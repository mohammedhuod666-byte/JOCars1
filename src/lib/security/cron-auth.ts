import { timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

function safeEquals(configured: string, presented: string): boolean {
  const configuredBuffer = Buffer.from(configured);
  const presentedBuffer = Buffer.from(presented);
  return (
    configuredBuffer.length === presentedBuffer.length &&
    timingSafeEqual(configuredBuffer, presentedBuffer)
  );
}

/**
 * Accepts either:
 *  - `x-cron-secret: <secret>` (the local server.js scheduler), or
 *  - `Authorization: Bearer <secret>` (Vercel Cron sends this when the
 *    CRON_SECRET env var is set to the same value).
 * Compared timing-safe against BACKUP_CRON_SECRET (and CRON_SECRET itself,
 * if configured as a fallback).
 */
export function isCronAuthorized(request: NextRequest): boolean {
  const secrets = [process.env.BACKUP_CRON_SECRET, process.env.CRON_SECRET].filter(
    (s): s is string => !!s
  );
  if (!secrets.length) return false;

  const headerSecret = request.headers.get('x-cron-secret') || '';
  const authHeader = request.headers.get('authorization') || '';
  const bearer = /^bearer\s+/i.test(authHeader) ? authHeader.replace(/^bearer\s+/i, '').trim() : '';

  const presented = [headerSecret, bearer].filter(Boolean);
  if (!presented.length) return false;

  return secrets.some((secret) => presented.some((value) => safeEquals(secret, value)));
}
