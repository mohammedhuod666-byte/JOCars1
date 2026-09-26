/**
 * Tiered matching + similarity scoring (spec §2, §3).
 *
 * Hierarchical (never binary-drop on specs):
 *   Tier 1 EXACT   — same make/model/year AND trim/engine/trans match-or-unknown
 *   Tier 2 STRONG  — same make/model/year, specs differ
 *   Tier 3 NEARBY  — same make/model, year ±1 (always) or ±2 (only when thin)
 *   Tier 4 SIMILAR — same brand, close model (only when tiers 1-3 total < 5)
 * Spec differences never delete a row — they lower similarity and get a
 * recorded price adjustment instead.
 */
import type { Comparable, NormalizedListing, VehicleSpec } from './types';
import { SIM_WEIGHTS } from './types';

function norm(s: string | null | undefined): string {
  return (s || '').toLowerCase().replace(/[\s\-_]+/g, ' ').trim();
}

export function sameModel(a: NormalizedListing, spec: VehicleSpec): boolean {
  const lm = norm(a.model);
  const sm = norm(spec.model);
  const lmEn = norm(a.modelEn);
  const smEn = norm(spec.modelEn);
  if (!lm || !sm) return !!lmEn && !!smEn && (lmEn === smEn || lmEn.includes(smEn) || smEn.includes(lmEn));
  return lm === sm || lm.includes(sm) || sm.includes(lm) || (!!lmEn && !!smEn && (lmEn === smEn));
}

function closeModel(a: NormalizedListing, spec: VehicleSpec): boolean {
  if (sameModel(a, spec)) return true;
  // Token overlap: "land cruiser" vs "land cruiser prado".
  const at = new Set(norm(a.model).split(' ').concat(norm(a.modelEn).split(' ')).filter(Boolean));
  const st = norm(spec.model).split(' ').concat(norm(spec.modelEn).split(' ')).filter(Boolean);
  if (st.length === 0) return false;
  const hit = st.filter((t) => at.has(t)).length;
  return hit > 0 && hit / st.length >= 0.5;
}

export function sameBrand(a: NormalizedListing, spec: VehicleSpec): boolean {
  const pairs: [string | null | undefined, string | null | undefined][] = [
    [a.brand, spec.brand], [a.brandEn, spec.brandEn],
  ];
  for (const [x, y] of pairs) {
    const nx = norm(x); const ny = norm(y);
    if (nx && ny && (nx === ny || nx.includes(ny) || ny.includes(nx))) return true;
  }
  return false;
}

function specMatches(a: NormalizedListing, spec: VehicleSpec): boolean {
  // A factor counts as matching when the target is unknown OR values equal.
  // Missing data must never demote a row by itself.
  const trimOk = !spec.trim || !a.trim || norm(a.trim) === norm(spec.trim);
  const fuelOk = !spec.fuelType || !a.fuelType || norm(a.fuelType) === norm(spec.fuelType);
  const transOk = !spec.transmission || !a.transmission || norm(a.transmission) === norm(spec.transmission);
  return trimOk && fuelOk && transOk;
}

export type Tier = 1 | 2 | 3 | 4;

/** Tier factor (price weight) per user framework. Year ±2 gets 0.50, ±1 gets 0.70. */
export function tierFactor(tier: Tier, yearDiff: number): number {
  if (tier === 1) return 1.0;
  if (tier === 2) return 0.85;
  if (tier === 3) return Math.abs(yearDiff) <= 1 ? 0.7 : 0.5;
  return 0.3;
}

export interface TierContext {
  allowPlus2: boolean; // year ±2 admitted only when tiers 1-2 are thin
  allowTier4: boolean; // similar-vehicle admitted only when tiers 1-3 are thin
  allowAnyYear: boolean; // expansion: same model, any year → tier 4
  allowSameBrand: boolean; // expansion: same brand any model, year ±5 → tier 4
}

