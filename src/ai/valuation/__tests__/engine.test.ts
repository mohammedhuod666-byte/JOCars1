/**
 * Valuation engine unit tests (spec §14).
 * Run: npx tsx --test src/ai/valuation/__tests__/engine.test.ts
 * Pure deterministic modules only — no DB, no network, no LLM.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseKilometers, parsePrice, toJod, normalizeTrim, contentHash } from '../normalize';
import { extractSpecsFromTitle } from '../spec-extract';
import { assignTier, scoreSimilarity, isTargetCopy } from '../similarity';
import { dedupeExact, dedupeNear, iqrFences, flagOutliers, sanityCheck } from '../outliers';
import { adjustComparable, calibrate } from '../adjust';
import { weightedMedian, weightedAvg, confidenceScore, computeWeight } from '../price';
import type { Comparable, VehicleSpec } from '../types';

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
    assert.equal(assignTier(mkListing({ year: 2020 }), spec), 3);
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
    const cal = { perYearJod: 700, per10kKmJod: 180, calibrated: false };
    const newer = adjustComparable(mkListing({ year: 2024, priceJod: 15000, kilometers: 80000 }), spec, cal);
    const older = adjustComparable(mkListing({ year: 2020, priceJod: 11000, kilometers: 80000 }), spec, cal);
    assert.ok(newer.adjustedPrice! < 15000);
    assert.ok(older.adjustedPrice! > 11000);
    assert.ok(newer.adjustments.some((a) => a.factor === 'year'));
  });
  it('higher-km comp gets wear added back', () => {
    const cal = { perYearJod: 700, per10kKmJod: 180, calibrated: false };
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
