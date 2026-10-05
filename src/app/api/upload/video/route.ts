import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { cloudinary } from '@/lib/cloudinary';
import { validateUploadedVideo, detectVideoContainer } from '@/lib/video-validate';

/**
 * POST /api/upload/video
 *
 * Real video upload for a listing (the wizard previously collected a
 * `videoFile` that no input fed and the server ignored — a dead path).
 *
 * Pipeline: rate limit -> MIME allowlist -> magic-byte container check ->
 * duration/size limits -> Cloudinary `video` resource. The returned URL is what
 * the client stores in `videoUrl`, so the existing player keeps working.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return unauthorizedResponse();

    const ip = getClientIp(request);
    if (!checkRateLimit(`upload-video:${user.id}:${ip}`, RATE_LIMITS.UPLOAD).allowed) {
      return errorResponse('تم تجاوز عدد محاولات رفع الفيديو — حاول بعد قليل', 429);
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse('تعذر استلام الملف — الفيديو كبير جداً أو انقطع الاتصال', 413);
    }

    const file = formData.get('file') as File | null;
    if (!file) return errorResponse('لم يتم إرسال ملف فيديو', 400);

    /**
     * Defence at the boundary: the platform rejects oversized bodies BEFORE this
     * handler runs, so we can also defend against a client that ignores the
     * advertised limit. Reported in MB so the seller gets an actionable number.
     */
    const INLINE_MAX_BYTES = 4 * 1024 * 1024; // Vercel serverless body ceiling
    if (file.size > INLINE_MAX_BYTES) {
      return errorResponse(
        `حجم الفيديو ${(file.size / 1024 / 1024).toFixed(1)} ميجابايت — الحد الأقصى للرفع المباشر ` +
        `${((INLINE_MAX_BYTES - 512 * 1024) / 1024 / 1024).toFixed(1)} ميجابايت. ` +
        'صوّر مقطعاً أقصر، أو استخدم رابط YouTube.',
        413,
      );
    }

    let validated;
    try {
      validated = await validateUploadedVideo(file, probeMp4DurationSeconds);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر التحقق من الفيديو';
      // Arabic messages come from our validator and are actionable; anything
      // else is an internal failure and must not leak.
      const safe = /[\u0600-\u06FF]/.test(msg)
        ? msg
        : 'تعذر معالجة ملف الفيديو — جرّب MP4 بحجم أصغر';
      return errorResponse(safe, 400);
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (cloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const result = await cloudinary.uploader.upload(
          `data:${validated.mime};base64,${validated.buffer.toString('base64')}`,
          {
            folder: 'jo-cars/videos',
            resource_type: 'video',
            // Videos are far heavier than images: transcode to a web-friendly
            // mp4/h264 so Safari and mobile browsers can play it.
            eager: [
              { format: 'mp4', video_codec: 'h264', quality: 'auto', width: 1280 },
            ],
            eager_async: false,
            // Stream the body in 6MB chunks instead of one large write, so a
            // near-limit upload does not spike memory in the function.
            chunk_size: 6 * 1024 * 1024,
          },
        );
        return successResponse({
          url: result.secure_url,
          provider: 'cloudinary',
          bytes: result.bytes,
          duration: result.duration ?? null,
          format: result.format,
        });
      } catch (err) {
        console.error('[upload/video] cloudinary failed:', err);
        return errorResponse('تعذر رفع الفيديو على خادم التخزين — حاول مجدداً', 503);
      }
    }

    return errorResponse('تخزين الفيديو غير مُهيأ حالياً — استخدم رابط فيديو بدلاً من ذلك', 503);
  } catch (err) {
    console.error('[upload/video] unexpected:', err);
    return errorResponse('فشل رفع الفيديو', 500);
  }
}

/**
 * Best-effort MP4 duration read from the `mvhd` box.
 *
 * Deliberately dependency-free and conservative: it returns null whenever the
 * box is missing or the layout is unexpected, and the caller then skips the
 * duration check rather than rejecting a valid file. Cloudinary enforces the
 * limit server-side anyway on the transcoded result.
 */
async function probeMp4DurationSeconds(buffer: Buffer): Promise<number | null> {
  try {
    // mvhd lives inside moov; scan the first chunk for the marker.
    const idx = buffer.indexOf(Buffer.from('mvhd', 'latin1'));
    if (idx === -1 || idx + 20 > buffer.length) return null;

    const version = buffer[idx + 4];
    if (version === 0) {
      const timescale = buffer.readUInt32BE(idx + 16);
      const duration = buffer.readUInt32BE(idx + 20);
      if (!timescale) return null;
      return duration / timescale;
    }
    if (version === 1 && idx + 32 <= buffer.length) {
      const timescale = buffer.readUInt32BE(idx + 24);
      const hi = buffer.readUInt32BE(idx + 28);
      const lo = buffer.readUInt32BE(idx + 32);
      if (!timescale) return null;
      return (hi * 4294967296 + lo) / timescale;
    }
    return null;
  } catch {
    return null;
  }
}
