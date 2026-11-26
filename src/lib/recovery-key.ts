import crypto from 'crypto';

// Ambiguity-free alphabet (excludes 0, O, 1, I, L)
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

// Argon2id OWASP-recommended parameters: 64 MiB memory, 3 iterations, 1 lane, 32-byte tag
const ARGON2_MEMORY_KIB = 65536;
const ARGON2_PASSES = 3;
const ARGON2_PARALLELISM = 1;
const ARGON2_TAG_LENGTH = 32;

/**
 * Generates a cryptographically random 16-character recovery key formatted as JOC-XXXX-XXXX-XXXX.
 */
export function generateRecoveryKey(): string {
  const bytes = crypto.randomBytes(16);
  let raw = '';
  for (let i = 0; i < 16; i++) {
    raw += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `JOC-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

/**
 * Normalizes user-entered recovery key (uppercase, removes spaces/dashes).
 */
export function normalizeRecoveryKey(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Node 24+ native OpenSSL Argon2id helper (typed explicitly for older @types/node)
type Argon2SyncFn = (
  algorithm: 'argon2id' | 'argon2i' | 'argon2d',
  params: {
    message: string | Buffer;
    nonce: Buffer;
    parallelism: number;
    passes: number;
    memory: number;
    tagLength: number;
  }
) => Buffer;

const argon2Sync: Argon2SyncFn = (
  crypto as unknown as { argon2Sync: Argon2SyncFn }
).argon2Sync;

/**
 * Hashes a recovery key using one-way memory-hard Argon2id with a 16-byte random salt.
 * Output format: $argon2id$v=19$m=65536,t=3,p=1$<salt_b64>$<hash_b64>
 */
export function hashRecoveryKeyArgon2id(plainKey: string): string {
  const normalized = normalizeRecoveryKey(plainKey);
  const nonce = crypto.randomBytes(16);
  const derived = argon2Sync('argon2id', {
    message: normalized,
    nonce,
    parallelism: ARGON2_PARALLELISM,
    passes: ARGON2_PASSES,
    memory: ARGON2_MEMORY_KIB,
    tagLength: ARGON2_TAG_LENGTH,
  });
  return `$argon2id$v=19$m=${ARGON2_MEMORY_KIB},t=${ARGON2_PASSES},p=${ARGON2_PARALLELISM}$${nonce.toString('base64')}$${derived.toString('base64')}`;
}

/**
 * Verifies a user-supplied recovery key against a stored Argon2id hash in constant time.
 */
export function verifyRecoveryKeyArgon2id(plainKey: string, storedHash: string | null | undefined): boolean {
  if (!plainKey || !storedHash) return false;
  try {
    const parts = storedHash.split('$');
    // ['', 'argon2id', 'v=19', 'm=...,t=...,p=...', '<salt>', '<hash>']
    if (parts.length !== 6 || parts[1] !== 'argon2id') return false;

    const paramPairs = Object.fromEntries(
      parts[3].split(',').map((kv) => {
        const [k, v] = kv.split('=');
        return [k, parseInt(v, 10)];
      })
    );
    const memory = paramPairs.m || ARGON2_MEMORY_KIB;
    const passes = paramPairs.t || ARGON2_PASSES;
    const parallelism = paramPairs.p || ARGON2_PARALLELISM;

    const nonce = Buffer.from(parts[4], 'base64');
    const expected = Buffer.from(parts[5], 'base64');
    if (nonce.length === 0 || expected.length === 0) return false;

    const normalized = normalizeRecoveryKey(plainKey);
    const actual = argon2Sync('argon2id', {
      message: normalized,
      nonce,
      parallelism,
      passes,
      memory,
      tagLength: expected.length,
    });

    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
