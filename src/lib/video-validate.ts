/**
 * Video upload validation.
 *
 * Kept separate from lib/image-validate because videos need a different set of
 * checks: magic bytes for MP4/WebM/MOV containers, a hard size ceiling, and a
 * duration probe. A 200MB phone clip cannot go through the image path.
 *
 * Nothing here trusts the file name or the client MIME: the container is
 * identified from the leading bytes, and the extension is derived from what we
 * actually detected — never from `file.name`.
 */

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_DURATION_SECONDS = 180; // 3 minutes is plenty for a car walkaround

export type VideoContainer = 'mp4' | 'webm' | 'mov';

const ALLOWED_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
]);

export interface ValidatedVideo {
  buffer: Buffer;
  ext: VideoContainer;
  mime: string;
  /** Bytes of the `ftyp` box — enough for ffprobe/Cloudinary to identify it. */
  header: Buffer;
}

/**
 * Detect the container from magic bytes.
 *  - ISO-BMFF (MP4/MOV/M4V): bytes 4..8 == "ftyp"
 *  - WebM/Matroska: 1A 45 DF A3
 */
export function detectVideoContainer(buffer: Buffer): { ext: VideoContainer; mime: string } | null {
  if (buffer.length < 12) return null;

  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    // "ftyp" — MP4 family. Brand at 8..12 tells us more:
    //   qt  => QuickTime (.mov)
    const brand = buffer.toString('latin1', 8, 12);
    if (brand.startsWith('qt')) return { ext: 'mov', mime: 'video/quicktime' };
    return { ext: 'mp4', mime: 'video/mp4' };
  }

  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return { ext: 'webm', mime: 'video/webm' };
  }

  return null;
}

/**
 * Validate an uploaded video. Throws with an Arabic, user-actionable message.
 * `probeDuration` is injected so this module stays testable and free of a
 * hard ffprobe dependency; callers pass a real implementation or omit the
 * duration check.
 */
export async function validateUploadedVideo(
  file: { type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> },
  probeDuration?: (header: Buffer) => Promise<number | null>,
): Promise<ValidatedVideo> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error('صيغة الفيديو غير مدعومة — الأنواع المسموحة: MP4 أو WebM أو MOV');
  }
  if (file.size <= 0) {
    throw new Error('ملف الفيديو فارغ');
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error('حجم الفيديو يتجاوز الحد الأقصى (100 ميجابايت) — جرّب تقصيره أو خفض جودته');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const detected = detectVideoContainer(buffer);
  if (!detected) {
    throw new Error('محتوى الملف ليس فيديو صالحاً');
  }
  // The declared MIME must agree with the actual container, otherwise the file
  // is trying to pass as something it is not.
  if (detected.mime !== file.type && !(file.type === 'video/x-m4v' && detected.ext === 'mp4')) {
    throw new Error('نوع الملف المعلن لا يطابق محتواه الحقيقي');
  }

  if (probeDuration) {
    const duration = await probeDuration(buffer.subarray(0, Math.min(buffer.length, 512 * 1024)));
    if (duration != null && duration > MAX_DURATION_SECONDS) {
      throw new Error(`مدة الفيديو ${Math.round(duration)} ثانية — الحد الأقصى ${MAX_DURATION_SECONDS} ثانية`);
    }
  }

  return {
    buffer,
    ext: detected.ext,
    mime: detected.mime,
    header: buffer.subarray(0, Math.min(buffer.length, 512 * 1024)),
  };
}

export const VIDEO_LIMITS = {
  maxBytes: MAX_VIDEO_BYTES,
  maxDurationSeconds: MAX_DURATION_SECONDS,
  allowedMime: [...ALLOWED_MIME],
};
