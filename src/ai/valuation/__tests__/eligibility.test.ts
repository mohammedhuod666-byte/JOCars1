/**
 * Phase 2 — Direct-eligibility single-definition tests (spec §2).
 * Run: npx tsx --test src/ai/valuation/__tests__/eligibility.test.ts
 *
 * Mandate:
 *  - confirmed Petrol/Diesel mismatch      => ineligible for Direct
 *  - confirmed AWD/FWD and AWD/RWD mismatch => ineligible for Direct
 *  - UNKNOWN drivetrain                    => must NOT become a mismatch
 *  - PHEV vs Petrol                        => no Direct (existing behaviour kept)
 *  - matching fuel + drivetrain + year/spec => Direct possible
 *  - isDirectEligible / assignTier / price.ts share ONE predicate
 * Pure deterministic modules only — no DB, no network, no LLM.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assignTier, scoreSimilarity, isDirectComparable, canonFuel, canonDrivetrain, isConfirmedFuelMismatch, isConfirmedDrivetrainMismatch, isPhevVsPetrolMismatch } from '../similarity';
import { calculateFMV, priceStats, balancePrimarySecondaryWeights } from '../price';
import type { Comparable, NormalizedListing, VehicleSpec } from '../types';

const baseSpec: VehicleSpec = {
  brand: 'بي ام دبليو', brandEn: 'bmw', model: 'X5', modelEn: 'x5',
  year: 2018, trim: 'AWD', kilometers: 171000, fuelType: 'PETROL',
  transmission: 'AUTOMATIC', drivetrain: 'AWD', city: 'عمان',
};

function mk(over: Partial<NormalizedListing> = {}): NormalizedListing {
  return {
    source: 'opensooq', sourceLabel: 'OpenSooq', externalId: 'e1',
    title: 'BMW X5 2018',
    brand: 'بي ام دبليو', brandEn: 'bmw', model: 'X5', modelEn: 'x5',
    year: 2018, trim: 'AWD', kilometers: 170000,
    price: 25000, currency: 'JOD', priceJod: 25000, fxRate: 1,
    city: 'عمان', country: 'JO', fuelType: 'PETROL',
    transmission: 'AUTOMATIC', drivetrain: 'AWD',
    priceType: 'asking', specs: [], scrapedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  } as NormalizedListing;
}

/** listing -> tier -> similarity -> Comparable (the real pipeline path). */
function build(spec: VehicleSpec, over: Partial<NormalizedListing>[]): Comparable[] {
  return over.map((o, i) => {
    const l = mk({ externalId: `e${i}`, ...o });
    const tier = assignTier(l, spec);
    assert.notEqual(tier, 0, `comparable ${i} must survive tiering`);
    return scoreSimilarity(l, spec, tier as 1 | 2 | 3 | 4);
  });
}

describe('Phase 2: canonical helpers', () => {
  it('canonFuel collapses synonyms and reports unknown safely', () => {
    assert.equal(canonFuel('PETROL'), 'petrol');
    assert.equal(canonFuel('بنزين'), 'petrol');
    assert.equal(canonFuel('DIESEL', 'ديزل'), 'diesel');
    assert.equal(canonFuel('Plug-in Hybrid 40e'), 'phev');
    assert.equal(canonFuel(null), 'unknown');
    assert.equal(canonFuel('', '', 'AWD'), 'unknown');
  });

  it('canonDrivetrain collapses 4WD/AWD/4x4 and never maps empty to a family', () => {
    assert.equal(canonDrivetrain('AWD'), 'awd');
    assert.equal(canonDrivetrain('4WD'), 'awd');
    assert.equal(canonDrivetrain('4x4'), 'awd');
    assert.equal(canonDrivetrain('دفع رباعي'), 'awd');
    assert.equal(canonDrivetrain('FWD'), 'fwd');
    assert.equal(canonDrivetrain('RWD'), 'rwd');
    assert.equal(canonDrivetrain(null), 'unknown');
    assert.equal(canonDrivetrain(''), 'unknown');
    assert.equal(canonDrivetrain('UNKNOWN'), 'unknown');
    assert.equal(canonDrivetrain('2WD'), 'unknown');
  });

  it('UNKNOWN never counts as a confirmed mismatch (fuel or drivetrain)', () => {
    const spec = baseSpec;
    assert.equal(isConfirmedFuelMismatch(mk({ fuelType: null }), spec), false);
    assert.equal(isConfirmedDrivetrainMismatch(mk({ drivetrain: null }), spec), false);
    assert.equal(isConfirmedDrivetrainMismatch(mk({ drivetrain: 'unknown' }), spec), false);
    // Both known and different => confirmed
    assert.equal(isConfirmedFuelMismatch(mk({ fuelType: 'DIESEL' }), spec), true);
    assert.equal(isConfirmedDrivetrainMismatch(mk({ drivetrain: 'FWD' }), spec), true);
    // Same family expressed differently => NOT a mismatch
    assert.equal(isConfirmedDrivetrainMismatch(mk({ drivetrain: '4WD' }), spec), false);
    assert.equal(isConfirmedFuelMismatch(mk({ fuelType: 'بنزين' }), spec), false);
  });

  it('PHEV vs Petrol behaviour is unchanged', () => {
    assert.equal(isPhevVsPetrolMismatch(mk({ fuelType: 'Plug-in Hybrid' }), baseSpec), true);
    assert.equal(isConfirmedFuelMismatch(mk({ fuelType: 'Plug-in Hybrid' }), baseSpec), true);
  });
});

