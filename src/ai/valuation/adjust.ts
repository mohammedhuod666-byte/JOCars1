/**
 * Spec-difference adjustments (spec §6, §7): bring each comparable to the
 * target's spec before pricing, recording every delta in JOD.
 * Year/km slopes are calibrated from the corpus itself when ≥8 same-model
 * rows exist, else conservative Jordan-market defaults.
 */
import type { Comparable, VehicleSpec } from './types';

export interface Calibration {
  perYearJod: number;   // price delta per model-year step
  per10kKmJod: number;  // price delta per 10,000 km
  calibrated: boolean;
}

const DEFAULT_PER_YEAR = 700;
const DEFAULT_PER_10K_KM = 180;

export function calibrate(rows: Comparable[]): Calibration {
  const same = rows.filter(
    (r) => r.included && r.year !== null && r.year !== undefined && r.kilometers && r.priceJod > 0,
  );
  if (same.length < 8) {
    return { perYearJod: DEFAULT_PER_YEAR, per10kKmJod: DEFAULT_PER_10K_KM, calibrated: false };
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
  const perYearJod = steps.length > 0 ? Math.max(150, Math.round(steps[Math.floor(steps.length / 2)])) : DEFAULT_PER_YEAR;

  // Km slope: median price of low-km half vs high-km half, per 10k km.
  const kms = same.map((r) => r.kilometers!).sort((a, b) => a - b);
  const mid = kms[Math.floor(kms.length / 2)];
  const lo = same.filter((r) => r.kilometers! <= mid).map((r) => r.priceJod);
  const hi = same.filter((r) => r.kilometers! > mid).map((r) => r.priceJod);
  const kmGap = Math.max(10000, (Math.max(...kms) - Math.min(...kms)) / 2);
  const per10kKmJod = lo.length && hi.length
    ? Math.max(50, Math.min(600, Math.round(((med(lo) - med(hi)) / kmGap) * 10000)))
    : DEFAULT_PER_10K_KM;
  return { perYearJod, per10kKmJod, calibrated: true };
}

const TRIM_BONUS: Record<string, number> = {
  LE: 0, SE: 250, XLE: 700, XSE: 900, LIMITED: 1100, PLATINUM: 1400,
  PREMIUM: 600, LUXURY: 800, SPORT: 400, FULL: 500,
};

export function adjustComparable(r: Comparable, spec: VehicleSpec, cal: Calibration): Comparable {
  const adj: { factor: string; factorAr: string; delta: number }[] = [];
  let price = r.priceJod;

  if (r.year !== null && r.year !== undefined && r.year !== spec.year) {
    // Newer comp than target → subtract; older → add. Capped: a 30-year gap
    // must inform direction, never dominate the price (±50% of comp price).
    let d = (spec.year - r.year) * cal.perYearJod;
    const cap = Math.round(r.priceJod * 0.5);
    d = Math.max(-cap, Math.min(cap, d));
    price += d;
    adj.push({ factor: 'year', factorAr: `فرق السنة (${r.year}←${spec.year})`, delta: Math.round(d) });
  }
  if (r.kilometers && spec.kilometers) {
    const d = ((r.kilometers - spec.kilometers) / 10000) * cal.per10kKmJod;
    price += d; // comp driven more → add back the wear discount
    if (Math.abs(d) >= 20) {
      adj.push({ factor: 'km', factorAr: `فرق الممشى (${r.kilometers.toLocaleString()} كم)`, delta: Math.round(d) });
    }
  }
  const rt = (r.trim || '').toUpperCase();
  const st = (spec.trim || '').toUpperCase();
  if (rt && st && rt !== st && TRIM_BONUS[rt] !== undefined && TRIM_BONUS[st] !== undefined) {
    const d = TRIM_BONUS[st] - TRIM_BONUS[rt];
    price += d;
    adj.push({ factor: 'trim', factorAr: `فرق الفئة (${r.trim}←${spec.trim})`, delta: Math.round(d) });
  }
  const COND_RANK: Record<string, number> = {
    EXCELLENT: 5, VERY_GOOD: 4, GOOD: 3, FAIR: 2, NEEDS_MAINTENANCE: 1, NEEDS_INSPECTION: 1,
  };
  const rc = COND_RANK[(r.condition || '').toUpperCase()] ?? null;
  const sc = COND_RANK[(spec.condition || '').toUpperCase()] ?? null;
  if (rc !== null && sc !== null && rc !== sc) {
    // One condition step ≈ 3% of price, capped at ±10%.
    const d = Math.max(-price * 0.1, Math.min(price * 0.1, (sc - rc) * price * 0.03));
    if (Math.abs(d) >= 20) {
      price += d;
      adj.push({ factor: 'condition', factorAr: `فرق الحالة (${r.condition}←${spec.condition})`, delta: Math.round(d) });
    }
  }
  if (r.country && r.country !== 'JO') {
    // Foreign-market comp: widen, don't pretend precision (spec §8).
    const d = -Math.round(price * 0.05);
    price += d;
    adj.push({ factor: 'market', factorAr: 'تعديل سوق أجنبي (-5%)', delta: d });
  }

  return { ...r, adjustedPrice: Math.max(100, Math.round(price)), adjustments: adj };
}
