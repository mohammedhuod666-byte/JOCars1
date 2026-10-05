// Shared in-memory OTP store (phone -> { code, expiresAt, attempts }).
// Used by passwordless phone login AND profile-verify flows.
// NOTE: single source of truth — do NOT create other Maps elsewhere.
// For multi-instance production, replace with Redis/DB (see checkRateLimitAsync pattern).
import { randomInt } from 'crypto';

export interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

const store = new Map<string, OtpRecord>();

export const MAX_OTP_ATTEMPTS = 5;
export const OTP_TTL_MS = 5 * 60 * 1000;

export function generateSecureOtp(): string {
  return randomInt(100000, 1000000).toString();
}

export function setOtp(phone: string, code: string): void {
  store.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
}

export function getOtp(phone: string): OtpRecord | undefined {
  return store.get(phone);
}

export function deleteOtp(phone: string): void {
  store.delete(phone);
}

export function incrementOtpAttempts(phone: string): number {
  const rec = store.get(phone);
  if (!rec) return 0;
  rec.attempts += 1;
  store.set(phone, rec);
  return rec.attempts;
}

/** Normalize Jordanian phone variants to +9627XXXXXXXX form */
export function normalizeJoPhone(input: string): string | null {
  const cleaned = String(input || '').replace(/[^0-9+]/g, '');
  let digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (/^9627[789]\d{7}$/.test(digits)) return '+' + digits;
  if (/^07[789]\d{7}$/.test(digits)) return '+962' + digits.slice(1);
  if (/^7[789]\d{7}$/.test(digits)) return '+962' + digits;
  return null;
}

// Periodic cleanup of expired codes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (now > v.expiresAt) store.delete(k);
    }
  }, 5 * 60 * 1000);
}
