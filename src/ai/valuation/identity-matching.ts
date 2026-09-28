/**
 * Canonical Vehicle Identity — deterministic identity layer.
 *
 * HARD CONSTRAINTS:
 * - Mileage is NEVER identity
 * - Asking price is NEVER identity
 * - Condition is NEVER identity
 * - UNKNOWN is never EXACT
 * - Substring matching is FORBIDDEN
 * - Model/Series mismatch is FATAL
 */

// ── Token-aware text matching ──────────────────────────────────────────────

/**
 * Normalize text for comparison: lowercase, strip punctuation, normalize Arabic.
 */
export function normalizeText(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[_\-–—/\s]+/g, ' ')
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize text into word boundary tokens.
 */
export function tokenize(s: string | null | undefined): string[] {
  const n = normalizeText(s);
  if (!n) return [];
  return n.split(' ').filter(Boolean);
}

/**
 * Check if a token matches exactly (token-aware, NOT substring).
 */
export function tokenMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length === 0 || tb.length === 0) return false;
  // Every token in the shorter array must exist in the longer
  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  return shorter.every(t => longer.includes(t));
}

/**
 * Check if a phrase appears as exact tokens in text.
 */
export function phraseInText(phrase: string, text: string | null | undefined): boolean {
  const pt = tokenize(phrase);
  const tt = tokenize(text);
  if (pt.length === 0 || tt.length === 0) return false;
  // All phrase tokens must appear consecutively in text
  for (let i = 0; i <= tt.length - pt.length; i++) {
    let match = true;
    for (let j = 0; j < pt.length; j++) {
      if (tt[i + j] !== pt[j]) { match = false; break; }
    }
    if (match) return true;
  }
  return false;
}

// ── Canonical Identity ─────────────────────────────────────────────────────

export interface CanonicalIdentity {
  make: string | null;
  model: string | null;
  year: number | null;
  variant: string | null;
  powertrain: string | null;
  drivetrain: string | null;
  transmission: string | null;
  engineCc: number | null;
  horsepower: number | null;
  conflicts: string[];
}

// ── BMW Model Token Map ────────────────────────────────────────────────────

const BMW_MODEL_TOKENS: Record<string, string> = {
  'x5': 'X5',
  'x6': 'X6',
  'x3': 'X3',
  'x4': 'X4',
  'x7': 'X7',
  'x1': 'X1',
  'x2': 'X2',
  '3series': '3-Series',
  '5series': '5-Series',
  '7series': '7-Series',
  '320': '3-Series',
  '520': '5-Series',
  '530': '5-Series',
  '530e': '5-Series',
  '540': '5-Series',
  '330': '3-Series',
  '325': '3-Series',
  '318': '3-Series',
  '316': '3-Series',
  '730': '7-Series',
  '740': '7-Series',
  '750': '7-Series',
  'm3': 'M3',
  'm4': 'M4',
  'm5': 'M5',
  'm6': 'M6',
  'z4': 'Z4',
  'ix': 'iX',
  'i3': 'i3',
  'i4': 'i4',
  'i8': 'i8',
};

// ── Variant/Powertrain Signals ─────────────────────────────────────────────

const VARIANT_40E = ['40e', 'xdrive40e', 'xdrive 40e', 'x drive 40e', 'x-drive 40e', 'x5 40e'];
const VARIANT_45E = ['45e', 'xdrive45e', 'xdrive 45e', 'x5 45e'];
const VARIANT_50E = ['50e', 'xdrive50e', 'xdrive 50e', 'x5 50e'];
const VARIANT_35I = ['35i', 'x35i', 'xdrive35i', 'x5 35i'];
const VARIANT_40I = ['40i', 'x40i', 'xdrive40i', 'x5 40i'];
const VARIANT_50I = ['50i', 'x50i', 'xdrive50i', 'x5 50i'];
const VARIANT_30D = ['30d', 'x30d', 'xdrive30d', 'x5 30d'];
const VARIANT_40D = ['40d', 'x40d', 'xdrive40d', 'x5 40d'];

