/**
 * Pricing + range + confidence (spec §5, §10, §11).
 * Weighted median leads; plain average is never used alone.
 * Confidence is built from measurable indicators only — never vibes.
 */
import type { Comparable, PriceStats, ConsensusBand, LeaveOneOutResult, WeightBreakdown, VehicleSpec } from './types';
import { MIN_INCLUDED_FOR_ESTIMATE, MIN_INCLUDED_FOR_RANGE_ONLY } from './types';
import { isDirectComparable, isConfirmedDrivetrainMismatch } from './similarity';

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base] + (sorted[base + 1] !== undefined ? rest * (sorted[base + 1] - sorted[base]) : 0);
}

/**
 * Multi-factor decomposed comparable weight (Requirement §8 & §22):
 * weight = identityWeight × yearWeight × technicalWeight × mileageWeight × completenessWeight × sourceQualityWeight × recencyWeight.
 * Every single component is stored in weightBreakdown for full mathematical auditability.
 */
export function computeDetailedWeight(
  c: Comparable,
  sourceTrust: Record<string, number>,
  spec?: VehicleSpec
): { weight: number; breakdown: WeightBreakdown } {
  // 1. Identity weight: 1.0 (strict same-model prerequisite)
  const identityWeight = 1.0;

  // 2. Year weight:
  // Same-year (Tier 1/2): 1.0
  // ±1 year (Tier 3): 0.70
  // ±2 years: 0.45
  // Tier 4 (±3 to ±10 years): scales down with distance so distant years cannot hijack FMV
  const yearDiff = c.yearDiff ?? (c.year && spec?.year ? Math.abs(c.year - spec.year) : 5);
  let yearWeight: number;
  if ((c.tier === 1 || c.tier === 2) && yearDiff === 0) {
    yearWeight = 1.0;
  } else if (yearDiff === 1) {
    yearWeight = 0.70;
  } else if (yearDiff === 2) {
    yearWeight = 0.45;
  } else {
    // yearDiff >= 3: Tier 4 support evidence discounted by year distance
    yearWeight = Math.max(0.10, Math.round((0.40 - (yearDiff - 2) * 0.05) * 100) / 100);
  }

  // 3. Technical weight: alignment of powertrain, trim, generation, and specs
  let simFraction = Math.max(0.35, Math.min(1.0, (c.similarity || 50) / 100));
  if (c.isGenerationMismatch) {
    simFraction *= 0.35; // Generation mismatch cannot be direct or high weight
  }
  if (c.isPowertrainMismatch) {
    simFraction *= 0.60;
  }
  if (spec?.drivetrain && isConfirmedDrivetrainMismatch(c, spec)) {
    simFraction *= 0.85; // Confirmed drivetrain mismatch (canonically different families)
  }
  const technicalWeight = Math.round(simFraction * 100) / 100;

  // 4. Mileage weight: penalize extreme mileage discrepancies relative to target
  let mileageWeight = 1.0;
  if (c.kilometers != null && spec?.kilometers != null && spec.kilometers > 0) {
    const kmRatio = Math.abs(c.kilometers - spec.kilometers) / spec.kilometers;
    if (kmRatio <= 0.25) mileageWeight = 1.0;
    else if (kmRatio <= 0.50) mileageWeight = 0.88;
    else if (kmRatio <= 0.80) mileageWeight = 0.75;
    else mileageWeight = 0.60;
  }

  // 5. Completeness weight: penalize missing attributes
  let knownCount = 0;
  const totalTracked = 5;
  if (c.year != null) knownCount++;
  if (c.kilometers != null) knownCount++;
  if (c.trim != null) knownCount++;
  if (c.fuelType != null) knownCount++;
  if (c.transmission != null) knownCount++;
  const completenessWeight = Math.round((0.60 + 0.40 * (knownCount / totalTracked)) * 100) / 100;

  // 6. Source Quality weight
  const sourceQualityWeight = sourceTrust[c.source] ?? 0.85;

  // 7. Recency weight: freshness decay
  const days = c.ageDays ?? 30;
  const recencyWeight = days <= 7 ? 1.0 : days <= 30 ? 0.90 : days <= 90 ? 0.75 : 0.60;

  const rawCompositeWeight = Math.round(
    identityWeight *
    yearWeight *
    technicalWeight *
    mileageWeight *
    completenessWeight *
    sourceQualityWeight *
    recencyWeight * 1000
  ) / 1000;

  const finalWeight = Math.max(0.01, rawCompositeWeight);

  const breakdown: WeightBreakdown = {
    identityWeight,
    yearWeight,
    technicalWeight,
    mileageWeight,
    completenessWeight,
    sourceQualityWeight,
    recencyWeight,
    rawCompositeWeight,
    finalNormalizedWeight: finalWeight,
  };

  return { weight: finalWeight, breakdown };
}

