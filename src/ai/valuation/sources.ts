/**
 * Source adapters (spec §1, §27). Every market source implements
 * SourceAdapter — adding a new site means adding one file + one
 * registry line, never touching the engine.
 */
import type { NormalizedListing, VehicleSpec, MarketSourceExecution, SourceExecutionStatus } from './types';
import { parseKilometers, toJod, normalizeTrim, contentHash, enrichFromTitle } from './normalize';
import { resolveCanonicalListingUrl, createSourceSnapshot } from './url-verifier';
import { collectOrdonAuto } from './sources-ordonauto';
import { collectFacebook } from './sources-facebook';
import { collectKarmal } from './sources-karmal';
import { collectWaseet } from './sources-waseet';
import { collectAutohub } from './sources-autohub';

export interface SourceAdapter {
  id: string;          // stable id stored in DB
  label: string;       // Arabic display name
  country: string;     // market country code
  enabled: boolean;
  /** Bounded collection: must respect timeoutMs, never throw. */
  collect: (spec: VehicleSpec, timeoutMs: number) => Promise<NormalizedListing[]>;
}

export interface SourceOutcome {
  id: string;
  label: string;
  ok: boolean;
  count: number;
  ms: number;
  error?: string;
}

// ── OpenSooq adapter (wraps the existing verified SERP parser) ──
async function collectOpenSooq(spec: VehicleSpec, timeoutMs: number): Promise<NormalizedListing[]> {
  try {
    const { fetchOpenSooqListings } = await import('@/lib/opensooq-scrape');
    const brand = spec.brandEn || spec.brand;
    const model = spec.modelEn || spec.model;
    const res = await Promise.race([
      fetchOpenSooqListings(brand, model, spec.year),
      new Promise<null>((r) => setTimeout(() => r(null), timeoutMs)),
    ]);
    if (!res || !res.listings) return [];
    const now = new Date().toISOString();
    // Prefer strictly matched listings (same brand and model).
    const pool = (res.matchedListings && res.matchedListings.length > 0)
      ? res.matchedListings
      : (res.brandMatchedListings && res.brandMatchedListings.length > 0)
      ? res.brandMatchedListings
      : res.listings;

    return pool.map((l, i) => {
      const km = parseKilometers(l.km);
      const { priceJod, fxRate } = toJod(l.price, 'JOD');
      const canonicalUrl = resolveCanonicalListingUrl(l.url || '', 'opensooq');

      const row: NormalizedListing = {
        source: 'opensooq',
        sourceLabel: 'السوق المفتوح',
        externalId: `os-${contentHash([canonicalUrl || l.url])}-${i}`,
        url: canonicalUrl || l.url || null,
        canonicalUrl: canonicalUrl || null,
        finalUrl: canonicalUrl || null,
        urlStatus: canonicalUrl ? 'VALID' : 'UNKNOWN',
        urlVerifiedAt: now,
        evidenceStatus: 'VERIFIED_AT_COLLECTION',
        title: l.title || `${spec.brand} ${spec.model}`,
        brand: spec.brand,
        brandEn: brand || null,
        model: spec.model,
        modelEn: model || null,
        year: l.year,
        trim: normalizeTrim(l.title),
        kilometers: km,
        price: l.price,
        currency: 'JOD',
        priceJod,
        fxRate,
        city: l.city,
        country: 'JO',
        fuelType: l.fuelType,
        transmission: null,
        drivetrain: null,
        horsepower: null,
        priceType: 'asking',
        condition: l.condition,
        specs: [],
        listingDate: l.postedAt,
        scrapedAt: now,
      };

      const enriched = enrichFromTitle(row, l.title);
      enriched.sourceSnapshot = createSourceSnapshot({
        source: 'opensooq',
        sourceLabel: 'السوق المفتوح',
        url: canonicalUrl || l.url,
        title: l.title,
        price: l.price,
        currency: 'JOD',
        year: l.year,
        brand: enriched.brand,
        model: enriched.model,
        kilometers: km,
        city: l.city,
        scrapedAt: now,
      }, canonicalUrl);

      return enriched;
    });
  } catch {
    return [];
  }
}

