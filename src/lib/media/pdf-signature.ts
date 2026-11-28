/**
 * PDF signature detection.
 *
 * A real PDF starts with "%PDF-", but that alone is not enough: an attacker can
 * prepend "%PDF-" to an arbitrary file (a polyglot) to slip it past a naive
 * check. So we require BOTH the header and a terminating "%%EOF" near the end,
 * which a non-PDF is very unlikely to contain.
 *
 * Kept dependency-free on purpose — no parser is needed to reject bad input,
 * and pulling in a full PDF library for a signature check would be a needless
 * attack surface.
 */
export function detectPdfSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 32) return false;

  // Header must be within the first 1KB — some writers emit junk first.
  const head = buffer.subarray(0, 1024).toString('latin1');
  if (!head.startsWith('%PDF-')) return false;

  // Must contain a version marker like "%PDF-1.7" or "%PDF-2.0".
  if (!/%PDF-\d\.\d/.test(head)) return false;

  // Must be terminated.
  const tail = buffer.subarray(Math.max(0, buffer.length - 4096)).toString('latin1');
  if (!tail.includes('%%EOF')) return false;

  return true;
}

/** True when the buffer looks like an image we already accept. */
export function looksLikeImage(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;          // JPEG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true; // PNG
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;      // GIF
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;    // WEBP
  return false;
}