const FULL_CTX: TierContext = { allowPlus2: true, allowTier4: true, allowAnyYear: false, allowSameBrand: false };

export function assignTier(a: NormalizedListing, spec: VehicleSpec, ctx: Partial<TierContext> = {}): Tier | 0 {
  const c: TierContext = { ...FULL_CTX, ...ctx };
  if (!sameBrand(a, spec)) return 0;
  const same = sameModel(a, spec);
  const yd = a.year === null || a.year === undefined ? null : Math.abs(a.year - spec.year);
  const fuelMismatch = spec.fuelType && a.fuelType && norm(a.fuelType) !== norm(spec.fuelType);

  if (same && yd === 0) {
    return specMatches(a, spec) ? 1 : 2;
  }
  if (same && yd === null) return 2; // year unknown: strong by model, never dropped
  if (same && yd !== null && yd <= 1) return fuelMismatch ? 4 : 3;
  if (same && yd !== null && yd === 2 && c.allowPlus2) return 4;
  if (same && yd !== null && yd > 2 && yd <= 5 && c.allowAnyYear) return 4; // expansion: bounded window only
  if (!same && closeModel(a, spec) && (yd === null || yd <= 2) && c.allowTier4) return 4;
  if (!same && c.allowSameBrand && (yd === null || yd <= 5)) return 4; // expansion: brand kin
  return 0;
}

function trimScore(a: NormalizedListing, spec: VehicleSpec): number {
  if (!spec.trim) return 0.5; // unknown target trim: neutral
  if (!a.trim) return 0.4;
  return norm(a.trim) === norm(spec.trim) ? 1 : 0.2;
}

function kmScore(a: NormalizedListing, spec: VehicleSpec): number {
  if (!a.kilometers || !spec.kilometers) return 0.5;
  const diff = Math.abs(a.kilometers - spec.kilometers) / Math.max(spec.kilometers, 1);
  if (diff <= 0.1) return 1;
  if (diff <= 0.25) return 0.8;
  if (diff <= 0.5) return 0.55;
  if (diff <= 1) return 0.3;
  return 0.1;
}

function engineTransScore(a: NormalizedListing, spec: VehicleSpec): number {
  let s = 0.5;
  let n = 0;
  if (spec.fuelType) {
    n++;
    if (a.fuelType && norm(a.fuelType) === norm(spec.fuelType)) {
      s += 0.5;
    } else if (a.fuelType) {
      // Different fuel: strong demotion
      s -= 0.6;
    } else {
      // Unknown fuel: moderate penalty
      s -= 0.2;
    }
  }
  if (spec.transmission) {
    n++;
    s += (a.transmission && norm(a.transmission) === norm(spec.transmission)) ? 0.5 : -0.2;
  }
  if (spec.drivetrain) {
    n++;
    s += (a.drivetrain && norm(a.drivetrain) === norm(spec.drivetrain)) ? 0.5 : -0.2;
  }
  if ((a as any).horsepower && (spec as any).horsepower) {
    n++;
    const diff = Math.abs(Number((a as any).horsepower) - Number((spec as any).horsepower)) / Math.max(1, Number((spec as any).horsepower));
    s += diff <= 0.1 ? 0.5 : diff <= 0.25 ? 0 : -0.3;
  }
  if (n === 0) return 0.5;
  return Math.max(0, Math.min(1, s));
}

/**
 * Target-leakage guard (spec: never value the car with itself).
 * Layer 1: same internal listing ID / same external URL.
 * Layer 2: fingerprint — same model + same year + km ±1% + price ≈ asking.
 * Catches the target reposted on another platform.
 */
export interface TargetIdentity {
  carId: string | null;
  spec: VehicleSpec;
  askingPrice: number | null;
}

export interface MatchRow {
  factor: string;
  factorAr: string;
  target: string;
  comp: string;
  verdict: 'EXACT' | 'CLOSE' | 'DIFFERENT' | 'UNKNOWN';
}

