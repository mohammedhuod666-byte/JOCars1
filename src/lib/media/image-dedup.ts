import prisma from '../prisma';
import sharp from 'sharp';

interface DuplicateCheck {
  url: string;
  carId: string;
  carSlug?: string;
  carTitle: string;
  distance: number;
  similarity: number; // 0-100
}

// ── Perceptual hash (average hash, 64-bit) of actual IMAGE CONTENT ──
// Two photos with different URLs/filenames but identical (or resized /
// recompressed) pixels produce the same hash — unlike the old URL-string
// hash which could never match different URLs.
const hashCache = new Map<string, { hash: string; at: number }>();
const HASH_CACHE_TTL = 30 * 60 * 1000;
const MAX_DISTANCE = 8; // Hamming distance ≤ 8/64 ≈ near-duplicate
const FETCH_TIMEOUT_MS = 8000;
const COMPARE_POOL = 8;

function resolveUrl(url: string): string | null {
  if (!url) return null;
  if (url.startsWith('data:')) return null; // embedded data URIs can't be refetched
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  if (url.startsWith('/')) return base + url;
  return `${base}/${url}`;
}

async function phashFromUrl(url: string): Promise<string | null> {
  const cached = hashCache.get(url);
  if (cached && Date.now() - cached.at < HASH_CACHE_TTL) return cached.hash;

  const absolute = resolveUrl(url);
  if (!absolute) return null;

  try {
    const res = await fetch(absolute, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) return null;

    // 8x8 grayscale → average → 64-bit hash
    const raw = await sharp(buf).resize(8, 8, { fit: 'fill' }).grayscale().raw().toBuffer();
    if (raw.length < 64) return null;
    let sum = 0;
    for (let i = 0; i < 64; i++) sum += raw[i];
    const avg = sum / 64;
    let bits = '';
    for (let i = 0; i < 64; i++) bits += raw[i] >= avg ? '1' : '0';
    const hash = bits; // 64-char binary string (no BigInt — ES target compat)
    hashCache.set(url, { hash, at: Date.now() });
    if (hashCache.size > 2000) {
      const first = hashCache.keys().next().value;
      if (first) hashCache.delete(first);
    }
    return hash;
  } catch {
    return null;
  }
}

function hammingDistanceHex(a: string, b: string): number {
  if (a.length !== 64 || b.length !== 64) return 64;
  let dist = 0;
  for (let i = 0; i < 64; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

export async function findDuplicateImages(imageUrl: string, excludeCarId?: string): Promise<DuplicateCheck[]> {
  try {
    const targetHash = await phashFromUrl(imageUrl);
    if (!targetHash) return [];

    const recentImages = await prisma.carImage.findMany({
      where: {
        ...(excludeCarId ? { carId: { not: excludeCarId } } : {}),
        NOT: { url: { startsWith: 'data:' } },
      },
      select: {
        url: true,
        carId: true,
        car: { select: { brand: true, model: true, year: true, slug: true } },
      },
      orderBy: { car: { createdAt: 'desc' } },
      take: 400,
    });

    const duplicates: DuplicateCheck[] = [];

    // Bounded worker pool so a 400-image scan finishes in seconds, not minutes
    for (let i = 0; i < recentImages.length; i += COMPARE_POOL) {
      const chunk = recentImages.slice(i, i + COMPARE_POOL);
      const results = await Promise.all(
        chunk.map(async (img) => {
          if (img.url === imageUrl) return null;
          const h = await phashFromUrl(img.url);
          if (!h) return null;
          const distance = hammingDistanceHex(targetHash, h);
          if (distance > MAX_DISTANCE) return null;
          return {
            url: img.url,
            carId: img.carId,
            carSlug: img.car.slug,
            carTitle: `${img.car.brand?.nameAr || ''} ${img.car.model?.nameAr || ''} ${img.car.year || ''}`.trim(),
            distance,
            similarity: Math.round(((64 - distance) / 64) * 100),
          } as DuplicateCheck;
        })
      );
      for (const r of results) if (r) duplicates.push(r);
      if (duplicates.length >= 10) break; // enough evidence
    }

    return duplicates.sort((a, b) => a.distance - b.distance).slice(0, 10);
  } catch (error) {
    console.error('Image dedup error:', error);
    return [];
  }
}