// ── JO Cars internal DB adapter (own market = source #2) ──
async function collectJoCars(spec: VehicleSpec, timeoutMs: number): Promise<NormalizedListing[]> {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const q = (async () => {
      const baseWhere = {
        status: { in: ['APPROVED', 'SOLD'] },
        deletedAt: null,
        brand: { OR: [{ nameEn: { equals: spec.brandEn || spec.brand } }, { nameAr: { contains: spec.brand } }] },
        model: { OR: [{ nameEn: { equals: spec.modelEn || spec.model } }, { nameAr: { contains: spec.model } }] },
      };

      const selectClause = {
        id: true, slug: true, year: true, trim: true, kilometers: true,
        price: true, currency: true, fuelType: true, transmission: true,
        drivetrain: true, horsepower: true, condition: true, city: { select: { nameAr: true } },
        createdAt: true, soldPrice: true, status: true,
        brand: { select: { nameAr: true, nameEn: true } },
        model: { select: { nameAr: true, nameEn: true } },
        features: true, engineCapacity: true, cylinders: true,
      };

      // 1. Same Year
      let cars: any[] = await prisma.car.findMany({
        where: { ...baseWhere, year: spec.year },
        take: 60, orderBy: { createdAt: 'desc' }, select: selectClause as any,
      });

      // 2. +/- 1 Year
      if (cars.length < 5) {
        const existingIds: string[] = cars.map((c: any) => String(c.id));
        const more: any[] = await prisma.car.findMany({
          where: { ...baseWhere, year: { in: [spec.year - 1, spec.year + 1] }, id: { notIn: existingIds } },
          take: 60, orderBy: { createdAt: 'desc' }, select: selectClause as any,
        });
        cars = [...cars, ...more];
      }

      // 3. +/- 2 Years
      if (cars.length < 5) {
        const existingIds: string[] = cars.map((c: any) => String(c.id));
        const more: any[] = await prisma.car.findMany({
          where: { ...baseWhere, year: { in: [spec.year - 2, spec.year + 2] }, id: { notIn: existingIds } },
          take: 60, orderBy: { createdAt: 'desc' }, select: selectClause as any,
        });
        cars = [...cars, ...more];
      }

      const now = new Date().toISOString();
      return cars.map((c: any) => {
        // Sold archive carries actual transacted prices — most trustworthy.
        const sold = c.status === 'SOLD' && c.soldPrice;
        const price = sold ? c.soldPrice as number : c.price;
        const { priceJod, fxRate } = toJod(price, c.currency || 'JOD');
        return {
          source: 'jocars',
          sourceLabel: 'سوق JO Cars',
          externalId: `jo-${c.id}`,
          url: `/cars/${c.slug || c.id}`,
          brand: c.brand?.nameAr || spec.brand,
          brandEn: c.brand?.nameEn || null,
          model: c.model?.nameAr || spec.model,
          modelEn: c.model?.nameEn || null,
          year: c.year,
          trim: normalizeTrim(c.trim),
          kilometers: c.kilometers,
          price,
          currency: c.currency || 'JOD',
          priceJod,
          fxRate,
          city: c.city?.nameAr || null,
          country: 'JO',
          fuelType: c.fuelType,
          transmission: c.transmission,
          drivetrain: c.drivetrain || null,
          horsepower: c.horsepower || null,
          cylinders: c.cylinders || null,
          engineCc: c.engineCapacity || null,
          priceType: sold ? 'sold' : 'asking',
          condition: c.condition,
          specs: Array.isArray(c.features) ? c.features.map(String).slice(0, 20) : [],
          listingDate: c.createdAt ? new Date(c.createdAt).toISOString() : null,
          scrapedAt: now,
        } as NormalizedListing;
      });
    })();
    return await Promise.race([
      q,
      new Promise<NormalizedListing[]>((r) => setTimeout(() => r([]), timeoutMs)),
    ]);
  } catch {
    return [];
  }
}

// ── Registry: All 7 market sources in the Jordanian ecosystem ──
export const SOURCE_ADAPTERS: SourceAdapter[] = [
  { id: 'opensooq', label: 'السوق المفتوح', country: 'JO', enabled: true, collect: collectOpenSooq },
  { id: 'jocars', label: 'سوق JO Cars', country: 'JO', enabled: true, collect: collectJoCars },
  { id: 'ordonauto', label: 'أردن أوتو (وكيل)', country: 'JO', enabled: true, collect: collectOrdonAuto },
  { id: 'karmal', label: 'كارمال الأردن', country: 'JO', enabled: true, collect: collectKarmal },
  { id: 'waseet', label: 'الوسيط الأردن', country: 'JO', enabled: true, collect: collectWaseet },
  { id: 'autohub', label: 'أوتوهاب الأردن', country: 'JO', enabled: true, collect: collectAutohub },
  { id: 'facebook', label: 'فيسبوك ماركت', country: 'JO', enabled: false, collect: collectFacebook },
];