const PHEV_PATTERNS = [
  'phev', 'plug-in hybrid', 'plug in hybrid', 'plugin hybrid',
  'هايبرد قابل للشحن', 'هايبرد بلج ان',
];

const AWD_PATTERNS = [
  'awd', 'xdrive', 'x drive', '4wd', '4x4',
  'all wheel drive', 'all-wheel drive',
  'دفع كلي', 'دفع رباعي', 'رباعي',
];

// ── BMW Series/Model Detection ─────────────────────────────────────────────

/**
 * Detect BMW model from text using token-aware matching.
 * Returns canonical model name or null.
 */
export function detectBmwModel(text: string | null | undefined): string | null {
  const tokens = tokenize(text);
  if (tokens.length === 0) return null;

  // Check for X-series models first (X5, X6, etc.)
  for (const token of tokens) {
    if (token === 'x5' || token === 'اكس5' || token === 'اكس 5' || token === 'اكس فايف') return 'X5';
    if (token === 'x6' || token === 'اكس6' || token === 'اكس 6') return 'X6';
    if (token === 'x3' || token === 'اكس3' || token === 'اكس 3') return 'X3';
    if (token === 'x4' || token === 'اكس4' || token === 'اكس 4') return 'X4';
    if (token === 'x7' || token === 'اكس7' || token === 'اكس 7') return 'X7';
    if (token === 'x1' || token === 'اكس1' || token === 'اكس 1') return 'X1';
    if (token === 'x2' || token === 'اكس2' || token === 'اكس 2') return 'X2';
  }

  // Check for numbered series (5 Series, 530, etc.)
  const hasFiveSeries = tokens.some(t => t === '5' || t === '5series' || t === 'الفئة الخامسة' || t === 'سلسلة 5');
  const hasSevenSeries = tokens.some(t => t === '7' || t === '7series' || t === 'الفئة السابعة' || t === 'سلسلة 7');
  const hasThreeSeries = tokens.some(t => t === '3' || t === '3series' || t === 'الفئة الثالثة' || t === 'سلسلة 3');

  // Check for specific model numbers (530, 520, etc.)
  const modelNumberTokens = tokens.filter(t => /^\d{3}$/.test(t) || /^\d{3}[a-z]?$/.test(t));
  for (const mn of modelNumberTokens) {
    const num = parseInt(mn, 10);
    if (num >= 500 && num < 600) return '5-Series';
    if (num >= 700 && num < 800) return '7-Series';
    if (num >= 300 && num < 400) return '3-Series';
    if (num >= 100 && num < 200) return '1-Series';
  }

  if (hasFiveSeries) return '5-Series';
  if (hasSevenSeries) return '7-Series';
  if (hasThreeSeries) return '3-Series';

  return null;
}

/**
 * Check if two BMW models are the same (token-aware, NOT substring).
 */
export function isSameBmwModel(a: string | null | undefined, b: string | null | undefined): boolean {
  const ma = detectBmwModel(a);
  const mb = detectBmwModel(b);
  if (!ma || !mb) return false;
  return ma === mb;
}

// ── Variant Detection (context-aware) ───────────────────────────────────────

/**
 * Detect variant from text with context awareness.
 * '40e' is PHEV evidence ONLY for BMW X5 (or when model is already known).
 */
