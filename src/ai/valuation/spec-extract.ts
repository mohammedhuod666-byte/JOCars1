/**
 * Source spec extraction (§10): pull structured specs from listing titles
 * WITHOUT ever inventing them. Absent evidence → null (UNKNOWN), never a
 * default. Regression-critical: 40e must never become Gasoline, AWD never
 * FWD, 2000cc never 2500cc, trim never dropped.
 */
export interface ExtractedSpecs {
  trim: string | null;
  generation: string | null;
  chassisCode: string | null;
  fuel: 'PETROL' | 'DIESEL' | 'HYBRID' | 'PHEV' | 'EV' | null;
  drivetrain: 'FWD' | 'RWD' | 'AWD' | 'FOUR_WD' | null;
  engineCc: number | null;
  cylinders: number | null;
  horsepower: number | null;
  conditionScore: number | null;
  conditionCertainty: 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';
}

/**
 * Phase 5 — trim/drivetrain separation (§5):
 * A trim value must never be a drivetrain token (e.g. Car.trim = "AWD" or
 * "FWD/RWD"). Drivetrain tokens belong in drivetrain only; a polluted trim
 * creates fake trim matches (spec.trim='AWD' vs comp.trim='AWD' -> similarity 1)
 * while both values carry zero trim information.
 */
const DRIVETRAIN_TOKEN_RE = /^(awd|4wd|fwd|rwd|2wd|4x4|4\*4|iwd|دفع رباعي|رباعي|دفع امامي|دفع أمامي|دفع خلفي|دفع خلفى)$/i;

/** Derive a canonical drivetrain from a polluted trim value (pure drivetrain token). */
export function drivetrainFromTrim(trim: string | null | undefined): 'AWD' | 'RWD' | 'FWD' | null {
  if (!trim) return null;
  const t = String(trim).trim();
  if (!t) return null;
  if (/^(AWD|4WD|4X4|4\*4)$/i.test(t)) return 'AWD';
  if (/^RWD$/i.test(t)) return 'RWD';
  if (/^(FWD|2WD|IWD)$/i.test(t)) return 'FWD';
  if (/^(دفع رباعي|رباعي)$/.test(t)) return 'AWD';
  if (/^دفع خلفي/.test(t)) return 'RWD';
  if (/^دفع أمامي|^دفع امامي/.test(t)) return 'FWD';
  return null;
}

/** Remove drivetrain tokens from a trim value; pure drivetrain values become null (UNKNOWN). */
export function sanitizeTrim(trim: string | null | undefined): string | null {
  if (!trim) return null;
  const s = String(trim).trim();
  if (!s) return null;
  if (drivetrainFromTrim(s)) return null;
  const kept = s.split(/[\s/,·|()]+/).filter((tok) => tok && !DRIVETRAIN_TOKEN_RE.test(tok));
  const joined = kept.join(' ').trim();
  return joined || null;
}

/**
 * Phase 4 — Target condition data flow (§5):
 * structured declared condition (Car.condition enum) -> normalized conditionScore
 * with explicit provenance. Rules:
 *  - declared enum is USER-DECLARED evidence => certainty INFERRED (never CONFIRMED:
 *    no inspection report backs it), NEVER a fabricated default.
 *  - absent / unknown / legacy free-text => { null, 'UNKNOWN' } — stays UNKNOWN,
 *    never assumes EXCELLENT (the listing form's default must not leak into pricing).
 */
export function normalizeTargetCondition(condition: string | null | undefined): {
  conditionScore: number | null;
  conditionCertainty: 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';
  matchedPattern?: string;
} {
  if (!condition) return { conditionScore: null, conditionCertainty: 'UNKNOWN' };
  const key = String(condition).trim().toUpperCase().replace(/\s+/g, '_');
  const MAP: Record<string, number> = {
    EXCELLENT: 90,
    VERY_GOOD: 80,
    GOOD: 70,
    FAIR: 55,
    NEEDS_MAINTENANCE: 40,
    NEEDS_INSPECTION: 30,
  };
  const score = MAP[key];
  if (score == null) {
    // Untrusted / unrecognized value: stays UNKNOWN (never defaults to EXCELLENT/90).
    return { conditionScore: null, conditionCertainty: 'UNKNOWN' };
  }
  return { conditionScore: score, conditionCertainty: 'INFERRED', matchedPattern: `حالة معلنة: ${key}` };
}

