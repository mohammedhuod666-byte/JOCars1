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

export const KNOWN_BRANDS = [
  { key: 'bmw', patterns: ['bmw', 'بي ام', 'بي إم', 'ب ام', 'بي ام دبليو'] },
  { key: 'mercedes', patterns: ['mercedes', 'مرسيدس', 'بنز', 'benz'] },
  { key: 'toyota', patterns: ['toyota', 'تويوتا', 'تايوتا'] },
  { key: 'hyundai', patterns: ['hyundai', 'هيونداي', 'حيونداي'] },
  { key: 'kia', patterns: ['kia', 'كيا'] },
  { key: 'nissan', patterns: ['nissan', 'نيسان'] },
  { key: 'byd', patterns: ['byd', 'بي واي دي', 'باي دي', 'دولفين', 'dolphin'] },
  { key: 'honda', patterns: ['honda', 'هوندا'] },
  { key: 'ford', patterns: ['ford', 'فورد'] },
  { key: 'chevrolet', patterns: ['chevrolet', 'شفروليه', 'شيفروليه'] },
  { key: 'audi', patterns: ['audi', 'اودي', 'أودي'] },
  { key: 'lexus', patterns: ['lexus', 'لكزس'] },
];

export function sameBrand(a: NormalizedListing, spec: VehicleSpec): boolean {
  const aBrand = norm(a.brand);
  const aBrandEn = norm(a.brandEn);
  const sBrand = norm(spec.brand);
  const sBrandEn = norm(spec.brandEn);

  const pairs: [string | null | undefined, string | null | undefined][] = [
    [aBrand, sBrand], [aBrandEn, sBrandEn],
    [aBrand, sBrandEn], [aBrandEn, sBrand],
  ];
  for (const [x, y] of pairs) {
    if (x && y && (x === y || x.includes(y) || y.includes(x))) return true;
  }

  // Canonical known brand check (e.g. "BMW" vs "بي ام دبليو")
  const aMatches = KNOWN_BRANDS.find(b => b.patterns.some(p => aBrand.includes(p) || aBrandEn.includes(p)));
  const sMatches = KNOWN_BRANDS.find(b => b.patterns.some(p => sBrand.includes(p) || sBrandEn.includes(p)));
  if (aMatches && sMatches && aMatches.key === sMatches.key) return true;

  return false;
}

export interface IdentityCheckResult {
  consistent: boolean;
  reason?: string;
  detectedModel?: string;
  detectedBrand?: string;
}

/**
 * Listing Identity Consistency Check (Requirement §3).
 * Detects contradictions between target vehicle and listing title/metadata.
 * e.g., Target: BMW X5, Title: "بي ام دبليو 520 F10" -> IDENTITY_CONFLICT.
 */
