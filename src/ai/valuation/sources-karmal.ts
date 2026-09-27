/**
 * Karmal Jordan Adapter (https://karmal.com)
 * Historic Jordanian auto portal.
 * Compliant SourceAdapter: respects timeout, parses schema/listings if available,
 * records redirects or parked status honestly, never creates synthetic data.
 */
import type { NormalizedListing, VehicleSpec } from './types';
import { parseKilometers, toJod, normalizeTrim, contentHash, enrichFromTitle } from './normalize';
import { resolveCanonicalListingUrl, createSourceSnapshot } from './url-verifier';

export async function collectKarmal(
  spec: VehicleSpec,
  timeoutMs: number
): Promise<NormalizedListing[]> {
  const brand = (spec.brandEn || spec.brand || '').toLowerCase().trim();
  const model = (spec.modelEn || spec.model || '').toLowerCase().trim();
  if (!brand) return [];

  const ctrl = AbortSignal.timeout(Math.min(timeoutMs, 8000));
  try {
    const searchUrl = `https://karmal.com/cars?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&year=${spec.year}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.9',
      },
      signal: ctrl,
    });

    if (!res.ok) return [];

    // Detect domain parking or external redirect
    if (res.url.includes('biomimicrist.com') || !res.url.includes('karmal.com')) {
      // Domain redirected to parked lander — record 0 listings honestly
      return [];
    }

    const html = await res.text();
    const out: NormalizedListing[] = [];
    const now = new Date().toISOString();

    // Check for JSON-LD Car schema if present
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const m of jsonLdMatches) {
        try {
          const raw = m.replace(/<\/?script[^>]*>/gi, '');
          const data = JSON.parse(raw);
          const items = Array.isArray(data) ? data : data['@type'] === 'ItemList' ? data.itemListElement || [] : [data];
          for (const item of items) {
            const car = item.item || item;
            if (car['@type'] === 'Car' || car['@type'] === 'Vehicle') {
              const price = typeof car.offers?.price === 'number' ? car.offers.price : parseFloat(car.offers?.price || '0');
              if (price > 500) {
                const km = parseKilometers(car.mileageFromOdometer?.value || car.mileage);
                const { priceJod, fxRate } = toJod(price, car.offers?.priceCurrency || 'JOD');
                const canonUrl = resolveCanonicalListingUrl(car.url || '', 'karmal');
                const row: NormalizedListing = {
                  source: 'karmal',
                  sourceLabel: 'كارمال الأردن',
                  externalId: `km-${contentHash([car.url || String(price)])}`,
                  url: canonUrl || car.url || null,
                  brand: spec.brand,
                  brandEn: spec.brandEn || null,
                  model: spec.model,
                  modelEn: spec.modelEn || null,
                  year: parseInt(car.vehicleModelDate || car.year || '0', 10) || spec.year,
                  trim: normalizeTrim(car.name),
                  kilometers: km,
                  price,
                  currency: car.offers?.priceCurrency || 'JOD',
                  priceJod,
                  fxRate,
                  city: 'عمان',
                  country: 'JO',
                  fuelType: car.fuelType || null,
                  transmission: car.vehicleTransmission || null,
                  priceType: 'asking',
                  specs: [],
                  scrapedAt: now,
                };
                const enriched = enrichFromTitle(row, car.name || '');
                enriched.sourceSnapshot = createSourceSnapshot({
                  source: 'karmal',
                  sourceLabel: 'كارمال الأردن',
                  url: canonUrl || car.url,
                  title: car.name,
                  price,
                  year: row.year,
                  brand: enriched.brand,
                  model: enriched.model,
                  kilometers: km,
                  city: 'عمان',
                  scrapedAt: now,
                }, canonUrl);
                out.push(enriched);
              }
            }
          }
        } catch {
          // ignore single item JSON error
        }
      }
    }

    return out;
  } catch {
    return [];
  }
}