export function extractConditionFromText(text: string): {
  conditionScore: number | null;
  conditionCertainty: 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';
  matchedPattern?: string;
} {
  if (!text) return { conditionScore: null, conditionCertainty: 'UNKNOWN' };
  const s = text.toLowerCase();

  // Tier 1: Confirmed top condition (Score: 95)
  if (/فحص\s*كامل|4\s*جيد|أربعة\s*جيد|اربعة\s*جيد|فحص\s*وكال[ةه]|بحال[ةه]\s*الوكال[ةه]|كلين\s*تايتل|clean\s*title|خال[يية]\s*من\s*الحوادث|بدون\s*حوادث/i.test(s)) {
    return { conditionScore: 95, conditionCertainty: 'CONFIRMED', matchedPattern: 'فحص كامل / كلين تايتل' };
  }

  // Tier 2: Confirmed severe damage (Score: 30)
  if (/شاص[يى]\s*مضروب|بنكيت|حادث\s*قوي|ضرب[ةه]\s*شاص[يى]|غيار\s*واجه[ةه]|salvage|قص\s*شاص[يى]/i.test(s)) {
    return { conditionScore: 30, conditionCertainty: 'CONFIRMED', matchedPattern: 'أضرار جسيمة / شاصي مضروب' };
  }

  // Tier 3: Confirmed minor defect / 2-3 جيد (Score: 60)
  if (/3\s*جيد|2\s*جيد|قصع[ةه]|قصعات|دقة\s*على\s*الراس|ضرب[ةه]\s*كفر|دقات\s*خفيف[ةه]|مضروب\s*ومصلح/i.test(s)) {
    return { conditionScore: 60, conditionCertainty: 'CONFIRMED', matchedPattern: 'فحص جزئي (2-3 جيد / قصعات)' };
  }

  // Tier 4: Cosmetic repaint (Score: 75)
  if (/صبغ\s*نظاف[ةه]|دهان\s*نظاف[ةه]|صبغ\s*تجميل[يى]|رش\s*تجميل[يى]/i.test(s)) {
    return { conditionScore: 75, conditionCertainty: 'CONFIRMED', matchedPattern: 'دهان نظافة / تجميلي' };
  }

  // Tier 5: General inferred condition (Score: 80)
  if (/نظيف[ةه]\s*جدا|توب\s*نظاف[ةه]|excellent|very\s*good|ممتاز[ةه]/i.test(s)) {
    return { conditionScore: 80, conditionCertainty: 'INFERRED', matchedPattern: 'حالة ممتازة مستنبطة' };
  }

  return { conditionScore: null, conditionCertainty: 'UNKNOWN' };
}

export function extractSpecsFromTitle(title: string): ExtractedSpecs {
  const t = (title || '').toLowerCase();
  const cond = extractConditionFromText(t);
  const out: ExtractedSpecs = {
    trim: null, generation: null, chassisCode: null, fuel: null, drivetrain: null,
    engineCc: null, cylinders: null, horsepower: null,
    conditionScore: cond.conditionScore,
    conditionCertainty: cond.conditionCertainty,
  };
  if (!t) return out;

  // Chassis / Generation detection (BMW, Mercedes, Toyota, etc.)
  const bmwChassisM = t.match(/\b(f15|g05|e70|e53|f10|g30|f30|g20|e46|e90|f16|g06|g07|f25|g01|f26|g02)\b/i);
  if (bmwChassisM) {
    const code = bmwChassisM[1].toUpperCase();
    out.chassisCode = code;
    out.generation = code;
  }

  const mercChassisM = t.match(/\b(w211|w212|w213|w204|w205|w206|w221|w222|w223)\b/i);
  if (mercChassisM) {
    const code = mercChassisM[1].toUpperCase();
    out.chassisCode = code;
    out.generation = code;
  }

  // Trim: tokens like 40e/40i/30d/xdrive40e/glx/m/full — model suffix token.
  const trimM = t.match(/\b(xdrive\s*\d{2}[a-z]{0,2}|\d{2}[a-z]{1,2}|glx|full|m\s*package|limited|sport)\b/i);
  if (trimM) out.trim = trimM[1].replace(/\s+/g, '').toUpperCase();

  // Fuel: explicit evidence only. Order matters (plug-in before hybrid).
  if (/plug[\s-]*in|phev|40e\b/i.test(t)) out.fuel = 'PHEV';
  else if (/hybrid|هايبرد|هايبرد/i.test(t)) out.fuel = 'HYBRID';
  else if (/electric|كهربا|ev\b/i.test(t)) out.fuel = 'EV';
  else if (/diesel|ديزل/i.test(t)) out.fuel = 'DIESEL';

  // Drivetrain: explicit evidence only.
  if (/xdrive|awd|4wd|quattro|4matic|دفع رباعي|رباعي/i.test(t)) out.drivetrain = 'AWD';
  else if (/\brwd\b|دفع خلفي|خلفي(?!.*رباعي)/i.test(t) && !/awd/i.test(t)) out.drivetrain = 'RWD';
  else if (/\bfwd\b|دفع امامي|دفع أمامي/i.test(t)) out.drivetrain = 'FWD';

  // Engine CC: "2.0", "2.0L", "2000cc".
  const ccM = t.match(/(\d{4})\s*cc/) || (() => {
    const lM = t.match(/(\d(?:\.\d)?)\s*(?:l\b|لتر)/);
    return lM ? [lM[0], String(Math.round(parseFloat(lM[1]) * 1000))] : null;
  })();
  if (ccM) {
    const cc = parseInt(ccM[1], 10);
    if (cc >= 500 && cc <= 10000) out.engineCc = cc;
  }

  // Cylinders: V6/V8 or Arabic.
  const cylM = t.match(/\bv(\d{1,2})\b/i) || t.match(/(\d{1,2})\s*سلندر/);
  if (cylM) {
    const c = parseInt(cylM[1], 10);
    if (c >= 2 && c <= 16) out.cylinders = c;
  }

  // Horsepower: "308HP", "308 hp".
  const hpM = t.match(/(\d{2,4})\s*hp/i);
  if (hpM) {
    const hp = parseInt(hpM[1], 10);
    if (hp >= 50 && hp <= 2000) out.horsepower = hp;
  }
  return out;
}