describe('Phase 2: mandated eligibility cases', () => {
  it('Case 1 — Petrol target + 3 Diesel comparables => directCompsCount = 0', () => {
    const comps = build(baseSpec, [
      { fuelType: 'DIESEL', drivetrain: 'AWD' },
      { fuelType: 'DIESEL', drivetrain: 'AWD' },
      { fuelType: 'ديزل', drivetrain: 'AWD' },
    ]);
    for (const c of comps) assert.equal(c.isFuelMismatch, true, 'confirmed fuel mismatch flag');
    assert.equal(comps.every((c) => !c.isDirectEligible), true);
    const fmv = calculateFMV(comps, 30000);
    assert.equal(fmv.directCompsCount, 0);
    assert.equal(fmv.fmv, null);
    assert.equal(fmv.valuationMode, 'SUPPORTING_RANGE_ONLY');
  });

  it('Case 2 — AWD target + FWD comparables => directCompsCount = 0', () => {
    const comps = build(baseSpec, [
      { drivetrain: 'FWD' },
      { drivetrain: 'FWD' },
      { drivetrain: 'FWD' },
    ]);
    for (const c of comps) assert.equal(c.isDrivetrainMismatch, true, 'confirmed drivetrain mismatch flag');
    const fmv = calculateFMV(comps, 30000);
    assert.equal(fmv.directCompsCount, 0);
    assert.equal(fmv.fmv, null);
    assert.equal(fmv.valuationMode, 'SUPPORTING_RANGE_ONLY');
  });

  it('Case 3 — AWD target + RWD comparables => directCompsCount = 0', () => {
    const comps = build(baseSpec, [
      { drivetrain: 'RWD' },
      { drivetrain: 'RWD' },
      { drivetrain: 'RWD' },
    ]);
    for (const c of comps) assert.equal(c.isDrivetrainMismatch, true);
    const fmv = calculateFMV(comps, 30000);
    assert.equal(fmv.directCompsCount, 0);
    assert.equal(fmv.fmv, null);
  });

  it('Case 4 — UNKNOWN drivetrain is NOT auto-rejected: Direct remains possible', () => {
    const comps = build(baseSpec, [
      { drivetrain: null },
      { drivetrain: null },
      { drivetrain: null },
    ]);
    for (const c of comps) assert.equal(c.isDrivetrainMismatch ?? false, false, 'unknown must not be a mismatch');
    assert.equal(comps.every((c) => isDirectComparable(c)), true, 'unknown drivetrain comps stay Direct-eligible');
    const fmv = calculateFMV(comps, 30000);
    assert.equal(fmv.directCompsCount, 3, 'UNKNOWN drivetrain must not collapse the direct set');
    assert.equal(fmv.valuationMode, 'FMV');
    assert.equal(typeof fmv.fmv, 'number');
  });

  it('Case 5 — PHEV vs Petrol => no Direct', () => {
    const comps = build(baseSpec, [
      { fuelType: 'Plug-in Hybrid 40e', drivetrain: 'AWD' },
      { fuelType: 'Plug-in Hybrid 40e', drivetrain: 'AWD' },
      { fuelType: 'Plug-in Hybrid 40e', drivetrain: 'AWD' },
    ]);
    for (const c of comps) {
      assert.equal(c.isPowertrainMismatch, true, 'PHEV must stay a powertrain mismatch');
      assert.equal(c.isDirectEligible, false, 'PHEV must never be direct eligible for Petrol target');
    }
    const fmv = calculateFMV(comps, 30000);
    assert.equal(fmv.directCompsCount, 0);
    assert.equal(fmv.fmv, null);
  });

  it('Case 6 — matching fuel + drivetrain + year/spec => Direct possible (FMV allowed)', () => {
    const comps = build(baseSpec, [
      { kilometers: 165000, trim: 'AWD' },
      { kilometers: 172000, trim: 'AWD' },
      { kilometers: 168000, trim: 'AWD' },
    ]);
    for (const c of comps) {
      assert.equal(c.tier, 1, 'fully matching comparable must be Tier 1');
      assert.equal(c.isDirectEligible, true);
      assert.equal(isDirectComparable(c), true);
    }
    const fmv = calculateFMV(comps, 30000);
    assert.equal(fmv.directCompsCount, 3);
    assert.equal(fmv.valuationMode, 'FMV');
    assert.equal(typeof fmv.fmv, 'number');
    assert.equal(fmv.supportingCompsCount, 0);
  });
});

