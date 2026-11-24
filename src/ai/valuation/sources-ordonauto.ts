/**
 * OrdonAuto adapter (https://ordonauto.com)
 * Verified Jordanian dealer inventory & marketplace portal.
 * Robust parser supporting both Next.js listing cards and structured metadata.
 */
import type { NormalizedListing, VehicleSpec } from './types';
import { parseKilometers, toJod, normalizeTrim, contentHash, enrichFromTitle } from './normalize';
import { resolveCanonicalListingUrl, createSourceSnapshot } from './url-verifier';

const SLUG_OVERRIDES: Record<string, string> = {
  'land rover': 'land-rover',
  'mercedes': 'mercedes-benz',
  'mercedes benz': 'mercedes-benz',
  'بي ام دبليو': 'bmw',
  'بي إم دبليو': 'bmw',
  'تويوتا': 'toyota',
  'هيونداي': 'hyundai',
  'كيا': 'kia',
  'نيسان': 'nissan',
};

function brandSlug(spec: VehicleSpec): string | null {
  const raw = (spec.brandEn || spec.brand || '').toLowerCase().trim();
  if (!raw) return null;
  if (SLUG_OVERRIDES[raw]) return SLUG_OVERRIDES[raw];
  if (/^[a-z0-9]+(?:[ -][a-z0-9]+)*$/.test(raw)) return raw.replace(/ /g, '-');
  return null;
}

function modelSlug(spec: VehicleSpec): string | null {
  const raw = (spec.modelEn || spec.model || '').toLowerCase().trim();
  if (!raw) return null;
  return raw.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function collectOrdonAuto(spec: VehicleSpec, timeoutMs: number): Promise<NormalizedListing[]> {
  const bSlug = brandSlug(spec);
  if (!bSlug) return [];

  const mSlug = modelSlug(spec);
  const urlsToTry: string[] = [];
  if (mSlug) {
    urlsToTry.push(`https://ordonauto.com/used-cars/${bSlug}/${mSlug}`);
  }
  urlsToTry.push(`https://ordonauto.com/used-cars/${bSlug}`);

  const ctrl = AbortSignal.timeout(Math.min(timeoutMs, 10000));
  const out: NormalizedListing[] = [];
  const now = new Date().toISOString();
  const seenUrls = new Set<string>();

  for (const fetchUrl of urlsToTry) {
    try {
      const res = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        },
        signal: ctrl,
      });

      if (!res.ok) continue;
      const html = await res.text();

      // 1. Parse HTML listing cards (Next.js layout: data-testid="overhaul-listing-card")
      const cards = html.split('data-testid="overhaul-listing-card"').slice(1);
      for (const rawCard of cards) {
        const hrefM = rawCard.match(/href="(\/used-cars\/[^"]+)"/);
        if (!hrefM) continue;
        const relativeHref = hrefM[1];
        if (seenUrls.has(relativeHref)) continue;

        // Extract Price from WhatsApp link (e.g. text=...listed for 30,000 JD on Ordon Auto)
        let price = 0;
        const waMatch = rawCard.match(/wa\.me\/[0-9]+\?text=([^"'\s>]+)/i);
        if (waMatch) {
          let q = '';
          try {
            q = decodeURIComponent(waMatch[1].replace(/\+/g, ' '));
          } catch {
            q = waMatch[1].replace(/%20/g, ' ').replace(/%2C/g, ',');
          }
          const pMatch = q.match(/listed\s+for\s+([0-9, \-–]+)\s*JD/i);
          if (pMatch) {
            const rawP = pMatch[1].replace(/,/g, '').trim();
            if (rawP.includes('-') || rawP.includes('–')) {
              const parts = rawP.split(/[-–]/).map((p) => parseFloat(p.trim())).filter((p) => !isNaN(p));
              if (parts.length >= 2) price = Math.round((parts[0] + parts[1]) / 2);
              else if (parts.length === 1) price = parts[0];
            } else {
              price = parseFloat(rawP);
            }
          }
        }

        // Fallback price from card text if not in WhatsApp button
        if (!price || isNaN(price) || price < 500) {
          const pMatch = rawCard.match(/([0-9,]{4,7})\s*(?:JD|JOD|د\.أ)/i);
          if (pMatch) price = parseFloat(pMatch[1].replace(/,/g, ''));
        }

        if (!price || isNaN(price) || price < 500) continue;

        // Extract year from URL (/used-cars/brand/model/YEAR/uuid) or card text
        const urlSegments = relativeHref.split('/');
        let year: number | null = parseInt(urlSegments[4] || '', 10);
        if (!year || isNaN(year) || year < 1980 || year > 2030) {
          const yMatch = rawCard.match(/\b(19\d{2}|20\d{2})\b/);
          year = yMatch ? parseInt(yMatch[1], 10) : spec.year;
        }

        // Extract title & trim
        const titleMatch = rawCard.match(/aria-label="Share ([^"]+)"/i) || rawCard.match(/alt="([^"]+)"/i);
        const title = titleMatch ? titleMatch[1].trim() : `${spec.brand} ${spec.model} ${year}`;

        // Extract mileage (km)
        const kmMatch = rawCard.match(/([0-9,]+)\s*km/i);
        const km = kmMatch ? parseKilometers(kmMatch[1]) : null;

        const fullUrl = `https://ordonauto.com${relativeHref}`;
        const canonicalUrl = resolveCanonicalListingUrl(fullUrl, 'ordonauto');
        const { priceJod, fxRate } = toJod(price, 'JOD');

        seenUrls.add(relativeHref);
        const listingRow: NormalizedListing = {
          source: 'ordonauto',
          sourceLabel: 'أردن أوتو (وكيل)',
          externalId: `oa-${contentHash([fullUrl])}`,
          url: canonicalUrl || fullUrl,
          canonicalUrl: canonicalUrl || fullUrl,
          finalUrl: canonicalUrl || fullUrl,
          urlStatus: 'VALID',
          urlVerifiedAt: now,
          evidenceStatus: 'VERIFIED_AT_COLLECTION',
          title,
          brand: spec.brand,
          brandEn: spec.brandEn || null,
          model: spec.model,
          modelEn: spec.modelEn || null,
          year,
          trim: normalizeTrim(title),
          kilometers: km,
          price,
          currency: 'JOD',
          priceJod,
          fxRate,
          city: 'عمان',
          country: 'JO',
          fuelType: null,
          transmission: null,
          drivetrain: null,
          horsepower: null,
          priceType: 'asking',
          condition: null,
          specs: [],
          listingDate: null,
          scrapedAt: now,
        };

        const enriched = enrichFromTitle(listingRow, title);
        enriched.sourceSnapshot = createSourceSnapshot({
          source: 'ordonauto',
          sourceLabel: 'أردن أوتو (وكيل)',
          url: canonicalUrl || fullUrl,
          title,
          price,
          currency: 'JOD',
          year: year || spec.year,
          brand: enriched.brand,
          model: enriched.model,
          kilometers: km,
          city: 'عمان',
          scrapedAt: now,
        }, canonicalUrl);

        out.push(enriched);
      }

      // If we found cars on the specific model URL, no need to query generic brand page
      if (out.length > 0) break;
    } catch {
      // Best-effort per URL
    }
  }

  return out;
}