export function checkListingIdentityConsistency(
  l: NormalizedListing | { brand: string; model: string; title?: string | null; trim?: string | null; bodyType?: string | null; brandEn?: string | null; modelEn?: string | null },
  spec: VehicleSpec
): IdentityCheckResult {
  const title = String((l as any).title || (l as any).trim || '').toLowerCase().trim();
  const listingModel = norm((l as any).model || (l as any).modelEn || '');
  const targetModel = norm(spec.modelEn || spec.model);
  const targetBrand = norm(spec.brandEn || spec.brand);

  // 1. Non-car listing patterns (license plates, parts, non-automotive goods)
  if (/رقم مميز|ارقام مميزة|لوحة مميزة|ترميز|لوحة ارقام|نمرة سيارة|نمرة مميزة|قطع غيار|جنطات|محرك للبيع|جير للبيع|قير للبيع|حزام|تنحيف|تخسيس|كرش|مشد|رجاج|سكوتر|دراجة|ماتور|موتور/i.test(title)) {
    return {
      consistent: false,
      reason: `NON_CAR_LISTING: إعلان غير مخصص لسيارة كاملة (لوحة/قطع/مستلزمات): ${title.slice(0, 50)}`,
    };
  }

  // 2. Cross-brand conflict
  const targetBrandEntry = KNOWN_BRANDS.find(b => b.patterns.some(p => targetBrand.includes(p)));
  if (targetBrandEntry) {
    for (const otherBrand of KNOWN_BRANDS) {
      if (otherBrand.key !== targetBrandEntry.key) {
        if (otherBrand.patterns.some(p => {
          const re = new RegExp(`(^|\\s|[^a-z0-9])${p}($|\\s|[^a-z0-9])`, 'i');
          return re.test(title) || re.test(listingModel);
        })) {
          return {
            consistent: false,
            reason: `IDENTITY_CONFLICT: تناقض في الشركة الصانعة (الهدف ${spec.brand} ولكن الإعلان يشير إلى ${otherBrand.key})`,
            detectedBrand: otherBrand.key,
          };
        }
      }
    }
  }

  // 3. Model series conflict for BMW
  if (targetBrandEntry?.key === 'bmw' || targetBrand.includes('bmw') || targetBrand.includes('بي ام')) {
    if (targetModel.includes('x5') || targetModel.includes('اكس فايف') || targetModel.includes('اكس 5')) {
      const BMW_NON_X5_MODELS = [
        { model: '5-Series', re: /\b(5\s*series|520|523|525|528|530|535|540|550|f10|f11|g30|m5)\b|الفئة الخامسة|سلسلة 5/i },
        { model: '7-Series', re: /\b(7\s*series|730|740|745|750|760|f01|g11)\b|الفئة السابعة/i },
        { model: '3-Series', re: /\b(3\s*series|316|318|320|323|325|328|330|335|340|e46|e90|f30|g20|m3)\b|الفئة الثالثة|سلسلة 3/i },
        { model: '4-Series', re: /\b(4\s*series|420|428|430|435|440|m4)\b|الفئة الرابعة/i },
        { model: '6-Series', re: /\b(6\s*series|630|640|650|m6)\b|الفئة السادسة/i },
        { model: '8-Series', re: /\b(8\s*series|840|850|m8)\b|الفئة الثامنة/i },
        { model: 'X1', re: /\b(x1|اكس 1|اكس1)\b/i },
        { model: 'X2', re: /\b(x2|اكس 2|اكس2)\b/i },
        { model: 'X3', re: /\b(x3|اكس 3|اكس3)\b/i },
        { model: 'X4', re: /\b(x4|اكس 4|اكس4)\b/i },
        { model: 'X6', re: /\b(x6|اكس 6|اكس6)\b/i },
        { model: 'X7', re: /\b(x7|اكس 7|اكس7)\b/i },
        { model: 'Z4', re: /\b(z4|زد 4)\b/i },
        { model: 'i3', re: /\b(i3|اي 3)\b/i },
        { model: 'i4', re: /\b(i4|اي 4)\b/i },
        { model: 'iX', re: /\b(ix|اي اكس)\b/i },
      ];
      const mentionsX5 = /\bx5\b|اكس\s*فايف|اكس\s*5/i.test(title) || /\bx5\b/i.test(listingModel);
      for (const m of BMW_NON_X5_MODELS) {
        if (m.re.test(title) || m.re.test(listingModel)) {
          if (!mentionsX5 || m.re.test(listingModel) || /\b(5\s*series|7\s*series|3\s*series|520|f10|320|f30|z4|i3|x1|x3)\b/i.test(title)) {
            return {
              consistent: false,
              reason: `IDENTITY_CONFLICT: تناقض في الموديل (الهدف X5 ولكن الإعلان يشير إلى ${m.model})`,
              detectedModel: m.model,
            };
          }
        }
      }

      // If listingModel is explicitly set and is not X5, reject
      if (listingModel && !listingModel.includes('x5') && !listingModel.includes('اكس 5') && !listingModel.includes('اكس فايف')) {
        return {
          consistent: false,
          reason: `IDENTITY_CONFLICT: موديل الإعلان (${listingModel}) غير مطابق للموديل المستهدف (X5)`,
          detectedModel: listingModel,
        };
      }
    }
  }

  // 4. Model series conflict for Mercedes
  if (targetBrandEntry?.key === 'mercedes' || targetBrand.includes('مرسيدس')) {
    if (targetModel.includes('e-class') || targetModel.includes('e200') || targetModel.includes('e300')) {
      if (/\b(c180|c200|c250|c300|c43|c63|c-class)\b/i.test(title) && !/\b(e200|e300|e350|e-class)\b/i.test(title)) {
        return { consistent: false, reason: `IDENTITY_CONFLICT: تناقض في الموديل (الهدف E-Class ولكن الإعلان C-Class)` };
      }
    }
  }

  return { consistent: true };
}

