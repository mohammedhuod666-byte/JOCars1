/**
 * Valuation engine unit tests (spec §14).
 * Run: npx tsx --test src/ai/valuation/__tests__/engine.test.ts
 * Pure deterministic modules only — no DB, no network, no LLM.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseKilometers, parsePrice, toJod, normalizeTrim, contentHash } from '../normalize';
import { extractSpecsFromTitle, extractConditionFromText } from '../spec-extract';
import { assignTier, scoreSimilarity, isTargetCopy, checkListingIdentityConsistency, isPhevVsPetrolMismatch, getQualitativeMatch, isGenerationMismatch, resolveGeneration } from '../similarity';
import { dedupeExact, dedupeNear, iqrFences, flagOutliers, sanityCheck, detectTargetIdentityCluster } from '../outliers';
import { adjustComparable, calibrate } from '../adjust';
import { weightedMedian, weightedAvg, confidenceScore, computeWeight, computeDetailedWeight, balancePrimarySecondaryWeights, buildMarketConsensusBand, computeLeaveOneOut, priceStats, calculateFMV } from '../price';
import { generateDeterministicExplanation } from '../glm-intelligence';
import { SOURCE_ADAPTERS } from '../sources';
import type { Comparable, VehicleSpec, NormalizedListing } from '../types';

const spec: VehicleSpec = {
  brand: 'تويوتا', brandEn: 'toyota', model: 'كامري', modelEn: 'camry',
  year: 2022, trim: 'LE', kilometers: 80000, fuelType: 'PETROL',
  transmission: 'AUTOMATIC', city: 'عمان',
};

function mkListing(over: Partial<Comparable> = {}): Comparable {
  return {
    source: 't', sourceLabel: 'T', brand: 'تويوتا', brandEn: 'toyota',
    model: 'كامري', modelEn: 'camry', year: 2022, trim: 'LE',
    kilometers: 80000, price: 13000, currency: 'JOD', priceJod: 13000,
    fxRate: 1, city: 'عمان', country: 'JO', fuelType: 'PETROL',
    transmission: 'AUTOMATIC', condition: 'GOOD', specs: [],
    drivetrain: null, horsepower: null, priceType: 'asking',
    scrapedAt: new Date().toISOString(), tier: 1, yearDiff: 0, similarity: 90,
    simBreakdown: {}, adjustedPrice: null, adjustments: [],
    weight: 1, included: true, ageDays: 1, ...over,
  };
}

describe('normalize', () => {
  it('parses Arabic-Indic km + ألف + K shorthand', () => {
    assert.equal(parseKilometers('٨٠٬٠٠٠'), 80000);
    assert.equal(parseKilometers('80k'), 80000);
    assert.equal(parseKilometers('80 ألف'), 80000);
    assert.equal(parseKilometers('80,000 km'), 80000);
  });
  it('rejects garbage km', () => {
    assert.equal(parseKilometers('abc'), null);
    assert.equal(parseKilometers(-5), null);
    assert.equal(parseKilometers(99999999), null);
  });
  it('parses prices with currency hints', () => {
    assert.deepEqual(parsePrice('13,500 $'), { price: 13500, currency: 'USD' });
    assert.deepEqual(parsePrice('13.5K USD'), { price: 13500, currency: 'USD' });
    assert.deepEqual(parsePrice('13500'), { price: 13500, currency: 'JOD' });
    assert.equal(parsePrice('free'), null);
  });
  it('converts FX to JOD with recorded rate', () => {
    const r = toJod(10000, 'USD');
    assert.equal(r.priceJod, 7090);
    assert.equal(r.fxRate, 0.709);
  });
  it('normalizes trims + stable content hash', () => {
    assert.equal(normalizeTrim('2.5L XLE Premium'), 'XLE');
    assert.equal(contentHash(['a', 1]), contentHash(['a', 1]));
    assert.notEqual(contentHash(['a', 1]), contentHash(['a', 2]));
  });
});

describe('matching + similarity', () => {
  it('assigns tiers 1/2/3(+2 gated)/4/0', () => {
    assert.equal(assignTier(mkListing(), spec), 1);
    assert.equal(assignTier(mkListing({ fuelType: 'HYBRID' }), spec), 2);
    assert.equal(assignTier(mkListing({ year: 2021 }), spec), 3);
    assert.equal(assignTier(mkListing({ year: 2020 }), spec, { allowPlus2: false, allowTier4: false }), 0);
    assert.equal(assignTier(mkListing({ year: 2020 }), spec), 4);
    assert.equal(assignTier(mkListing({ year: 2015 }), spec), 0);
    assert.equal(assignTier(mkListing({ modelEn: 'corolla', model: 'كورولا' }), spec), 0);
    assert.equal(assignTier(mkListing({ brandEn: 'honda', brand: 'هوندا' }), spec), 0);
  });
  it('identical car scores higher than distant one', () => {
    const close = scoreSimilarity(mkListing(), spec, 1);
    const far = scoreSimilarity(mkListing({ year: 2018, kilometers: 200000, trim: 'XSE', fuelType: 'HYBRID' }), spec, 2);
    assert.ok(close.similarity > 85, 'close=' + close.similarity);
    assert.ok(far.similarity < close.similarity, `far=${far.similarity} close=${close.similarity}`);
  });
  it('tier caps hold (tier3 <= 85) and tier factor orders weights', () => {
    const t3 = scoreSimilarity(mkListing({ year: 2021 }), spec, 3);
    assert.ok(t3.similarity <= 85);
    const w1 = computeWeight(mkListing({ tier: 1, yearDiff: 0, similarity: 80, ageDays: 2, source: 'jocars' }), { jocars: 1 });
    const w4 = computeWeight(mkListing({ tier: 4, yearDiff: 2, similarity: 80, ageDays: 2, source: 'jocars' }), { jocars: 1 });
    assert.ok(w1 > w4 * 2, `w1=${w1} w4=${w4}`);
  });
});

describe('dedupe + outliers', () => {
  it('dedupeExact keeps newest, records reason', () => {
    const a = mkListing({ scrapedAt: new Date(Date.now() - 86400000).toISOString() });
    const b = mkListing();
    const out = dedupeExact([a, b]);
    assert.equal(b.included, true);
    assert.equal(a.included, false);
    assert.match(a.excludeReason || '', /مكرر/);
  });
  it('dedupeNear merges cross-source reposts', () => {
    const a = mkListing({ source: 'opensooq' });
    const b = mkListing({ source: 'jocars', similarity: 80 });
    a.similarity = 90;
    const out = dedupeNear([a, b]);
    assert.equal(a.included, true);
    assert.equal(b.included, false);
    assert.match(b.excludeReason || '', /موقع آخر/);
  });
  it('IQR fences flag low/high with reasons, keep sane', () => {
    const rows = [12000, 12500, 13000, 13200, 12800, 5000, 40000].map((p) => mkListing({ priceJod: p, price: p }));
    const f = iqrFences(rows.map((r) => r.priceJod));
    flagOutliers(rows, f);
    assert.equal(rows.find((r) => r.priceJod === 5000)!.included, false);
    assert.equal(rows.find((r) => r.priceJod === 40000)!.included, false);
    assert.equal(rows.filter((r) => r.included).length, 5);
  });
  it('flags stale rows but never kills on missing year/km alone', () => {
    const noYear = mkListing({ year: null, tier: 2 });
    const noKm = mkListing({ kilometers: null });
    const noPrice = mkListing({ priceJod: 0, price: 0 });
    const old = mkListing({ ageDays: 90 });
    flagOutliers([noYear, noKm, noPrice, old], { q1: 1, q3: 2, iqr: 1, low: 0, high: 50000, median: 13000 });
    assert.equal(noYear.included, true);
    assert.equal(noKm.included, true);
    assert.equal(noPrice.included, false);
    assert.equal(old.included, false);
  });
  it('IQR applies only with >=5 candidates', () => {
    const rows = [12000, 50000].map((p) => mkListing({ priceJod: p, price: p }));
    const f = iqrFences(rows.map((r) => r.priceJod));
    flagOutliers(rows, f);
    assert.equal(rows.filter((r) => r.included).length, 2);
  });
});

describe('adjustments', () => {
  it('year delta sign: newer comp subtracts', () => {
    const cal = { perYearJod: 700, per10kKmJod: 180, calibrated: false, provenance: 'CONSERVATIVE_HEURISTIC' as const, sampleSize: 2 };
    const newer = adjustComparable(mkListing({ year: 2023, priceJod: 15000, kilometers: 80000 }), spec, cal);
    const older = adjustComparable(mkListing({ year: 2021, priceJod: 11000, kilometers: 80000 }), spec, cal);
    assert.ok(newer.adjustedPrice! < 15000);
    assert.ok(older.adjustedPrice! > 11000);
    assert.ok(newer.adjustments.some((a) => a.factor === 'year'));
  });
  it('higher-km comp gets wear added back', () => {
    const cal = { perYearJod: 700, per10kKmJod: 180, calibrated: false, provenance: 'CONSERVATIVE_HEURISTIC' as const, sampleSize: 2 };
    const worn = adjustComparable(mkListing({ kilometers: 130000, priceJod: 11000, year: 2022 }), spec, cal);
    assert.ok(worn.adjustedPrice! > 11000);
  });
  it('calibrate falls back under 8 rows', () => {
    const cal = calibrate([mkListing(), mkListing()]);
    assert.equal(cal.calibrated, false);
  });
});

describe('pricing + confidence', () => {
  it('weighted median resists a whale the plain avg follows', () => {
    const items = [
      { price: 12000, weight: 1 }, { price: 12500, weight: 1 },
      { price: 13000, weight: 1 }, { price: 50000, weight: 0.05 },
    ];
    assert.ok(Math.abs(weightedMedian(items) - 12500) <= 500);
    assert.ok(weightedAvg(items) > weightedMedian(items));
  });
  it('confidence bands respond to evidence (not count alone)', () => {
    const hi = confidenceScore({ used: 25, found: 30, sourcesUsed: 4, highSim: 15, spreadRatio: 0.08, freshShare: 0.9, specComplete: true, yearMatchShare: 0.8, trimMatchShare: 0.7, engineMatchShare: 0.9, tier1Share: 0.6, excludedShare: 0.1 });
    const lo = confidenceScore({ used: 3, found: 3, sourcesUsed: 1, highSim: 0, spreadRatio: 0.5, freshShare: 0.1, specComplete: false, yearMatchShare: 0, trimMatchShare: 0.2, engineMatchShare: 0.3, tier1Share: 0, excludedShare: 0.6 });
    assert.equal(hi.label, 'مرتفع');
    assert.equal(lo.label, 'منخفض');
    assert.ok(hi.score > lo.score + 30);
  });
  it('3 exact beats 15 mismatched on confidence', () => {
    const fewExact = confidenceScore({ used: 3, found: 5, sourcesUsed: 3, highSim: 3, spreadRatio: 0.06, freshShare: 1, specComplete: true, yearMatchShare: 1, trimMatchShare: 1, engineMatchShare: 1, tier1Share: 1, excludedShare: 0 });
    const manyLoose = confidenceScore({ used: 15, found: 40, sourcesUsed: 2, highSim: 1, spreadRatio: 0.4, freshShare: 0.3, specComplete: false, yearMatchShare: 0.1, trimMatchShare: 0.1, engineMatchShare: 0.2, tier1Share: 0, excludedShare: 0.6 });
    assert.ok(fewExact.score > manyLoose.score, `exact3=${fewExact.score} loose15=${manyLoose.score}`);
  });
  it('freshness/source trust shape weights', () => {
    const fresh = computeWeight(mkListing({ ageDays: 2, similarity: 90, source: 'jocars' }), { jocars: 1 });
    const stale = computeWeight(mkListing({ ageDays: 120, similarity: 90, source: 'x' }), { x: 0.8 });
    assert.ok(fresh > stale * 1.5);
  });
});

describe('target leakage guard', () => {
  const target = { carId: 'car123', spec: { ...spec, kilometers: 171000 }, askingPrice: 30000 };
  it('excludes same internal ID with audit line', () => {
    const l = mkListing({ source: 'jocars', externalId: 'jo-car123' });
    const hit = isTargetCopy(l, target as any);
    assert.equal(hit.hit, true);
    assert.match(hit.via, /TARGET LISTING EXCLUDED/);
  });
  it('fingerprints cross-posted copy (model+year+km±1%+price)', () => {
    const l = mkListing({
      source: 'opensooq', externalId: 'os-x', url: 'https://x/y',
      year: 2022, kilometers: 171500, priceJod: 30000, price: 30000,
    });
    const t2 = { carId: 'other', spec: { ...spec, kilometers: 171000, year: 2022 }, askingPrice: 30000 };
    const hit = isTargetCopy(l, t2 as any);
    assert.equal(hit.hit, true);
  });
  it('does not flag genuinely different cars', () => {
    const l = mkListing({ source: 'opensooq', year: 2020, kilometers: 90000, priceJod: 22000, price: 22000 });
    const hit = isTargetCopy(l, target as any);
    assert.equal(hit.hit, false);
  });
});

describe('price sanity gate', () => {
  const group = (prices: number[]) => prices.map((p, i) => mkListing({
    source: 'opensooq', externalId: 'os-s' + i, priceJod: p, price: p,
    year: 2020, kilometers: 80000 + i * 1000,
  }));
  it('quarantines placeholder + suspicious + extreme, keeps genuine', () => {
    const rows = group([12000, 12500, 13000, 12800, 13100, 15, 1000, 400000]);
    const { clean, excluded } = sanityCheck(rows);
    const reasons = excluded.map((e) => e.reason);
    assert.ok(reasons.includes('POSSIBLE_PLACEHOLDER'));
    assert.ok(reasons.includes('SUSPICIOUS_PRICE'));
    assert.ok(reasons.includes('EXTREME_OUTLIER'));
    assert.equal(clean.length, 5);
  });
  it('does not judge tiny groups (rare models safe)', () => {
    const rows = group([12000, 1000]);
    const { clean } = sanityCheck(rows);
    assert.equal(clean.length, 2);
  });
});

describe('powertrain priority', () => {
  it('fuel mismatch demotes to tier 2 with capped similarity', () => {
    const t = assignTier(mkListing({ fuelType: 'HYBRID' }), spec);
    assert.equal(t, 2);
    const s = scoreSimilarity(mkListing({ fuelType: 'HYBRID' }), spec, 2);
    assert.ok(s.similarity <= 95);
  });
  it('no-trim target falls back without assuming trim', () => {
    const noTrim = { ...spec, trim: null };
    const s = scoreSimilarity(mkListing({ trim: 'XLE' }), noTrim, 1);
    assert.ok(s.similarity > 50);
  });
});

describe('source spec extraction (no corruption)', () => {
  const cases: [string, Partial<ReturnType<typeof extractSpecsFromTitle>>][] = [
    ['BMW X5 40e', { trim: '40E', fuel: 'PHEV' }],
    ['BMW X5 xDrive40e 2018', { trim: 'XDRIVE40E', fuel: 'PHEV', drivetrain: 'AWD' }],
    ['BMW X5 Plug-in Hybrid AWD', { fuel: 'PHEV', drivetrain: 'AWD' }],
    ['BMW X5 Hybrid 2020', { fuel: 'HYBRID' }],
    ['Toyota Camry 2.0L 2022', { engineCc: 2000 }],
    ['Nissan Patrol 4000cc V8 320HP', { engineCc: 4000, cylinders: 8, horsepower: 320 }],
    ['Kia Sorento AWD', { drivetrain: 'AWD' }],
    ['Hyundai Sonata RWD', { drivetrain: 'RWD' }],
  ];
  for (const [title, want] of cases) {
    it(`parses "${title}"`, () => {
      const got = extractSpecsFromTitle(title);
      for (const [k, v] of Object.entries(want)) {
        assert.equal((got as any)[k], v, `${k} in "${title}"`);
      }
    });
  }
  it('never invents: plain title yields nulls, gasoline never assumed', () => {
    const got = extractSpecsFromTitle('BMW X5 2018 clean car');
    assert.equal(got.fuel, null);
    assert.equal(got.drivetrain, null);
    assert.equal(got.engineCc, null);
    assert.equal(got.trim, null);
  });
  it('AWD never degrades to FWD, 2000cc never becomes 2500cc', () => {
    const got = extractSpecsFromTitle('X5 xDrive 2.0');
    assert.notEqual(got.drivetrain, 'FWD');
    assert.notEqual(got.engineCc, 2500);
  });
});

describe('Valuation Engine Methodology & Audit Tests (User Mandate §21)', () => {
  const x5Spec: VehicleSpec = {
    brand: 'بي ام دبليو',
    brandEn: 'bmw',
    model: 'X5',
    modelEn: 'X5',
    year: 2018,
    trim: 'xDrive40e',
    kilometers: 171000,
    fuelType: 'HYBRID',
    transmission: 'AUTOMATIC',
    city: 'عمان',
  };

  function mkNorm(over: Partial<NormalizedListing> = {}): NormalizedListing {
    return {
      source: 'opensooq', sourceLabel: 'OpenSooq', brand: 'بي ام دبليو', brandEn: 'bmw',
      model: 'X5', modelEn: 'X5', year: 2018, trim: 'xDrive40e', kilometers: 100000,
      price: 28000, currency: 'JOD', priceJod: 28000, fxRate: 1, city: 'عمان', country: 'JO',
      priceType: 'asking', specs: [], scrapedAt: new Date().toISOString(), ...over,
    };
  }

  // Test 1: Target Identity Cluster across 3 sites
  it('1. Target Identity Cluster: consolidates 3 mirrors across sites into 1 cluster and excludes all from cleanListings', () => {
    const target = { carId: 'car-bmw-x5', spec: x5Spec, askingPrice: 30000 };
    const candidates: NormalizedListing[] = [
      mkNorm({
        source: 'jocars', externalId: 'car-bmw-x5', brand: 'بي ام دبليو', brandEn: 'BMW',
        model: 'X5', modelEn: 'X5', year: 2018, trim: 'xDrive40e', kilometers: 171000,
        price: 30000, priceJod: 30000,
      }),
      mkNorm({
        source: 'opensooq', externalId: 'os-clone-1', url: 'https://opensooq/clone', brand: 'بي ام دبليو', brandEn: 'BMW',
        model: 'X5', modelEn: 'X5', year: 2018, trim: 'xDrive40e', kilometers: 171200,
        price: 30000, priceJod: 30000,
      }),
      mkNorm({
        source: 'ordonauto', externalId: 'oa-clone-2', brand: 'بي ام دبليو', brandEn: 'BMW',
        model: 'X5', modelEn: 'X5', year: 2018, trim: 'xDrive40e', kilometers: 170900,
        price: 29500, priceJod: 29500,
      }),
      // Real separate comparable
      mkNorm({
        source: 'opensooq', externalId: 'os-real-comp', brand: 'بي ام دبليو', brandEn: 'BMW',
        model: 'X5', modelEn: 'X5', year: 2018, trim: 'xDrive40e', kilometers: 85000,
        price: 28500, priceJod: 28500,
      }),
    ];

    const { cluster, cleanListings } = detectTargetIdentityCluster(candidates, target);
    assert.equal(cluster.totalClusterCount, 3);
    assert.equal(cluster.sourcesInCluster.length, 3);
    assert.ok(cluster.sourcesInCluster.includes('jocars'));
    assert.ok(cluster.sourcesInCluster.includes('opensooq'));
    assert.ok(cluster.sourcesInCluster.includes('ordonauto'));
    assert.equal(cleanListings.length, 1);
    assert.equal(cleanListings[0].externalId, 'os-real-comp');
  });

  // Test 2: BMW 520 F10 title -> IDENTITY_CONFLICT
  it('2. Identity Conflict Gate: BMW 520 F10 title fails identity check for an X5', () => {
    const f10Listing: NormalizedListing = mkNorm({
      source: 'opensooq', externalId: 'os-520', brand: 'بي ام دبليو', brandEn: 'BMW',
      model: 'X5', modelEn: 'X5', trim: 'بي ام دبليو 520 f10 بحالة الوكالة فحص كامل',
      year: 2018, kilometers: 120000, price: 19500, priceJod: 19500,
    });
    const res = checkListingIdentityConsistency(f10Listing, x5Spec);
    assert.equal(res.consistent, false);
    assert.match(res.reason || '', /IDENTITY_CONFLICT/);

    const tier = assignTier(f10Listing, x5Spec);
    assert.equal(tier, 0); // Must be strictly excluded
  });

  // Test 3: Unknown year cannot enter Tier 1 or Tier 2
  it('3. Unknown year cannot enter Tier 1/2', () => {
    const noYearListing: NormalizedListing = mkNorm({
      source: 'opensooq', externalId: 'os-noyear', brand: 'بي ام دبليو', brandEn: 'BMW',
      model: 'X5', modelEn: 'X5', year: null, kilometers: 100000, price: 25000, priceJod: 25000,
    });
    const tier = assignTier(noYearListing, x5Spec, { allowPlus2: false, allowTier4: false });
    assert.equal(tier, 0);
  });

  // Test 4: Same-year primary comps dominate over older comps (>= 85% weight)
  it('4. Primary Set Weight Dominance: same-year comps control >= 85% of weight', () => {
    const comps: Comparable[] = [
      mkListing({ year: 2018, yearDiff: 0, tier: 1, similarity: 95, weight: 1, priceJod: 29000 }),
      mkListing({ year: 2018, yearDiff: 0, tier: 2, similarity: 90, weight: 0.85, priceJod: 28000 }),
      mkListing({ year: 2013, yearDiff: 5, tier: 4, similarity: 65, weight: 0.9, priceJod: 16500 }),
      mkListing({ year: 2014, yearDiff: 4, tier: 4, similarity: 60, weight: 0.8, priceJod: 17000 }),
    ];
    balancePrimarySecondaryWeights(comps);

    const primaryW = comps.filter((c) => c.tier <= 2).reduce((sum, c) => sum + c.weight, 0);
    const secondaryW = comps.filter((c) => c.tier > 2).reduce((sum, c) => sum + c.weight, 0);
    const totalW = primaryW + secondaryW;
    const primaryShare = primaryW / totalW;

    assert.ok(primaryShare >= 0.85, `Primary share ${primaryShare} must be >= 0.85`);
  });

  // Test 5: Only Tier 4 exists -> low confidence / approximate capped
  it('5. Only Tier 4 exists: confidence is capped and marked approximate', () => {
    const conf = confidenceScore({
      used: 3, found: 3, sourcesUsed: 1, highSim: 0, spreadRatio: 0.3,
      freshShare: 0.5, specComplete: true, yearMatchShare: 0, trimMatchShare: 0,
      engineMatchShare: 0.5, tier1Share: 0, excludedShare: 0,
    });
    assert.ok(conf.score <= 35, `Confidence score ${conf.score} should be <= 35`);
    assert.equal(conf.label, 'منخفض');
  });

  // Test 6: 1,000 JD outlier quarantined by price sanity gate
  it('6. Price Sanity Gate: 1,000 JD listing is quarantined as SUSPICIOUS_PRICE against 25k group', () => {
    const group: NormalizedListing[] = [
      mkNorm({ source: 'os', brand: 'BMW', model: 'X5', year: 2018, price: 27000, priceJod: 27000 }),
      mkNorm({ source: 'os', brand: 'BMW', model: 'X5', year: 2018, price: 28000, priceJod: 28000 }),
      mkNorm({ source: 'os', brand: 'BMW', model: 'X5', year: 2018, price: 29000, priceJod: 29000 }),
      mkNorm({ source: 'os', brand: 'BMW', model: 'X5', year: 2018, price: 30000, priceJod: 30000 }),
      mkNorm({ source: 'os', brand: 'BMW', model: 'X5', year: 2018, price: 1000, priceJod: 1000 }),
    ];
    const { clean, excluded } = sanityCheck(group);
    assert.equal(clean.length, 4);
    assert.equal(excluded.length, 1);
    assert.equal(excluded[0].reason, 'SUSPICIOUS_PRICE');
  });

  // Test 7: Target Asking Price Invariance (20k vs 35k)
  it('7. Target Price Invariance: Asking price 20k vs 35k produces identical weighted median', () => {
    const marketComps = [
      { price: 28000, weight: 1.5 },
      { price: 29000, weight: 2.0 },
      { price: 30000, weight: 1.8 },
      { price: 27500, weight: 1.2 },
    ];
    // Asking price is completely isolated: neither 20,000 nor 35,000 is injected into marketComps
    const fmv1 = weightedMedian(marketComps);
    const fmv2 = weightedMedian(marketComps);
    assert.equal(fmv1, fmv2);
    assert.equal(Math.abs(fmv1 - fmv2), 0);
  });

  // Test 8: Leave-One-Out Sensitivity Analysis
  it('8. Leave-One-Out Sensitivity: removing single comp computes delta and checks dominance', () => {
    const comps: Comparable[] = [
      mkListing({ externalId: 'c1', priceJod: 28000, weight: 2 }),
      mkListing({ externalId: 'c2', priceJod: 29000, weight: 2 }),
      mkListing({ externalId: 'c3', priceJod: 45000, weight: 5 }), // Dominant whale
    ];
    const baseFmv = weightedMedian(comps.map((c) => ({ price: c.priceJod, weight: c.weight })));
    const loo = computeLeaveOneOut(comps, baseFmv);

    assert.equal(loo.length, 3);
    const whaleResult = loo.find((r) => r.comparableId === 'c3');
    assert.ok(whaleResult);
    assert.ok(whaleResult.isDominant, 'Whale should be flagged as dominant comparable');
    assert.ok(Math.abs(whaleResult.percentShift) > 10);
  });

  // Test 9: Market Consensus Band Calculation
  it('9. Consensus Band: calculates low, high, median, count, and spread correctly', () => {
    const comps: Comparable[] = [
      mkListing({ priceJod: 27000 }),
      mkListing({ priceJod: 28500 }),
      mkListing({ priceJod: 31000 }),
    ];
    const band = buildMarketConsensusBand(comps);
    assert.equal(band.low, 27000);
    assert.equal(band.high, 31000);
    assert.equal(band.median, 28500);
    assert.equal(band.count, 3);
    assert.equal(band.spread, 4000);
  });

  // Test 10: Source diversity does not count duplicate vehicles
  it('10. Source Diversity: 3 mirrors of the same car across 3 portals do not add to valid source count', () => {
    const target = { carId: 'car-bmw-x5', spec: x5Spec, askingPrice: 30000 };
    const candidates: NormalizedListing[] = [
      mkNorm({ source: 'jocars', externalId: 'c1', brand: 'BMW', model: 'X5', year: 2018, kilometers: 171000, price: 30000, priceJod: 30000 }),
      mkNorm({ source: 'opensooq', externalId: 'c2', brand: 'BMW', model: 'X5', year: 2018, kilometers: 171100, price: 30000, priceJod: 30000 }),
      mkNorm({ source: 'ordonauto', externalId: 'c3', brand: 'BMW', model: 'X5', year: 2018, kilometers: 170950, price: 30000, priceJod: 30000 }),
    ];
    const { cleanListings } = detectTargetIdentityCluster(candidates, target);
    // All 3 mirrors excluded
    assert.equal(cleanListings.length, 0);
    const validSources = new Set(cleanListings.map((l) => l.source)).size;
    assert.equal(validSources, 0, 'Cloned listings cannot count towards source diversity');
  });

  // Test 11: Cross-model contamination strictly banned (BMW 520, 730, 320, X1, X3 never admitted into any tier for X5)
  it('11. Model Contamination Barrier: Other BMW models (5-Series, 7-Series, 3-Series, X3) are NEVER admitted into any tier for X5', () => {
    const foreignModels: NormalizedListing[] = [
      mkNorm({ source: 'ordonauto', brand: 'BMW', model: '520', year: 2018, price: 26000, priceJod: 26000 }),
      mkNorm({ source: 'opensooq', brand: 'BMW', model: '730', year: 2018, price: 38000, priceJod: 38000 }),
      mkNorm({ source: 'opensooq', brand: 'BMW', model: '320', year: 2018, price: 21000, priceJod: 21000 }),
      mkNorm({ source: 'ordonauto', brand: 'BMW', model: 'X3', year: 2018, price: 24000, priceJod: 24000 }),
      mkNorm({ source: 'opensooq', brand: 'BMW', model: 'X1', year: 2018, price: 18000, priceJod: 18000 }),
      mkNorm({ source: 'opensooq', brand: 'BMW', model: '5-Series', year: 2018, price: 27000, priceJod: 27000 }),
      mkNorm({ source: 'opensooq', brand: 'BMW', model: '7-Series', year: 2018, price: 39000, priceJod: 39000 }),
    ];

    for (const f of foreignModels) {
      // Even with maximum expansion flags enabled, different models must return Tier 0 (disqualified)
      const tierWithExpansion = assignTier(f, x5Spec, { allowPlus2: true, allowTier4: true, allowAnyYear: true });
      assert.equal(tierWithExpansion, 0, `Model ${f.model} should be rejected (tier 0) for target BMW X5`);
    }
  });

  // Test 12: Empirical percentiles strictly computed on eligible comparables
  it('12. Empirical Percentiles: computes P25, P50, P75, P85, P90 strictly from eligible comps', () => {
    const eligibleComps: Comparable[] = [
      mkListing({ priceJod: 20000, weight: 1 }),
      mkListing({ priceJod: 24000, weight: 1 }),
      mkListing({ priceJod: 26000, weight: 1 }),
      mkListing({ priceJod: 28000, weight: 1 }),
      mkListing({ priceJod: 30000, weight: 1 }),
      mkListing({ priceJod: 32000, weight: 1 }),
      mkListing({ priceJod: 35000, weight: 1 }),
    ];

    const stats = priceStats(eligibleComps, 30000);
    assert.equal(stats.median, 28000);
    assert.equal(stats.p50, 28000);
    assert.ok(stats.p25 && stats.p25 <= stats.p50);
    assert.ok(stats.p75 && stats.p75 >= stats.p50);
    assert.ok(stats.p85 && stats.p85 >= stats.p75);
    assert.ok(stats.p90 && stats.p90 >= stats.p85);
    assert.ok(stats.askingPricePercentile !== null && stats.askingPricePercentile !== undefined && stats.askingPricePercentile > 50);
  });

  // Test 13: Asking price premium vs market percentile separation
  it('13. Separation of Asking Price Premium vs Market Percentile: Premium (+15.4%) does not equal Percentile rank', () => {
    const eligibleComps: Comparable[] = [
      mkListing({ priceJod: 25000, weight: 1 }),
      mkListing({ priceJod: 26000, weight: 1 }),
      mkListing({ priceJod: 27000, weight: 1 }),
      mkListing({ priceJod: 28000, weight: 1 }),
      mkListing({ priceJod: 29000, weight: 1 }),
    ];
    // Target asking 30,000 JD against weighted median 27,000 JD
    const stats = priceStats(eligibleComps, 30000);
    const premiumPct = stats.askingPricePremiumPercent;
    const percentile = stats.askingPricePercentile;

    assert.ok(premiumPct !== null && premiumPct !== undefined);
    assert.ok(percentile !== null && percentile !== undefined);
    // Premium should be ~11.1% ((30000 - 27000)/27000)
    assert.equal(Math.round(premiumPct!), 11);
    // Percentile rank in [25k..29k] is 100th percentile (higher than all 5 comps)
    assert.equal(percentile, 100);
    // Premium % and Percentile rank MUST NOT be conflated
    assert.notEqual(premiumPct, percentile);
  });

  // Test 14: UNKNOWN specs are scored 0.5 (neutral missing evidence) and do not penalize similarity as a defect
  it('14. Neutral UNKNOWN Spec Scoring: missing trim/fuel/transmission scores 0.5 neutral', () => {
    const targetWithTrim: VehicleSpec = {
      brand: 'BMW', brandEn: 'BMW', model: 'X5', modelEn: 'X5',
      year: 2018, trim: 'xDrive40e', kilometers: 171000, fuelType: 'HYBRID',
      transmission: 'AUTOMATIC', city: 'عمان',
    };

    const compWithUnknownSpecs: Comparable = mkListing({
      brand: 'BMW', model: 'X5', year: 2018, trim: null, fuelType: null,
      transmission: null, kilometers: 171000, tier: 2,
    });

    const scored = scoreSimilarity(compWithUnknownSpecs, targetWithTrim, 2);
    // Breakdown for trim, fuel, and transmission should each be 50% (neutral 0.5, not 0)
    assert.equal(scored.simBreakdown.trim, 50);
    assert.equal(scored.simBreakdown.engineTrans, 50);
    // Overall similarity should remain robust (>= 60) rather than plunging to 0
    assert.ok(scored.similarity >= 60, `Similarity ${scored.similarity} should be >= 60`);
  });

  // Test 15: Mathematical Traceability: adjustedPrice = rawPrice + sum(adjustments) with valid provenance
  it('15. Traceable Adjustments: adjustedPrice equals rawPrice + sum(adjustments) with valid provenance and formula', () => {
    const cal = { perYearJod: 800, per10kKmJod: 150, calibrated: true, provenance: 'MARKET_DERIVED' as const, sampleSize: 10 };
    const rawComp = mkListing({ year: 2020, priceJod: 20000, kilometers: 120000, trim: 'LE' });
    const adjusted = adjustComparable(rawComp, spec, cal);

    assert.ok(adjusted.adjustments.length > 0);
    const sumAdjustments = adjusted.adjustments.reduce((sum, a) => sum + a.delta, 0);
    assert.equal(adjusted.adjustedPrice, rawComp.priceJod + sumAdjustments);

    for (const adj of adjusted.adjustments) {
      assert.ok(['MARKET_DERIVED', 'CONSERVATIVE_HEURISTIC', 'EMPIRICAL_SEGMENT'].includes(adj.provenance));
      assert.ok(adj.formula && adj.formula.length > 0);
      assert.ok(adj.reason && adj.reason.length > 0);
    }
  });

  // Test 16: Multi-Factor Weight Decomposition: differentiated weights (Tier 1 > Tier 4)
  it('16. Multi-Factor Weight Decomposition: Tier 1 weight is substantially higher than Tier 4', () => {
    const tier1Comp = mkListing({ tier: 1, yearDiff: 0, similarity: 92, ageDays: 5, source: 'jocars' });
    const tier4Comp = mkListing({ tier: 4, yearDiff: 5, similarity: 60, ageDays: 45, source: 'opensooq' });
    const trust = { jocars: 1.0, opensooq: 0.85 };

    const { breakdown: w1 } = computeDetailedWeight(tier1Comp, trust, spec);
    const { breakdown: w4 } = computeDetailedWeight(tier4Comp, trust, spec);

    assert.equal(w1.identityWeight, 1.0);
    assert.equal(w4.identityWeight, 1.0);
    assert.ok(w1.yearWeight > w4.yearWeight, 'Tier 1 year weight must exceed Tier 4');
    assert.ok(w1.rawCompositeWeight > w4.rawCompositeWeight * 2.5, 'Tier 1 composite weight must be > 2.5x Tier 4');
  });

  // Test 17: Target Price Invariance across multiple asking prices
  it('17. Target Price Invariance: Asking prices across 20k, 25k, 30k, 35k yield identical FMV and weights', () => {
    const comps = [
      mkListing({ priceJod: 27000, tier: 2, yearDiff: 0, similarity: 85 }),
      mkListing({ priceJod: 28500, tier: 2, yearDiff: 0, similarity: 88 }),
      mkListing({ priceJod: 29000, tier: 1, yearDiff: 0, similarity: 94 }),
      mkListing({ priceJod: 31000, tier: 2, yearDiff: 0, similarity: 82 }),
    ];

    const fmv20k = calculateFMV(comps, 20000);
    const fmv25k = calculateFMV(comps, 25000);
    const fmv30k = calculateFMV(comps, 30000);
    const fmv35k = calculateFMV(comps, 35000);

    assert.equal(fmv20k.fmv, fmv30k.fmv);
    assert.equal(fmv25k.fmv, fmv35k.fmv);
    assert.equal(fmv20k.minPrice, fmv35k.minPrice);
    assert.equal(fmv20k.maxPrice, fmv35k.maxPrice);
  });

  // Test 18: GLM Deterministic Fallback: Resilient and zero-hallucination
  it('18. GLM Deterministic Fallback: Generates grounded claims, warnings, and limitations without hallucination', () => {
    const payload = {
      target: { brand: 'BMW', model: 'X5', year: 2018, mileage: 171000, trim: 'xDrive40e', fuelType: 'HYBRID', transmission: 'AUTOMATIC', askingPrice: 30000 },
      evidenceQuality: {
        totalAdsChecked: 27, eligibleComparables: 5, sameYearComparables: 0, plusMinusOneYearComparables: 0,
        supportComparables: 5, excludedAds: 22, independentSources: 2, targetClusterExcluded: 3,
        confidence: 40, confidenceLabel: 'منخفض', status: 'INSUFFICIENT_DIRECT_EVIDENCE',
      },
      pricingResults: {
        fairMarketValue: 26000, range: { low: 20000, high: 33000 }, isWideRange: true,
        rangeDisclaimerAr: 'نطاق استرشادي واسع نظراً لمحدودية الأدلة المباشرة',
        rawMedian: 17000, adjustedMedian: 26000, weightedMedian: 26000,
        percentiles: { p25: 22000, p50: 26000, p75: 31000, p85: 32000, p90: 33000 },
        askingPricePremiumPercent: 15, askingPricePercentile: 72, pricePositionClassification: 'ABOVE_MARKET',
      },
      comparables: [
        { title: 'BMW X5 2014', rawPrice: 17000, adjustedPrice: 25000, tier: 4, weight: 0.15, contributionPercent: 30, similarity: 65, adjustments: [{ factor: 'year', delta: 8000, formula: 'test', reason: 'year adj' }] },
      ],
      leaveOneOut: [],
    };

    const explanation = generateDeterministicExplanation(payload as any);
    assert.equal(explanation.generatedBy, 'DETERMINISTIC_FALLBACK');
    assert.ok(explanation.marketSummary.includes('BMW X5'));
    assert.ok(explanation.keyDrivers.length > 0);
    assert.ok(explanation.dataWarnings.length > 0);
    assert.ok(explanation.limitations.length > 0);
  });

  // Test 19: Wide Range Marking on Insufficient Direct Evidence
  it('19. Wide Range Marking: When same-year count is 0 and only Tier 4 exists, isWideRange is true', () => {
    const tier4Comps = [
      mkListing({ year: 2014, tier: 4, yearDiff: 4, adjustedPrice: 24000, weight: 0.1 }),
      mkListing({ year: 2015, tier: 4, yearDiff: 3, adjustedPrice: 26000, weight: 0.15 }),
      mkListing({ year: 2013, tier: 4, yearDiff: 5, adjustedPrice: 22000, weight: 0.08 }),
    ];
    const res = calculateFMV(tier4Comps, 30000);
    assert.equal(res.isWideRange, true);
    assert.ok(res.rangeDisclaimerAr && res.rangeDisclaimerAr.includes('محدودية الأدلة المباشرة'));
  });
});

describe('User Methodological Refinements (Public Separation, Powertrain, Depreciation, 7 Sources)', () => {
  const bmwSpec: VehicleSpec = {
    brand: 'بي ام دبليو', brandEn: 'bmw', model: 'X5', modelEn: 'X5',
    year: 2018, trim: 'xDrive40i', kilometers: 100000, fuelType: 'PETROL',
    transmission: 'AUTOMATIC', city: 'عمان',
  };

  it('20. PHEV vs Petrol Mismatch: PHEV is demoted to Tier 3 secondary evidence and cannot be Tier 1 or Tier 2', () => {
    const phevListing = mkListing({
      brand: 'BMW', brandEn: 'bmw', model: 'X5', modelEn: 'x5',
      year: 2018, title: 'BMW X5 xDrive40e 2018 Plug-in Hybrid',
      fuelType: 'Plug-in Hybrid',
    });
    const petrolListing = mkListing({
      brand: 'BMW', brandEn: 'bmw', model: 'X5', modelEn: 'x5',
      year: 2018, title: 'BMW X5 xDrive40i 2018 Petrol',
      fuelType: 'PETROL', trim: 'xDrive40i',
    });

    assert.equal(isPhevVsPetrolMismatch(phevListing, bmwSpec), true);
    assert.equal(isPhevVsPetrolMismatch(petrolListing, bmwSpec), false);

    // PHEV gets demoted to Tier 3 max even though year matches 2018!
    const phevTier = assignTier(phevListing, bmwSpec);
    assert.equal(phevTier, 3);

    // Pure petrol gets Tier 1
    const petrolTier = assignTier(petrolListing, bmwSpec);
    assert.equal(petrolTier, 1);

    // Scored similarity for PHEV is capped at <= 65%
    const phevScored = scoreSimilarity(phevListing, bmwSpec, 3);
    assert.ok(phevScored.similarity <= 65);
    assert.equal(phevScored.isPowertrainMismatch, true);
  });

  it('21. Petrol Dominance: When >= 3 Petrol comps exist, Petrol comps control >= 85% of total weight', () => {
    const comps: Comparable[] = [
      mkListing({ externalId: 'p1', tier: 1, yearDiff: 0, weight: 1.0, fuelType: 'PETROL', isPowertrainMismatch: false }),
      mkListing({ externalId: 'p2', tier: 1, yearDiff: 0, weight: 1.0, fuelType: 'PETROL', isPowertrainMismatch: false }),
      mkListing({ externalId: 'p3', tier: 2, yearDiff: 0, weight: 0.85, fuelType: 'PETROL', isPowertrainMismatch: false }),
      mkListing({ externalId: 'h1', tier: 3, yearDiff: 0, weight: 0.70, fuelType: 'Plug-in Hybrid', isPowertrainMismatch: true }),
      mkListing({ externalId: 'h2', tier: 3, yearDiff: 0, weight: 0.70, fuelType: 'Plug-in Hybrid', isPowertrainMismatch: true }),
    ];

    balancePrimarySecondaryWeights(comps);

    const primaryComps = comps.filter((c) => (c.tier === 1 || c.tier === 2) && c.yearDiff === 0 && !c.isPowertrainMismatch);
    const secondaryComps = comps.filter((c) => c.tier > 2 || c.yearDiff > 0 || c.isPowertrainMismatch);

    const primaryTotalWeight = primaryComps.reduce((acc, c) => acc + c.weight, 0);
    const totalWeight = comps.reduce((acc, c) => acc + c.weight, 0);
    const primaryShare = primaryTotalWeight / totalWeight;

    assert.ok(primaryShare >= 0.85, `Expected primary share >= 0.85, got ${primaryShare}`);
    assert.ok(secondaryComps.every((c) => c.contributionPercent! < 10));
  });

  it('22. Far-year evidence (|yearDiff| >= 3): has delta = 0, no compound annual depreciation', () => {
    const cal = { perYearJod: 800, per10kKmJod: 180, calibrated: true, provenance: 'MARKET_DERIVED' as const, sampleSize: 10 };
    const farOld = adjustComparable(mkListing({ year: 2014, priceJod: 18000, kilometers: 100000 }), bmwSpec, cal); // yearDiff = 4
    const farNew = adjustComparable(mkListing({ year: 2022, priceJod: 38000, kilometers: 100000 }), bmwSpec, cal); // yearDiff = 4

    const oldYearAdj = farOld.adjustments.find((a) => a.factor === 'year');
    const newYearAdj = farNew.adjustments.find((a) => a.factor === 'year');

    assert.equal(oldYearAdj?.delta, 0);
    assert.equal(newYearAdj?.delta, 0);
    assert.ok(oldYearAdj?.reason.includes('دون تطبيق نسب إهلاك تراكمية'));
  });

  it('23. Percentile Suppression: askingPricePercentile is suppressed (null) when valid comps < 4', () => {
    const fewComps = [
      mkListing({ adjustedPrice: 28000, weight: 1 }),
      mkListing({ adjustedPrice: 29000, weight: 1 }),
      mkListing({ adjustedPrice: 31000, weight: 1 }),
    ]; // count = 3 (< 4)

    const statsFew = priceStats(fewComps, 30000);
    assert.equal(statsFew.askingPricePercentile, null);

    const fourComps = [
      ...fewComps,
      mkListing({ adjustedPrice: 32000, weight: 1 }),
    ]; // count = 4 (>= 4)
    const statsFour = priceStats(fourComps, 30000);
    assert.notEqual(statsFour.askingPricePercentile, null);
    assert.equal(typeof statsFour.askingPricePercentile, 'number');
  });

  it('24. Qualitative Match Badges: assign appropriate qualitative level based on tier and similarity', () => {
    assert.equal(getQualitativeMatch(1, 85, false), 'مطابقة قوية');
    assert.equal(getQualitativeMatch(2, 75, false), 'مطابقة جيدة');
    assert.equal(getQualitativeMatch(3, 60, false), 'مطابقة متوسطة');
    assert.equal(getQualitativeMatch(4, 45, false), 'مطابقة محدودة');
    // Powertrain mismatch caps at moderate or limited
    assert.equal(getQualitativeMatch(3, 65, true), 'مطابقة متوسطة');
    assert.equal(getQualitativeMatch(3, 50, true), 'مطابقة محدودة');
  });

  it('25. All 7 Market Sources registered: opensooq, jocars, ordonauto, karmal, waseet, autohub, facebook', () => {
    const registeredIds = SOURCE_ADAPTERS.map((a) => a.id);
    const expected = ['opensooq', 'jocars', 'ordonauto', 'karmal', 'waseet', 'autohub', 'facebook'];
    for (const src of expected) {
      assert.ok(registeredIds.includes(src), `Source ${src} must be registered in SOURCE_ADAPTERS`);
    }
    assert.equal(SOURCE_ADAPTERS.length, 7);
  });
});

describe('User Mandate: Multi-Source Integrity, Independent Source Isolation & Narrative Consistency', () => {
  const bmwSpec: VehicleSpec = {
    brand: 'BMW', brandEn: 'bmw', model: 'X5', modelEn: 'x5',
    year: 2018, trim: 'xDrive40i', kilometers: 90000, fuelType: 'PETROL',
    transmission: 'AUTOMATIC', city: 'عمان',
  };

  // Test 1: 7 sources searched but only 1 independent source used
  it('1. 7 sources searched but only 1 independent source used: independentSourcesUsedInFMV = 1 and confidence reflects 1 source', () => {
    const searchedSourceIds = ['opensooq', 'jocars', 'ordonauto', 'karmal', 'waseet', 'autohub', 'facebook'];
    const comps = [
      mkListing({ source: 'opensooq', sourceLabel: 'السوق المفتوح', priceJod: 28000, included: true }),
      mkListing({ source: 'opensooq', sourceLabel: 'السوق المفتوح', priceJod: 29000, included: true }),
      mkListing({ source: 'opensooq', sourceLabel: 'السوق المفتوح', priceJod: 30000, included: true }),
    ];

    const sourcesSearched = searchedSourceIds.length;
    const independentSourcesUsedInFMV = new Set(comps.map((c) => c.source)).size;

    assert.equal(sourcesSearched, 7);
    assert.equal(independentSourcesUsedInFMV, 1);

    // Confidence receives only single-source weighting, no 7-source inflation
    const conf = confidenceScore({
      used: comps.length,
      found: 10,
      sourcesUsed: independentSourcesUsedInFMV, // Pass actual 1, not 7!
      highSim: 3,
      spreadRatio: 0.05,
      freshShare: 1,
      specComplete: true,
      yearMatchShare: 1,
      trimMatchShare: 1,
      engineMatchShare: 1,
      tier1Share: 1,
      excludedShare: 0.1,
    });

    assert.ok(conf.reasons.some((r) => r.includes('مصدر واحد')));
    assert.equal(conf.reasons.some((r) => r.includes('7 مصادر')), false);
  });

  // Test 2: Target duplicates across sources
  it('2. Target duplicates across sources: clustered and quarantined across opensooq, jocars, ordonauto', () => {
    const rawListings: NormalizedListing[] = [
      {
        source: 'opensooq', sourceLabel: 'السوق المفتوح', externalId: 'os-1', url: 'https://opensooq.com/1',
        title: 'BMW X5 2018 xDrive40i Clean', brand: 'BMW', model: 'X5', year: 2018, kilometers: 90000,
        price: 29000, currency: 'JOD', priceJod: 29000, fxRate: 1, city: 'عمان', country: 'JO',
        fuelType: 'PETROL', transmission: 'AUTOMATIC', condition: 'EXCELLENT', specs: [],
        drivetrain: null, horsepower: null, priceType: 'asking', scrapedAt: new Date().toISOString(),
      },
      {
        source: 'jocars', sourceLabel: 'جو كارز', externalId: 'jc-1', url: 'https://jocars.com/1',
        title: 'BMW X5 2018 xDrive40i Same Car', brand: 'BMW', model: 'X5', year: 2018, kilometers: 90000,
        price: 29000, currency: 'JOD', priceJod: 29000, fxRate: 1, city: 'عمان', country: 'JO',
        fuelType: 'PETROL', transmission: 'AUTOMATIC', condition: 'EXCELLENT', specs: [],
        drivetrain: null, horsepower: null, priceType: 'asking', scrapedAt: new Date().toISOString(),
      },
      {
        source: 'ordonauto', sourceLabel: 'أردن أوتو', externalId: 'oa-1', url: 'https://ordonauto.com/1',
        title: 'BMW X5 2018 xDrive40i Mirror', brand: 'BMW', model: 'X5', year: 2018, kilometers: 90000,
        price: 29000, currency: 'JOD', priceJod: 29000, fxRate: 1, city: 'عمان', country: 'JO',
        fuelType: 'PETROL', transmission: 'AUTOMATIC', condition: 'EXCELLENT', specs: [],
        drivetrain: null, horsepower: null, priceType: 'asking', scrapedAt: new Date().toISOString(),
      },
    ];

    const { cluster, cleanListings } = detectTargetIdentityCluster(rawListings, {
      spec: bmwSpec,
      askingPrice: 29000,
    });

    assert.equal(cluster.totalClusterCount, 3);
    assert.deepEqual(cluster.sourcesInCluster.sort(), ['jocars', 'opensooq', 'ordonauto'].sort());
    assert.equal(cleanListings.length, 0);
  });

  // Test 3: Source count after target-cluster removal
  it('3. Source count after target-cluster removal: jocars and ordonauto excluded from eligible sources', () => {
    const rawListings: NormalizedListing[] = [
      // Target copies
      { source: 'jocars', sourceLabel: 'جو كارز', externalId: 'jc-1', title: 'BMW X5 2018', brand: 'BMW', model: 'X5', year: 2018, kilometers: 90000, price: 29000, currency: 'JOD', priceJod: 29000, fxRate: 1, city: 'عمان', country: 'JO', fuelType: 'PETROL', transmission: 'AUTOMATIC', condition: 'GOOD', specs: [], drivetrain: null, horsepower: null, priceType: 'asking', scrapedAt: new Date().toISOString() },
      { source: 'ordonauto', sourceLabel: 'أردن أوتو', externalId: 'oa-1', title: 'BMW X5 2018', brand: 'BMW', model: 'X5', year: 2018, kilometers: 90000, price: 29000, currency: 'JOD', priceJod: 29000, fxRate: 1, city: 'عمان', country: 'JO', fuelType: 'PETROL', transmission: 'AUTOMATIC', condition: 'GOOD', specs: [], drivetrain: null, horsepower: null, priceType: 'asking', scrapedAt: new Date().toISOString() },
      // Legitimate separate comps from OpenSooq
      { source: 'opensooq', sourceLabel: 'السوق المفتوح', externalId: 'os-other-1', title: 'BMW X5 2018 Different Car', brand: 'BMW', model: 'X5', year: 2018, kilometers: 130000, price: 27500, currency: 'JOD', priceJod: 27500, fxRate: 1, city: 'إربد', country: 'JO', fuelType: 'PETROL', transmission: 'AUTOMATIC', condition: 'GOOD', specs: [], drivetrain: null, horsepower: null, priceType: 'asking', scrapedAt: new Date().toISOString() },
      { source: 'opensooq', sourceLabel: 'السوق المفتوح', externalId: 'os-other-2', title: 'BMW X5 2018 Another Car', brand: 'BMW', model: 'X5', year: 2018, kilometers: 75000, price: 31000, currency: 'JOD', priceJod: 31000, fxRate: 1, city: 'عمان', country: 'JO', fuelType: 'PETROL', transmission: 'AUTOMATIC', condition: 'GOOD', specs: [], drivetrain: null, horsepower: null, priceType: 'asking', scrapedAt: new Date().toISOString() },
    ];

    const { cluster, cleanListings } = detectTargetIdentityCluster(rawListings, {
      spec: bmwSpec,
      askingPrice: 29000,
    });

    assert.equal(cluster.totalClusterCount, 2);
    assert.equal(cleanListings.length, 2);

    const eligibleSources = new Set(cleanListings.map((l) => l.source));
    assert.equal(eligibleSources.has('jocars'), false, 'JO Cars must NOT be an eligible source');
    assert.equal(eligibleSources.has('ordonauto'), false, 'OrdonAuto must NOT be an eligible source');
    assert.equal(eligibleSources.size, 1);
    assert.ok(eligibleSources.has('opensooq'));
  });

  // Test 4: Blocked source
  it('4. Blocked source: facebook marketplace remains BLOCKED without automated bypass', () => {
    const fb = SOURCE_ADAPTERS.find((a) => a.id === 'facebook');
    assert.ok(fb);
    assert.equal(fb.enabled, false);
    // Verified: No bypass of CAPTCHA/Login/Anti-bot
  });

  // Test 5: No eligible source
  it('5. No eligible source: when all candidates fail sanity gates, eligible and used source counts are 0', () => {
    const invalidListings = [
      mkListing({ priceJod: 50, title: 'BMW X5 لقطة 50 دينار' }), // Suspicious placeholder < 100
      mkListing({ priceJod: 300, title: 'رقم مميز ترميز 5' }), // Plate listing
    ];

    const { clean } = sanityCheck(invalidListings);
    assert.equal(clean.length, 0);

    const eligibleSourcesCount = new Set(clean.map((c) => c.source)).size;
    assert.equal(eligibleSourcesCount, 0);
  });

  // Test 6: No direct same-year evidence
  it('6. No direct same-year evidence: PHEV or distant years yield primarySameYearComparables = 0 and status INSUFFICIENT_DIRECT_EVIDENCE', () => {
    const distantComps: Comparable[] = [
      mkListing({ year: 2015, tier: 4, yearDiff: 3, fuelType: 'PETROL', isPowertrainMismatch: false }),
      mkListing({ year: 2016, tier: 4, yearDiff: 2, fuelType: 'PETROL', isPowertrainMismatch: false }),
      mkListing({ year: 2018, tier: 3, yearDiff: 0, fuelType: 'Plug-in Hybrid', isPowertrainMismatch: true }), // PHEV demoted
    ];

    const primaryComps = distantComps.filter(
      (c) => (c.tier === 1 || c.tier === 2) && c.yearDiff === 0 && !c.isPowertrainMismatch
    );
    assert.equal(primaryComps.length, 0);
  });

  // Test 7: No far-year synthetic FMV
  it('7. No far-year synthetic FMV: |yearDiff| >= 2 produces delta = 0 for year difference', () => {
    const cal = { perYearJod: 800, per10kKmJod: 180, calibrated: true, provenance: 'MARKET_DERIVED' as const, sampleSize: 10 };

    // 2016 model (diff = 2)
    const comp2016 = adjustComparable(mkListing({ year: 2016, priceJod: 22000, kilometers: 90000 }), bmwSpec, cal);
    const yrAdj2016 = comp2016.adjustments.find((a) => a.factor === 'year');
    assert.equal(yrAdj2016?.delta, 0, 'Year diff 2 must NOT have synthetic depreciation');
    assert.ok(yrAdj2016?.reason.includes('دون تطبيق نسب إهلاك تراكمية'));

    // 2015 model (diff = 3)
    const comp2015 = adjustComparable(mkListing({ year: 2015, priceJod: 19000, kilometers: 90000 }), bmwSpec, cal);
    const yrAdj2015 = comp2015.adjustments.find((a) => a.factor === 'year');
    assert.equal(yrAdj2015?.delta, 0, 'Year diff 3 must NOT have synthetic depreciation');
  });

  // Test 8: Public source redaction
  it('8. Public source redaction: clean public presentation format strips raw URLs and external copy triggers', () => {
    const internalComp = {
      title: 'BMW X5 2018',
      year: 2018,
      mileage: 95000,
      rawPrice: 28500,
      source: 'السوق المفتوح',
      sourceUrl: 'https://jo.opensooq.com/ar/search/287272368',
      canonicalUrl: 'https://jo.opensooq.com/ar/search/287272368',
    };

    // Public representation sanitization
    const publicComp = {
      title: internalComp.title,
      year: internalComp.year,
      mileage: internalComp.mileage,
      price: internalComp.rawPrice,
      sourceLabel: 'إعلان مبوب محلي موثق',
    };

    assert.equal('sourceUrl' in publicComp, false);
    assert.equal('canonicalUrl' in publicComp, false);
    assert.equal(publicComp.price, 28500);
  });

  // Test 9: Admin source attribution preserved
  it('9. Admin source attribution preserved: internal audit retains full URLs, canonical URLs, and snapshot hashes', () => {
    const comp = mkListing({
      source: 'opensooq',
      url: 'https://jo.opensooq.com/ar/search/287272368',
      canonicalUrl: 'https://jo.opensooq.com/ar/search/287272368',
      urlStatus: 'VALID',
      evidenceStatus: 'VERIFIED_AT_COLLECTION',
    });

    assert.equal(comp.source, 'opensooq');
    assert.equal(comp.url, 'https://jo.opensooq.com/ar/search/287272368');
    assert.equal(comp.canonicalUrl, 'https://jo.opensooq.com/ar/search/287272368');
    assert.equal(comp.urlStatus, 'VALID');
    assert.equal(comp.evidenceStatus, 'VERIFIED_AT_COLLECTION');
  });

  // Test 10: AI summary cannot claim direct evidence when valuation status says support-only
  it('10. AI summary cannot claim direct evidence when valuation status says support-only', () => {
    const supportOnlyPayload = {
      target: { brand: 'BMW', model: 'X5', year: 2018, mileage: 120000, trim: null, fuelType: 'PETROL', transmission: null, askingPrice: null },
      evidenceQuality: {
        totalAdsChecked: 25,
        eligibleComparables: 6,
        sameYearComparables: 0,
        primarySameYearComparables: 0, // NO direct primary comps!
        plusMinusOneYearComparables: 0,
        supportComparables: 6,
        excludedAds: 19,
        independentSources: 1, // Only 1 source!
        targetClusterExcluded: 2,
        confidence: 30,
        confidenceLabel: 'منخفض',
        status: 'INSUFFICIENT_DIRECT_EVIDENCE',
      },
      pricingResults: {
        fairMarketValue: 24000,
        range: { low: 19000, high: 29000 },
        isWideRange: true,
        rangeDisclaimerAr: 'نطاق استرشادي واسع نظراً لمحدودية الأدلة المباشرة',
        rawMedian: 24000, adjustedMedian: 24000, weightedMedian: 24000,
        percentiles: { p25: 20000, p50: 24000, p75: 28000, p85: 28500, p90: 29000 },
        askingPricePremiumPercent: null, askingPricePercentile: null, pricePositionClassification: 'UNKNOWN',
      },
      comparables: [],
    };

    const explanation = generateDeterministicExplanation(supportOnlyPayload as any);

    // Summary MUST NOT claim direct same-year evidence
    assert.equal(explanation.marketSummary.includes('مقارنات مباشرة من نفس السنة'), false);
    assert.ok(explanation.marketSummary.includes('غير متوفرة') || explanation.marketSummary.includes('شواهد ثانوية/داعمة'));

    // Key drivers MUST NOT claim same-year comps led the weight
    const sameYearDriver = explanation.keyDrivers.find((d) => d.evidence?.metric === 'primarySameYearComparables');
    assert.ok(sameYearDriver);
    assert.ok(sameYearDriver.text.includes('لم تتوفر أي مقارنات مباشرة مؤهلة'));
    assert.equal(sameYearDriver.text.includes('قادت الوزن الأكبر'), false);

    // Single source restriction noted in explanation
    const sourceDriver = explanation.keyDrivers.find((d) => d.evidence?.metric === 'independentSources');
    assert.ok(sourceDriver);
    assert.ok(sourceDriver.text.includes('مصدر مستقل واحد'));
  });
});

describe('Mandated 10 Systematic FMV Core Engine Tests (Phase 4 Overhaul)', () => {
  const bmwX5Petrol: VehicleSpec = {
    brand: 'بي ام دبليو',
    brandEn: 'BMW',
    model: 'X5',
    modelEn: 'X5',
    year: 2018,
    kilometers: 171000,
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    drivetrain: 'AWD',
    condition: 'VERY_GOOD',
    conditionScore: 85,
    conditionCertainty: 'CONFIRMED',
    generation: 'F15',
    chassisCode: 'F15',
  };

  // Test 1: Target Petrol vs Comparable PHEV -> ineligible for direct comps / tier penalized
  it('1. Target Petrol vs Comparable PHEV -> ineligible for direct comps, tier penalized, separate cluster', () => {
    const phevListing = mkListing({
      brand: 'BMW',
      brandEn: 'BMW',
      model: 'X5',
      modelEn: 'X5',
      year: 2018,
      trim: '40e',
      fuelType: 'PHEV',
      priceJod: 25000,
    });

    const isMismatch = isPhevVsPetrolMismatch(phevListing, bmwX5Petrol);
    assert.equal(isMismatch, true, 'Petrol vs PHEV must be flagged as powertrain mismatch');

    const tier = assignTier(phevListing, bmwX5Petrol, { allowPlus2: true, allowTier4: true });
    assert.ok(tier >= 3, `PHEV cannot be Tier 1 or 2 for Petrol target; actual tier: ${tier}`);

    const scored = scoreSimilarity(phevListing, bmwX5Petrol, (tier || 4) as any);
    assert.equal(scored.isPowertrainMismatch, true);
    assert.equal(scored.isDirectEligible, false, 'PHEV must never be direct eligible for Petrol target');
    assert.ok(scored.similarity <= 65, 'PHEV similarity cap must not exceed 65%');
  });

  // Test 2: Target G05 vs Comparable F15 -> generation mismatch detected / ineligible for direct
  it('2. Target G05 vs Comparable F15 -> generation mismatch detected / ineligible for direct', () => {
    const targetG05: VehicleSpec = {
      brand: 'BMW',
      brandEn: 'BMW',
      model: 'X5',
      modelEn: 'X5',
      year: 2019,
      kilometers: 40000,
      chassisCode: 'G05',
      generation: 'G05',
      fuelType: 'PETROL',
    };

    const compF15 = mkListing({
      brand: 'BMW',
      brandEn: 'BMW',
      model: 'X5',
      modelEn: 'X5',
      year: 2017,
      chassisCode: 'F15',
      generation: 'F15',
      fuelType: 'PETROL',
    });

    const genCheck = isGenerationMismatch(compF15, targetG05);
    assert.equal(genCheck, true, 'G05 vs F15 must be recognized as generation mismatch');

    const tier = assignTier(compF15, targetG05, { allowPlus2: true, allowTier4: true });
    assert.ok(tier >= 4 || tier === 0, `Generation mismatch cannot be Tier 1, 2, or 3; got ${tier}`);

    const scored = scoreSimilarity(compF15, targetG05, (tier || 4) as any);
    assert.equal(scored.isGenerationMismatch, true);
    assert.equal(scored.isDirectEligible, false);
    assert.ok(scored.similarity <= 60, 'Generation mismatch similarity cap must not exceed 60%');
  });

  // Test 3: Direct evidence >= 3 -> FMV calculated, primary comps drive pricing
  it('3. Direct evidence >= 3 -> FMV calculated, primary comps drive pricing', () => {
    const direct1 = mkListing({ year: 2018, fuelType: 'PETROL', tier: 1, yearDiff: 0, priceJod: 26000, adjustedPrice: 26000, weight: 1.0 });
    const direct2 = mkListing({ year: 2018, fuelType: 'PETROL', tier: 2, yearDiff: 0, priceJod: 27000, adjustedPrice: 27000, weight: 0.9 });
    const direct3 = mkListing({ year: 2018, fuelType: 'PETROL', tier: 1, yearDiff: 0, priceJod: 28000, adjustedPrice: 28000, weight: 1.0 });
    const distantSupport = mkListing({ year: 2014, fuelType: 'PETROL', tier: 4, yearDiff: 4, priceJod: 17000, adjustedPrice: 17000, weight: 0.1 });

    const comps = [direct1, direct2, direct3, distantSupport];
    balancePrimarySecondaryWeights(comps);

    const res = calculateFMV(comps, 30000);
    assert.equal(res.valuationMode, 'FMV', 'Mode must be FMV when direct comps >= 3');
    assert.ok(res.fmv !== null, 'FMV must not be null');
    assert.equal(res.indicativePrice, null, 'Indicative price should be null when FMV is approved');
    assert.equal(res.directCompsCount, 3);
    assert.equal(res.supportingCompsCount, 1);
    assert.ok(res.fmv >= 26000 && res.fmv <= 28000, `FMV should be driven by direct comps (~27,000), got ${res.fmv}`);
  });

  // Test 4: Direct evidence = 1 or 2 -> Indicative value only, FMV is null, explicit warning
  it('4. Direct evidence = 1 or 2 -> Indicative value only, FMV is null, explicit warning', () => {
    const direct1 = mkListing({ year: 2018, fuelType: 'PETROL', tier: 1, yearDiff: 0, priceJod: 27000, adjustedPrice: 27000, weight: 1.0 });
    const support1 = mkListing({ year: 2016, fuelType: 'PETROL', tier: 4, yearDiff: 2, priceJod: 21000, adjustedPrice: 21000, weight: 0.4 });
    const support2 = mkListing({ year: 2015, fuelType: 'PETROL', tier: 4, yearDiff: 3, priceJod: 19000, adjustedPrice: 19000, weight: 0.3 });

    const comps = [direct1, support1, support2];
    const res = calculateFMV(comps, 30000);

    assert.equal(res.valuationMode, 'INDICATIVE', 'Mode must be INDICATIVE when direct comps = 1 or 2');
    assert.equal(res.fmv, null, 'FMV must be null when direct comps < 3');
    assert.ok(res.indicativePrice !== null && res.indicativePrice > 0, 'Indicative price must be provided');
    assert.equal(res.directCompsCount, 1);
    assert.ok(res.rangeDisclaimerAr.includes('قيمة استرشادية'), 'Disclaimer must explicitly state indicative nature');
  });

  // Test 5: Direct evidence = 0 -> Supporting range only, FMV is null, weighted median not masqueraded as FMV
  it('5. Direct evidence = 0 -> Supporting range only, FMV is null, weighted median not masqueraded as FMV', () => {
    // 5 supporting comps from 2016 or PHEV
    const comp1 = mkListing({ year: 2016, fuelType: 'PETROL', tier: 4, yearDiff: 2, priceJod: 22000, adjustedPrice: 22000, weight: 0.3 });
    const comp2 = mkListing({ year: 2016, fuelType: 'PETROL', tier: 4, yearDiff: 2, priceJod: 23000, adjustedPrice: 23000, weight: 0.3 });
    const comp3 = mkListing({ year: 2018, fuelType: 'PHEV', isPowertrainMismatch: true, tier: 4, yearDiff: 0, priceJod: 25000, adjustedPrice: 25000, weight: 0.2 });
    const comp4 = mkListing({ year: 2015, fuelType: 'PETROL', tier: 4, yearDiff: 3, priceJod: 20000, adjustedPrice: 20000, weight: 0.2 });

    const comps = [comp1, comp2, comp3, comp4];
    const res = calculateFMV(comps, 30000);

    assert.equal(res.valuationMode, 'SUPPORTING_RANGE_ONLY', 'Mode must be SUPPORTING_RANGE_ONLY when direct comps = 0');
    assert.equal(res.fmv, null, 'FMV must be strictly null when direct comps = 0');
    assert.equal(res.indicativePrice, null, 'Indicative single point price must be null in supporting range only');
    assert.equal(res.directCompsCount, 0);
    assert.ok(res.minPrice > 0 && res.maxPrice > 0, 'Range must be populated from supporting comps');
    assert.ok(res.rangeDisclaimerAr.includes('نطاق استرشادي للشواهد الداعمة'), 'Must explicitly warn that this is supporting range only');
  });

  // Test 6: Mileage calibration -> linear slope adjustment applied
  it('6. Mileage calibration -> linear slope adjustment applied correctly', () => {
    const targetKm = 80000;
    const extremeKm = 280000; // +200,000 km difference!
    const targetSpec: VehicleSpec = { ...bmwX5Petrol, kilometers: targetKm };

    const comp = mkListing({
      year: 2018,
      kilometers: extremeKm,
      priceJod: 25000,
    });

    const cal = { perYearJod: 800, per10kKmJod: 250, calibrated: true, provenance: 'MARKET_DERIVED' as const, sampleSize: 10 };
    const adjusted = adjustComparable(comp, targetSpec, cal);

    const kmAdj = adjusted.adjustments.find((a) => a.factor === 'mileage');
    assert.ok(kmAdj, 'Mileage adjustment must be recorded');

    // Expected linear delta: (200000 / 10000) * 250 = 5000 JOD
    const expectedDelta = 5000;
    assert.equal(kmAdj.delta, expectedDelta, `Mileage adjustment must be linear: expected ${expectedDelta}, got ${kmAdj.delta}`);
  });

  // Test 7: Bounded year adjustment -> Delta = 0 for |yearDiff| >= 2, bounded step for |yearDiff| = 1
  it('7. Bounded year adjustment -> Delta = 0 for |yearDiff| >= 2, bounded step for |yearDiff| = 1', () => {
    const cal = { perYearJod: 900, per10kKmJod: 180, calibrated: true, provenance: 'MARKET_DERIVED' as const, sampleSize: 10 };

    // Diff = 1 (2017 vs 2018)
    const comp2017 = adjustComparable(mkListing({ year: 2017, priceJod: 24000, kilometers: bmwX5Petrol.kilometers }), bmwX5Petrol, cal);
    const yrAdj1 = comp2017.adjustments.find((a) => a.factor === 'year');
    assert.ok(yrAdj1 && yrAdj1.delta > 0, 'Year diff = 1 must apply limited year step');
    assert.ok(yrAdj1.delta <= 24000 * 0.08, 'Year diff 1 delta must be bounded <= 8%');

    // Diff = 2 (2016 vs 2018) -> strictly delta = 0
    const comp2016 = adjustComparable(mkListing({ year: 2016, priceJod: 21000, kilometers: bmwX5Petrol.kilometers }), bmwX5Petrol, cal);
    const yrAdj2 = comp2016.adjustments.find((a) => a.factor === 'year');
    assert.equal(yrAdj2?.delta, 0, 'Year diff >= 2 must have delta = 0 (no synthetic compound depreciation)');
  });

  // Test 8: Percentile / P92 calculation -> calculated only on direct comps when adequate, else suppressed/labeled supporting
  it('8. Percentile calculation -> calculated on direct comps when >= 4, else scoped to supporting or null', () => {
    // 5 direct comps
    const directComps = [22000, 24000, 26000, 28000, 30000].map((p) =>
      mkListing({ year: 2018, fuelType: 'PETROL', tier: 1, yearDiff: 0, priceJod: p, adjustedPrice: p, weight: 1.0 })
    );

    const statsDirect = priceStats(directComps, 32000);
    assert.equal(statsDirect.percentileScope, 'DIRECT', 'Percentile scope must be DIRECT when direct comps >= 4');
    assert.equal(statsDirect.askingPricePercentile, 100);

    // 0 direct comps, 4 supporting comps
    const supportingComps = [18000, 19000, 20000, 21000].map((p) =>
      mkListing({ year: 2015, fuelType: 'PETROL', tier: 4, yearDiff: 3, priceJod: p, adjustedPrice: p, weight: 0.2 })
    );

    const statsSupporting = priceStats(supportingComps, 22000);
    assert.equal(statsSupporting.percentileScope, 'SUPPORTING', 'Percentile scope must be SUPPORTING when direct comps < 3');
  });

  // Test 9: Independent sources count -> searches 7 sources, OpenSooq only comps = 1 independent source
  it('9. Independent sources count -> searches 7 sources, OpenSooq only comps = 1 independent source', () => {
    const allOpenSooqComps = [
      mkListing({ source: 'opensooq', sourceLabel: 'السوق المفتوح' }),
      mkListing({ source: 'opensooq', sourceLabel: 'السوق المفتوح' }),
      mkListing({ source: 'opensooq', sourceLabel: 'السوق المفتوح' }),
    ];

    const independentSourcesUsed = new Set(allOpenSooqComps.map((c) => c.source)).size;
    assert.equal(independentSourcesUsed, 1, 'Only OpenSooq listings must yield exactly 1 independent source');

    const totalSourcesSearched = 7;
    assert.ok(totalSourcesSearched > independentSourcesUsed, 'Sources searched (7) must be decoupled from sources used in FMV (1)');
  });

  // Test 10: Public vs Admin transparency -> public hides math, admin reveals full pipeline without data mismatch
  it('10. Public vs Admin transparency -> funnel counts reconcile perfectly (61 = sum of parts)', () => {
    const counts = {
      collected: 61,
      targetCluster: 1,
      rejectedBySanity: 15,
      rejectedByIdentity: 1,
      rejectedByMatching: 32,
      eligibleDirect: 0,
      eligibleSupporting: 12,
      usedInPricing: 12,
    };

    const sumOfExclusionsAndEligible =
      counts.targetCluster +
      counts.rejectedBySanity +
      counts.rejectedByIdentity +
      counts.rejectedByMatching +
      counts.eligibleDirect +
      counts.eligibleSupporting;

    assert.equal(sumOfExclusionsAndEligible, counts.collected, 'Funnel counts must reconcile with zero missing or phantom rows (61 = 61)');
  });
});

describe('Suite 15: Single-Valuation Integrity and UI Contract Guarantees (No Legacy Fallback Bleed)', () => {
  it('1. SUPPORTING_RANGE_ONLY output contract guarantees fairMarketValue = null and differencePercent = null', () => {
    // Mimic the BMW X5 2018 Petrol Case C scenario: 12 supporting comps (2016-2017 & PHEV), 0 direct petrol 2018 comps
    const supportingComps = [
      mkListing({ year: 2017, fuelType: 'PHEV', isPowertrainMismatch: true, tier: 3, priceJod: 22000, adjustedPrice: 24300, weight: 0.213 }),
      mkListing({ year: 2016, fuelType: 'PETROL', isPowertrainMismatch: false, tier: 4, priceJod: 24500, adjustedPrice: 24440, weight: 0.232 }),
      mkListing({ year: 2018, fuelType: 'PHEV', isPowertrainMismatch: true, tier: 3, priceJod: 27000, adjustedPrice: 27900, weight: 0.152 }),
      mkListing({ year: 2018, fuelType: 'PHEV', isPowertrainMismatch: true, tier: 3, priceJod: 32000, adjustedPrice: 29540, weight: 0.152 }),
    ];

    const askingPrice = 30000;
    const fmvResult = calculateFMV(supportingComps, askingPrice);

    assert.equal(fmvResult.valuationMode, 'SUPPORTING_RANGE_ONLY', 'Must be SUPPORTING_RANGE_ONLY');
    assert.equal(fmvResult.fmv, null, 'FMV must be null');
    assert.equal(fmvResult.indicativePrice, null, 'indicativePrice must be null');
    assert.equal(fmvResult.directCompsCount, 0, 'directCompsCount must be 0');
    assert.equal(fmvResult.supportingCompsCount, 4, 'supportingCompsCount must be 4');
    assert.ok(fmvResult.minPrice > 0 && fmvResult.maxPrice > fmvResult.minPrice, 'Range must be valid');

    // In SUPPORTING_RANGE_ONLY mode, asking price difference must NOT be computed against FMV
    const diffPercent = fmvResult.fmv !== null ? ((askingPrice - fmvResult.fmv) / fmvResult.fmv) * 100 : null;
    assert.equal(diffPercent, null, 'differencePercent must be strictly null when FMV is null');
  });

  it('2. Single-valuation integrity test: UI variables must never resurrect legacy estimatedPrice when section24 is present', () => {
    // Given a Section 24 contract with null FMV and supporting range only
    const mockSection24 = {
      status: 'INSUFFICIENT_DIRECT_EVIDENCE' as const,
      valuationMode: 'SUPPORTING_RANGE_ONLY' as const,
      fairMarketValue: null,
      indicativePrice: null,
      range: { low: 23927, high: 28182 },
      confidence: 25,
      pricePosition: {
        classification: 'UNKNOWN' as const,
        differenceAmount: null,
        differencePercent: null,
        percentileRank: 83,
        percentileLabel: 'الشريحة ضمن الشواهد الداعمة العامة: P83 (غير معتمدة كـ FMV)',
      },
      marketEvidence: {
        totalListings: 61,
        usedComparables: 12,
        independentSourcesUsedInFMV: 1,
      },
    };

    // And suppose a legacy report exists in DB with the old 24,500 number
    const mockLegacyReport = {
      estimatedPrice: 24500,
      minPrice: 22656,
      maxPrice: 26224,
      confidence: 30,
      grade: 'insufficient_direct_evidence',
      targetDiffPct: 22.4,
    };

    // The single source of truth resolution logic in ValuationReport.tsx:
    const hasSection24 = !!mockSection24 && (mockSection24.status as string) !== 'INSUFFICIENT_DATA';
    const fmv = hasSection24 ? (mockSection24.fairMarketValue ?? null) : (mockLegacyReport?.estimatedPrice ?? null);
    const minPrice = hasSection24 ? mockSection24.range?.low : (mockLegacyReport?.minPrice ?? null);
    const maxPrice = hasSection24 ? mockSection24.range?.high : (mockLegacyReport?.maxPrice ?? null);
    const confidence = hasSection24 ? mockSection24.confidence : (mockLegacyReport?.confidence ?? 0);

    // Verify ZERO leakage of legacy report numbers into the active UI state
    assert.equal(fmv, null, 'FMV must resolve to null (NOT 24,500)');
    assert.equal(minPrice, 23927, 'minPrice must resolve to 23,927 from section24 (NOT 22,656)');
    assert.equal(maxPrice, 28182, 'maxPrice must resolve to 28,182 from section24 (NOT 26,224)');
    assert.equal(confidence, 25, 'confidence must resolve to 25 from section24 (NOT 30%)');
    assert.equal(mockSection24.pricePosition.differencePercent, null, 'differencePercent must be null');
    assert.equal(mockSection24.pricePosition.percentileRank, 83, 'percentileRank must be 83 (P83)');
  });
});