/** Run all adapters with per-source budgets; one failure never stops the rest (spec §21). */
export async function collectAll(
  spec: VehicleSpec,
  perSourceMs = 9000,
): Promise<{
  listings: NormalizedListing[];
  outcomes: SourceOutcome[];
  sourceExecutions: MarketSourceExecution[];
}> {
  const listings: NormalizedListing[] = [];
  const outcomes: SourceOutcome[] = [];
  const sourceExecutions: MarketSourceExecution[] = [];

  const baseQuery = `${spec.brand} ${spec.model} ${spec.year}`.trim();
  const queriesExecuted = [
    baseQuery,
    `${spec.brand} ${spec.model}`,
    spec.trim ? `${spec.brand} ${spec.model} ${spec.trim}` : null,
  ].filter(Boolean) as string[];

  const enabledAdapters = SOURCE_ADAPTERS.filter((a) => a.enabled);
  const disabledAdapters = SOURCE_ADAPTERS.filter((a) => !a.enabled);

  const results = await Promise.allSettled(
    enabledAdapters.map(async (a) => {
      const searchStartedAt = new Date().toISOString();
      const t0 = Date.now();
      try {
        const rows = await a.collect(spec, perSourceMs);
        const searchFinishedAt = new Date().toISOString();
        const durationMs = Date.now() - t0;
        const status: SourceExecutionStatus = rows.length > 0 ? 'SEARCHED' : 'NO_RESULTS';

        return {
          rows,
          execution: {
            sourceId: a.id,
            sourceLabel: a.label,
            searchStartedAt,
            searchFinishedAt,
            durationMs,
            status,
            queriesExecuted,
            rawResults: rows.length,
            validListings: rows.length,
            rejectedListings: 0,
            rejectionReasons: {},
            acceptedComparables: 0,
            error: null,
          } as MarketSourceExecution,
          outcome: {
            id: a.id,
            label: a.label,
            ok: true,
            count: rows.length,
            ms: durationMs,
          } as SourceOutcome,
        };
      } catch (e: any) {
        const searchFinishedAt = new Date().toISOString();
        const durationMs = Date.now() - t0;
        const isTimeout = durationMs >= perSourceMs - 200 || e?.name === 'AbortError' || e?.message?.includes('timeout');
        const status: SourceExecutionStatus = isTimeout ? 'TIMEOUT' : 'FAILED';
        const errorMsg = isTimeout ? 'تجاوزت مهلة الاتصال بالخادم (Timeout)' : (e?.message || 'فشل الاتصال');

        return {
          rows: [],
          execution: {
            sourceId: a.id,
            sourceLabel: a.label,
            searchStartedAt,
            searchFinishedAt,
            durationMs,
            status,
            queriesExecuted,
            rawResults: 0,
            validListings: 0,
            rejectedListings: 0,
            rejectionReasons: {},
            acceptedComparables: 0,
            error: errorMsg,
          } as MarketSourceExecution,
          outcome: {
            id: a.id,
            label: a.label,
            ok: false,
            count: 0,
            ms: durationMs,
            error: errorMsg,
          } as SourceOutcome,
        };
      }
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') {
      listings.push(...r.value.rows);
      outcomes.push(r.value.outcome);
      sourceExecutions.push(r.value.execution);
    }
  }

  for (const a of disabledAdapters) {
    const now = new Date().toISOString();
    const isFb = a.id === 'facebook';
    const status: SourceExecutionStatus = isFb ? 'BLOCKED' : 'DISABLED';
    const errorMsg = isFb
      ? 'مطلوب تسجيل دخول ومحمي بجدار حماية ضد التتبع الآلي (Meta Anti-Bot / Login Required)'
      : 'المصدر معطل في الإعدادات';

    outcomes.push({
      id: a.id,
      label: a.label,
      ok: false,
      count: 0,
      ms: 0,
      error: errorMsg,
    });

    sourceExecutions.push({
      sourceId: a.id,
      sourceLabel: a.label,
      searchStartedAt: now,
      searchFinishedAt: now,
      durationMs: 0,
      status,
      queriesExecuted: isFb ? ['Facebook Marketplace JO Automotive Query'] : [],
      rawResults: 0,
      validListings: 0,
      rejectedListings: 0,
      rejectionReasons: {},
      acceptedComparables: 0,
      error: errorMsg,
    });
  }

  return { listings, outcomes, sourceExecutions };
}
