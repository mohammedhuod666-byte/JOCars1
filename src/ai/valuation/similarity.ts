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
import type { Comparable, NormalizedListing, VehicleSpec, QualitativeMatchLevel } from './types';
import { SIM_WEIGHTS } from './types';

function norm(s: string | null | undefined): string {
  return (s || '').toLowerCase().replace(/[\s\-_]+/g, ' ').trim();
}

/**
 * ---------------------------------------------------------------------------
 * Phase 2 — ONE canonical fuel / drivetrain definition shared by tiering,
 * similarity scoring, Direct-eligibility and every pricing partition.
 * ---------------------------------------------------------------------------
 * Rule: a "confirmed mismatch" exists ONLY when BOTH sides resolve to a known
 * canonical value AND those values differ. UNKNOWN on either side is NEVER a
 * mismatch (missing evidence must not auto-reject a comparable).
 */

export type CanonFuel = 'phev' | 'hybrid' | 'electric' | 'diesel' | 'petrol' | 'unknown';
export type CanonDrivetrain = 'awd' | 'fwd' | 'rwd' | 'unknown';

/** Canonical fuel keyword resolution — identical logic to the legacy normF helper. */
export function canonFuel(fuel?: string | null, title?: string | null, trim?: string | null): CanonFuel {
  const s = `${fuel || ''} ${title || ''} ${trim || ''}`.toLowerCase();
  if (s.includes('plug-in') || s.includes('plugin') || s.includes('phev') || s.includes('بلج ان') || s.includes('بلاج ان') || s.includes('40e') || s.includes('45e') || s.includes('50e')) {
    return 'phev';
  }
  if (s.includes('hyb') || s.includes('هايبرد') || s.includes('هجين')) {
    return 'hybrid';
  }
  if (s.includes('elec') || s.includes('كهرب')) {
    return 'electric';
  }
  if (s.includes('diesel') || s.includes('ديزل')) {
    return 'diesel';
  }
  if (s.includes('petrol') || s.includes('gas') || s.includes('بنزين')) {
    return 'petrol';
  }
  return 'unknown';
}

/** Canonical drivetrain family — awd/fwd/rwd families collapse synonyms (4WD/AWD/دفع رباعي...). */
export function canonDrivetrain(dt?: string | null): CanonDrivetrain {
  const s = (dt || '').toLowerCase().replace(/[\s\-_/]+/g, '');
  if (!s) return 'unknown';
  if (s === 'unknown' || s === 'غير معروف' || s === 'غيرمعلوم' || s === 'n/a' || s === 'na' || s === '2wd') return 'unknown';
  if (s.includes('awd') || s.includes('4wd') || s.includes('4x4') || s.includes('fourwd') || s.includes('allwheel') || s.includes('quattro') || s.includes('xdrive') || s.includes('4matic') || s.includes('دفعرباعي') || s.includes('رباعي')) return 'awd';
  if (s.includes('fwd') || s.includes('frontwheel') || s.includes('دفعأمامي') || s.includes('أمامي')) return 'fwd';
  if (s.includes('rwd') || s.includes('rearwheel') || s.includes('دفعخلفي') || s.includes('خلفي')) return 'rwd';
  return 'unknown';
}

/** Confirmed fuel mismatch (both sides known and different). */
export function isConfirmedFuelMismatch(
  a: NormalizedListing | { fuelType?: string | null; title?: string | null; trim?: string | null },
  spec: VehicleSpec
): boolean {
  const targetFuel = canonFuel(spec.fuelType, '', spec.trim);
  const compFuel = canonFuel(a.fuelType, (a as any).title, a.trim);
  return targetFuel !== 'unknown' && compFuel !== 'unknown' && targetFuel !== compFuel;
}

