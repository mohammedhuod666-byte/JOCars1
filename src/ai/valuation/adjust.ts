/**
 * Spec-difference adjustments (Requirement §2, §3, §4, §5, §6):
 * Bring each comparable to the target's spec before pricing, recording every delta in JOD.
 * Every adjustment includes provenance (MARKET_DERIVED vs CONSERVATIVE_HEURISTIC),
 * mathematical formula, and clear audit reason.
 * 
 * Strict rule: NO double adjustments. Adjustments are applied strictly here and once only.
 */
import type { Comparable, VehicleSpec, PriceAdjustment, AdjustmentProvenance } from './types';

export interface Calibration {
  perYearJod: number;   // price delta per model-year step
  per10kKmJod: number;  // price delta per 10,000 km
  calibrated: boolean;
  provenance: AdjustmentProvenance;
  sampleSize: number;
}

const DEFAULT_ANNUAL_DEPRECIATION_RATE = 0.075; // 7.5% annual depreciation baseline for Jordan market
const DEFAULT_PER_10K_KM = 180;

export function calibrate(rows: Comparable[]): Calibration {
  const same = rows.filter(
    (r) => r.included && r.year !== null && r.year !== undefined && r.kilometers && r.priceJod > 0,
  );
  if (same.length < 8) {
    return {
      perYearJod: 0,
      per10kKmJod: DEFAULT_PER_10K_KM,
      calibrated: false,
      provenance: 'CONSERVATIVE_HEURISTIC',
      sampleSize: same.length,
    };
  }
  // Median price per year → median year-step.
  const byYear = new Map<number, number[]>();
  for (const r of same) {
    const arr = byYear.get(r.year!) || [];
    arr.push(r.priceJod);
    byYear.set(r.year!, arr);
  }
  const med = (a: number[]) => {
    const s = [...a].sort((x, y) => x - y);
    return s[Math.floor(s.length / 2)];
  };
  const years = [...byYear.keys()].sort();
  const steps: number[] = [];
  for (let i = 1; i < years.length; i++) {
    steps.push((med(byYear.get(years[i])!) - med(byYear.get(years[i - 1])!)) / (years[i] - years[i - 1]));
  }
  steps.sort((a, b) => a - b);
  const perYearJod = steps.length > 0 ? Math.max(150, Math.round(steps[Math.floor(steps.length / 2)])) : 0;

  // Km slope: median price of low-km half vs high-km half, per 10k km.
  const kms = same.map((r) => r.kilometers!).sort((a, b) => a - b);
  const mid = kms[Math.floor(kms.length / 2)];
  const lo = same.filter((r) => r.kilometers! <= mid).map((r) => r.priceJod);
  const hi = same.filter((r) => r.kilometers! > mid).map((r) => r.priceJod);
  const kmGap = Math.max(10000, (Math.max(...kms) - Math.min(...kms)) / 2);
  const per10kKmJod = lo.length && hi.length
    ? Math.max(50, Math.min(600, Math.round(((med(lo) - med(hi)) / kmGap) * 10000)))
    : DEFAULT_PER_10K_KM;
  return { perYearJod, per10kKmJod, calibrated: true, provenance: 'MARKET_DERIVED', sampleSize: same.length };
}

const TRIM_BONUS: Record<string, number> = {
  LE: 0, SE: 250, XLE: 700, XSE: 900, LIMITED: 1100, PLATINUM: 1400,
  PREMIUM: 600, LUXURY: 800, SPORT: 400, FULL: 500,
};

