/**
 * Data normalization (spec §7): chaotic source formats → canonical numbers.
 * 80,000 km | 80k | 80000 | 80 ألف  →  80000
 * 13,500 $ | 13.5K USD | 13500 USD  →  { price: 13500, currency: 'USD' }
 */

// Arabic-Indic digits → ASCII.
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export function normalizeDigits(s: string): string {
  return String(s || '').replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

export function parseKilometers(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw <= 0 || raw > 1000000) return null;
    return Math.round(raw);
  }
  let s = normalizeDigits(String(raw)).toLowerCase();
  let mult = 1;
  if (/k\b|ألف|الف/.test(s)) mult = 1000;
  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num) || num <= 0) return null;
  const km = Math.round(num * mult);
  // Sanity: odometers live in 0..1,000,000 km.
  if (km > 1000000) return null;
  return km;
}

const CURRENCY_HINTS: [RegExp, string][] = [
  [/د\.?أ|دينار|jod|jd/i, 'JOD'],
  [/\$|usd|dollar/i, 'USD'],
  [/€|eur|euro/i, 'EUR'],
  [/₪|ils|shekel|شيكل/i, 'ILS'],
  [/ر\.?س|sar|riyal|ريال/i, 'SAR'],
];

/** Fixed reference rates TO JOD (recorded per analysis for audit). */
export const FX_TO_JOD: Record<string, number> = {
  JOD: 1,
  USD: 0.709,
  EUR: 0.77,
  ILS: 0.19,
  SAR: 0.189,
};
export const FX_DATE = '2026-09-26';

export function parsePrice(raw: unknown, fallbackCurrency = 'JOD'): { price: number; currency: string } | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? { price: raw, currency: fallbackCurrency } : null;
  }
  let s = normalizeDigits(String(raw));
  let currency = fallbackCurrency;
  for (const [re, code] of CURRENCY_HINTS) {
    if (re.test(s)) { currency = code; break; }
  }
  // "13.5K" style shorthand.
  let mult = 1;
  if (/\d\s*[kK]\b/.test(s)) mult = 1000;
  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num) || num <= 0) return null;
  const price = num * mult;
  if (price > 10000000) return null; // garbage guard
  return { price, currency };
}

export function toJod(price: number, currency: string): { priceJod: number; fxRate: number } {
  const rate = FX_TO_JOD[currency] ?? 1;
  return { priceJod: Math.round(price * rate), fxRate: rate };
}

// Model trims first (LE..PLATINUM), package words last — "XLE Premium" → XLE.
const TRIM_LEVELS = [
  'limited', 'platinum', 'xle', 'xse', 'base', 'le', 'se',
  'premium', 'luxury', 'sport', 'full',
];

export function normalizeTrim(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  if (!s) return null;
  // Keep short canonical token when recognizable (model trims outrank
  // package words: "XLE Premium" → XLE; longest-first inside each class).
  const ordered = [...TRIM_LEVELS].sort((a, b) => b.length - a.length);
  const found = ordered.filter((t) => s.includes(t));
  // Prefer the earliest model-trim class match; fall back to longest match.
  const modelClass = ['limited', 'platinum', 'xle', 'xse', 'base', 'le', 'se'];
  for (const t of modelClass) {
    if (found.includes(t)) return t.toUpperCase();
  }
  if (found.length > 0) return found[0].toUpperCase();
  return s.slice(0, 40);
}

import type { NormalizedListing } from './types';
import { extractSpecsFromTitle, sanitizeTrim, drivetrainFromTrim } from './spec-extract';

/** Enrich a listing with title-parsed specs ONLY where structured data is absent. */
export function enrichFromTitle(l: NormalizedListing, title: string): NormalizedListing {
  const x = extractSpecsFromTitle(title);
  const prov: Record<string, 'FEED' | 'DERIVED'> = { ...(l.specProvenance || {}) };
  // Phase 5: trim must never hold drivetrain tokens; if it does, the value
  // belongs to drivetrain (and trim stays UNKNOWN instead of polluting matches).
  const xTrim = sanitizeTrim(x.trim);
  if (!l.trim && xTrim) { l.trim = xTrim; prov.trim = 'DERIVED'; }
  if (!l.drivetrain && x.trim) {
    const xDrive = drivetrainFromTrim(x.trim);
    if (xDrive) { l.drivetrain = xDrive; prov.drivetrain = 'DERIVED'; }
  }
  if (!l.generation && x.generation) { l.generation = x.generation; prov.generation = 'DERIVED'; }
  if (!l.chassisCode && x.chassisCode) { l.chassisCode = x.chassisCode; prov.chassisCode = 'DERIVED'; }
  if (!l.fuelType && x.fuel) { l.fuelType = x.fuel === 'PHEV' ? 'PLUGIN_HYBRID' : x.fuel; prov.fuelType = 'DERIVED'; }
  if (!l.drivetrain && x.drivetrain) { l.drivetrain = x.drivetrain; prov.drivetrain = 'DERIVED'; }
  if (x.engineCc != null) { (l as any).engineCc = x.engineCc; prov.engineCc = 'DERIVED'; }
  if (x.cylinders != null) { (l as any).cylinders = x.cylinders; prov.cylinders = 'DERIVED'; }
  if (x.horsepower != null) { l.horsepower = x.horsepower; prov.horsepower = 'DERIVED'; }
  if (l.conditionScore == null && x.conditionScore != null) {
    l.conditionScore = x.conditionScore;
    l.conditionCertainty = x.conditionCertainty;
    prov.condition = 'DERIVED';
  }
  l.specProvenance = prov;
  return l;
}

/** Canonical key for duplicate detection (spec §8). */
export function contentHash(parts: (string | number | null | undefined)[]): string {
  const norm = parts
    .map((p) => String(p ?? '').toLowerCase().replace(/[\s\-_,.،]+/g, ' ').trim())
    .join('|');
  let h = 0;
  for (let i = 0; i < norm.length; i++) {
    h = (Math.imul(31, h) + norm.charCodeAt(i)) | 0;
  }
  return 'h' + (h >>> 0).toString(36);
}
