import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { authenticateRequest } from './auth';

// Helper: ensures every JSON response ships with a charset so Arabic
// (and other UTF-8 strings) renders correctly across all clients.
export function jsonWithCharset(body: unknown, init: ResponseInit = {}): NextResponse {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return NextResponse.json(body, { ...init, headers });
}

export function successResponse<T>(data: T, status: number = 200) {
  return jsonWithCharset({ success: true, data }, { status });
}

export function errorResponse(message: string, status: number = 400) {
  return jsonWithCharset({ success: false, error: message }, { status });
}

export function unauthorizedResponse() {
  return jsonWithCharset(
    { success: false, error: 'غير مصرح لك بالوصول' },
    { status: 401 }
  );
}

export function notFoundResponse(resource: string = 'البيانات') {
  return jsonWithCharset(
    { success: false, error: `${resource} غير موجود` },
    { status: 404 }
  );
}

export function validationErrorResponse(error: ZodError) {
  const messages = error.issues.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
  return jsonWithCharset(
    { success: false, error: 'خطأ في التحقق من البيانات', details: messages },
    { status: 422 }
  );
}

export function parseSearchParams(searchParams: URLSearchParams) {
  const params: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    if (key.endsWith('[]')) {
      const realKey = key.slice(0, -2);
      if (!params[realKey]) params[realKey] = [];
      (params[realKey] as string[]).push(value);
    } else {
      params[key] = value;
    }
  }
  return params;
}

/**
 * Extracts the real client IP behind Cloudflare / reverse proxies.
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Authenticates the current request and returns either `{ user }` or a 401 `error` response.
 */
export async function requireAuth(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return { user: null as never, error: unauthorizedResponse() };
  return { user, error: null };
}

/**
 * Enforces `ADMIN` role on API routes, returning either `{ user }` or a 401 `error` response.
 */
export async function requireAdmin(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') {
    return { user: null as never, error: unauthorizedResponse() };
  }
  return { user, error: null };
}