export function adjustComparable(r: Comparable, spec: VehicleSpec, cal: Calibration): Comparable {
  const adj: PriceAdjustment[] = [];
  let price = r.priceJod;

  // 1. Year Adjustment
  if (r.year !== null && r.year !== undefined && r.year !== spec.year) {
    const yearDiff = r.year - spec.year; // positive = comp is newer than target
    let d: number;
    let method: string;
    let formula: string;
    let provenance: AdjustmentProvenance = cal.calibrated ? 'MARKET_DERIVED' : 'CONSERVATIVE_HEURISTIC';

    if (cal.calibrated && cal.perYearJod > 0) {
      d = -yearDiff * cal.perYearJod;
      method = 'Corpus Median Year Step Regression';
      formula = `delta = -(${yearDiff} years) * ${cal.perYearJod} JOD/year`;
    } else {
      // Percentage compound annual depreciation based on vehicle price
      const rate = DEFAULT_ANNUAL_DEPRECIATION_RATE;
      if (yearDiff > 0) {
        // Comp is newer -> discount down to target year
        d = -Math.round(r.priceJod * (1 - Math.pow(1 - rate, Math.min(yearDiff, 8))));
        method = 'Compound Annual Segment Depreciation (Newer Comp Discount)';
        formula = `delta = -round(price * (1 - (1 - ${rate})^${yearDiff}))`;
      } else {
        // Comp is older -> add back depreciation up to target year
        const absDiff = Math.abs(yearDiff);
        d = Math.round(r.priceJod * (Math.pow(1 + rate, Math.min(absDiff, 8)) - 1));
        method = 'Compound Annual Segment Depreciation (Older Comp Appreciation)';
        formula = `delta = +round(price * ((1 + ${rate})^${absDiff} - 1))`;
      }
    }

    // Safety cap: single year adjustment cannot exceed 50% of the comp price to prevent artificial distortion
    const cap = Math.round(r.priceJod * 0.50);
    const uncapped = d;
    d = Math.max(-cap, Math.min(cap, d));
    price += d;

    adj.push({
      factor: 'year',
      factorAr: `تعديل فارق سنة الصنع (${r.year} ← ${spec.year})`,
      delta: d,
      provenance,
      method,
      formula: uncapped !== d ? `${formula} [مقيّد بسقف 50%]` : formula,
      reason: yearDiff > 0
        ? `المقارنة أحدث بـ ${yearDiff} سنوات، تم خصم فارق الاستهلاك الزمني`
        : `المقارنة أقدم بـ ${Math.abs(yearDiff)} سنوات، تمت إضافة قيمة حداثة سنة الصنع المستهدفة`,
    });
  }

  // 2. Mileage Adjustment
  if (r.kilometers != null && spec.kilometers != null) {
    const kmDiff = r.kilometers - spec.kilometers; // positive = comp driven more than target
    const ratePer10k = cal.calibrated
      ? cal.per10kKmJod
      : Math.max(120, Math.min(450, Math.round(r.priceJod * 0.005))); // ~0.5% per 10k km

    const d = Math.round((kmDiff / 10000) * ratePer10k);
    if (Math.abs(d) >= 50) {
      price += d;
      adj.push({
        factor: 'mileage',
        factorAr: `تعديل فارق الممشى (${r.kilometers.toLocaleString()} كم ← ${spec.kilometers.toLocaleString()} كم)`,
        delta: d,
        provenance: cal.calibrated ? 'MARKET_DERIVED' : 'CONSERVATIVE_HEURISTIC',
        method: 'Linear Kilometers Wear Slope',
        formula: `delta = ((${r.kilometers} - ${spec.kilometers}) / 10000) * ${ratePer10k}`,
        reason: kmDiff > 0
          ? `المقارنة قطعت مسافة أكبر (+${kmDiff.toLocaleString()} كم)، تمت إضافة تعويض الاستهلاك`
          : `المقارنة أقل استهلاكاً (-${Math.abs(kmDiff).toLocaleString()} كم)، تم تعديل علاوة الممشى المنخفض لتناسب سيارة الهدف`,
      });
    }
  }

  // 3. Trim / Package Adjustment
  const rt = (r.trim || '').toUpperCase();
  const st = (spec.trim || '').toUpperCase();
  if (rt && st && rt !== st && TRIM_BONUS[rt] !== undefined && TRIM_BONUS[st] !== undefined) {
    const d = TRIM_BONUS[st] - TRIM_BONUS[rt];
    if (d !== 0) {
      price += d;
      adj.push({
        factor: 'trim',
        factorAr: `تعديل فارق الفئة (${r.trim} ← ${spec.trim})`,
        delta: d,
        provenance: 'EMPIRICAL_SEGMENT',
        method: 'Jordan Automotive Trim Premium Differential',
        formula: `delta = bonus(${spec.trim}) - bonus(${r.trim}) = ${TRIM_BONUS[st]} - ${TRIM_BONUS[rt]}`,
        reason: `فارق المواصفات التجهيزية بين فئتي ${r.trim} و ${spec.trim}`,
      });
    }
  }

  // 4. Condition Adjustment
  const COND_RANK: Record<string, number> = {
    EXCELLENT: 5, VERY_GOOD: 4, GOOD: 3, FAIR: 2, NEEDS_MAINTENANCE: 1, NEEDS_INSPECTION: 1,
  };
  const rc = COND_RANK[(r.condition || '').toUpperCase()] ?? null;
  const sc = COND_RANK[(spec.condition || '').toUpperCase()] ?? null;
  if (rc !== null && sc !== null && rc !== sc) {
    const d = Math.round(Math.max(-r.priceJod * 0.1, Math.min(r.priceJod * 0.1, (sc - rc) * r.priceJod * 0.03)));
    if (Math.abs(d) >= 50) {
      price += d;
      adj.push({
        factor: 'condition',
        factorAr: `تعديل فارق الحالة العامة (${r.condition} ← ${spec.condition})`,
        delta: d,
        provenance: 'CONSERVATIVE_HEURISTIC',
        method: 'Condition Step Differential (3% per tier rank)',
        formula: `delta = (${sc} - ${rc}) * ${r.priceJod} * 0.03`,
        reason: `تعديل فارق الحالة الفنية التقديرية بين المركبتين`,
      });
    }
  }

  // 5. Foreign Market Adjustment
  if (r.country && r.country !== 'JO') {
    const d = -Math.round(r.priceJod * 0.05);
    price += d;
    adj.push({
      factor: 'market',
      factorAr: 'تعديل سوق إقليمي (-5%)',
      delta: d,
      provenance: 'CONSERVATIVE_HEURISTIC',
      method: 'Cross-Border Valuation Calibration',
      formula: `delta = -round(price * 0.05)`,
      reason: `عكس تكاليف الشحن والجمارك والمعاينة المحلية للسوق الأردني`,
    });
  }

  const finalAdjustedPrice = Math.max(100, Math.round(price));
  return { ...r, adjustedPrice: finalAdjustedPrice, adjustments: adj };
}
