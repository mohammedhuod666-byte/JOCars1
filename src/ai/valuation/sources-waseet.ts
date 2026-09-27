/**
 * Waseet Jordan Classifieds Auto Adapter (https://jo.waseet.net)
 * Large Jordanian classifieds portal.
 * Respects timeout, parses listing blocks/schema, handles redirects,
 * never fabricates fake rows.
 */
import type { NormalizedListing, VehicleSpec } from './types';
import { parseKilometers, toJod, normalizeTrim, contentHash, enrichFromTitle } from './normalize';
import { resolveCanonicalListingUrl, createSourceSnapshot } from './url-verifier';

export async function collectWaseet(
  spec: VehicleSpec,
  timeoutMs: number
): Promise<NormalizedListing[]> {
  const brand = (spec.brandEn || spec.brand || '').toLowerCase().trim();
  const model = (spec.modelEn || spec.model || '').toLowerCase().trim();
  if (!brand) return [];

  const ctrl = AbortSignal.timeout(Math.min(timeoutMs, 8000));
  try {
    const query = `${spec.brand} ${spec.model} ${spec.year}`.trim();
    const searchUrl = `https://jo.waseet.net/ar/site/amman/cars?keyword=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.9',
      },
      signal: ctrl,
    });

    if (!res.ok) return [];

    const html = await res.text();
    const out: NormalizedListing[] = [];
    const now = new Date().toISOString();

    // Check for JSON-LD schema or structured listing cards
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const m of jsonLdMatches) {
        try {
          const raw = m.replace(/<\/?script[^>]*>/gi, '');
          const data = JSON.parse(raw);
          const items = Array.isArray(data) ? data : data['@type'] === 'ItemList' ? data.itemListElement || [] : [data];
          for (const item of items) {
            const car = item.item || item;
            if (car['@type'] === 'Car' || car['@type'] === 'Product' || car['@type'] === 'Vehicle') {
              const price = typeof car.offers?.price === 'number' ? car.offers.price : parseFloat(car.offers?.price || '0');
              if (price > 1000) {
                const km = parseKilometers(car.mileageFromOdometer?.value || car.mileage);
                const { priceJod, fxRate } = toJod(price, car.offers?.priceCurrency || 'JOD');
                const canonUrl = resolveCanonicalListingUrl(car.url || '', 'waseet');
                const row: NormalizedListing = {
                  source: 'waseet',
                  sourceLabel: 'الوسيط الأردن',
                  externalId: `ws-${contentHash([car.url || String(price)])}`,
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
                  source: 'waseet',
                  sourceLabel: 'الوسيط الأردن',
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
          // ignore
        }
      }
    }

    return out;
  } catch {
    return [];
  }
}