/** Human-readable per-factor comparison for the audit table. */
export function matchMatrix(spec: VehicleSpec, c: NormalizedListing): MatchRow[] {
  const eq = (a: any, b: any) => {
    if (a === null || a === undefined || a === '' || b === null || b === undefined || b === '') return 'UNKNOWN' as const;
    const na = String(a).toLowerCase().trim();
    const nb = String(b).toLowerCase().trim();
    if (na === nb) return 'EXACT' as const;
    return 'DIFFERENT' as const;
  };
  const num = (a: any, b: any, tol: number) => {
    if (a === null || a === undefined || b === null || b === undefined) return 'UNKNOWN' as const;
    const d = Math.abs(Number(a) - Number(b)) / Math.max(1, Number(b));
    return d === 0 ? 'EXACT' as const : d <= tol ? 'CLOSE' as const : 'DIFFERENT' as const;
  };
  const fmt = (v: any) => (v === null || v === undefined || v === '' ? '—' : String(v));
  return [
    { factor: 'year', factorAr: 'السنة', target: fmt(spec.year), comp: fmt(c.year), verdict: num(c.year, spec.year, 0) === 'EXACT' ? 'EXACT' : c.year == null ? 'UNKNOWN' : Math.abs(c.year - spec.year) <= 1 ? 'CLOSE' : 'DIFFERENT' },
    { factor: 'model', factorAr: 'الموديل', target: fmt(spec.model), comp: fmt(c.model), verdict: eq(c.modelEn || c.model, spec.modelEn || spec.model) },
    { factor: 'trim', factorAr: 'الفئة', target: fmt(spec.trim), comp: fmt(c.trim), verdict: eq(c.trim, spec.trim) },
    { factor: 'engine', factorAr: 'المحرك', target: fmt((spec as any).engineCapacity), comp: fmt((c as any).engineCc), verdict: num((c as any).engineCc, (spec as any).engineCapacity, 0.15) },
    { factor: 'cylinders', factorAr: 'السلندر', target: fmt((spec as any).cylinders), comp: fmt((c as any).cylinders), verdict: eq((c as any).cylinders, (spec as any).cylinders) },
    { factor: 'horsepower', factorAr: 'القدرة', target: fmt((spec as any).horsepower), comp: fmt((c as any).horsepower), verdict: num((c as any).horsepower, (spec as any).horsepower, 0.1) },
    { factor: 'fuel', factorAr: 'الوقود', target: fmt(spec.fuelType), comp: fmt(c.fuelType), verdict: eq(c.fuelType, spec.fuelType) },
    { factor: 'transmission', factorAr: 'الجير', target: fmt(spec.transmission), comp: fmt(c.transmission), verdict: eq(c.transmission, spec.transmission) },
    { factor: 'drivetrain', factorAr: 'الدفع', target: fmt(spec.drivetrain), comp: fmt(c.drivetrain), verdict: eq(c.drivetrain, spec.drivetrain) },
    { factor: 'mileage', factorAr: 'الممشى', target: fmt(spec.kilometers), comp: fmt(c.kilometers), verdict: num(c.kilometers, spec.kilometers, 0.1) },
    { factor: 'options', factorAr: 'المواصفات', target: fmt((spec.specs || []).length), comp: fmt((c.specs || []).length), verdict: 'CLOSE' },
  ];
}