export function computeWeight(
  c: Comparable,
  sourceTrust: Record<string, number>,
  spec?: VehicleSpec
): number {
  const res = computeDetailedWeight(c, sourceTrust, spec);
  c.weightBreakdown = res.breakdown;
  return res.weight;
}

/**
 * Normalizes weights between Primary Set (Tiers 1 & 2 / same-year)
 * and Secondary Set (Tiers 3 & 4 / different years) so that Primary Set
 * controls at least 85% of total weight when present.
 * Also computes each comparable's mathematical contributionPercent to total weight.
 * (Requirement §2 & §8)
 */
export function balancePrimarySecondaryWeights(comps: Comparable[]): Comparable[] {
  const primary = comps.filter((c) => isDirectComparable(c));
  const secondary = comps.filter((c) => !isDirectComparable(c));

  const primaryWeight = primary.reduce((sum, c) => sum + c.weight, 0);
  const secondaryWeight = secondary.reduce((sum, c) => sum + c.weight, 0);
  const totalWeight = primaryWeight + secondaryWeight;

  if (primaryWeight > 0 && secondaryWeight > 0 && totalWeight > 0) {
    const secondaryShare = secondaryWeight / totalWeight;
    // Secondary set can never exceed 15% of total weight when primary evidence exists
    if (secondaryShare > 0.15) {
      const targetSecondaryWeight = (primaryWeight * 0.1495) / 0.8505;
      const scale = targetSecondaryWeight / secondaryWeight;
      for (const c of secondary) {
        c.weight = Math.max(0.001, Math.round(c.weight * scale * 10000) / 10000);
        if (c.weightBreakdown) {
          c.weightBreakdown.finalNormalizedWeight = c.weight;
        }
      }
    }
  }

  // Calculate mathematical contribution percentage for each comparable
  const finalTotalW = comps.reduce((sum, c) => sum + c.weight, 0);
  for (const c of comps) {
    c.contributionPercent = finalTotalW > 0
      ? Math.round((c.weight / finalTotalW) * 1000) / 10
      : 0;
  }

  return comps;
}

/**
 * Market Consensus Band (Requirement §4):
 * Calculates the pricing consensus from primary market comparables.
 */
export function buildMarketConsensusBand(comps: Comparable[]): ConsensusBand {
  if (comps.length === 0) {
    return { low: 0, high: 0, median: 0, count: 0, spread: 0 };
  }
  const prices = comps.map((c) => c.adjustedPrice ?? c.priceJod).sort((a, b) => a - b);
  const low = prices[0];
  const high = prices[prices.length - 1];
  const median = Math.round(quantile(prices, 0.5));
  const spread = high - low;
  return { low, high, median, count: comps.length, spread };
}

/**
 * Leave-One-Out Sensitivity Analysis (Requirement §4):
 * Systematically removes each comparable to verify that no single listing dictates the FMV.
 */