describe('Phase 2: one eligibility definition across modules', () => {
  it('scoreSimilarity.isDirectEligible === isDirectComparable for every comparable', () => {
    const comps = build(baseSpec, [
      { fuelType: 'DIESEL' },
      { drivetrain: 'FWD' },
      { drivetrain: null },
      { fuelType: 'Plug-in Hybrid 40e' },
      {},
      { year: 2017 },
      { year: 2019 },
    ]);
    for (const c of comps) {
      assert.equal(
        c.isDirectEligible ?? false,
        isDirectComparable(c),
        `flag/predicate disagreement on ${c.externalId} (tier ${c.tier}, yd ${c.yearDiff})`
      );
    }
  });

  it('price.ts partitions (stats + calculateFMV) equal the shared predicate', () => {
    const comps = build(baseSpec, [
      { fuelType: 'DIESEL' },
      { drivetrain: 'FWD' },
      { drivetrain: null },
      { drivetrain: null },
      {},
      { year: 2017 },
    ]);
    const stats = priceStats(comps, 30000);
    const fmv = calculateFMV(comps, 30000);
    const expectedDirect = comps.filter((c) => isDirectComparable(c)).length;
    assert.equal(fmv.directCompsCount, expectedDirect, 'calculateFMV must use the shared predicate');
    assert.equal(fmv.supportingCompsCount, comps.length - expectedDirect);
    assert.equal(stats.percentileScope !== undefined, true);
    // balancePrimarySecondaryWeights must split by the SAME predicate
    const balanced = balancePrimarySecondaryWeights(comps.map((c) => ({ ...c })));
    const primaryTotal = balanced.filter((c) => isDirectComparable(c)).reduce((s, c) => s + c.weight, 0);
    const secondaryTotal = balanced.filter((c) => !isDirectComparable(c)).reduce((s, c) => s + c.weight, 0);
    assert.equal(primaryTotal + secondaryTotal > 0, true);
  });

  it('legacy rows without new flags are treated as "no confirmed mismatch" (never auto-rejected)', () => {
    const legacy = {
      tier: 1,
      yearDiff: 0,
      isPowertrainMismatch: false,
      isGenerationMismatch: false,
      // no isFuelMismatch / isDrivetrainMismatch on old stored rows
    } as Partial<Comparable>;
    assert.equal(isDirectComparable(legacy as Comparable), true);
    // ...but a mismatch flag still excludes
    assert.equal(isDirectComparable({ ...legacy, isFuelMismatch: true } as Comparable), false);
    assert.equal(isDirectComparable({ ...legacy, isDrivetrainMismatch: true } as Comparable), false);
    // ...and tier/Year rules still hold
    assert.equal(isDirectComparable({ ...legacy, tier: 3 } as Comparable), false);
    assert.equal(isDirectComparable({ ...legacy, yearDiff: 1 } as Comparable), false);
    assert.equal(isDirectComparable({ ...legacy, yearDiff: undefined as unknown as number, year: 2018 }, 2018), true);
    assert.equal(isDirectComparable({ ...legacy, yearDiff: undefined as unknown as number, year: 2017 }, 2018), false);
  });
});
