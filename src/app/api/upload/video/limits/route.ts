import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, jsonWithCharset } from '@/lib/api';

/**
 * GET /api/upload/video/limits
 *
 * Publishes the REAL platform limits so the client can reject an oversized file
 * before spending the seller's bandwidth on an upload that the platform will
 * refuse anyway.
 *
 * Why this exists: Vercel serverless functions cap the request body at 4.5MB.
 * A 30-second phone video is 15-60MB. The upload therefore never reaches this
 * app's handler — the edge returns a 413 with an HTML body, `res.json()` in the
 * browser throws, and the seller sees a misleading "connection error" for a
 * file that satisfies our own advertised 100MB limit.
 *
 * Two options exist for a genuinely large upload: an unsigned Cloudinary
 * upload preset (browser -> CDN, bypasses Vercel entirely), or a limit the
 * platform can actually honour. This endpoint exposes the platform number so
 * the UI can be honest, and the wizard offers client-side compression to fit
 * under it.
 */

// Vercel serverless request-body ceiling (verified by measurement against this
// project: 4MB accepted, 6MB rejected with FUNCTION_PAYLOAD_TOO_LARGE).
export const PLATFORM_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// Multipart framing overhead + a safety margin so we never sit exactly on the
// edge and fail non-deterministically.
export const EFFECTIVE_MAX_UPLOAD_BYTES = PLATFORM_MAX_UPLOAD_BYTES - 512 * 1024;

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  return jsonWithCharset({
    success: true,
    data: {
      platformMaxBytes: PLATFORM_MAX_UPLOAD_BYTES,
      effectiveMaxBytes: EFFECTIVE_MAX_UPLOAD_BYTES,
      maxDurationSeconds: 180,
      allowedMime: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'],
    },
  });
}