function specMatches(a: NormalizedListing, spec: VehicleSpec): boolean {
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
  allowTier4: boolean; // same model, farther years (±2 to ±5) admitted only when tiers 1-3 are thin
  allowAnyYear: boolean; // expansion: same model, any year → tier 4
}

const FULL_CTX: TierContext = { allowPlus2: true, allowTier4: true, allowAnyYear: false };

export function assignTier(a: NormalizedListing, spec: VehicleSpec, ctx: Partial<TierContext> = {}): Tier | 0 {
  const c: TierContext = { ...FULL_CTX, ...ctx };
  // Check Identity Consistency FIRST
  const identityCheck = checkListingIdentityConsistency(a, spec);
  if (!identityCheck.consistent) return 0;

  if (!sameBrand(a, spec)) return 0;
  const same = sameModel(a, spec);
  // CRITICAL REQUIREMENT: A comparable MUST be the same model. Different models can NEVER be comparables!
  if (!same) return 0;

  const yd = a.year === null || a.year === undefined ? null : Math.abs(a.year - spec.year);
  const fuelMismatch = spec.fuelType && a.fuelType && norm(a.fuelType) !== norm(spec.fuelType);

  if (yd === 0) {
    return specMatches(a, spec) ? 1 : 2;
  }
  if (yd === null) return c.allowAnyYear ? 4 : 0; // year unknown can NEVER be same-year Tier 1 or Tier 2
  if (yd <= 1) return fuelMismatch ? 4 : 3;
  if (yd === 2 && c.allowPlus2) return 4;
  if (yd > 2 && yd <= 6 && c.allowAnyYear) return 4; // expansion: same model only!
  return 0;
}

function trimScore(a: NormalizedListing, spec: VehicleSpec): number {
  if (!spec.trim || !a.trim) return 0.5; // UNKNOWN is neutral (missing evidence, not mismatch)
  return norm(a.trim) === norm(spec.trim) ? 1 : 0.2;
}

function kmScore(a: NormalizedListing, spec: VehicleSpec): number {
  if (!a.kilometers || !spec.kilometers) return 0.5; // UNKNOWN is neutral (missing evidence, not mismatch)
  const diff = Math.abs(a.kilometers - spec.kilometers) / Math.max(spec.kilometers, 1);
  if (diff <= 0.1) return 1;
  if (diff <= 0.25) return 0.8;
  if (diff <= 0.5) return 0.55;
  if (diff <= 1) return 0.3;
  return 0.1;
}

/**
 * Technical Scoring: UNKNOWN is neutral (0.5 = missing evidence), while an explicit mismatch is penalized (0.0).
 * Missing evidence lowers DataCompletenessScore/Confidence, not vehicle technical similarity.
 */
