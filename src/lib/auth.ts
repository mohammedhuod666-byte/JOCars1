import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import prisma from './prisma';

const TOKEN_EXPIRY = process.env.JWT_EXPIRY || '7d';
const ROTATION_THRESHOLD = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Target cost for NEW password hashes and for lazy upgrades of existing ones.
 *
 * This is intentionally at the original cost 12: Workers Paid is the chosen
 * plan, and it provides the CPU budget bcrypt needs. Local benchmarking showed every
 * bcrypt cost above ~8ms CPU blows past the Workers Free plan's 10ms/request CPU
 * budget — the reason cost 12 was failing on Free. With Paid that no longer
 * applies, so there is no credential-safety reason to weaken existing hashes.
 *
 * Existing cost-12 hashes are left untouched; lazy rehash only fires when a stored
 * hash is stronger than cost 12 (currently none), and new hashes are generated at
 * this target. So in practice nothing is rewritten until an account is created or
 * reset through the normal flows.
 */
export const TARGET_BCRYPT_COST = 12;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: JWT_SECRET environment variable is required in production');
    }
    console.warn(JSON.stringify({
      level: 'SECURITY',
      action: 'JWT_SECRET_MISSING',
      message: 'JWT_SECRET env var is not set in dev — using placeholder (signing will work but tokens are insecure)',
    }));
    return 'dev-insecure-placeholder';
  }
  return secret;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, TARGET_BCRYPT_COST);
}

/**
 * Reads the bcrypt cost embedded in an existing hash without hashing anything.
 * Format: `$2[ab]$<cost>$<salt><hash>`. Returns null for anything that is not a
 * bcrypt hash, so a non-bcrypt value never triggers a silent rehash.
 *
 * Used to decide whether a *verified* login should be upgraded: rehashing only
 * happens after `bcrypt.compare` has succeeded, so an invalid guess can never
 * cause a write, and a legacy hash in an unexpected format is left untouched.
 */
export function detectBcryptCost(hash: string): number | null {
  const m = /^\$2[aby]\$(\d{2})\$/.exec(hash);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRY as jwt.SignOptions['expiresIn'] ?? '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
}

export function signPasswordResetToken(user: { id: string; email: string; password: string }): string {
  const passwordVersion = createHash('sha256').update(user.password).digest('hex');
  return jwt.sign({ sub: user.id, purpose: 'password-reset', passwordVersion }, getJwtSecret(), {
    expiresIn: '15m', audience: 'password-reset', issuer: 'jo-cars',
  });
}

export function verifyPasswordResetToken(token: string): { userId: string; passwordVersion: string } | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), { audience: 'password-reset', issuer: 'jo-cars' }) as jwt.JwtPayload;
    if (payload.purpose !== 'password-reset' || typeof payload.sub !== 'string' || typeof payload.passwordVersion !== 'string') return null;
    return { userId: payload.sub, passwordVersion: payload.passwordVersion };
  } catch { return null; }
}

export function passwordVersion(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex');
}

export function shouldRotateToken(token: string): boolean {
  const payload = verifyToken(token);
  if (!payload) return false;
  const tokenAge = Date.now() / 1000 - payload.iat;
  return tokenAge > ROTATION_THRESHOLD / 1000;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieToken = request.cookies.get('token')?.value;
  return cookieToken || null;
}

export async function authenticateRequest(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const userId = payload.userId || (payload as any).id || (payload as any).sub;
  if (!userId || typeof userId !== 'string') return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        phone: true,
        whatsapp: true,
        isActive: true,
        canPost: true,
        banStatus: true,
        banUntil: true,
        dealerName: true,
        dealerLogo: true,
        dealerVerified: true,
        rating: true,
        ratingCount: true,
        badges: true,
        forumBannedCommentUntil: true,
        forumBannedTopicUntil: true,
        carCommentBannedUntil: true,
      },
    });

    if (!user) return null;
    if (!user.isActive) return null;
    if (user.banStatus && user.banUntil && new Date(user.banUntil) > new Date()) return null;

    return user;
  } catch {
    return null;
  }
}

export function requireRole(...roles: string[]) {
  return (user: { role: string } | null) => {
    if (!user) return false;
    return roles.includes(user.role);
  };
}

export function setAuthCookie(response: Response, token: string) {
  // Cookie lifetime must match the JWT lifetime (default 7d) —
  // otherwise the cookie expires first and every authenticated
  // fetch starts returning 401 while the user is still "logged in".
  response.headers.set(
    'Set-Cookie',
    `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  );
}

export function rotateToken(response: Response, user: { id: string; email: string; role: string }) {
  const newToken = signToken({ userId: user.id, email: user.email, role: user.role });
  setAuthCookie(response, newToken);
  return newToken;
}