/** Confirmed drivetrain mismatch (both sides known and different). */
export function isConfirmedDrivetrainMismatch(
  a: NormalizedListing | { drivetrain?: string | null },
  spec: VehicleSpec
): boolean {
  const targetDrive = canonDrivetrain(spec.drivetrain);
  const compDrive = canonDrivetrain((a as any).drivetrain);
  return targetDrive !== 'unknown' && compDrive !== 'unknown' && targetDrive !== compDrive;
}

/** Minimal shape accepted by the single Direct-eligibility predicate. */
export interface DirectEligibilityInput {
  tier?: number | null;
  yearDiff?: number | null;
  year?: number | null;
  isPowertrainMismatch?: boolean;
  isGenerationMismatch?: boolean;
  isFuelMismatch?: boolean;
  isDrivetrainMismatch?: boolean;
}

/**
 * THE single Direct-comparable eligibility definition.
 * Used by: scoreSimilarity (isDirectEligible), engine.ts (isPrimary / primary set),
 * price.ts (weight balancing + priceStats + calculateFMV) and intelligence-engine
 * (contract evidence). A comparable is Direct ONLY when:
 *   tier 1 or 2, same year (yearDiff === 0), and NO confirmed mismatch of any kind
 *   (powertrain / generation / fuel / drivetrain).
 * Missing flags (undefined on legacy rows / hand-built fixtures) are treated as
 * "no confirmed mismatch" — never as an auto-rejection.
 */
export function isDirectComparable(c: DirectEligibilityInput, specYear?: number): boolean {
  if (c.tier !== 1 && c.tier !== 2) return false;
  let yearDiff = c.yearDiff;
  if (yearDiff == null && c.year != null) {
    yearDiff = specYear != null ? Math.abs(c.year - specYear) : null;
  }
  if (yearDiff !== 0) return false;
  if (c.isPowertrainMismatch) return false;
  if (c.isGenerationMismatch) return false;
  if (c.isFuelMismatch) return false;
  if (c.isDrivetrainMismatch) return false;
  return true;
}

export function isPhevVsPetrolMismatch(
  a: NormalizedListing | { fuelType?: string | null; title?: string | null; trim?: string | null },
  spec: VehicleSpec
): boolean {
  const targetFuel = canonFuel(spec.fuelType, '', spec.trim);
  const compFuel = canonFuel(a.fuelType, (a as any).title, a.trim);

  if (targetFuel === 'petrol' && compFuel === 'phev') return true;
  if (targetFuel === 'phev' && compFuel === 'petrol') return true;
  return false;
}