function engineTransScore(a: NormalizedListing, spec: VehicleSpec): number {
  let s = 0;
  let count = 0;

  if (spec.fuelType) {
    count++;
    if (a.fuelType && norm(a.fuelType) === norm(spec.fuelType)) {
      s += 1.0;
    } else if (a.fuelType) {
      s += 0.0; // explicit mismatch
    } else {
      s += 0.5; // UNKNOWN = neutral missing evidence
    }
  }

  if (spec.transmission) {
    count++;
    if (a.transmission && norm(a.transmission) === norm(spec.transmission)) {
      s += 1.0;
    } else if (a.transmission) {
      s += 0.0; // explicit mismatch
    } else {
      s += 0.5; // UNKNOWN = neutral missing evidence
    }
  }

  if (spec.drivetrain) {
    count++;
    if (a.drivetrain && norm(a.drivetrain) === norm(spec.drivetrain)) {
      s += 1.0;
    } else if (a.drivetrain) {
      s += 0.0; // explicit mismatch
    } else {
      s += 0.5; // UNKNOWN = neutral missing evidence
    }
  }

  if ((spec as any).engineCapacity) {
    count++;
    if ((a as any).engineCc) {
      const diff = Math.abs(Number((a as any).engineCc) - Number((spec as any).engineCapacity)) / Math.max(1, Number((spec as any).engineCapacity));
      s += diff <= 0.1 ? 1.0 : diff <= 0.25 ? 0.6 : 0.1;
    } else {
      s += 0.5; // UNKNOWN = neutral missing evidence
    }
  }

  return count > 0 ? s / count : 0.5;
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
  verdict: 'MATCH' | 'CLOSE' | 'DIFFERENT' | 'UNKNOWN';
}

/** Human-readable per-factor comparison for the audit table. */
export function matchMatrix(spec: VehicleSpec, c: NormalizedListing): MatchRow[] {
  const eq = (a: any, b: any) => {
    if (a === null || a === undefined || a === '' || b === null || b === undefined || b === '') return 'UNKNOWN' as const;
    const na = String(a).toLowerCase().trim();
    const nb = String(b).toLowerCase().trim();
    if (na === nb || na.includes(nb) || nb.includes(na)) return 'MATCH' as const;
    return 'DIFFERENT' as const;
  };
  const num = (a: any, b: any, tol: number) => {
    if (a === null || a === undefined || b === null || b === undefined) return 'UNKNOWN' as const;
    const d = Math.abs(Number(a) - Number(b)) / Math.max(1, Number(b));
    return d === 0 ? 'MATCH' as const : d <= tol ? 'CLOSE' as const : 'DIFFERENT' as const;
  };
  const fmt = (v: any) => (v === null || v === undefined || v === '' ? '—' : String(v));
  const normFuel = (f: any) => {
    if (!f) return '';
    const s = String(f).toLowerCase().trim();
    if (s.includes('gas') || s.includes('petrol') || s.includes('بنزين')) return 'petrol';
    if (s.includes('hyb') || s.includes('هايبرد')) return 'hybrid';
    if (s.includes('elec') || s.includes('كهرب')) return 'electric';
    if (s.includes('diesel') || s.includes('ديزل')) return 'diesel';
    return s;
  };
  const normTrans = (t: any) => {
    if (!t) return '';
    const s = String(t).toLowerCase().trim();
    if (s.includes('auto') || s.includes('اوتو') || s.includes('أوتو')) return 'auto';
    if (s.includes('man') || s.includes('عادي') || s.includes('يدوي')) return 'manual';
    return s;
  };
  return [
    { factor: 'make', factorAr: 'الشركة الصانعة', target: fmt(spec.brandEn || spec.brand), comp: fmt(c.brandEn || c.brand), verdict: eq(c.brandEn || c.brand, spec.brandEn || spec.brand) },
    { factor: 'model', factorAr: 'الموديل', target: fmt(spec.modelEn || spec.model), comp: fmt(c.modelEn || c.model), verdict: eq(c.modelEn || c.model, spec.modelEn || spec.model) },
    { factor: 'year', factorAr: 'السنة', target: fmt(spec.year), comp: fmt(c.year), verdict: num(c.year, spec.year, 0) === 'MATCH' ? 'MATCH' : c.year == null ? 'UNKNOWN' : Math.abs(c.year - spec.year) <= 1 ? 'CLOSE' : 'DIFFERENT' },
    { factor: 'trim', factorAr: 'الفئة', target: fmt(spec.trim), comp: fmt(c.trim), verdict: eq(c.trim, spec.trim) },
    { factor: 'fuel', factorAr: 'الوقود', target: fmt(spec.fuelType), comp: fmt(c.fuelType), verdict: eq(normFuel(c.fuelType), normFuel(spec.fuelType)) },
    { factor: 'transmission', factorAr: 'الجير', target: fmt(spec.transmission), comp: fmt(c.transmission), verdict: eq(normTrans(c.transmission), normTrans(spec.transmission)) },
    { factor: 'drivetrain', factorAr: 'الدفع', target: fmt(spec.drivetrain), comp: fmt(c.drivetrain), verdict: eq(c.drivetrain, spec.drivetrain) },
    { factor: 'engineCc', factorAr: 'سعة المحرك', target: fmt((spec as any).engineCapacity), comp: fmt((c as any).engineCc), verdict: num((c as any).engineCc, (spec as any).engineCapacity, 0.15) },
    { factor: 'horsepower', factorAr: 'القدرة الحصانية', target: fmt((spec as any).horsepower), comp: fmt((c as any).horsepower), verdict: num((c as any).horsepower, (spec as any).horsepower, 0.1) },
    { factor: 'mileage', factorAr: 'الممشى', target: fmt(spec.kilometers), comp: fmt(c.kilometers), verdict: num(c.kilometers, spec.kilometers, 0.1) },
    { factor: 'location', factorAr: 'المدينة', target: fmt(spec.city), comp: fmt(c.city), verdict: eq(c.city, spec.city) },
    { factor: 'features', factorAr: 'المواصفات الإضافية', target: fmt((spec.specs || []).length), comp: fmt((c.specs || []).length), verdict: 'CLOSE' },
  ];
}

