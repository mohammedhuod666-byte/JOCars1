/**
 * Pricing + range + confidence (spec §5, §10, §11).
 * Weighted median leads; plain average is never used alone.
 * Confidence is built from measurable indicators only — never vibes.
 */
import type { Comparable, PriceStats } from './types';
import { MIN_INCLUDED_FOR_ESTIMATE, MIN_INCLUDED_FOR_RANGE_ONLY } from './types';

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base] + (sorted[base + 1] !== undefined ? rest * (sorted[base + 1] - sorted[base]) : 0);
}

/** Weight = tier × similarity × freshness × source trust. */
export function computeWeight(c: Comparable, sourceTrust: Record<string, number>): number {
  const tierW = c.tier === 1 ? 1 : c.tier === 2 ? 0.85 : c.tier === 3 ? (c.yearDiff <= 1 ? 0.7 : 0.5) : 0.3;
  const sim = c.similarity / 100;
  const fresh = c.ageDays <= 7 ? 1 : c.ageDays <= 30 ? 0.85 : c.ageDays <= 90 ? 0.65 : 0.45;
  const trust = sourceTrust[c.source] ?? 0.8;
  return Math.max(0.05, tierW * sim * fresh * trust);
}

export function weightedMedian(items: { price: number; weight: number }[]): number {
  if (items.length === 0) return 0;
  const s = [...items].sort((a, b) => a.price - b.price);
  const total = s.reduce((x, y) => x + y.weight, 0);
  let acc = 0;
  for (const it of s) {
    acc += it.weight;
    if (acc >= total / 2) return Math.round(it.price);
  }
  return Math.round(s[s.length - 1].price);
}

export function weightedAvg(items: { price: number; weight: number }[]): number {
  const tw = items.reduce((x, y) => x + y.weight, 0);
  if (tw <= 0) return 0;
  return Math.round(items.reduce((x, y) => x + y.price * y.weight, 0) / tw);
}

export function priceStats(included: Comparable[]): PriceStats {
  const prices = included.map((c) => c.adjustedPrice ?? c.priceJod).sort((a, b) => a - b);
  const items = included.map((c) => ({ price: c.adjustedPrice ?? c.priceJod, weight: c.weight }));
  return {
    weightedMedian: weightedMedian(items),
    weightedAvg: weightedAvg(items),
    median: Math.round(quantile(prices, 0.5)),
    p25: Math.round(quantile(prices, 0.25)),
    p75: Math.round(quantile(prices, 0.75)),
    iqr: Math.round(quantile(prices, 0.75) - quantile(prices, 0.25)),
  };
}

export interface ConfidenceInput {
  used: number;
  found: number;
  sourcesUsed: number;
  highSim: number;   // similarity >= 80
  spreadRatio: number; // iqr / median
  freshShare: number;  // share of comps <= 30 days
  specComplete: boolean;
  yearMatchShare: number;   // share with |Δyear| == 0
  trimMatchShare: number;   // share with trim equal-or-unknown
  engineMatchShare: number; // share with fuel+trans equal-or-unknown
  tier1Share: number;       // share of exact-tier comps
  excludedShare: number;    // share of found rows rejected (sanity/dup/outlier)
}

export function confidenceScore(i: ConfidenceInput): { score: number; label: 'مرتفع' | 'متوسط' | 'منخفض'; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  // Sample size (max 22)
  if (i.used >= 16) { score += 22; reasons.push(`${i.used} إعلاناً مشابهاً مستخدماً`); }
  else if (i.used >= 7) { score += 17; reasons.push(`${i.used} إعلانات مشابهة`); }
  else if (i.used >= 4) { score += 11; reasons.push(`${i.used} إعلانات فقط — عينة محدودة`); }
  else { score += 5; reasons.push(`عينة ضعيفة (${i.used})`); }
  // High-similarity share (max 20)
  const hiShare = i.used > 0 ? i.highSim / i.used : 0;
  if (hiShare >= 0.5) { score += 20; reasons.push(`${i.highSim} إعلاناً بتطابق عالٍ (80%+)`); }
  else if (hiShare >= 0.25) { score += 12; reasons.push('تطابق عالٍ جزئي'); }
  else { score += 4; reasons.push('تشابه متوسط في الغالب'); }
  // Year/trim/engine match (max 18: 8+5+5)
  if (i.yearMatchShare >= 0.6) { score += 8; reasons.push('غالبية المقارنات بنفس السنة'); }
  else if (i.yearMatchShare >= 0.3) { score += 4; reasons.push('جزء من المقارنات بسنوات قريبة'); }
  else { score += 1; reasons.push('معظم المقارنات بسنوات مختلفة'); }
  if (i.trimMatchShare >= 0.6) { score += 5; } else { reasons.push('اختلاف الفئات بين المقارنات'); }
  if (i.engineMatchShare >= 0.6) { score += 5; } else { reasons.push('اختلاف الوقود/الجير بين المقارنات'); }
  // Source diversity + coverage (max 15)
  if (i.sourcesUsed >= 3) { score += 10; reasons.push(`${i.sourcesUsed} مصادر بيانات`); }
  else if (i.sourcesUsed === 2) { score += 6; reasons.push('مصدران فقط'); }
  else { score += 2; reasons.push('مصدر واحد — خطر التحيز'); }
  if (i.tier1Share >= 0.5) { score += 5; reasons.push('نصف العينة على الأقل مطابقة تامة'); }
  // Spread (max 12)
  if (i.spreadRatio <= 0.12) { score += 12; reasons.push('إجماع سعري ضيق بين المقارنات'); }
  else if (i.spreadRatio <= 0.25) { score += 7; reasons.push('تباين سعري متوسط'); }
  else { score += 2; reasons.push('تباين سعري كبير بين المقارنات — يعود جزئياً لاختلاف المواصفات والحالة، لذلك انخفضت الثقة'); }
  // Freshness (max 8)
  if (i.freshShare >= 0.7) { score += 8; reasons.push('بيانات حديثة'); }
  else if (i.freshShare >= 0.4) { score += 4; reasons.push('جزء من البيانات قديم'); }
  else { score += 1; reasons.push('بيانات قديمة في الغالب'); }
  // Spec completeness (max 5)
  if (i.specComplete) { score += 5; } else { reasons.push('مواصفات السيارة غير مكتملة'); }
  // Excluded share (penalty up to -10): a market that mostly fails validation is suspect.
  if (i.excludedShare >= 0.7) { score -= 10; reasons.push('معظم المرشحين مرفوضون (أسعار مشبوهة/تكرار) — السوق غير موثوق لهذا الموديل'); }
  else if (i.excludedShare >= 0.4) { score -= 5; reasons.push('جزء كبير من المرشحين مرفوض'); }

  score = Math.max(5, Math.min(97, Math.round(score)));
  const label = score >= 75 ? 'مرتفع' : score >= 50 ? 'متوسط' : 'منخفض';
  return { score, label, reasons };
}

export type Sufficiency = 'ok' | 'range-only' | 'insufficient';

export function sufficiency(used: number): Sufficiency {
  if (used >= MIN_INCLUDED_FOR_ESTIMATE) return 'ok';
  if (used >= MIN_INCLUDED_FOR_RANGE_ONLY) return 'range-only';
  return 'insufficient';
}