export function detectVariant(
  text: string | null | undefined,
  knownModel?: string | null
): { variant: string | null; powertrain: string | null } {
  const tokens = tokenize(text);
  if (tokens.length === 0) return { variant: null, powertrain: null };

  const lowerText = normalizeText(text);

  // Check for 40e/45e/50e (PHEV variants for BMW X5)
  const isBmwX5 = !knownModel || knownModel === 'X5' || lowerText.includes('x5') || lowerText.includes('اكس 5');

  if (isBmwX5) {
    // Check 40e
    for (const v of VARIANT_40E) {
      if (phraseInText(v, text)) return { variant: '40e', powertrain: 'PHEV' };
    }
    // Check 45e
    for (const v of VARIANT_45E) {
      if (phraseInText(v, text)) return { variant: '45e', powertrain: 'PHEV' };
    }
    // Check 50e
    for (const v of VARIANT_50E) {
      if (phraseInText(v, text)) return { variant: '50e', powertrain: 'PHEV' };
    }
    // Check 35i
    for (const v of VARIANT_35I) {
      if (phraseInText(v, text)) return { variant: '35i', powertrain: null };
    }
    // Check 40i
    for (const v of VARIANT_40I) {
      if (phraseInText(v, text)) return { variant: '40i', powertrain: null };
    }
    // Check 50i
    for (const v of VARIANT_50I) {
      if (phraseInText(v, text)) return { variant: '50i', powertrain: null };
    }
    // Check 30d
    for (const v of VARIANT_30D) {
      if (phraseInText(v, text)) return { variant: '30d', powertrain: 'diesel' };
    }
    // Check 40d
    for (const v of VARIANT_40D) {
      if (phraseInText(v, text)) return { variant: '40d', powertrain: 'diesel' };
    }
  }

  return { variant: null, powertrain: null };
}

/**
 * Detect powertrain from text with conflict resolution.
 */
export function detectPowertrain(
  structured: string | null | undefined,
  text: string | null | undefined
): { powertrain: string | null; confidence: string; conflicts: string[] } {
  const conflicts: string[] = [];
  const lowerStructured = normalizeText(structured);
  const lowerText = normalizeText(text);

  // Check for explicit PHEV evidence in text
  const textHasPhev = PHEV_PATTERNS.some(p => phraseInText(p, text));
  const textHas40e = phraseInText('40e', text) || phraseInText('xdrive40e', text);

  // Check for generic fuel mentions
  const structuredHasPetrol = lowerStructured.includes('petrol') || lowerStructured.includes('gasoline') || lowerStructured.includes('بنزين');
  const structuredHasHybrid = lowerStructured.includes('hybrid') || lowerStructured.includes('هايبرد') || lowerStructured.includes('هجين');

  // Resolution logic
  if (textHasPhev || textHas40e) {
    // Specific PHEV evidence in text
    if (structuredHasPetrol && !structuredHasHybrid) {
      conflicts.push(`CONFLICT: structured says petrol but text says PHEV — using PHEV (specific overrides generic)`);
    }
    if (structuredHasHybrid) {
      conflicts.push(`CONFLICT: structured says hybrid but text says PHEV — using PHEV (specific overrides generic)`);
    }
    return { powertrain: 'PHEV', confidence: 'text-specific', conflicts };
  }

  if (structuredHasHybrid) {
    return { powertrain: 'hybrid', confidence: 'structured', conflicts };
  }

  if (structuredHasPetrol) {
    return { powertrain: 'petrol', confidence: 'structured', conflicts };
  }

  return { powertrain: null, confidence: 'unknown', conflicts };
}

/**
 * Detect drivetrain from text with normalization.
 */
export function detectDrivetrain(
  structured: string | null | undefined,
  text: string | null | undefined
): { drivetrain: string | null; confidence: string } {
  const lowerStructured = normalizeText(structured);
  const lowerText = normalizeText(text);

  // Check for AWD evidence (including xDrive)
  const hasAwd = AWD_PATTERNS.some(p => phraseInText(p, text)) ||
    lowerStructured.includes('awd') || lowerStructured.includes('xdrive') ||
    lowerStructured.includes('4wd') || lowerText.includes('xdrive') ||
    lowerText.includes('x drive') || lowerText.includes('دفع كلي');

  if (hasAwd) return { drivetrain: 'AWD', confidence: 'explicit' };

  // Check for RWD
  const hasRwd = lowerStructured.includes('rwd') || lowerStructured.includes('rear wheel') ||
    lowerText.includes('دفع خلفي') || lowerText.includes('خلفي');

  if (hasRwd) return { drivetrain: 'RWD', confidence: 'explicit' };

  // Check for FWD
  const hasFwd = lowerStructured.includes('fwd') || lowerStructured.includes('front wheel') ||
    lowerText.includes('دفع امامي') || lowerText.includes('أمامي');

  if (hasFwd) return { drivetrain: 'FWD', confidence: 'explicit' };

  return { drivetrain: null, confidence: 'unknown' };
}