export function isTargetCopy(
  l: NormalizedListing,
  target: TargetIdentity,
): { hit: boolean; via: string } {
  // 1) Direct Internal ID or URL match
  if (target.carId && (l.externalId === `jo-${target.carId}` || (l.url && l.url.includes(target.carId)))) {
    return { hit: true, via: 'TARGET LISTING EXCLUDED FROM COMPARABLES (internal ID)' };
  }
  if (l.url && (target as any).targetUrls?.includes(l.url)) {
    return { hit: true, via: 'TARGET LISTING EXCLUDED FROM COMPARABLES (same URL)' };
  }

  // 2) VIN match (if available)
  if (target.spec.vin && (l as any).vin && norm((l as any).vin) === norm(target.spec.vin)) {
    return { hit: true, via: 'TARGET LISTING EXCLUDED FROM COMPARABLES (matching VIN)' };
  }

  // 3) Model + Year prerequisite for any fingerprint check
  const lm = norm(l.modelEn || l.model);
  const sm = norm(target.spec.modelEn || target.spec.model);
  const modelOk = !!lm && !!sm && (lm === sm || lm.includes(sm) || sm.includes(lm));
  if (!modelOk || l.year !== target.spec.year) return { hit: false, via: '' };

  const targetKm = target.spec.kilometers || 0;
  if (targetKm <= 0 || l.kilometers == null) return { hit: false, via: '' };

  const absKmDiff = Math.abs(l.kilometers - targetKm);
  const relKmDiff = absKmDiff / targetKm;

  // 4) Exact same vehicle fingerprint (Strictly Price-Agnostic):
  // If mileage is within 100 km or 0.2% of target on the same model & year,
  // it is an identical vehicle clone/mirror across portals.
  // We NEVER look at asking price here, ensuring target asking price cannot leak.
  if (absKmDiff <= 100 || relKmDiff <= 0.002) {
    return { hit: true, via: 'TARGET LISTING EXCLUDED FROM COMPARABLES (unique vehicle fingerprint: model+year+km)' };
  }

  // 5) Close mileage (within 0.5% or 300 km) with same city or same trim
  if (absKmDiff <= 300 || relKmDiff <= 0.005) {
    const cityMatch = !!(target.spec.city && l.city && norm(target.spec.city) === norm(l.city));
    const trimMatch = !!(target.spec.trim && l.trim && norm(target.spec.trim) === norm(l.trim));
    if (cityMatch || trimMatch) {
      return { hit: true, via: 'TARGET LISTING EXCLUDED FROM COMPARABLES (fingerprint: model+year+km+city/trim)' };
    }
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
