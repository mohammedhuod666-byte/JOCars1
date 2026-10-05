import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { cloudinary } from '@/lib/cloudinary';

/**
 * POST /api/upload/cleanup
 *
 * Deletes a staged asset from Cloudinary when the publish flow
 * failed after some uploads already succeeded — prevents orphan files.
 *
 * The caller must own the asset. We derive the publicId from the
 * CDN URL and issue a destroy. No secret exposure: the route checks
 * authentication and only deletes assets under the project's folder.
 */

function publicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // https://res.cloudinary.com/<cloud>/image/upload/<publicId>.ext
    const parts = u.pathname.split('/');
    // parts[0]='', parts[1]=cloud, parts[2]='image'|'video'|'raw', parts[3]='upload', rest=publicId
    if (parts.length < 5) return null;
    if (parts[1] !== process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) return null;
    return parts.slice(4).join('/').replace(/\.(jpg|jpeg|png|webp|gif|pdf|mp4|mov|webm)$/i, '');
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await authenticateRequest(request);
  } catch {
    return unauthorizedResponse();
  }
  if (!user) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('طلب غير صالح', 400);
  }
  const url = (body as any)?.url;
  if (typeof url !== 'string' || !url.startsWith('https://res.cloudinary.com/')) {
    return errorResponse('رابط غير صالح', 400);
  }
  const publicId = publicIdFromUrl(url);
  if (!publicId) return errorResponse('تعذر استخراج معرّف الملف', 400);

  // Defence: only delete within our own folders.
  const allowedPrefix = ['jo-cars/cars', 'jo-cars/docs', 'jo-cars/covers', 'jo-cars/users', 'jo-cars/dealers', 'jo-cars/videos'];
  if (!allowedPrefix.some(p => publicId.startsWith(p))) {
    return errorResponse('الملف خارج النطاق المسموح', 403);
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: url.includes('/video/') ? 'video' : 'image',
    });
    return successResponse({ deleted: true, publicId });
  } catch (err) {
    console.error('[upload/cleanup] failed:', err);
    // Non-blocking: a failure here must not break the publish flow.
    return successResponse({ deleted: false, publicId, note: 'destroy failed' });
  }
}