// ── Canonical Identity Builder ──────────────────────────────────────────────

/**
 * Build canonical identity from all available evidence.
 */
export function buildCanonicalIdentity(
  make: string | null | undefined,
  model: string | null | undefined,
  year: number | null | undefined,
  trim: string | null | undefined,
  fuelType: string | null | undefined,
  drivetrain: string | null | undefined,
  transmission: string | null | undefined,
  engineCapacity: number | null | undefined,
  horsepower: number | null | undefined,
  title?: string | null | undefined,
  description?: string | null | undefined
): CanonicalIdentity {
  const conflicts: string[] = [];

  // Detect variant from title/description (use both for better detection)
  const combinedText = `${title || ''} ${description || ''}`.trim();
  const variantResult = detectVariant(combinedText, model);

  // Detect powertrain with conflict resolution
  const powertrainResult = detectPowertrain(fuelType, title || description || '');

  // Detect drivetrain
  const drivetrainResult = detectDrivetrain(drivetrain, title || description || '');

  // Collect all conflicts
  conflicts.push(...powertrainResult.conflicts);

  // Check for configuration contradictions
  if (variantResult.variant === '40e' && powertrainResult.powertrain === 'petrol') {
    conflicts.push('CONTRADICTION: variant says 40e (PHEV) but powertrain says petrol');
  }
  if (variantResult.variant === '530' && (model === 'X5' || model?.includes('X5'))) {
    conflicts.push('CONTRADICTION: variant 530 does not belong to X5 model');
  }

  return {
    make: make || null,
    model: model || null,
    year: year || null,
    variant: variantResult.variant,
    powertrain: variantResult.powertrain || powertrainResult.powertrain,
    drivetrain: drivetrainResult.drivetrain,
    transmission: transmission || null,
    engineCc: engineCapacity || null,
    horsepower: horsepower || null,
    conflicts,
  };
}

// ── Identity Comparison ────────────────────────────────────────────────────

/**
 * Compare two canonical identities for compatibility.
 */
export interface IdentityComparison {
  isSameModel: boolean;
  isSameYear: boolean;
  isSameVariant: boolean;
  isSamePowertrain: boolean;
  isSameDrivetrain: boolean;
  isDirectCandidate: boolean;
  matchLevel: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'REJECTED';
  reasons: string[];
}

