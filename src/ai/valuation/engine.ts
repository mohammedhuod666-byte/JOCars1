/**
 * Valuation orchestrator (spec §15 pipeline):
 * collect → persist corpus → match tiers → similarity → dedupe →
 * outliers → calibrate → adjust → weight → price → confidence → persist.
 * Numbers come ONLY from here. The LLM only writes the explanation.
 */
import prisma from '@/lib/prisma';
import type { Comparable, DataQualityReport, FunnelStep, NormalizedListing, ValuationOutput, VehicleSpec, ValuationAuditTrace } from './types';
import { roundDisplayPrice } from './types';
import { collectAll, type SourceOutcome } from './sources';
import { assignTier, scoreSimilarity, sameBrand, sameModel, isTargetCopy, matchMatrix, checkListingIdentityConsistency } from './similarity';
import { dedupeExact, dedupeNear, flagOutliers, iqrFences, sanityCheck, detectTargetIdentityCluster } from './outliers';
import { adjustComparable, calibrate } from './adjust';
import { computeWeight, confidenceScore, priceStats, weightedMedian, balancePrimarySecondaryWeights, buildMarketConsensusBand, computeLeaveOneOut } from './price';
import { getTuning } from './tuning';
import { contentHash } from './normalize';

const MODEL_VERSION = 'v1';
// Sold archive + same-city JO sources are most trustworthy.
// Dealer inventory (ordonauto) skews retail-high: slightly down-weighted.
const SOURCE_TRUST: Record<string, number> = { jocars: 1, opensooq: 0.85, ordonauto: 0.75, manual: 0.95 };

export interface EngineResult {
  requestId: string;
  output: ValuationOutput | null;
  comparables: Comparable[];
  outcomes: SourceOutcome[];
  status: 'RELIABLE' | 'LIMITED' | 'APPROXIMATE' | 'INSUFFICIENT' | 'FAILED';
  insufficientReason?: string;
  dataQuality?: DataQualityReport;
  auditTrace?: ValuationAuditTrace;
}

export function buildTargetSnapshot(
  spec: VehicleSpec,
  opts: { carId?: string | null; targetPrice?: number | null },
) {
  const fmt = (v: any) => (v !== null && v !== undefined && v !== '' ? v : 'UNKNOWN');
  return {
    make: fmt(spec.brandEn || spec.brand),
    makeAr: fmt(spec.brand),
    model: fmt(spec.modelEn || spec.model),
    modelAr: fmt(spec.model),
    year: fmt(spec.year),
    trim: fmt(spec.trim),
    engineCc: fmt(spec.engineCapacity),
    horsepower: fmt(spec.horsepower),
    cylinders: fmt(spec.cylinders),
    fuelType: fmt(spec.fuelType),
    transmission: fmt(spec.transmission),
    drivetrain: fmt(spec.drivetrain),
    mileageKm: fmt(spec.kilometers),
    bodyType: fmt(spec.bodyType),
    condition: fmt(spec.condition),
    location: fmt(spec.city),
    color: fmt(spec.color),
    doors: fmt(spec.doors),
    featuresCount: (spec.specs || []).length,
    features: spec.specs || [],
    askingPriceJod: opts.targetPrice ?? spec.askingPrice ?? 'UNKNOWN',
    vin: fmt(spec.vin),
    carId: opts.carId || 'NONE',
    collectedAt: new Date().toISOString(),
  };
}

export function evaluateDataQuality(spec: VehicleSpec): DataQualityReport {
  const currentYear = new Date().getFullYear();
  const checks: DataQualityReport['checks'] = [];

  // Check 1: Brand
  if (spec.brand && String(spec.brand).trim().length > 0) {
    checks.push({ field: 'brand', labelAr: 'الشركة الصانعة', status: 'VALID' });
  } else {
    checks.push({ field: 'brand', labelAr: 'الشركة الصانعة', status: 'INVALID', detail: 'اسم الشركة مفقود' });
  }

  // Check 2: Model
  if (spec.model && String(spec.model).trim().length > 0) {
    checks.push({ field: 'model', labelAr: 'الموديل', status: 'VALID' });
  } else {
    checks.push({ field: 'model', labelAr: 'الموديل', status: 'INVALID', detail: 'اسم الموديل مفقود' });
  }

  // Check 3: Year
  const yr = Number(spec.year);
  if (Number.isInteger(yr) && yr >= 1970 && yr <= currentYear + 1) {
    checks.push({ field: 'year', labelAr: 'سنة الصنع', status: 'VALID' });
  } else {
    checks.push({ field: 'year', labelAr: 'سنة الصنع', status: 'INVALID', detail: `سنة صنع غير صالحة (${spec.year})` });
  }

  // Check 4: Mileage (Kilometers)
  const km = Number(spec.kilometers);
  if (Number.isFinite(km) && km >= 0 && km <= 1500000) {
    checks.push({ field: 'kilometers', labelAr: 'عداد المسافة', status: 'VALID' });
  } else {
    checks.push({ field: 'kilometers', labelAr: 'عداد المسافة', status: 'INVALID', detail: 'عداد المسافة غير صالح أو سالب' });
  }

  // Check 5: Powertrain consistency (electric vs engine specs)
  const fuelNorm = String(spec.fuelType || '').toLowerCase();
  const isElectric = fuelNorm.includes('electric') || fuelNorm === 'ev' || fuelNorm.includes('كهربا');
  if (isElectric && ((spec.engineCapacity && Number(spec.engineCapacity) > 0) || (spec.cylinders && Number(spec.cylinders) > 0))) {
    checks.push({ field: 'powertrain', labelAr: 'تناسق المحرك والوقود', status: 'INVALID', detail: 'سيارة كهربائية ولكن مسجل لها محرك وقود أو سلندرات' });
  } else {
    checks.push({ field: 'powertrain', labelAr: 'تناسق المحرك والوقود', status: spec.fuelType ? 'VALID' : 'MISSING' });
  }

  // Optional specs
  checks.push({ field: 'transmission', labelAr: 'ناقل الحركة', status: spec.transmission ? 'VALID' : 'MISSING' });
  checks.push({ field: 'drivetrain', labelAr: 'نوع الدفع', status: spec.drivetrain ? 'VALID' : 'MISSING' });
  checks.push({ field: 'condition', labelAr: 'حالة المركبة', status: spec.condition ? 'VALID' : 'MISSING' });
  checks.push({ field: 'location', labelAr: 'الموقع/المدينة', status: spec.city ? 'VALID' : 'MISSING' });
  checks.push({ field: 'engineCapacity', labelAr: 'سعة المحرك', status: spec.engineCapacity ? 'VALID' : 'MISSING' });
  checks.push({ field: 'horsepower', labelAr: 'القوة الحصانية', status: spec.horsepower ? 'VALID' : 'MISSING' });

  const invalidCrucial = checks.filter((c) => c.status === 'INVALID');
  const validCount = checks.filter((c) => c.status === 'VALID').length;
  const score = Math.round((validCount / checks.length) * 100);

  return {
    passed: invalidCrucial.length === 0,
    score,
    checks,
  };
}

