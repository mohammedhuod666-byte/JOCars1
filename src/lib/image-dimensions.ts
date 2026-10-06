/**
 * Image dimensions from the file header, in pure JavaScript.
 *
 * WHY THIS EXISTS
 * The previous implementation asked sharp, a compiled native addon, for
 * metadata. Cloudflare Workers cannot load native binaries at all — not sharp,
 * not anything else with a .node binding — so `import sharp from 'sharp'` fails
 * at bundle time on that platform.
 *
 * This module replaces the one call that mattered: reading width and height.
 * Everything else the upload path needs was already pure JavaScript:
 *   - `hasImageMagicBytes` verifies the format from magic numbers, so a renamed
 *     executable or an HTML file cannot pass as an image. That defence is
 *     unchanged and does not depend on this module.
 *
 * WHY PARSING HEADERS IS ACCEPTABLE HERE
 * Dimensions are read to reject 1x1 tracking pixels and corrupt placeholders.
 * If a crafted header claims large dimensions while the data is junk, the worst
 * outcome is that a junk file is accepted — and the magic-byte check, the
 * Cloudinary upload and the size cap all still apply. Conversely, a real photo
 * always declares its true size in the header, so a false REJECT (the failure
 * that would hurt a real seller) is not reachable for well-formed files.
 *
 * Only the first header is inspected, so a polyglot file cannot make us read
 * megabytes. Every parser bails out after a bounded number of bytes.
 */

/** A declared size beyond this is treated as unparseable, not as a huge image. */
const MAX_DIMENSION = 50_000;

interface Dimensions {
  width: number;
  height: number;
}

/** PNG: the IHDR chunk is always first, so this needs no scanning. */
function readPng(buf: Buffer): Dimensions | null {
  // 8-byte signature, then an IHDR chunk whose data starts at byte 16.
  if (buf.length < 24) return null;
  if (buf[12] !== 0x49 || buf[13] !== 0x48 || buf[14] !== 0x44 || buf[15] !== 0x52) return null; // "IHDR"
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** GIF: the logical screen descriptor carries it, right after the signature. */
function readGif(buf: Buffer): Dimensions | null {
  if (buf.length < 10) return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

/**
 * WebP: three container variants, all with the dimensions at a known offset.
 *   VP8  (lossy)  - lossy, 3-byte frame tag, then 14-bit width/height
 *   VP8L (lossless)- a 1-byte signature then 14-bit width/height
 *   VP8X (extended)- 24-bit canvas width/height minus one
 */
function readWebp(buf: Buffer): Dimensions | null {
  if (buf.length < 30) return null;
  const tag = buf.toString('ascii', 12, 16);

  if (tag === 'VP8X') {
    return {
      width: (buf[24] | (buf[25] << 8) | (buf[26] << 16)) + 1,
      height: (buf[27] | (buf[28] << 8) | (buf[29] << 16)) + 1,
    };
  }
  if (tag === 'VP8 ') {
    // Frame header: 3 bytes tag, 3-byte start code 0x9d012a, then 2+2 bytes.
    if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return null;
    return {
      width: buf.readUInt16LE(26) & 0x3fff,
      height: buf.readUInt16LE(28) & 0x3fff,
    };
  }
  if (tag === 'VP8L') {
    if (buf[20] !== 0x2f) return null;
    const bits = buf.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      // The height's 14 bits sit above the width's, across a byte boundary.
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  return null;
}

/**
 * JPEG is the only format needing a walk: dimensions live in a variable-length
 * segment chain, and SOFn markers appear after APPn/EXIF segments. The scan is
 * bounded so a malicious file cannot make us read the whole body.
 */
function readJpeg(buf: Buffer): Dimensions | null {
  let offset = 2; // skip SOI
  const limit = Math.min(buf.length, 1024 * 1024);

  while (offset + 9 < limit) {
    if (buf[offset] !== 0xff) {
      // Resynchronise: padding bytes (0xff runs) are legal between segments.
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    // Standalone markers carry no length field.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    // Start of scan: the entropy-coded data follows, no more headers.
    if (marker === 0xda || marker === 0xd9) return null;

    const segmentLength = buf.readUInt16BE(offset + 2);
    // SOF0..SOF15 except the DHT/JPG/DAC markers at C4, C8, CC.
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return {
        // Height at +5, width at +7 relative to the marker's offset.
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    if (segmentLength < 2) return null; // malformed; refuse rather than loop
    offset += 2 + segmentLength;
  }
  return null;
}

/**
 * Returns the declared dimensions, or null when they cannot be determined.
 * A null result is a REJECT: the caller treats an image of unknown size as
 * invalid, which is the conservative direction — we would rather refuse one odd
 * file than accept a tracking pixel.
 */
export function readImageDimensions(buffer: Buffer): Dimensions | null {
  if (!buffer || buffer.length < 12) return null;

  let dims: Dimensions | null = null;
  try {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      dims = readJpeg(buffer);
    } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      dims = readPng(buffer);
    } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      dims = readGif(buffer);
    } else if (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      dims = readWebp(buffer);
    }
  } catch {
    return null;
  }

  if (!dims) return null;
  // A width or height of zero is not a real image, and an absurd value means we
  // mis-parsed rather than that the seller uploaded a giant photo.
  if (dims.width <= 0 || dims.height <= 0) return null;
  if (dims.width > MAX_DIMENSION || dims.height > MAX_DIMENSION) return null;
  return dims;
}