export function getQualitativeMatch(
  tier: Tier,
  similarity: number,
  isPowertrainMismatch = false
): QualitativeMatchLevel {
  if (isPowertrainMismatch) {
    return similarity >= 60 ? 'مطابقة متوسطة' : 'مطابقة محدودة';
  }
  if (tier === 1 && similarity >= 80) return 'مطابقة قوية';
  if ((tier === 1 || tier === 2) && similarity >= 70) return 'مطابقة جيدة';
  if (tier <= 3 && similarity >= 55) return 'مطابقة متوسطة';
  return 'مطابقة محدودة';
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

export interface GenerationDefinition {
  generation: string;
  chassisCode: string;
  startYear: number;
  endYear: number;
  crossoverYears?: number[];
  keywords: string[];
}

export const KNOWN_MODEL_GENERATIONS: Record<string, GenerationDefinition[]> = {
  'x5': [
    { generation: 'E53', chassisCode: 'E53', startYear: 1999, endYear: 2006, keywords: ['e53'] },
    { generation: 'E70', chassisCode: 'E70', startYear: 2007, endYear: 2013, crossoverYears: [2013], keywords: ['e70'] },
    { generation: 'F15', chassisCode: 'F15', startYear: 2013, endYear: 2018, crossoverYears: [2013, 2018], keywords: ['f15'] },
    { generation: 'G05', chassisCode: 'G05', startYear: 2019, endYear: 2026, crossoverYears: [2018, 2019], keywords: ['g05'] },
  ],
  '5-series': [
    { generation: 'E39', chassisCode: 'E39', startYear: 1995, endYear: 2003, keywords: ['e39'] },
    { generation: 'E60', chassisCode: 'E60', startYear: 2003, endYear: 2010, keywords: ['e60'] },
    { generation: 'F10', chassisCode: 'F10', startYear: 2010, endYear: 2016, keywords: ['f10', 'f11'] },
    { generation: 'G30', chassisCode: 'G30', startYear: 2017, endYear: 2023, keywords: ['g30', 'g31'] },
  ],
  '3-series': [
    { generation: 'E46', chassisCode: 'E46', startYear: 1998, endYear: 2005, keywords: ['e46'] },
    { generation: 'E90', chassisCode: 'E90', startYear: 2005, endYear: 2012, keywords: ['e90', 'e91', 'e92', 'e93'] },
    { generation: 'F30', chassisCode: 'F30', startYear: 2012, endYear: 2018, keywords: ['f30', 'f31'] },
    { generation: 'G20', chassisCode: 'G20', startYear: 2019, endYear: 2026, keywords: ['g20'] },
  ],
  'e-class': [
    { generation: 'W211', chassisCode: 'W211', startYear: 2002, endYear: 2009, keywords: ['w211'] },
    { generation: 'W212', chassisCode: 'W212', startYear: 2009, endYear: 2016, keywords: ['w212'] },
    { generation: 'W213', chassisCode: 'W213', startYear: 2016, endYear: 2023, keywords: ['w213'] },
  ],
  'c-class': [
    { generation: 'W203', chassisCode: 'W203', startYear: 2000, endYear: 2007, keywords: ['w203'] },
    { generation: 'W204', chassisCode: 'W204', startYear: 2007, endYear: 2014, keywords: ['w204'] },
    { generation: 'W205', chassisCode: 'W205', startYear: 2014, endYear: 2021, keywords: ['w205'] },
    { generation: 'W206', chassisCode: 'W206', startYear: 2021, endYear: 2026, keywords: ['w206'] },
  ],
};

export function resolveGeneration(
  brand?: string | null,
  model?: string | null,
  year?: number | null,
  text?: string | null
): string | null {
  if (!model) return null;
  const normM = norm(model);
  const t = (text || '').toLowerCase();

  let gens: GenerationDefinition[] | undefined;
  for (const [k, v] of Object.entries(KNOWN_MODEL_GENERATIONS)) {
    if (normM.includes(k) || k.includes(normM)) {
      gens = v;
      break;
    }
  }
  if (!gens) return null;

  // 1. Explicit keyword match in text has highest precedence
  for (const g of gens) {
    if (g.keywords.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(t))) {
      return g.generation;
    }
  }

  // 2. Year mapping if year is valid
  if (year && Number.isInteger(year)) {
    const matches = gens.filter((g) => year >= g.startYear && year <= g.endYear);
    if (matches.length === 1) {
      return matches[0].generation;
    }
    if (matches.length > 1) {
      // Transition year: several generations' ranges cover this model year.
      // Phase 5: deterministic rule that NEVER depends on declaration order
      // (the old `matches[0]` silently changed meaning whenever entries were
      // reordered). Default = longest-established generation (earliest startYear),
      // tie-break = later endYear (the generation still in production longer).
      // Keyword evidence above already overrides this when explicitly stated
      // (e.g. title says "f15" -> F15 regardless of year ambiguity).
      const established = [...matches].sort(
        (a, b) => (a.startYear - b.startYear) || (b.endYear - a.endYear),
      )[0];
      return established.generation;
    }
  }

  return null;
}

