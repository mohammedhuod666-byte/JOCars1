/**
 * The REAL platform body ceiling, in one place.
 *
 * Measured against this deployment (2026-10-05) by POSTing synthetic multipart
 * bodies to /api/cars and /api/upload/video:
 *
 *   3.0 MB -> 401 (reached the handler, JSON)
 *   4.0 MB -> 401 (reached the handler, JSON)
 *   4.5 MB -> 413 "Request Entity Too Large" / FUNCTION_PAYLOAD_TOO_LARGE
 *   6.0 MB -> 413, HTML body
 *
 * The 413 arrives as an HTML page from the edge, BEFORE any route handler runs.
 * That is why an oversized publish used to surface as a fake network error or as
 * "تعذر استلام البيانات": `res.json()` on an HTML page throws, and the request
 * body never reaches our own 413 handler.
 *
 * Two rules follow, and both were violated before:
 *   1. No code may advertise a limit above this number. We previously shipped a
 *      "9MB" client guard, so every ad between 4.5MB and 9MB passed our check and
 *      then died at the edge.
 *   2. Multipart framing adds overhead on top of the file bytes, so the value the
 *      UI enforces must sit BELOW the platform number, not equal to it.
 */

/** Hard platform ceiling. Exceeding it means the edge returns HTML 413. */
export const PLATFORM_BODY_LIMIT_BYTES = 4.5 * 1024 * 1024;

/**
 * What the wizard actually enforces on the summed upload payload. Deliberately
 * ~600KB under the ceiling so multipart boundaries and part headers cannot push
 * a "legal" total over the edge.
 */
export const MAX_PUBLISH_BODY_BYTES = 3.8 * 1024 * 1024;

/** Server-side mirror, so an API caller cannot bypass the client guard. */
export const SERVER_MAX_PUBLISH_BODY_BYTES = PLATFORM_BODY_LIMIT_BYTES - 512 * 1024;

/** Formats the byte budget in the Arabic the UI uses. */
export function formatMB(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1);
}

/**
 * Hard cap for ONE file in ONE request, on both the client and the server.
 *
 * Why staged-per-file and not chunked upload: Cloudinary's chunked-upload API
 * exists precisely for files larger than a function body, but it REQUIRES every
 * chunk except the last to be >5MB. Verified against the live API:
 *
 *   POST /v1_1/<cloud>/raw/upload  Content-Range: bytes 0-3145727/8388608
 *   -> 400 {"error":{"message":"All parts except EOF-chunk must be larger than 5mb"}}
 *
 * 5MB chunks cannot fit through a 4.5MB body limit, so chunked upload is
 * impossible on this hosting plan. Splitting a PDF in the browser would corrupt
 * it, and an unsigned direct upload would store the document PUBLICLY — which
 * the privacy model forbids. Therefore the ceiling for a single document is a
 * hard limit, and the only honest response to a larger file is to say so.
 */
export const MAX_SINGLE_FILE_BYTES = 3.8 * 1024 * 1024;

/** Message for a single file that cannot fit, explaining the real reason. */
export function singleFileTooLargeMessage(bytes: number, label = 'الملف'): string {
  return (
    `حجم ${label} ${formatMB(bytes)} ميجابايت — والحد الأقصى للملف الواحد ` +
    `${formatMB(MAX_SINGLE_FILE_BYTES)} ميجابايت.\n` +
    'قلّص دقة الصورة، أو اضغط ملف PDF لتقلّص حجمه قبل الرفع.'
  );
}

/**
 * Identifies an edge/HTML 413 so callers can report the real cause instead of
 * guessing. The platform body is plain text, not JSON.
 */
export function isPlatformTooLarge(status: number, contentType: string): boolean {
  return status === 413 || /text\/html/i.test(contentType);
}

/**
 * The message shown when the platform rejects the body. It states the measured
 * ceiling rather than an invented one, and tells the seller what to do.
 */
export function tooLargeMessage(actualBytes: number): string {
  return (
    `حجم الصور والمستندات ${formatMB(actualBytes)} ميجابايت — والحد الأقصى في هذا النشر ` +
    `${formatMB(MAX_PUBLISH_BODY_BYTES)} ميجابايت.\n` +
    'احذف صورة أو اثنتين، أو ارفع المستندات كملف PDF أصغر.'
  );
}