export function compareIdentities(
  target: CanonicalIdentity,
  comp: CanonicalIdentity
): IdentityComparison {
  const reasons: string[] = [];

  // Model match (HARD constraint)
  const isSameModel = isSameBmwModel(target.model, comp.model);
  if (!isSameModel) {
    return {
      isSameModel: false,
      isSameYear: false,
      isSameVariant: false,
      isSamePowertrain: false,
      isSameDrivetrain: false,
      isDirectCandidate: false,
      matchLevel: 'REJECTED',
      reasons: [`MODEL_MISMATCH: ${target.model} != ${comp.model}`],
    };
  }
  reasons.push('MODEL_MATCH');

  // Year match
  const isSameYear = target.year === comp.year;
  if (isSameYear) reasons.push('YEAR_MATCH');
  else reasons.push(`YEAR_DIFF: ${target.year} vs ${comp.year}`);

  // Variant match
  const isSameVariant = !target.variant || !comp.variant || target.variant === comp.variant;
  if (target.variant && comp.variant) {
    if (target.variant === comp.variant) reasons.push('VARIANT_MATCH');
    else reasons.push(`VARIANT_DIFF: ${target.variant} vs ${comp.variant}`);
  } else {
    reasons.push('VARIANT_UNKNOWN');
  }

  // Powertrain match
  const isSamePowertrain = !target.powertrain || !comp.powertrain || target.powertrain === comp.powertrain;
  if (target.powertrain && comp.powertrain) {
    if (target.powertrain === comp.powertrain) reasons.push('POWERTRAIN_MATCH');
    else reasons.push(`POWERTRAIN_MISMATCH: ${target.powertrain} vs ${comp.powertrain}`);
  } else {
    reasons.push('POWERTRAIN_UNKNOWN');
  }

  // Drivetrain match
  const isSameDrivetrain = !target.drivetrain || !comp.drivetrain || target.drivetrain === comp.drivetrain;
  if (target.drivetrain && comp.drivetrain) {
    if (target.drivetrain === comp.drivetrain) reasons.push('DRIVETRAIN_MATCH');
    else reasons.push(`DRIVETRAIN_DIFF: ${target.drivetrain} vs ${comp.drivetrain}`);
  } else {
    reasons.push('DRIVETRAIN_UNKNOWN');
  }

  // Determine match level
  // UNKNOWN is never EXACT - require explicit matches for L1
  const hasExplicitVariant = target.variant && comp.variant;
  const hasExplicitPowertrain = target.powertrain && comp.powertrain;
  const hasExplicitDrivetrain = target.drivetrain && comp.drivetrain;

  const isDirectCandidate = isSameModel && isSameYear && isSameVariant && isSamePowertrain && isSameDrivetrain;

  let matchLevel: IdentityComparison['matchLevel'];
  if (isDirectCandidate && hasExplicitVariant && hasExplicitPowertrain && hasExplicitDrivetrain) {
    matchLevel = 'L1';
  } else if (isSameModel && isSameYear && isSamePowertrain && hasExplicitPowertrain) {
    matchLevel = 'L2';
  } else if (isSameModel && isSameYear) {
    matchLevel = 'L3';
  } else if (isSameModel && Math.abs((target.year || 0) - (comp.year || 0)) <= 1) {
    matchLevel = 'L4';
  } else if (isSameModel) {
    matchLevel = 'L5';
  } else {
    matchLevel = 'REJECTED';
  }

  return {
    isSameModel,
    isSameYear,
    isSameVariant,
    isSamePowertrain,
    isSameDrivetrain,
    isDirectCandidate,
    matchLevel,
    reasons,
  };
}

// ── False Positive Prevention ───────────────────────────────────────────────

/**
 * Check if a model mention is a false positive (substring collision).
 * e.g., "X5" should NOT match "RX5", "EX5", "X50", "X5M"
 */
export function isFalsePositiveModelMention(
  mentionedModel: string,
  fullText: string | null | undefined
): boolean {
  const tokens = tokenize(fullText);
  if (tokens.length === 0) return false;

  // Check for false positives - only if the false positive pattern exists
  // AND the correct model does NOT exist in the text
  const falsePositivePatterns = [
    { pattern: 'rx5', correct: 'x5' },
    { pattern: 'ex5', correct: 'x5' },
    { pattern: 'x50', correct: 'x5' },
    { pattern: 'x5m', correct: 'x5' },
  ];

  for (const fp of falsePositivePatterns) {
    if (mentionedModel.toLowerCase() === fp.correct) {
      // Check if the false positive pattern exists in text
      const hasFalsePositive = tokens.some(t => t === fp.pattern);
      const hasCorrectModel = tokens.some(t => t === fp.correct);
      if (hasFalsePositive && !hasCorrectModel) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Strict model equality check - NO substring matching.
 */
export function strictModelEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = tokenize(a);
  const tb = tokenize(b);

  // Normalize Arabic model names
  const normalizeModelToken = (t: string): string => {
    if (t === 'اكس5' || t === 'اكس 5' || t === 'اكس فايف') return 'x5';
    if (t === 'اكس6' || t === 'اكس 6') return 'x6';
    if (t === 'اكس3' || t === 'اكس 3') return 'x3';
    if (t === 'اكس4' || t === 'اكس 4') return 'x4';
    if (t === 'اكس7' || t === 'اكس 7') return 'x7';
    return t;
  };

  const na = ta.map(normalizeModelToken);
  const nb = tb.map(normalizeModelToken);

  // Must have at least one matching token
  return na.some(t => nb.includes(t));
}
