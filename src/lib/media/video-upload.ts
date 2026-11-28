/**
 * Video upload that actually works on Vercel serverless.
 *
 * THE PROBLEM
 * Vercel caps a serverless request body at 4.5MB (measured on this project:
 * 4MB passes, 6MB → 413 FUNCTION_PAYLOAD_TOO_LARGE with an HTML body). A 30s
 * phone video is 15-60MB, so POSTing it to a route handler can never work.
 * The browser then does `res.json()` on an HTML error page, which throws, and
 * the seller is shown a misleading "connection error".
 *
 * THE FIX — direct browser → Cloudinary upload
 * An UNSIGNED upload preset lets the browser POST straight to the CDN, so the
 * bytes never traverse a Vercel function. That is the only architecture that
 * supports real video on this hosting plan.
 *
 * The preset name is a public, non-secret value. Everything that matters
 * (allowed formats, max size, folder) is enforced by the preset itself in the
 * Cloudinary dashboard, and the server re-validates the RESULT (public id,
 * resource type) before trusting it. No credentials are exposed to the browser.
 *
 * FALLBACK
 * If no preset is configured, we degrade to the small-file route and say so
 * plainly, instead of failing with a fake network error.
 */

export interface DirectUploadResult {
  url: string;
  publicId: string;
  bytes: number;
}

/** 4MB with multipart overhead trimmed; matches the server route's real ceiling. */
export const SAFE_INLINE_MAX_BYTES = 3.5 * 1024 * 1024;

export function cloudName(): string {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
}

/**
 * The unsigned preset name. Public by design (it grants no authority without a
 * signed request), and rotatable in the Cloudinary dashboard without a deploy.
 */
export function unsignedPreset(): string {
  return process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_PRESET || '';
}

export function directUploadAvailable(): boolean {
  return !!cloudName() && !!unsignedPreset();
}

interface PresetConfigResponse {
  preset_settings?: {
    unsigned?: boolean;
    max_file_size?: number;
    allowed_formats?: string[];
  };
}

/**
 * Ask Cloudinary what the preset actually allows, so the UI states the real
 * numbers instead of numbers we invented. Cached briefly per page load.
 */
let cachedLimits: { maxBytes: number; formats: string[]; at: number } | null = null;

export async function fetchPresetLimits(): Promise<{ maxBytes: number; formats: string[] } | null> {
  if (!directUploadAvailable()) return null;
  if (cachedLimits && Date.now() - cachedLimits.at < 60_000) return cachedLimits;

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName()}/upload_presets/${unsignedPreset()}`,
      { headers: { 'Content-Type': 'application/json' } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as PresetConfigResponse;
    const maxBytes = json.preset_settings?.max_file_size;
    const formats = json.preset_settings?.allowed_formats;
    const limits = {
      // Cloudinary reports max_file_size in MB; 0 means unset.
      maxBytes: maxBytes && maxBytes > 0 ? maxBytes * 1024 * 1024 : 100 * 1024 * 1024,
      formats: formats?.length ? formats : ['mp4', 'webm', 'mov'],
      at: Date.now(),
    };
    cachedLimits = limits;
    return limits;
  } catch {
    return null;
  }
}

/**
 * Upload a video directly from the browser to Cloudinary using XHR, because we
 * need `upload.progress` — fetch() still has no upload-progress event stream in
 * the browsers this must support (Safari included).
 */
export function uploadVideoDirect(
  file: File,
  opts: { onProgress?: (pct: number) => void; signal?: AbortSignal },
): Promise<DirectUploadResult> {
  return new Promise((resolve, reject) => {
    const cn = cloudName();
    const preset = unsignedPreset();
    if (!cn || !preset) {
      reject(new Error('DIRECT_UPLOAD_UNAVAILABLE'));
      return;
    }

    const url = `https://api.cloudinary.com/v1_1/${cn}/video/upload`;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', preset);
    // Folder is pinned by the preset; sending it keeps the layout predictable even
    // if the preset is later edited in the dashboard.
    fd.append('folder', 'jo-cars/videos');

    /*
     * No eager/transformation is requested on purpose.
     *
     * An earlier attempt sent `eager=mp4,h264:1280,q_auto` and Cloudinary
     * answered "Invalid transformation component - mp4" — that syntax belongs
     * to the 1.x SDK. More importantly, a failing eager step fails the WHOLE
     * upload, so a codec preference could cost the seller a 40MB video.
     * Cloudinary derives H.264/AAC on demand from the same public_id, and the
     * player requests a plain https URL, which works for MP4/WebM/MOV alike.
     */

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (opts.signal) {
      opts.signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          // Trust only what we asked for: an https delivery URL.
          if (json.secure_url && json.public_id) {
            resolve({ url: json.secure_url, publicId: json.public_id, bytes: json.bytes ?? file.size });
            return;
          }
          reject(new Error('استجابة غير متوقعة من خادم الفيديو'));
        } catch {
          reject(new Error('تعذر قراءة استجابة خادم الفيديو'));
        }
      } else {
        // Cloudinary reports its own reason; surface it rather than inventing one.
        let msg = 'رفض خادم الفيديو الملف';
        try {
          const j = JSON.parse(xhr.responseText);
          if (j?.error?.message) msg = j.error.message;
        } catch { /* non-JSON body */ }
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error('تعذر الاتصال بخادم الفيديو — تحقق من الإنترنت وحاول مجدداً'));
    xhr.ontimeout = () => reject(new Error('انتهت مهلة رفع الفيديو — الملفات الكبيرة تحتاج اتصالاً أسرع'));
    xhr.onabort = () => reject(new Error('تم إلغاء الرفع'));

    xhr.send(fd);
  });
}
