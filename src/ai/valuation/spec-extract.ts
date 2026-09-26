/**
 * Source spec extraction (§10): pull structured specs from listing titles
 * WITHOUT ever inventing them. Absent evidence → null (UNKNOWN), never a
 * default. Regression-critical: 40e must never become Gasoline, AWD never
 * FWD, 2000cc never 2500cc, trim never dropped.
 */
export interface ExtractedSpecs {
  trim: string | null;
  fuel: 'PETROL' | 'DIESEL' | 'HYBRID' | 'PHEV' | 'EV' | null;
  drivetrain: 'FWD' | 'RWD' | 'AWD' | 'FOUR_WD' | null;
  engineCc: number | null;
  cylinders: number | null;
  horsepower: number | null;
}

export function extractSpecsFromTitle(title: string): ExtractedSpecs {
  const t = (title || '').toLowerCase();
  const out: ExtractedSpecs = {
    trim: null, fuel: null, drivetrain: null,
    engineCc: null, cylinders: null, horsepower: null,
  };
  if (!t) return out;

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
