/**
 * Cleaning: exact duplicates, cross-source near-duplicates (spec §8),
 * IQR outlier fences with recorded reasons (spec §4 — never silent).
 */
import type { Comparable, NormalizedListing } from './types';
import { contentHash } from './normalize';

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base] + (sorted[base + 1] !== undefined ? rest * (sorted[base + 1] - sorted[base]) : 0);
}

/** Exact reposts (same content hash) → keep newest, exclude rest. */
export function dedupeExact(rows: Comparable[]): Comparable[] {
  const seen = new Map<string, Comparable>();
  for (const r of rows) {
    const h = contentHash([r.brandEn || r.brand, r.modelEn || r.model, r.year, r.kilometers, r.priceJod, r.city]);
    const prev = seen.get(h);
    if (!prev) {
      seen.set(h, r);
      continue;
    }
    // Keep the fresher scrape.
    const prevT = new Date(prev.scrapedAt).getTime();
    const curT = new Date(r.scrapedAt).getTime();
    if (curT >= prevT) {
      prev.included = false;
      prev.excludeReason = `إعلان مكرر (نفس السيارة برقم ${h.slice(0, 6)})`;
      prev.isDuplicateOf = r.externalId || r.url || h;
      seen.set(h, r);
    } else {
      r.included = false;
      r.excludeReason = `إعلان مكرر (نفس السيارة برقم ${h.slice(0, 6)})`;
      r.isDuplicateOf = prev.externalId || prev.url || h;
    }
  }
  return rows;
}

/**
 * Cross-source near-duplicates: same model+year, km within 2%, price
 * identical, different source → almost surely the same car reposted.
 * Keep the higher-similarity copy.
 */
export function dedupeNear(rows: Comparable[]): Comparable[] {
  const act = rows.filter((r) => r.included);
  for (let i = 0; i < act.length; i++) {
    for (let j = i + 1; j < act.length; j++) {
      const a = act[i]; const b = act[j];
      if (a.source === b.source) continue;
      if ((a.modelEn || a.model) !== (b.modelEn || b.model)) continue;
      if (a.year !== b.year) continue;
      if (a.kilometers && b.kilometers) {
        const d = Math.abs(a.kilometers - b.kilometers) / Math.max(a.kilometers, 1);
        if (d > 0.02) continue;
      }
      if (a.priceJod !== b.priceJod) continue;
      const loser = a.similarity >= b.similarity ? b : a;
      const winner = loser === a ? b : a;
      loser.included = false;
      loser.excludeReason = `نفس السيارة منشورة بموقع آخر (${winner.sourceLabel})`;
      loser.isDuplicateOf = winner.externalId || winner.url || winner.source;
    }
  }
  return rows;
}

export interface IqrResult {
  q1: number; q3: number; iqr: number;
  low: number; high: number;
  median: number;
}

/** Tukey fences (1.5×IQR) over per-JOD prices. */
export function iqrFences(prices: number[]): IqrResult {
  const s = [...prices].sort((a, b) => a - b);
  const q1 = quantile(s, 0.25);
  const q3 = quantile(s, 0.75);
  const iqr = Math.max(1, q3 - q1);
  const median = quantile(s, 0.5);
  return { q1, q3, iqr, low: q1 - 1.5 * iqr, high: q3 + 1.5 * iqr, median };
}