export function computeLeaveOneOut(comps: Comparable[], baseFmv: number): LeaveOneOutResult[] {
  if (comps.length < 2 || baseFmv <= 0) return [];
  const results: LeaveOneOutResult[] = [];

  for (let i = 0; i < comps.length; i++) {
    const c = comps[i];
    const subset = comps.filter((_, idx) => idx !== i);
    const subItems = subset.map((item) => ({ price: item.adjustedPrice ?? item.priceJod, weight: item.weight }));
    const subFmv = weightedMedian(subItems);
    const absoluteShift = subFmv - baseFmv;
    const percentShift = baseFmv > 0 ? Math.round((absoluteShift / baseFmv) * 1000) / 10 : 0;
    const isDominant = Math.abs(percentShift) > 10 || Math.abs(absoluteShift) > 1500;

    results.push({
      comparableId: c.externalId || c.url || `comp-${i + 1}`,
      comparableTitle: `${c.brand} ${c.model} ${c.year || ''} (${c.sourceLabel})`.trim(),
      price: c.adjustedPrice ?? c.priceJod,
      weight: Math.round(c.weight * 1000) / 1000,
      fmvWithout: subFmv,
      absoluteShift,
      percentShift,
      isDominant,
    });
  }

  return results;
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

/**
 * Multiple Internal Estimates calculation (Phase 3 Requirement):
 * Separates direct vs supporting comparables and calculates both robust and indicative statistics.
 */
export function priceStats(included: Comparable[], askingPrice?: number | null): PriceStats {
  const prices = included.map((c) => c.adjustedPrice ?? c.priceJod).sort((a, b) => a - b);
  const items = included.map((c) => ({ price: c.adjustedPrice ?? c.priceJod, weight: c.weight }));
  const wm = weightedMedian(items);

  // Partition into direct vs supporting comparables (single shared predicate)
  const directComps = included.filter((c) => isDirectComparable(c));
  const supportingComps = included.filter((c) => !directComps.includes(c));

  const directPrices = directComps.map((c) => c.adjustedPrice ?? c.priceJod).sort((a, b) => a - b);
  const directItems = directComps.map((c) => ({ price: c.adjustedPrice ?? c.priceJod, weight: c.weight }));

  const supportingPrices = supportingComps.map((c) => c.adjustedPrice ?? c.priceJod).sort((a, b) => a - b);

  const directWeightedMedian = directItems.length > 0 ? weightedMedian(directItems) : null;
  const directMedian = directPrices.length > 0 ? Math.round(quantile(directPrices, 0.5)) : null;
  const directWeightedMean = directItems.length > 0 ? weightedAvg(directItems) : null;
  const supportingMedian = supportingPrices.length > 0 ? Math.round(quantile(supportingPrices, 0.5)) : null;
  const combinedEstimate = wm;

  const iqr = prices.length >= 2 ? Math.round(quantile(prices, 0.75) - quantile(prices, 0.25)) : 0;
  const dispersionIqr = directPrices.length >= 2
    ? Math.round(quantile(directPrices, 0.75) - quantile(directPrices, 0.25))
    : iqr;
  const medianVal = directMedian ?? (prices.length > 0 ? Math.round(quantile(prices, 0.5)) : 0);
  const dispersionRatio = medianVal > 0 ? Math.round((dispersionIqr / medianVal) * 1000) / 1000 : 0;

  // Strict Percentile Scoping:
  // Never compute a misleading "P92" or "أعلى 15%" from mixed or distant supporting comps!
  // Percentile is scoped to direct comps when >= 4 direct comps exist.
  // When direct evidence is limited, percentile is explicitly scoped to supporting observations or null.
  let askingPricePercentile: number | null = null;
  let askingPricePremiumPercent: number | null = null;
  let percentileScope: 'DIRECT' | 'SUPPORTING' | null = null;

  const baselinePrice = directWeightedMedian ?? combinedEstimate;

  if (askingPrice != null && askingPrice > 0) {
    if (baselinePrice > 0) {
      askingPricePremiumPercent = Math.round(((askingPrice - baselinePrice) / baselinePrice) * 1000) / 10;
    }

    if (directPrices.length >= 4) {
      const countBelow = directPrices.filter((p) => p < askingPrice).length;
      const countEqual = directPrices.filter((p) => p === askingPrice).length;
      askingPricePercentile = Math.round(((countBelow + 0.5 * countEqual) / directPrices.length) * 100);
      percentileScope = 'DIRECT';
    } else if (prices.length >= 4) {
      const countBelow = prices.filter((p) => p < askingPrice).length;
      const countEqual = prices.filter((p) => p === askingPrice).length;
      askingPricePercentile = Math.round(((countBelow + 0.5 * countEqual) / prices.length) * 100);
      percentileScope = 'SUPPORTING';
    } else {
      askingPricePercentile = null;
      percentileScope = null;
    }
  }

  return {
    weightedMedian: wm,
    weightedAvg: weightedAvg(items),
    median: Math.round(quantile(prices, 0.5)),
    p25: Math.round(quantile(prices, 0.25)),
    p50: Math.round(quantile(prices, 0.5)),
    p75: Math.round(quantile(prices, 0.75)),
    p85: Math.round(quantile(prices, 0.85)),
    p90: Math.round(quantile(prices, 0.90)),
    iqr,
    directWeightedMedian,
    directMedian,
    directWeightedMean,
    supportingMedian,
    combinedEstimate,
    dispersionIqr,
    dispersionRatio,
    percentileScope,
    askingPricePercentile,
    askingPricePremiumPercent,
  };
}

/**
 * Phase 5 — Source accounting that matches the displayed number:
 * - FMV mode: the FMV (and its range) is computed ONLY from direct comparables
 *   (directWeightedMedian + direct dispersion) -> count only their sources.
 * - INDICATIVE / SUPPORTING modes: the combined estimate uses ALL included
 *   comparables -> count every included source.
 * Never counts sources that merely produced listings which did not enter the number.
 */
export function sourcesDrivingNumber(
  valuationMode: import('./types').ValuationMode,
  comps: Comparable[],
): number {
  const driving = valuationMode === 'FMV' ? comps.filter((c) => isDirectComparable(c)) : comps;
  return new Set(driving.map((c) => c.source)).size;
}

export function calculateFMV(adjustedComps: Comparable[], askingPrice?: number | null): {
  fmv: number | null;
  indicativePrice: number | null;
  valuationMode: import('./types').ValuationMode;
  minPrice: number;
  maxPrice: number;
  stats: PriceStats;
  isWideRange: boolean;
  rangeDisclaimerAr: string;
  directCompsCount: number;
  supportingCompsCount: number;
} {
  const stats = priceStats(adjustedComps, askingPrice);
  const directComps = adjustedComps.filter((c) => isDirectComparable(c));
  const directCompsCount = directComps.length;
  const supportingCompsCount = adjustedComps.length - directCompsCount;
  const prices = adjustedComps.map((c) => c.adjustedPrice ?? c.priceJod).sort((a, b) => a - b);

  // CASE A: Direct Evidence >= 3 => FMV allowed
  if (directCompsCount >= 3) {
    const fmv = stats.directWeightedMedian ?? stats.weightedMedian;
    const spread = Math.max(Math.round((stats.dispersionIqr || stats.iqr) / 2), Math.round(fmv * 0.03));
    const minPrice = Math.max(100, fmv - spread);
    const maxPrice = fmv + spread;
    const isWideRange = (maxPrice - minPrice) > fmv * 0.25;
    const rangeDisclaimerAr = isWideRange
      ? 'نطاق القيمة السوقية العادلة (تباين في أسعار العروض المباشرة)'
      : 'نطاق القيمة السوقية العادلة بناءً على مقارنات مباشرة من نفس الموديل والجيل ونظام المحرك';

    return {
      fmv,
      indicativePrice: null,
      valuationMode: 'FMV',
      minPrice,
      maxPrice,
      stats,
      isWideRange,
      rangeDisclaimerAr,
      directCompsCount,
      supportingCompsCount,
    };
  }

  // CASE B: Direct Evidence = 1 or 2 => INDICATIVE only (FMV is null)
  if (directCompsCount === 1 || directCompsCount === 2) {
    const indicativePrice = stats.combinedEstimate ?? stats.weightedMedian;
    const spread = Math.max(Math.round(stats.iqr / 2), Math.round(indicativePrice * 0.05));
    const minPrice = Math.max(100, indicativePrice - spread);
    const maxPrice = indicativePrice + spread;

    return {
      fmv: null,
      indicativePrice,
      valuationMode: 'INDICATIVE',
      minPrice,
      maxPrice,
      stats,
      isWideRange: true,
      rangeDisclaimerAr: 'قيمة استرشادية تقديرية فقط — عدد المقارنات المباشرة (1-2) غير كافٍ لاعتماد FMV مؤكد',
      directCompsCount,
      supportingCompsCount,
    };
  }

  // CASE C: Direct Evidence = 0 => SUPPORTING_RANGE_ONLY (FMV and indicativePrice are null)
  const minPrice = stats.p25 > 0 ? stats.p25 : (prices[0] || 100);
  const maxPrice = stats.p75 > 0 ? stats.p75 : (prices[prices.length - 1] || 100);

  return {
    fmv: null,
    indicativePrice: null,
    valuationMode: 'SUPPORTING_RANGE_ONLY',
    minPrice,
    maxPrice,
    stats,
    isWideRange: true,
    rangeDisclaimerAr: 'نطاق استرشادي للشواهد الداعمة فقط — لا يتوفر FMV لعدم وجود أي مقارنة مباشرة متطابقة الجيل والمحرك والسنة (محدودية الأدلة المباشرة)',
    directCompsCount: 0,
    supportingCompsCount,
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