function stage(pipeline: ValuationOutput['pipeline'], stage: string, stageAr: string, t0: number, detail: string) {
  const s = { stage, stageAr, ms: Date.now() - t0, detail };
  pipeline.push(s);
  try { stageListener?.(s); } catch { /* never break the run */ }
}
let stageListener: ((s: { stage: string; stageAr: string; ms: number; detail: string }) => void) | null = null;
export function setStageListener(fn: typeof stageListener) {
  stageListener = fn;
}

function toDateOrNull(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function persistCorpus(listings: NormalizedListing[]): Promise<number> {
  let saved = 0;
  for (const l of listings) {
    const hash = contentHash([l.source, l.brandEn || l.brand, l.modelEn || l.model, l.year, l.kilometers, l.priceJod, l.city]);
    try {
      await prisma.marketListing.upsert({
        where: { source_externalId: { source: l.source, externalId: l.externalId || hash } },
        update: { lastSeenAt: new Date(), status: 'ACTIVE', price: l.price, priceJod: l.priceJod },
        create: {
          source: l.source, externalId: l.externalId || hash, url: l.url,
          brand: l.brand, brandEn: l.brandEn, model: l.model, modelEn: l.modelEn,
          year: l.year, trim: l.trim, kilometers: l.kilometers,
          price: l.price, currency: l.currency, priceJod: l.priceJod, fxRate: l.fxRate,
          city: l.city, country: l.country, fuelType: l.fuelType,
          transmission: l.transmission, condition: l.condition,
          specs: JSON.stringify(l.specs || []),
          listingDate: toDateOrNull(l.listingDate),
          scrapedAt: new Date(l.scrapedAt), lastSeenAt: new Date(),
          contentHash: hash, status: 'ACTIVE', priceType: l.priceType || 'unknown',
        },
      });
      saved++;
    } catch { /* one bad row never stops the run */ }
  }
  return saved;
}

export async function runValuation(
  spec: VehicleSpec,
  opts: { carId?: string | null; userId?: string | null; targetPrice?: number | null },
  onStage?: (s: { stage: string; stageAr: string; ms: number; detail: string }) => void,
): Promise<EngineResult> {
  const pipeline: ValuationOutput['pipeline'] = [];
  let t0 = Date.now();

  const fullSnapshot = buildTargetSnapshot(spec, opts);
  const dataQuality = evaluateDataQuality(spec);

  const request = await prisma.valuationRequest.create({
    data: {
      carId: opts.carId || null,
      userId: opts.userId || null,
      input: JSON.stringify(spec),
      targetSnapshot: JSON.stringify(fullSnapshot),
      status: 'RUNNING',
    },
  });
  // Progress fan-out for SSE streams.
  setStageListener(onStage || null);

  // Early Data Quality Gate refusal if vital identification data is corrupt/missing
  if (!dataQuality.passed) {
    const invalidDetails = dataQuality.checks
      .filter((c) => c.status === 'INVALID')
      .map((c) => `${c.labelAr}: ${c.detail || 'غير صالح'}`)
      .join(' • ');
    const reason = `فحص جودة البيانات (Data Quality Gate): ${invalidDetails} — تم إيقاف التقييم منعاً للأرقام المضللة.`;
    await prisma.valuationRequest.update({
      where: { id: request.id },
      data: { status: 'INSUFFICIENT', error: reason },
    });
    setStageListener(null);
    return {
      requestId: request.id,
      output: null,
      comparables: [],
      outcomes: [],
      status: 'INSUFFICIENT',
      insufficientReason: reason,
      dataQuality,
    };
  }

  try {
    const tuning = await getTuning();
    const funnel: FunnelStep[] = [];
    // 0) Corpus-first shortcut (§4): fresh same-model archive ≤48h with ≥10
    // rows skips live scraping entirely (2-3s instead of ~25s).
    let listings: NormalizedListing[] = [];
    let outcomes: SourceOutcome[] = [];
    let liveSkipped = false;
    try {
      const freshSince48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const cached = await prisma.marketListing.findMany({
        where: {
          status: 'ACTIVE',
          scrapedAt: { gte: freshSince48h },
          OR: [
            { AND: [{ brandEn: { equals: spec.brandEn || spec.brand } }, { modelEn: { equals: spec.modelEn || spec.model } }] },
            { AND: [{ brand: { contains: spec.brand } }, { model: { contains: spec.model } }] },
          ],
        },
        take: 120,
        orderBy: { scrapedAt: 'desc' },
      });
      if (cached.length >= 10) {
        liveSkipped = true;
        const SRC_LABEL: Record<string, string> = {
          opensooq: 'السوق المفتوح', jocars: 'سوق JO Cars',
          ordonauto: 'أردن أوتو (وكيل)', manual: 'يدوي موثق', corpus: 'الأرشيف',
        };
        for (const s of cached) {
          let specs: string[] = [];
          try { specs = JSON.parse(s.specs || '[]'); } catch { specs = []; }
          listings.push({
            source: s.source, sourceLabel: SRC_LABEL[s.source] || s.source,
            externalId: s.externalId, url: s.url,
            brand: s.brand, brandEn: s.brandEn, model: s.model, modelEn: s.modelEn,
            year: s.year, trim: s.trim, kilometers: s.kilometers,
            price: s.price, currency: s.currency, priceJod: s.priceJod, fxRate: s.fxRate,
            city: s.city, country: s.country, fuelType: s.fuelType,
            transmission: s.transmission, condition: s.condition, specs,
            drivetrain: (s as any).drivetrain || null,
            horsepower: (s as any).horsepower || null,
            priceType: ((s as any).priceType === 'sold' ? 'sold' : 'asking'),
            listingDate: s.listingDate ? new Date(s.listingDate).toISOString() : null,
            scrapedAt: new Date(s.scrapedAt).toISOString(),
          });
        }
        outcomes.push({ id: 'corpus', label: 'أرشيف السوق (سريع)', ok: true, count: listings.length, ms: 0 });
        funnel.push({
          stage: 'collect', stageAr: 'الجمع', before: 0, after: listings.length, rejected: 0,
          notes: [`مسار سريع: ${listings.length} إعلان طازج (≤48h) من الأرشيف — تخطي الكشط الحي`],
        });
      }
    } catch { /* fall through to live collection */ }
    if (!liveSkipped) {
      // 1) Collect live (spec §1, §21) + merge fresh stored corpus (spec §6,
      // §19: no re-scraping when recent market data already exists).
      const live = await collectAll(spec);
      listings = live.listings;
      outcomes = live.outcomes;
    }
    const missingFields = (['trim', 'fuelType', 'transmission', 'drivetrain', 'condition', 'city', 'engineCapacity'] as const)
      .filter((k) => !(spec as any)[k]);
    const provenance: Record<string, 'USER_PROVIDED' | 'UNKNOWN'> = {};
    for (const k of ['brand', 'model', 'year', 'trim', 'kilometers', 'fuelType', 'transmission', 'drivetrain', 'condition', 'city', 'engineCapacity', 'horsepower', 'cylinders'] as const) {
      provenance[k] = (spec as any)[k] ? 'USER_PROVIDED' : 'UNKNOWN';
    }
    const profile = { spec, missingFields: [...missingFields], provenance };
    if (!liveSkipped) {
      funnel.push({
        stage: 'collect', stageAr: 'الجمع', before: 0, after: listings.length, rejected: 0,
        notes: outcomes.map((o) => `${o.label}: ${o.ok ? o.count : 'فشل (' + (o.error || '') + ')'}`),
      });
    }
    try {
      const freshSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const stored = await prisma.marketListing.findMany({
        where: {
          status: 'ACTIVE',
          scrapedAt: { gte: freshSince },
          OR: [
            { brandEn: { equals: spec.brandEn || spec.brand } },
            { brand: { contains: spec.brand } },
          ],
        },
        take: 120,
        orderBy: { scrapedAt: 'desc' },
      });
      let merged = 0;
      const liveKeys = new Set(listings.map((l) => `${l.source}|${l.externalId}`));
      for (const s of stored) {
        if (liveKeys.has(`${s.source}|${s.externalId}`)) continue;
        let specs: string[] = [];
        try { specs = JSON.parse(s.specs || '[]'); } catch { specs = []; }
        listings.push({
          source: s.source, sourceLabel: s.source,
          externalId: s.externalId, url: s.url,
          brand: s.brand, brandEn: s.brandEn, model: s.model, modelEn: s.modelEn,
          year: s.year, trim: s.trim, kilometers: s.kilometers,
          price: s.price, currency: s.currency, priceJod: s.priceJod, fxRate: s.fxRate,
          city: s.city, country: s.country, fuelType: s.fuelType,
          transmission: s.transmission, condition: s.condition, specs,
          drivetrain: (s as any).drivetrain || null,
          horsepower: (s as any).horsepower || null,
          priceType: ((s as any).priceType === 'sold' ? 'sold' : 'asking'),
          listingDate: s.listingDate ? new Date(s.listingDate).toISOString() : null,
          scrapedAt: new Date(s.scrapedAt).toISOString(),
        });
        merged++;
      }
      if (merged > 0) {
        outcomes.push({ id: 'corpus', label: 'أرشيف السوق المخزن', ok: true, count: merged, ms: 0 });
      }
      funnel.push({
        stage: 'corpus', stageAr: 'دمج الأرشيف', before: listings.length - merged, after: listings.length, rejected: 0,
        notes: [`أضيف ${merged} من أرشيف آخر 7 أيام (بدون تكرار الحي)`],
      });
    } catch { /* corpus merge is best-effort */ }
    stage(pipeline, 'collect', 'جمع البيانات', t0, `${listings.length} إعلان من ${outcomes.filter((o) => o.ok).length}/${outcomes.length} مصادر`);
    t0 = Date.now();

    // Persist corpus (spec §6) — best effort, never blocks.
    const archived = await persistCorpus(listings).catch(() => 0);
    stage(pipeline, 'persist', 'حفظ السوق', t0, `أرشفة ${archived}/${listings.length} إعلان بقاعدة بيانات السوق`);
    t0 = Date.now();

    // 1b) Unified Target Identity Cluster (Requirement §1 & §8)
    // All cross-portal clones, DB copies, and mirror ads representing the target
    // vehicle are gathered into a single cluster and excluded from candidates completely.
    const { cluster: targetCluster, cleanListings: targetFilteredListings } = detectTargetIdentityCluster(listings, {
      carId: opts.carId || null,
      spec,
      askingPrice: opts.targetPrice ?? null,
    });
    const leaked = targetCluster.listings.map((l) => `${l.source}:${l.title} ${l.price} JOD (${l.reason})`);
    const pool = targetFilteredListings;
    funnel.push({
      stage: 'leakage', stageAr: 'عنقود الهدف الموحد', before: listings.length, after: pool.length,
      rejected: targetCluster.totalClusterCount,
      notes: targetCluster.totalClusterCount > 0
        ? [`TARGET_IDENTITY_CLUSTER: تم اكتشاف وعزل ${targetCluster.totalClusterCount} إعلانات مطابقة للهدف عبر (${targetCluster.sourcesInCluster.join(', ')})`, ...leaked.slice(0, 5)]
        : ['لا يوجد تطابق مع إعلانات السيارة المستهدفة في السوق'],
    });

    // 1c) Price sanity gate BEFORE matching/adjustment: untrustworthy raw
    // prices are quarantined, never laundered through adjustments.
    const { clean: sanePool, excluded: sanityOut } = sanityCheck(pool);
    const sanityGroups: Record<string, number> = {};
    for (const e of sanityOut) sanityGroups[e.reason] = (sanityGroups[e.reason] || 0) + 1;
    funnel.push({
      stage: 'sanity', stageAr: 'سلامة الأسعار', before: pool.length, after: sanePool.length,
      rejected: sanityOut.length,
      notes: sanityOut.length > 0
        ? [...Object.entries(sanityGroups).map(([k, n]) => `${k}: ${n}`),
           ...sanityOut.slice(0, 4).map((e) => `${e.listing.source} ${e.listing.priceJod} (${e.reasonAr.slice(0, 60)})`)]
        : ['كل الأسعار سليمة'],
    });

    // 1d) Identity Consistency Gate: Quarantine contradictory models (e.g. BMW 520 F10 for an X5)
    const identityConflictExclusions: { title: string; source: string; reason: string }[] = [];
    const nonConflictedPool = sanePool.filter((l) => {
      const idCheck = checkListingIdentityConsistency(l, spec);
      if (!idCheck.consistent) {
        identityConflictExclusions.push({
          title: (l as any).title || `${l.brand} ${l.model} ${l.year || ''}`,
          source: l.source,
          reason: idCheck.reason || 'تناقض في هوية وموديل المركبة (IDENTITY_CONFLICT)',
        });
        return false;
      }
      return true;
    });

    funnel.push({
      stage: 'identity-consistency', stageAr: 'فحص هوية الموديل', before: sanePool.length, after: nonConflictedPool.length,
      rejected: identityConflictExclusions.length,
      notes: identityConflictExclusions.length > 0
        ? identityConflictExclusions.slice(0, 5).map((e) => `${e.source}: ${e.title} -> ${e.reason}`)
        : ['كل الإعلانات متطابقة الهوية مع الموديل المستهدف'],
    });

    // From here on, matching works on the nonConflictedPool only.
    const matchPool = nonConflictedPool;

    // 2) Tiered matching, hierarchical (spec §2): first pass tiers 1-2 to
    // decide whether ±2 and tier-4 admission are needed — never binary-drop
    // on specs, only on brand/model/year-window.
    // Funnel includes per-factor match stats so "where did rows go" is exact.
    const fcount = (fn: (l: NormalizedListing) => boolean) => matchPool.filter(fn).length;
    const normEq = (a?: string | null, b?: string | null) => {
      if (!a || !b) return null;
      const na = a.toLowerCase().trim(); const nb = b.toLowerCase().trim();
      return na === nb || na.includes(nb) || nb.includes(na);
    };
    const factorStats: Record<string, number> = {
      brand: fcount((l) => sameBrand(l, spec)),
      model: fcount((l) => sameModel(l, spec)),
      yearWindow: fcount((l) => l.year === null || l.year === undefined || Math.abs(l.year - spec.year) <= 2),
      trim: fcount((l) => normEq(l.trim, spec.trim) !== false),
      fuel: fcount((l) => normEq(l.fuelType, spec.fuelType) !== false),
      transmission: fcount((l) => normEq(l.transmission, spec.transmission) !== false),
      kmPresent: fcount((l) => !!l.kilometers),
      conditionPresent: fcount((l) => !!l.condition),
    };
    funnel.push({
      stage: 'factors', stageAr: 'مطابقة العوامل', before: listings.length, after: listings.length, rejected: 0,
      notes: [
        `ماركة: ${factorStats.brand}/${listings.length}`, `موديل: ${factorStats.model}/${listings.length}`,
        `سنة ±2: ${factorStats.yearWindow}/${listings.length}`, `فئة: ${factorStats.trim}/${listings.length}`,
        `وقود: ${factorStats.fuel}/${listings.length}`, `جير: ${factorStats.transmission}/${listings.length}`,
        `ممشى موجود: ${factorStats.kmPresent}/${listings.length}`, `حالة موجودة: ${factorStats.conditionPresent}/${listings.length}`,
      ],
    });
    const admitMore = (
      label: string,
      ctx: { allowPlus2: boolean; allowTier4: boolean; allowAnyYear: boolean },
    ) => {
      let added = 0;
      for (const l of matchPool) {
        const tier = assignTier(l, spec, ctx);
        if (tier === 0) continue;
        const dupe = tiered.some((c) =>
          (c.externalId && c.externalId === (l as any).externalId) ||
          (c.url && c.url === (l as any).url && c.priceJod === (l as any).priceJod));
        if (!dupe) {
          tiered.push(scoreSimilarity(l, spec, tier, tuning.simWeights));
          added++;
        }
      }
      return added;
    };
    const first: Comparable[] = [];
    for (const l of matchPool) {
      const tier = assignTier(l, spec, { allowPlus2: false, allowTier4: false });
      if (tier === 0) continue;
      first.push(scoreSimilarity(l, spec, tier, tuning.simWeights));
    }
    // Expansion ladder: keep widening ONLY while quality comps < 5, and stop
    // the moment data is truly exhausted. Every stage is funnel-logged.
    // Note: NEVER expand to different models of the same brand!
    let tiered = [...first];
    const expansionLog: string[] = [`أساسي 1-2 و±1: ${tiered.length}`];
    if (tiered.filter((c) => c.tier <= 2).length < 5) {
      const n = admitMore('wide', { allowPlus2: true, allowTier4: true, allowAnyYear: false });
      expansionLog.push(`توسيع ±2 وقريب: +${n}`);
    }
    if (tiered.length < 5) {
      const n = admitMore('anyyear', { allowPlus2: true, allowTier4: true, allowAnyYear: true });
      expansionLog.push(`توسيع نفس الموديل أي سنة (T4): +${n}`);
    }
    const counts = [1, 2, 3, 4].map((t) => tiered.filter((c) => c.tier === t).length);
    // Expansion overflow guard: tier-4 is scaffolding, not foundation —
    // keep the 6 most similar, drop the rest so distant rows can never
    // outnumber (and hijack the median of) the core comps.
    let t4dropped = 0;
    const t4rows = tiered.filter((c) => c.tier === 4).sort((a, b) => b.similarity - a.similarity);
    if (t4rows.length > 6) {
      const keep = new Set(t4rows.slice(0, 6));
      for (let i = tiered.length - 1; i >= 0; i--) {
        if (tiered[i].tier === 4 && !keep.has(tiered[i])) {
          tiered[i].included = false;
          tiered[i].excludeReason = 'توسيع زائد: مستوى 4 أبعد من الستة الأقرب';
          t4dropped++;
        }
      }
    }
    const matched = tiered;
    funnel.push({
      stage: 'match', stageAr: 'المطابقة المتدرجة', before: listings.length, after: matched.length,
      rejected: listings.length - matched.length,
      notes: [`مستويات 1:${counts[0]} 2:${counts[1]} 3:${counts[2]} 4:${counts[3]}${t4dropped > 0 ? ` (أُسقط ${t4dropped} توسع زائد)` : ''}`, ...expansionLog, `خارج النافذة/الماركة: ${listings.length - matched.length}`],
    });
    stage(pipeline, 'match', 'المطابقة المتدرجة', t0, `${matched.length} مرشح (مستوى 1:${counts[0]} 2:${counts[1]} 3:${counts[2]} 4:${counts[3]}) من ${listings.length}`);
    t0 = Date.now();

    // 3) Dedupe + outliers (spec §4, §8).
    dedupeExact(matched);
    dedupeNear(matched);
    const candPrices = matched.filter((c) => c.included).map((c) => c.priceJod);
    const fences = iqrFences(candPrices.length > 0 ? candPrices : [0]);
    flagOutliers(matched, fences, tuning.staleDays);
    // Stale readmission: when fresh data is thin, old rows re-enter as tier 4
    // (freshness curve already discounts them) instead of vanishing.
    let included = matched.filter((c) => c.included);
    if (included.length < 5) {
      let revived = 0;
      for (const c of matched) {
        if (c.included || !c.excludeReason || !c.excludeReason.includes('قديم')) continue;
        c.included = true;
        c.tier = 4;
        c.excludeReason = null;
        (c as any).revivedStale = true;
        revived++;
      }
      if (revived > 0) {
        funnel.push({
          stage: 'expand-stale', stageAr: 'إحياء القديم', before: included.length, after: included.length + revived,
          rejected: 0, notes: [`أُعيد ${revived} إعلاناً قديماً كمستوى 4 مع خصم الحداثة`],
        });
        included = matched.filter((c) => c.included);
      }
    }
    const rejected = matched.length - included.length;
    const rejReasons: Record<string, number> = {};
    for (const c of matched) {
      if (c.included || !c.excludeReason) continue;
      const k = c.excludeReason.includes('مكرر') || c.excludeReason.includes('موقع آخر') ? 'تكرار'
        : c.excludeReason.includes('شاذ') ? 'شواذ'
        : c.excludeReason.includes('قديم') ? 'قدم'
        : 'نقص بيانات';
      rejReasons[k] = (rejReasons[k] || 0) + 1;
    }
    funnel.push({
      stage: 'clean', stageAr: 'التنظيف', before: matched.length, after: included.length, rejected,
      notes: Object.entries(rejReasons).map(([k, n]) => `${k}: ${n}`),
    });
    stage(pipeline, 'clean', 'التنظيف', t0, `مقبول ${included.length} / مستبعد ${rejected} (تكرار/شواذ/قدم/نقص)`);
    t0 = Date.now();

    const found = matched.length;
    // Graduated outcomes (never binary-refuse above 1), with a quality gate:
    // count alone never earns RELIABLE — exact-tier or high-sim share must agree.
    const preHi = included.filter((c) => c.similarity >= 80).length;
    const preT1 = included.filter((c) => c.tier === 1).length;
    const grade: 'approximate' | 'limited' | 'full' =
      included.length >= 7 && (preT1 / included.length >= 0.25 || preHi / included.length >= 0.4) ? 'full'
      : included.length >= 4 ? 'limited'
      : 'approximate';

    // Persist comparables (accepted + rejected with reasons, spec §14).
    const listingIdByHash = new Map<string, string>();
    try {
      const hashes = matched.map((c) => contentHash([c.source, c.brandEn || c.brand, c.modelEn || c.model, c.year, c.kilometers, c.priceJod, c.city]));
      const rows = await prisma.marketListing.findMany({
        where: { contentHash: { in: hashes } },
        select: { id: true, contentHash: true },
      });
      for (const r of rows) if (r.contentHash) listingIdByHash.set(r.contentHash, r.id);
    } catch { /* best effort */ }
    for (const c of matched) {
      const h = contentHash([c.source, c.brandEn || c.brand, c.modelEn || c.model, c.year, c.kilometers, c.priceJod, c.city]);
      try {
        await prisma.valuationComparable.create({
          data: {
            requestId: request.id,
            listingId: listingIdByHash.get(h) || null,
            snapshot: JSON.stringify({ ...c, adjustments: [], weight: 0 }),
            tier: c.tier, similarity: c.similarity,
            simBreakdown: JSON.stringify(c.simBreakdown),
            included: c.included,
            excludeReason: c.excludeReason || null,
          },
        });
      } catch { /* best effort */ }
    }

    if (included.length < Math.max(2, tuning.minIncluded)) {
      const reason = `البيانات المتاحة غير كافية لإعطاء تقييم موثوق — وجدنا ${found} مرشحاً فقط، ولا يمكن الاختلاق.`;
      await prisma.valuationRequest.update({
        where: { id: request.id },
        data: { status: 'INSUFFICIENT', error: reason },
      });
      setStageListener(null);
      return { requestId: request.id, output: null, comparables: matched, outcomes,
        status: 'INSUFFICIENT', insufficientReason: reason };
    }

    // 4) Calibrate + adjust (spec §6, §7).
    const cal = calibrate(included);
    const adjusted = included.map((c) => adjustComparable(c, spec, cal));
    for (const c of adjusted) {
      c.weight = computeWeight(c, SOURCE_TRUST);
      (c as any).rawWeight = c.weight;
      (c as any).isPrimary = (c.tier === 1 || c.tier === 2) && c.yearDiff === 0;
    }

    // Balance primary and secondary sets (Requirement §2):
    // Primary set controls >= 85% of total weight when present.
    balancePrimarySecondaryWeights(adjusted);

    const primaryComparables = adjusted.filter((c) => (c.tier === 1 || c.tier === 2) && c.yearDiff === 0);
    const secondaryComparables = adjusted.filter((c) => !((c.tier === 1 || c.tier === 2) && c.yearDiff === 0));
    const hasPrimaryEvidence = primaryComparables.length > 0;

    stage(pipeline, 'adjust', 'التعديلات', t0, `معايرة ${cal.calibrated ? 'من السوق' : 'افتراضية'}: سنة ${cal.perYearJod} / 10k كم ${cal.per10kKmJod} (أساسي: ${primaryComparables.length} / ثانوي: ${secondaryComparables.length})`);
    t0 = Date.now();

    // 5) Price (spec §5): weighted median leads.
    const stats = priceStats(adjusted, opts.targetPrice);
    const estimated = stats.weightedMedian;
    const spread = Math.max(Math.round(stats.iqr / 2), Math.round(estimated * 0.03));
    const minPrice = Math.max(100, estimated - spread);
    const maxPrice = estimated + spread;
    stage(pipeline, 'price', 'التسعير', t0, `وسيط مرجح ${estimated.toLocaleString()} (متوسط مرجح ${stats.weightedAvg.toLocaleString()}، وسيط ${stats.median.toLocaleString()})`);
    t0 = Date.now();

    // 5b) Market Consensus Band & Leave-One-Out Analysis (Requirement §4)
    const consensusBand = buildMarketConsensusBand(hasPrimaryEvidence ? primaryComparables : adjusted);
    const leaveOneOutAnalysis = computeLeaveOneOut(adjusted, estimated);

    // 6) Confidence (spec §11): count AND match quality, never count alone.
    const n = adjusted.length;
    const hi = adjusted.filter((c) => c.similarity >= 80).length;
    const fresh = adjusted.filter((c) => c.ageDays <= 30).length;
    const srcUsed = new Set(adjusted.map((c) => c.source)).size;
    const spreadRatio = stats.median > 0 ? stats.iqr / stats.median : 1;
    const specComplete = !!(spec.year && spec.kilometers && spec.fuelType && spec.transmission);
    const share = (fn: (c: (typeof adjusted)[number]) => boolean) => (n > 0 ? adjusted.filter(fn).length / n : 0);
    const conf = confidenceScore({
      used: n, found, sourcesUsed: srcUsed, highSim: hi,
      spreadRatio, freshShare: n ? fresh / n : 0, specComplete,
      yearMatchShare: share((c) => c.yearDiff === 0),
      trimMatchShare: share((c) => !spec.trim || !c.trim || c.trim.toLowerCase() === spec.trim.toLowerCase()),
      engineMatchShare: share((c) =>
        (!spec.fuelType || !c.fuelType || c.fuelType.toLowerCase() === spec.fuelType.toLowerCase()) &&
        (!spec.transmission || !c.transmission || c.transmission.toLowerCase() === spec.transmission.toLowerCase())),
      tier1Share: share((c) => c.tier === 1),
      excludedShare: found > 0 ? (found - n) / found : 0,
    });

    // Check if Tier 4 is trying to dictate FMV alone without primary comps (Requirement §2):
    if (!hasPrimaryEvidence) {
      // Tier 4 is supporting evidence only, cannot produce high confidence alone
      conf.score = Math.min(conf.score, 30);
      conf.label = 'منخفض';
      conf.reasons.unshift('غياب مقارنات من نفس سنة الصنع — الاعتماد فقط على شواهد داعمة (Tier 4)');
    } else if (grade === 'approximate') {
      conf.score = Math.min(conf.score, 35);
      conf.label = 'منخفض';
      conf.reasons.unshift('تقدير تقريبي جداً (2-3 مقارنات) — استرشد به بحذر');
    } else if (grade === 'limited') {
      conf.score = Math.min(conf.score, 60);
      if (conf.score < 50) conf.label = 'منخفض'; else conf.label = 'متوسط';
      conf.reasons.unshift('تقييم محدود (4-6 مقارنات)');
    }
    const factors = [
      { factor: 'السنة', impact: 'high' as const },
      { factor: 'الكيلومترات', impact: 'high' as const },
      { factor: 'الفئة', impact: 'medium' as const },
      { factor: 'المواصفات', impact: 'medium' as const },
      { factor: 'الموقع', impact: 'low' as const },
    ];
    stage(pipeline, 'confidence', 'الثقة', t0, `${conf.score}% (${conf.label}) من ${conf.reasons.length} مؤشرات قابلة للقياس`);
    t0 = Date.now();

    const roundedDisplayPrice = roundDisplayPrice(estimated, conf.score);

    // Sensitivity Analysis: Leave-One-Out (Comparable Removal Test)
    const removals: ValuationAuditTrace['sensitivity']['removals'] = leaveOneOutAnalysis.map((loo, idx) => ({
      index: idx + 1,
      title: loo.comparableTitle,
      fmvWithout: loo.fmvWithout,
      delta: loo.absoluteShift,
      deltaPct: loo.percentShift,
    }));

    const yearDistribution: Record<string, number> = {};
    for (const l of listings) {
      const yrKey = l.year ? String(l.year) : 'UNKNOWN';
      yearDistribution[yrKey] = (yearDistribution[yrKey] || 0) + 1;
    }

    const sources = [...new Map(adjusted.map((c) => [c.source, c.sourceLabel])).entries()]
      .map(([source, label]) => ({ source, label, count: adjusted.filter((c) => c.source === source).length }));
    const dataVersion = new Date(Math.max(...adjusted.map((c) => new Date(c.scrapedAt).getTime()))).toISOString();
    const targetDiffPct = opts.targetPrice && opts.targetPrice > 0
      ? Math.round(((opts.targetPrice - estimated) / estimated) * 1000) / 10
      : null;

    // Attach matchMatrix to all adjusted comps
    for (const c of adjusted) {
      c.matrix = matchMatrix(spec, c);
    }

    const auditTrace: ValuationAuditTrace = {
      targetSnapshot: fullSnapshot,
      dataQuality,
      targetCluster,
      identityConflictExclusions,
      marketSearchResults: {
        total: listings.length,
        sources: outcomes.map((o) => ({ source: o.label, count: o.count })),
      },
      yearDistribution,
      targetExclusions: leaked,
      suspiciousPriceExclusions: sanityOut.map((e) => ({
        title: `${e.listing.brand} ${e.listing.model} ${e.listing.year || ''}`.trim(),
        price: e.listing.priceJod,
        reason: `${e.reason}: ${e.reasonAr}`,
      })),
      duplicateExclusions: matched
        .filter((c) => !c.included && c.excludeReason && (c.excludeReason.includes('مكرر') || c.excludeReason.includes('موقع آخر')))
        .map((c) => `${c.brand} ${c.model} (${c.priceJod} JD): ${c.excludeReason}`),
      tierAssignments: {
        tier1: matched.filter((c) => c.tier === 1).length,
        tier2: matched.filter((c) => c.tier === 2).length,
        tier3: matched.filter((c) => c.tier === 3).length,
        tier4: matched.filter((c) => c.tier === 4).length,
      },
      primaryComparablesCount: primaryComparables.length,
      secondaryComparablesCount: secondaryComparables.length,
      consensusBand,
      leaveOneOutAnalysis,
      effectiveComparableWeight: Math.round(adjusted.reduce((acc, c) => acc + c.weight, 0) * 1000) / 1000,
      comparablesAudit: matched.map((c) => ({
        source: c.sourceLabel,
        sourceUrl: c.url,
        listingId: c.externalId,
        year: c.year,
        make: c.brandEn || c.brand,
        model: c.modelEn || c.model,
        trim: c.trim,
        engine: (c as any).engineCc ? `${(c as any).engineCc} CC` : null,
        engineCc: (c as any).engineCc,
        horsepower: (c as any).horsepower,
        cylinders: (c as any).cylinders,
        fuel: c.fuelType,
        transmission: c.transmission,
        drivetrain: (c as any).drivetrain,
        mileage: c.kilometers,
        body: (c as any).bodyType,
        condition: c.condition,
        location: c.city,
        color: (c as any).color,
        doors: (c as any).doors,
        features: c.specs,
        rawPrice: c.priceJod,
        normalizedPrice: c.adjustedPrice ?? c.priceJod,
        tier: c.tier,
        tierLabel: c.tier === 1 ? 'أساسي (Tier 1 - تطابق فئة وسنة)' :
                   c.tier === 2 ? 'أساسي (Tier 2 - نفس السنة وموديل)' :
                   c.tier === 3 ? 'ثانوي (Tier 3 - نفس الموديل ±1 سنة)' :
                   'داعم (Tier 4 - نفس الموديل بسنوات أبعد)',
        identityStatus: 'ELIGIBLE_SAME_MODEL',
        isPrimary: (c.tier === 1 || c.tier === 2) && c.yearDiff === 0,
        similarity: c.similarity,
        simBreakdown: c.simBreakdown,
        rawWeight: (c as any).rawWeight ?? c.weight,
        finalWeight: Math.round(c.weight * 1000) / 1000,
        priceAdjustments: c.adjustments,
        included: c.included,
        excludeReason: c.excludeReason,
        matchMatrix: matchMatrix(spec, c),
      })),
      rawWeightsSum: Math.round(adjusted.reduce((acc, c) => acc + ((c as any).rawWeight ?? c.weight), 0) * 1000) / 1000,
      finalWeightsSum: Math.round(adjusted.reduce((acc, c) => acc + c.weight, 0) * 1000) / 1000,
      robustStatistic: stats,
      finalFmv: estimated,
      displayFmv: roundedDisplayPrice,
      confidence: conf.score,
      status: grade,
      sensitivity: {
        baselineFmv: estimated,
        removals,
      },
    };

    const output: ValuationOutput = {
      estimatedPrice: estimated, minPrice, maxPrice, grade, funnel, profile,
      dataQuality,
      priceBasis: {
        sold: adjusted.filter((c) => c.priceType === 'sold').length,
        asking: adjusted.filter((c) => c.priceType !== 'sold').length,
      },
      confidence: conf.score, confidenceLabel: conf.label, confidenceReasons: conf.reasons,
      comparablesUsed: adjusted.length, comparablesFound: found,
      sourcesUsed: srcUsed, sources,
      method: 'weighted-median',
      stats, factors, pipeline,
      modelVersion: 'v1', dataVersion, targetDiffPct,
      roundedDisplayPrice,
      auditTrace,
    };

    // Persist result + update comparables with final numbers (spec §13, §15).
    const saved = await prisma.valuationResult.create({
      data: {
        requestId: request.id,
        estimatedPrice: estimated, minPrice, maxPrice,
        confidence: conf.score, confidenceLabel: conf.label,
        confidenceReasons: JSON.stringify(conf.reasons),
        comparablesUsed: adjusted.length, comparablesFound: found,
        sourcesUsed: srcUsed, sources: JSON.stringify(sources),
        method: 'weighted-median', stats: JSON.stringify(stats),
        factors: JSON.stringify(factors), pipeline: JSON.stringify(pipeline),
        funnel: JSON.stringify(funnel),
        modelVersion: 'v1', dataVersion, grade,
        targetPrice: opts.targetPrice || null, targetDiffPct,
      },
    });
    void saved;

    // Sync fairPriceEstimate to the Car model (spec §13)
    if (opts.carId && estimated > 0) {
      await prisma.car.update({
        where: { id: opts.carId },
        data: { fairPriceEstimate: estimated },
      }).catch(() => {});
    }

    // Attach final adjusted prices/weights to stored comparables (best effort).
    try {
      const stored = await prisma.valuationComparable.findMany({ where: { requestId: request.id }, select: { id: true, snapshot: true } });
      for (const s of stored) {
        const snap = JSON.parse(s.snapshot);
        const live = adjusted.find((c) =>
          (c.externalId && snap.externalId === c.externalId) ||
          (c.url && snap.url === c.url && c.priceJod === snap.priceJod));
        if (live) {
          await prisma.valuationComparable.update({
            where: { id: s.id },
            data: {
              snapshot: JSON.stringify({ ...live, adjustments: [], weight: 0, matrix: matchMatrix(spec, live) }),
              adjustedPrice: live.adjustedPrice, adjustments: JSON.stringify(live.adjustments),
              weight: Math.round(live.weight * 1000) / 1000,
            },
          });
        }
      }
    } catch { /* best effort */ }

    // Graduated status mirrors the grade: DONE never means "reliable" on its own.
    const finalStatus = output.grade === 'full' ? 'RELIABLE' : output.grade === 'limited' ? 'LIMITED' : 'APPROXIMATE';
    await prisma.valuationRequest.update({ where: { id: request.id }, data: { status: finalStatus } }).catch(() => {});
    setStageListener(null);
    return { requestId: request.id, output, comparables: adjusted, outcomes, status: finalStatus, dataQuality, auditTrace };
  } catch (e: any) {
    await prisma.valuationRequest.update({
      where: { id: request.id },
      data: { status: 'FAILED', error: e?.message || 'فشل التحليل' },
    }).catch(() => {});
    setStageListener(null);
    return { requestId: request.id, output: null, comparables: [], outcomes: [], status: 'FAILED', insufficientReason: 'فشل التحليل' };
  }
}

/** Latest successful result for a car (cached display, spec §13). */
export async function latestResultForCar(carId: string) {
  const req = await prisma.valuationRequest.findFirst({
    where: { carId, status: { in: ['RELIABLE', 'LIMITED', 'APPROXIMATE'] } },
    orderBy: { createdAt: 'desc' },
    include: {
      result: true,
      comparables: {
        where: { included: true },
        take: 12,
        orderBy: { similarity: 'desc' },
      },
    },
  });
  if (!req?.result) return null;

  const comps = (req.comparables || []).map((c) => {
    let snap: any = {};
    try { snap = JSON.parse(c.snapshot); } catch {}
    let adjs: any[] = [];
    try { adjs = JSON.parse(c.adjustments || '[]'); } catch {}
    return {
      source: snap.source || 'jocars',
      sourceLabel: snap.sourceLabel || snap.source || 'سوق JO Cars',
      url: snap.url,
      title: `${snap.brand || ''} ${snap.model || ''} ${snap.year ?? ''}`.trim(),
      year: snap.year,
      kilometers: snap.kilometers,
      price: snap.priceJod || snap.price,
      adjustedPrice: c.adjustedPrice,
      similarity: c.similarity,
      tier: c.tier,
      yearDiff: snap.yearDiff,
      weight: c.weight,
      adjustments: adjs,
      ageDays: snap.ageDays,
      matrix: snap.matrix || [],
    };
  });

  return {
    ...req.result,
    comparables: comps,
  };
}

/** Price history for the graph (spec §15): all DONE results for a car. */
export async function historyForCar(carId: string) {
  const reqs = await prisma.valuationRequest.findMany({
    where: { carId, status: { in: ['RELIABLE', 'LIMITED', 'APPROXIMATE'] } },
    orderBy: { createdAt: 'asc' },
    include: { result: true },
    take: 50,
  });
  return reqs.filter((r) => r.result).map((r) => ({
    at: r.createdAt,
    estimated: r.result!.estimatedPrice,
    min: r.result!.minPrice,
    max: r.result!.maxPrice,
    confidence: r.result!.confidence,
  }));
}
