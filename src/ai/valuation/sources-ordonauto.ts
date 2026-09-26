/**
 * OrdonAuto adapter — verified 2026-09-26: brand pages
 * (https://ordonauto.com/used-cars/{slug}) embed schema.org Car JSON-LD
 * with name/url/brand/model/year/mileage/transmission and JOD offers.
 * Dealer inventory: retail-skewed, so source trust stays below P2P.
 * Polite: single page fetch, 8s timeout, standard desktop UA.
 */
import type { NormalizedListing, VehicleSpec } from './types';
import { parseKilometers, toJod, normalizeTrim, contentHash, enrichFromTitle } from './normalize';

const SLUG_OVERRIDES: Record<string, string> = {
  'land rover': 'land-rover',
  mercedes: 'mercedes-benz',
  'mercedes benz': 'mercedes-benz',
};

function brandSlug(spec: VehicleSpec): string | null {
  const raw = (spec.brandEn || spec.brand || '').toLowerCase().trim();
  if (!raw) return null;
  if (SLUG_OVERRIDES[raw]) return SLUG_OVERRIDES[raw];
  if (/^[a-z0-9]+(?:[ -][a-z0-9]+)*$/.test(raw)) return raw.replace(/ /g, '-');
  return null; // Arabic-only brand: cannot address a slug — skip honestly
}

interface OrdonCar {
  name?: string; url?: string; model?: string;
  vehicleModelDate?: string;
  mileageFromOdometer?: { value?: number | string };
  vehicleTransmission?: string; bodyType?: string; color?: string;
  fuelType?: string;
  offers?: { price?: number | string; priceCurrency?: string };
}

function toListing(
  c: OrdonCar,
  spec: VehicleSpec,
  now: string,
): NormalizedListing | null {
  const price = typeof c.offers?.price === 'string' ? parseFloat(c.offers.price) : c.offers?.price;
  if (!price || !Number.isFinite(price) || price <= 0) return null;
  const year = parseInt(c.vehicleModelDate || '', 10);
  const kmRaw = c.mileageFromOdometer?.value;
  const km = typeof kmRaw === 'number' ? kmRaw : parseKilometers(kmRaw);
  const { priceJod, fxRate } = toJod(price, c.offers?.priceCurrency || 'JOD');
  const modelGuess = (c.model || '').trim() || (c.name || '').trim();
  const row: NormalizedListing = {
    source: 'ordonauto',
    sourceLabel: 'أردن أوتو (وكيل)',
    externalId: `oa-${contentHash([c.url])}`,
    url: c.url || null,
    brand: spec.brand,
    brandEn: spec.brandEn || null,
    model: modelGuess,
    modelEn: modelGuess || null,
    year: Number.isFinite(year) ? year : null,
    trim: normalizeTrim(c.name),
    kilometers: km,
    price,
    currency: c.offers?.priceCurrency || 'JOD',
    priceJod,
    fxRate,
    city: 'عمان',
    country: 'JO',
    fuelType: c.fuelType || null,
    transmission: c.vehicleTransmission || null,
    drivetrain: null,
    horsepower: null,
    priceType: 'asking',
    condition: null,
    specs: [c.bodyType, c.color].filter(Boolean) as string[],
    listingDate: null,
    scrapedAt: now,
  };
  return enrichFromTitle(row, c.name || '');
}

export async function collectOrdonAuto(spec: VehicleSpec, timeoutMs: number): Promise<NormalizedListing[]> {
  const slug = brandSlug(spec);
  if (!slug) return [];
  const ctrl = AbortSignal.timeout(Math.min(timeoutMs, 10000));
  try {
    const res = await fetch(`https://ordonauto.com/used-cars/${slug}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: ctrl,
    });
    if (!res.ok) return [];
    const html = await res.text();
    const out: NormalizedListing[] = [];
    const now = new Date().toISOString();
    const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      try {
        const j = JSON.parse(m[1]);
        const items = j['@type'] === 'ItemList' ? j.itemListElement || [] : [];
        for (const it of items) {
          const c = (it.item || it) as OrdonCar & { '@type'?: string };
          if (!c || c['@type'] !== 'Car') continue;
          const row = toListing(c, spec, now);
          if (row) out.push(row);
        }
      } catch { /* skip malformed block */ }
    }
    return out;
  } catch {
    return [];
  }
}