export function isTargetCopy(
  l: NormalizedListing,
  target: TargetIdentity,
): { hit: boolean; via: string } {
  if (target.carId && l.source === 'jocars' && l.externalId === `jo-${target.carId}`) {
    return { hit: true, via: 'TARGET LISTING EXCLUDED FROM COMPARABLES (internal ID)' };
  }
  if (l.url && (target as any).targetUrls?.includes(l.url)) {
    return { hit: true, via: 'TARGET LISTING EXCLUDED FROM COMPARABLES (same URL)' };
  }
  if (!target.askingPrice || target.askingPrice <= 0) return { hit: false, via: '' };
  const lm = norm(l.modelEn || l.model);
  const sm = norm(target.spec.modelEn || target.spec.model);
  const modelOk = !!lm && !!sm && (lm === sm || lm.includes(sm) || sm.includes(lm));
  if (!modelOk) return { hit: false, via: '' };
  if (l.year !== target.spec.year) return { hit: false, via: '' };
  const kmOk = l.kilometers != null && (target.spec.kilometers || 0) > 0 &&
    Math.abs(l.kilometers - target.spec.kilometers) / target.spec.kilometers <= 0.01;
  const priceOk = Math.abs(l.priceJod - target.askingPrice) <= Math.max(1, target.askingPrice * 0.005);
  if (kmOk && priceOk) {
    return { hit: true, via: 'TARGET LISTING EXCLUDED FROM COMPARABLES (fingerprint: model+year+km±1%+price)' };
  }
  return { hit: false, via: '' };
}

function specsScore(a: NormalizedListing, spec: VehicleSpec): number {
  const want = spec.specs || [];
  if (want.length === 0) return 0.5;
  const have = new Set((a.specs || []).map((x) => norm(x)));
  const hit = want.filter((w) => have.has(norm(w))).length;
  return 0.3 + (0.7 * hit) / want.length;
}

function conditionScore(a: NormalizedListing, spec: VehicleSpec): number {
  if (!spec.condition || !a.condition) return 0.5;
  return norm(a.condition) === norm(spec.condition) ? 1 : 0.5;
}

function marketScore(a: NormalizedListing, spec: VehicleSpec): number {
  // Same city market = full; same country = high; abroad = penalized (spec §8).
  if (spec.city && a.city && norm(a.city) === norm(spec.city)) return 1;
  if ((a.country || 'JO') === 'JO') return 0.85;
  return 0.4;
}

export function scoreSimilarity(
  a: NormalizedListing,
  spec: VehicleSpec,
  tier: Tier,
  weights: Record<string, number> = SIM_WEIGHTS,
): Comparable {
  const now = Date.now();
  const scraped = a.scrapedAt ? new Date(a.scrapedAt).getTime() : now;
  const ageDays = Math.max(0, Math.round((now - scraped) / 86400000));

  const parts: Record<string, number> = {
    brandModel: 1, // guaranteed by tier gating
    year: a.year === null || a.year === undefined ? 0.6 : a.year === spec.year ? 1 : Math.max(0.2, 1 - Math.abs(a.year - spec.year) * 0.35),
    trim: trimScore(a, spec),
    kilometers: kmScore(a, spec),
    engineTrans: engineTransScore(a, spec),
    drivetrain: 0.5, // drivetrain rarely present in external feeds
    specs: specsScore(a, spec),
    condition: conditionScore(a, spec),
    market: marketScore(a, spec),
  };
  // Tier penalty: lower tiers can never outrank tier 1 (caps), and the
  // tier factor (1.00/0.85/0.70/0.50/0.30) multiplies the final weight.
  const tierCap = tier === 1 ? 100 : tier === 2 ? 95 : tier === 3 ? 85 : 70;
  let raw = 0;
  for (const [k, w] of Object.entries(weights)) raw += (parts[k] ?? 0.5) * (w as number);
  const wSum = Object.values(weights).reduce((x, y) => x + (y as number), 0) || 100;
  raw = (raw / wSum) * 100;
  const similarity = Math.min(tierCap, Math.round(raw));

  const breakdown: Record<string, number> = {};
  for (const k of Object.keys(weights)) breakdown[k] = Math.round((parts[k] ?? 0.5) * 100);

  return {
    ...a, tier, yearDiff: a.year === null || a.year === undefined ? 0 : Math.abs(a.year - spec.year),
    similarity, simBreakdown: breakdown,
    adjustedPrice: null, adjustments: [], weight: 1,
    included: true, ageDays,
  };
}