export function isGenerationMismatch(
  a: NormalizedListing | { year?: number | null; title?: string | null; trim?: string | null; generation?: string | null },
  spec: VehicleSpec
): boolean {
  const targetGen = spec.generation || resolveGeneration(spec.brand, spec.model, spec.year, `${spec.trim || ''} ${(spec.specs || []).join(' ')}`);
  const compGen = (a as any).generation || resolveGeneration((a as any).brand || spec.brand, (a as any).model || spec.model, a.year, `${(a as any).title || ''} ${(a as any).trim || ''}`);

  if (targetGen && compGen && targetGen.toUpperCase() !== compGen.toUpperCase()) {
    return true;
  }
  return false;
}

function specMatches(a: NormalizedListing, spec: VehicleSpec): boolean {
  const trimOk = !spec.trim || !a.trim || norm(a.trim) === norm(spec.trim);
  // Canonical compare: بنزين ≡ PETROL, 4WD ≡ AWD (synonyms must not demote tier).
  const fuelOk = !spec.fuelType || !a.fuelType || !isConfirmedFuelMismatch(a, spec);
  const transOk = !spec.transmission || !a.transmission || norm(a.transmission) === norm(spec.transmission);
  const driveOk = !spec.drivetrain || !a.drivetrain || !isConfirmedDrivetrainMismatch(a, spec);
  return trimOk && fuelOk && transOk && driveOk;
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
  const phevMismatch = isPhevVsPetrolMismatch(a, spec);
  const genMismatch = isGenerationMismatch(a, spec);
  // Canonical confirmed-mismatch helpers (UNKNOWN on either side is never a mismatch).
  const fuelMismatch = isConfirmedFuelMismatch(a, spec) || phevMismatch;

  // Drivetrain: explicit mismatch (e.g. AWD vs RWD) prevents Tier 1
  const driveMismatch = isConfirmedDrivetrainMismatch(a, spec);

  // GENERATION MISMATCH RULE:
  // A generation mismatch (e.g. F15 vs G05) can NEVER be a Direct Comparable (Tier 1 or Tier 2)!
  // It is relegated to Tier 4 (supporting evidence only) if within ±3 years, otherwise excluded.
  if (genMismatch) {
    if (yd !== null && yd <= 3 && (c.allowPlus2 || c.allowTier4)) {
      return 4; // Supporting evidence across generations
    }
    return 0; // Excluded
  }

  // POWERTRAIN MISMATCH RULE:
  // Petrol vs PHEV can NEVER be Direct (Tier 1 or 2). Relegated to Tier 3 (secondary).
  if (yd === 0) {
    if (phevMismatch) return 3; // Demote PHEV to Secondary/Support (Tier 3 max) when target is Petrol
    if (driveMismatch) return 2; // Drivetrain mismatch drops Tier 1 to Tier 2
    return specMatches(a, spec) ? 1 : 2;
  }
  if (yd === null) return c.allowAnyYear ? 4 : 0; // year unknown can NEVER be same-year Tier 1 or Tier 2
  if (yd <= 1) return fuelMismatch ? (phevMismatch ? 3 : 4) : 3;
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
    const tFuel = canonFuel(spec.fuelType, '', spec.trim);
    const cFuel = canonFuel(a.fuelType, (a as any).title, a.trim);
    if (tFuel === 'unknown' || cFuel === 'unknown') {
      s += 0.5; // UNKNOWN = neutral missing evidence
    } else if (tFuel === cFuel) {
      s += 1.0;
    } else {
      s += 0.0; // confirmed mismatch
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
    const tDrive = canonDrivetrain(spec.drivetrain);
    const cDrive = canonDrivetrain(a.drivetrain);
    if (tDrive === 'unknown' || cDrive === 'unknown') {
      s += 0.5; // UNKNOWN = neutral missing evidence
    } else if (tDrive === cDrive) {
      s += 1.0;
    } else {
      s += 0.0; // confirmed mismatch
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
    { factor: 'fuel', factorAr: 'الوقود', target: fmt(spec.fuelType), comp: fmt(c.fuelType), verdict: isPhevVsPetrolMismatch(c, spec) ? 'DIFFERENT' : eq(normFuel(c.fuelType), normFuel(spec.fuelType)) },
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
  if (spec.conditionScore != null && a.conditionScore != null) {
    const diff = Math.abs(spec.conditionScore - a.conditionScore);
    return Math.max(0.2, 1 - (diff / 100) * 0.8);
  }
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

  // Phase 2: dynamic drivetrain evidence (no more hardcoded 0.5):
  // both sides known & equal -> 1, confirmed mismatch -> 0, either UNKNOWN -> 0.5.
  const tDrive = canonDrivetrain(spec.drivetrain);
  const cDrive = canonDrivetrain(a.drivetrain);
  const driveMismatch = tDrive !== 'unknown' && cDrive !== 'unknown' && tDrive !== cDrive;
  const drivePart = tDrive === 'unknown' || cDrive === 'unknown' ? 0.5 : tDrive === cDrive ? 1 : 0;
  const fuelMismatch = isConfirmedFuelMismatch(a, spec);

  const parts: Record<string, number> = {
    brandModel: 1, // guaranteed by tier gating
    year: a.year === null || a.year === undefined ? 0.6 : a.year === spec.year ? 1 : Math.max(0.2, 1 - Math.abs(a.year - spec.year) * 0.35),
    trim: trimScore(a, spec),
    kilometers: kmScore(a, spec),
    engineTrans: engineTransScore(a, spec),
    drivetrain: drivePart,
    specs: specsScore(a, spec),
    condition: conditionScore(a, spec),
    market: marketScore(a, spec),
  };
  // Tier penalty: lower tiers can never outrank tier 1 (caps), and the
  // tier factor (1.00/0.85/0.70/0.50/0.30) multiplies the final weight.
  const phevMismatch = isPhevVsPetrolMismatch(a, spec);
  const genMismatch = isGenerationMismatch(a, spec);
  const tierCap = tier === 1 ? 100 : tier === 2 ? 95 : tier === 3 ? 85 : 70;
  let maxCap = phevMismatch ? Math.min(65, tierCap) : tierCap;
  if (genMismatch) {
    maxCap = Math.min(55, maxCap);
  }
  let raw = 0;
  for (const [k, w] of Object.entries(weights)) raw += (parts[k] ?? 0.5) * (w as number);
  const wSum = Object.values(weights).reduce((x, y) => x + (y as number), 0) || 100;
  raw = (raw / wSum) * 100;
  const similarity = Math.min(maxCap, Math.round(raw));

  const qualitativeMatch = getQualitativeMatch(tier, similarity, phevMismatch);

  const breakdown: Record<string, number> = {};
  for (const k of Object.keys(weights)) breakdown[k] = Math.round((parts[k] ?? 0.5) * 100);

  return {
    ...a,
    tier,
    yearDiff: a.year === null || a.year === undefined ? 0 : Math.abs(a.year - spec.year),
    similarity,
    qualitativeMatch,
    isPowertrainMismatch: phevMismatch,
    powertrainNote: phevMismatch ? 'اختلاف في منظومة الدفع (بنزين مقابل هايبرد/PHEV) - مصنفة كدليل ثانوي' : undefined,
    isGenerationMismatch: genMismatch,
    generationNote: genMismatch ? 'اختلاف في جيل / شاصي المركبة - مصنفة كشاهد داعم فقط' : undefined,
    isFuelMismatch: fuelMismatch,
    isDrivetrainMismatch: driveMismatch,
    isDirectEligible: isDirectComparable({
      tier,
      yearDiff: a.year === null || a.year === undefined ? 0 : Math.abs(a.year - spec.year),
      isPowertrainMismatch: phevMismatch,
      isGenerationMismatch: genMismatch,
      isFuelMismatch: fuelMismatch,
      isDrivetrainMismatch: driveMismatch,
    }),
    simBreakdown: breakdown,
    adjustedPrice: null,
    adjustments: [],
    weight: 1,
    included: true,
    ageDays,
  };
}
