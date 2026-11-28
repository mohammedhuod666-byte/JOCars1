const MAX_WIDTH = 1600;
const WEBP_QUALITY = 80;

/**
 * sharp is an optional accelerator, not a requirement.
 *
 * It is a compiled native addon, and Cloudflare Workers cannot load native
 * binaries — so a top-level `import sharp from 'sharp'` breaks the bundle there.
 * Loading it dynamically behind a capability probe means one module serves both
 * platforms:
 *
 *   - where sharp exists (Vercel, local), images are re-encoded here;
 *   - where it does not (Workers), this is a measured no-op and Cloudinary does
 *     the work instead. lib/cloudinary.ts already sends `quality: 'auto'` and the
 *     delivery URLs negotiate format, so the bytes are still optimised — by a
 *     service built for it, and without a Worker spending CPU on it.
 *
 * `false` means "known absent" and is cached, so a Workers deployment does not
 * retry a failing import on every upload.
 */
/**
 * The slice of sharp's API this module uses, declared structurally.
 *
 * sharp's real typings are a namespace-plus-default hybrid that TypeScript
 * cannot narrow through a dynamic import, and the point of this module is to
 * work WITHOUT sharp present — so a minimal local shape is both simpler and
 * more honest than casting to a type that must then be guarded everywhere.
 */
type SharpLike = (input: unknown) => SharpInstance;

interface SharpInstance {
  rotate: () => SharpInstance;
  resize: (opts: { width: number; withoutEnlargement?: boolean }) => SharpInstance;
  webp: (opts: { quality: number }) => SharpInstance;
  png: () => { toBuffer: () => Promise<Buffer> };
  toBuffer: () => Promise<Buffer>;
}

type SharpModule = SharpLike | false;
let sharpCache: SharpModule | undefined;

/** Whether this runtime can compress images locally. */
export async function hasLocalImageCodec(): Promise<boolean> {
  return (await loadSharp()) !== false;
}

async function loadSharp(): Promise<SharpModule> {
  if (sharpCache !== undefined) return sharpCache;
  try {
    const mod = await import('sharp');
    // `unknown` first: sharp's typings are a namespace-plus-default hybrid that
    // cannot be narrowed through a dynamic import, and this module's whole point
    // is to work when sharp is absent, so asserting to a minimal local shape is
    // both simpler and safer than propagating sharp's types.
    const resolved = (mod.default ?? mod) as unknown as SharpLike;
    // Prove it actually works: a broken native binding can import cleanly and
    // still throw on first use.
    await resolved({ create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .png()
      .toBuffer();
    sharpCache = resolved;
  } catch {
    sharpCache = false;
  }
  return sharpCache;
}

/**
 * Compress any raster image to an optimized WebP (max 1600px wide).
 * - GIFs are returned untouched (to preserve animation).
 * - Already-small files (<150KB) are returned untouched.
 * - On any failure — including having no local codec — the original buffer is
 *   returned, so an upload never fails because compression was unavailable.
 */
export async function compressToWebP(input: Buffer, mimeType: string): Promise<{ buffer: Buffer; mime: string; ext: string }> {
  const passthrough = { buffer: input, mime: mimeType, ext: extFromMime(mimeType) };
  try {
    if (mimeType === 'image/gif') return passthrough;
    if (input.length < 150 * 1024) return passthrough;
    if (input.length > 25 * 1024 * 1024) return passthrough;

    const sharp = await loadSharp();
    if (sharp === false) return passthrough;

    const out = await sharp(input)
      .rotate() // honor EXIF orientation
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // Keep whichever is smaller (never inflate)
    if (out.length >= input.length) return passthrough;
    return { buffer: out, mime: 'image/webp', ext: 'webp' };
  } catch {
    return passthrough;
  }
}

function extFromMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}