/** Flag out-of-fence + stale rows with reasons (spec §4). Never silently.
 * Missing year/km NEVER excludes by itself (spec: mileage/year gaps get
 * adjustments + lower weight, not deletion) — except tier 3/4 where the
 * year window IS the admission basis. Only a missing/unusable price kills.
 * IQR fences apply only with ≥5 candidates (fences from 2-3 points are noise).
 */export function flagOutliers(rows: Comparable[], fences: IqrResult, staleDays = 60): Comparable[] {
  const candidates = rows.filter((r) => r.included);
  const useIqr = candidates.length >= 5;
  for (const r of rows) {
    if (!r.included) continue;
    if (!r.priceJod || r.priceJod <= 0) {
      r.included = false;
      r.excludeReason = 'بدون سعر صالح';
      continue;
    }
    if ((r.year === null || r.year === undefined) && r.tier >= 3) {
      r.included = false;
      r.excludeReason = 'سنة مجهولة في مستوى يعتمد على السنة';
      continue;
    }
    if (useIqr) {
      if (r.priceJod < fences.low) {
        r.included = false;
        r.excludeReason = `سعر منخفض شاذ (${r.priceJod.toLocaleString()} < حد ${Math.round(fences.low).toLocaleString()})`;
        continue;
      }
      if (r.priceJod > fences.high) {
        r.included = false;
        r.excludeReason = `سعر مرتفع شاذ (${r.priceJod.toLocaleString()} > حد ${Math.round(fences.high).toLocaleString()})`;
        continue;
      }
    }
    if (r.ageDays > staleDays) {
      r.included = false;
      r.excludeReason = `إعلان قديم (${r.ageDays} يوم)`;
      continue;
    }
  }
  return rows;
}

export type SanityReason =
  | 'INVALID_PRICE' | 'POSSIBLE_PLACEHOLDER' | 'SUSPICIOUS_PRICE' | 'EXTREME_OUTLIER';

export interface SanityExclusion {
  listing: NormalizedListing;
  reason: SanityReason;
  reasonAr: string;
}

/**
 * Price sanity gate (spec: validation BEFORE adjustment).
 * Adjustment must never launder an untrustworthy raw price.
 * Judged per same-model group (n≥4) so rare models aren't punished:
 * - price ≤ 0 → INVALID_PRICE
 * - price < 100 JOD → POSSIBLE_PLACEHOLDER (teaser "15/25/65" ads)
 * - price < 15% of group median (median > 3000) → SUSPICIOUS_PRICE
 * - price > 8× group median (median > 3000) → EXTREME_OUTLIER
 */
export function sanityCheck(
  listings: NormalizedListing[],
): { clean: NormalizedListing[]; excluded: SanityExclusion[] } {
  const groups = new Map<string, NormalizedListing[]>();
  for (const l of listings) {
    const k = `${(l.brandEn || l.brand || '').toLowerCase()}|${(l.modelEn || l.model || '').toLowerCase()}`;
    const arr = groups.get(k) || [];
    arr.push(l);
    groups.set(k, arr);
  }
  const medians = new Map<string, number>();
  for (const [k, arr] of groups) {
    if (arr.length < 4) continue;
    const s = arr.map((r) => r.priceJod).sort((a, b) => a - b);
    medians.set(k, s[Math.floor(s.length / 2)]);
  }
  const clean: NormalizedListing[] = [];
  const excluded: SanityExclusion[] = [];
  for (const l of listings) {
    if (!l.priceJod || l.priceJod <= 0) {
      excluded.push({ listing: l, reason: 'INVALID_PRICE', reasonAr: 'سعر غير صالح (≤0)' });
      continue;
    }
    if (l.priceJod < 100) {
      excluded.push({ listing: l, reason: 'POSSIBLE_PLACEHOLDER', reasonAr: `سعر رمزي مشبوه (${l.priceJod}) — غالباً إعلان صوري` });
      continue;
    }
    const k = `${(l.brandEn || l.brand || '').toLowerCase()}|${(l.modelEn || l.model || '').toLowerCase()}`;
    const med = medians.get(k);
    if (med !== undefined && med > 3000) {
      if (l.priceJod < med * 0.15) {
        excluded.push({ listing: l, reason: 'SUSPICIOUS_PRICE', reasonAr: `سعر مشبوه (${l.priceJod.toLocaleString()} < 15% من وسط الموديل ${med.toLocaleString()})` });
        continue;
      }
      if (l.priceJod > med * 8) {
        excluded.push({ listing: l, reason: 'EXTREME_OUTLIER', reasonAr: `سعر متطرف (${l.priceJod.toLocaleString()} > 8× وسط الموديل)` });
        continue;
      }
    }
    clean.push(l);
  }
  return { clean, excluded };
}
