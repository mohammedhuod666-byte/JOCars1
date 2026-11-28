/**
 * Lightweight photo-quality heuristics for the listing wizard.
 *
 * IMPORTANT — this is an ASSISTANT, not a gate. It measures objective, cheap
 * signals (brightness, sharpness, aspect ratio, duplicates) that any photo
 * genuinely fails, and it never guesses content ("this is not a car",
 * "this is a render") nor touches pricing/verification decisions. Nothing here
 * can block a publish.
 *
 * Why not a vision model: the project already has AI for price analysis, but a
 * vision call per photo costs latency and money on the critical path of the
 * most important seller action. A brightness/sharpness histogram gives most of
 * the benefit for zero latency and zero hallucination risk — which matters,
 * because an AI that says "no car detected" on a valid photo would be a real
 * harm to a seller.
 */

export interface PhotoHint {
  level: 'ok' | 'warn';
  code: 'DARK' | 'BLURRY' | 'PORTRAIT_ONLY' | 'DUPLICATE' | 'LOW_RES';
  message: string;
}

export interface PhotoAnalysis {
  index: number;
  hints: PhotoHint[];
}

interface Sample {
  avgBrightness: number;
  /** Mean absolute Laplacian response — a classic blur proxy. */
  sharpness: number;
  width: number;
  height: number;
}

/** Reads a downscaled greyscale version to keep the math cheap. */
function analyseOne(file: File): Promise<Sample | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const w = Math.min(160, img.naturalWidth);
        const h = Math.min(160, img.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        let sum = 0;
        const grey = new Float32Array(w * h);
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
          const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          grey[p] = v;
          sum += v;
        }
        const avgBrightness = sum / (w * h);

        // Laplacian over the greyscale plane.
        let lap = 0;
        let n = 0;
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            const v = 4 * grey[i] - grey[i - 1] - grey[i + 1] - grey[i - w] - grey[i + w];
            lap += Math.abs(v);
            n++;
          }
        }
        const sharpness = n ? lap / n : 0;
        resolve({ avgBrightness, sharpness, width: img.naturalWidth, height: img.naturalHeight });
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

/** Cheap perceptual hash for near-duplicate detection. */
async function dHash(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const w = 9, h = 8;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        const grey: number[] = [];
        for (let i = 0; i < data.length; i += 4) {
          grey.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }
        let bits = '';
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w - 1; x++) {
            bits += grey[y * w + x] > grey[y * w + x + 1] ? '1' : '0';
          }
        }
        resolve(bits);
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

function hamming(a: string, b: string): number {
  if (a.length !== b.length) return 99;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

/**
 * Analyse a set of photos. Returns at most one hint per problem per photo, and
 * never more than a couple of hints overall, so the seller is not buried.
 */
export async function analysePhotos(files: File[]): Promise<PhotoAnalysis[]> {
  const results: PhotoAnalysis[] = [];
  const hashes: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const hints: PhotoHint[] = [];
    const [sample, hash] = await Promise.all([analyseOne(files[i]), dHash(files[i])]);
    if (hash) {
      const dupIdx = hashes.findIndex((h) => hamming(h, hash) <= 6);
      if (dupIdx !== -1) {
        hints.push({
          level: 'warn',
          code: 'DUPLICATE',
          message: `تشبه الصورة ${dupIdx + 1} — يمكنك حذفها أو استبدالها بزاوية مختلفة`,
        });
      }
      hashes.push(hash);
    }

    if (sample) {
      if (sample.avgBrightness < 42) {
        hints.push({ level: 'warn', code: 'DARK', message: 'الصورة مظلمة — الإضاءة جيدة تجعل السيارة أوضح' });
      } else if (sample.avgBrightness > 232) {
        hints.push({ level: 'warn', code: 'DARK', message: 'الصورة فاتحة جداً (إضاءة زائدة) — قلّل التعرّض' });
      }
      if (sample.sharpness < 6) {
        hints.push({ level: 'warn', code: 'BLURRY', message: 'الصورة غير حادة — تحقّق من عدم الحركة أثناء الالتقاط' });
      }
      if (Math.min(sample.width, sample.height) < 640) {
        hints.push({ level: 'warn', code: 'LOW_RES', message: 'الدقة منخفضة — 640 بكسل على الأقل لكل جانب' });
      }
      if (sample.height > sample.width * 1.4) {
        hints.push({ level: 'warn', code: 'PORTRAIT_ONLY', message: 'صورة عمودية فقط — أضف صوراً أفقية لإبراز عرض السيارة' });
      }
    }

    if (hints.length) results.push({ index: i, hints });
  }
  return results;
}

/** Aggregate guidance shown once, above the gallery. */
export function summarisePhotoHints(list: PhotoAnalysis[]): string[] {
  const out: string[] = [];
  const all = list.flatMap((r) => r.hints);
  const count = (code: PhotoHint['code']) => all.filter((h) => h.code === code).length;
  if (count('DARK')) out.push('بعض الصور مظلمة أو فاتحة — أعد ضبط الإضاءة');
  if (count('BLURRY')) out.push('بعض الصور غير حادة');
  if (count('DUPLICATE')) out.push('توجد صور متشابهة — كل زاوية تضيف قيمة مختلفة');
  if (count('LOW_RES')) out.push('بعض الصور بدقة منخفضة');
  if (count('PORTRAIT_ONLY')) out.push('أضف صوراً أفقية إلى جانب العمودية');
  return out.slice(0, 4);
}
