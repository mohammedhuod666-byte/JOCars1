import { NextResponse } from 'next/server';

// Server-side logout: clears the HttpOnly auth cookie (the client store
// alone cannot remove it). Without this, a stale cookie keeps
// authenticating cookie-based requests AFTER logout — including as a
// different (e.g. admin) identity after account switching.
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set(
    'Set-Cookie',
    `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  );
  return res;
}
