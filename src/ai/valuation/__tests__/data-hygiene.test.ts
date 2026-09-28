/**
 * Phase 5 — data hygiene (spec §5):
 *  1) trim never holds drivetrain tokens (Car.trim="AWD" pollution) — and the
 *     value is separated into drivetrain, not silently dropped information.
 *  2) transition-year generation resolution is order-independent (no `matches[0]`).
 *  3) independentSourcesUsedInFMV counts only sources that drive the displayed
 *     number (direct-only in FMV mode; all included comps otherwise).
 * Pure deterministic modules only — no DB, no network, no LLM.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeTrim, drivetrainFromTrim } from '../spec-extract';
import { KNOWN_MODEL_GENERATIONS, resolveGeneration, assignTier, scoreSimilarity, isDirectComparable } from '../similarity';
import { sourcesDrivingNumber } from '../price';
import type { Comparable, NormalizedListing, VehicleSpec } from '../types';

describe('Phase 5: trim/drivetrain separation', () => {
  it('pure drivetrain tokens are NOT trim values', () => {
    for (const v of ['AWD', 'awd', '4WD', 'FWD', 'RWD', '2WD', '4X4', 'AWD/4WD', 'دفع رباعي', 'رباعي', 'دفع خلفي', '  AWD  ']) {
      assert.equal(sanitizeTrim(v), null, `"${v}" must not survive as trim`);
    }
    assert.equal(sanitizeTrim(null), null);
    assert.equal(sanitizeTrim(''), null);
  });

  it('real trim values are preserved', () => {
    assert.equal(sanitizeTrim('XDRIVE40E'), 'XDRIVE40E');
    assert.equal(sanitizeTrim('xDrive40e'), 'xDrive40e');
    assert.equal(sanitizeTrim('LE'), 'LE');
    assert.equal(sanitizeTrim('PLATINUM'), 'PLATINUM');
    // embedded drivetrain token removed, remainder kept
    assert.equal(sanitizeTrim('XDRIVE40E AWD'), 'XDRIVE40E');
    assert.equal(sanitizeTrim('40e 4wd'), '40e');
  });

  it('drivetrain tokens in trim are recovered into drivetrain (value is separated, not lost)', () => {
    assert.equal(drivetrainFromTrim('AWD'), 'AWD');
    assert.equal(drivetrainFromTrim('4wd'), 'AWD');
    assert.equal(drivetrainFromTrim('rwd'), 'RWD');
    assert.equal(drivetrainFromTrim('FWD'), 'FWD');
    assert.equal(drivetrainFromTrim('دفع رباعي'), 'AWD');
    assert.equal(drivetrainFromTrim('دفع خلفي'), 'RWD');
    // real trims carry no drivetrain information
    assert.equal(drivetrainFromTrim('XDRIVE40E'), null);
    assert.equal(drivetrainFromTrim('LE'), null);
    assert.equal(drivetrainFromTrim(null), null);
  });
});

describe('Phase 5: transition-year generation resolution (no matches[0] dependency)', () => {
  it('2013 X5 transition year resolves deterministically to the established generation (E70)', () => {
    // 2013 is covered by both E70 (2007-2013) and F15 (2013-2018).
    assert.equal(resolveGeneration('BMW', 'X5', 2013, ''), 'E70');
  });

  it('result is independent of declaration order in KNOWN_MODEL_GENERATIONS', () => {
    const original = KNOWN_MODEL_GENERATIONS['x5'];
    KNOWN_MODEL_GENERATIONS['x5'] = [...original].reverse();
    try {
      // old `matches[0]` returned F15 here after reversal; the fixed rule must not.
      assert.equal(resolveGeneration('BMW', 'X5', 2013, ''), 'E70',
        'transition-year result must not depend on array order');
    } finally {
      KNOWN_MODEL_GENERATIONS['x5'] = original;
    }
  });

  it('explicit keyword evidence still overrides the year default', () => {
    assert.equal(resolveGeneration('BMW', 'X5', 2013, 'f15'), 'F15');
  });

  it('non-transition years are unchanged', () => {
    assert.equal(resolveGeneration('BMW', 'X5', 2016, ''), 'F15');
    assert.equal(resolveGeneration('BMW', 'X5', 2021, ''), 'G05');
    assert.equal(resolveGeneration('BMW', 'X5', 2010, ''), 'E70'); // E70 range only
  });
});

describe('Phase 5: independentSourcesUsedInFMV counts only number-driving sources', () => {
  const spec: VehicleSpec = {
    brand: 'BMW', brandEn: 'bmw', model: 'X5', modelEn: 'X5',
    year: 2018, trim: null, kilometers: 150000, fuelType: 'PHEV',
    transmission: 'AUTOMATIC', drivetrain: 'AWD', city: 'عمان',
  };

  function mkComparable(source: string, over: Partial<NormalizedListing>): Comparable {
    const l: NormalizedListing = {
      source, sourceLabel: source, externalId: `${source}-1`,
      brand: 'BMW', brandEn: 'bmw', model: 'X5', modelEn: 'X5',
      year: 2018, kilometers: 150000, price: 25000, currency: 'JOD',
      priceJod: 25000, fxRate: 1, country: 'JO', priceType: 'asking',
      fuelType: 'PHEV', transmission: 'AUTOMATIC', drivetrain: 'AWD',
      specs: [], scrapedAt: '2026-01-01T00:00:00.000Z', ...over,
    } as NormalizedListing;
    const tier = assignTier(l, spec);
    assert.notEqual(tier, 0, `tier for ${source}`);
    return scoreSimilarity(l, spec, tier as 1 | 2 | 3 | 4);
  }

  // 4 direct comps across 3 sources (srcA contributes 2)
  const direct = [
    mkComparable('srcA', { externalId: 'a1' }),
    mkComparable('srcA', { externalId: 'a2' }),
    mkComparable('srcB', { externalId: 'b1' }),
    mkComparable('srcC', { externalId: 'c1' }),
  ];
  // 2 supporting comps (petrol vs PHEV target => tier 3, never Direct) from 2 more sources
  const supporting = [
    mkComparable('srcD', { externalId: 'd1', fuelType: 'PETROL' }),
    mkComparable('srcE', { externalId: 'e1', fuelType: 'PETROL' }),
  ];
  const all = [...direct, ...supporting];

  it('fixtures: direct vs supporting split is correct', () => {
    assert.equal(direct.filter((c) => isDirectComparable(c)).length, 4, 'all 4 direct comps eligible');
    assert.equal(supporting.filter((c) => isDirectComparable(c)).length, 0, 'supporting comps never Direct');
  });

  it('FMV mode counts ONLY distinct sources of direct comps (3, not 5)', () => {
    assert.equal(sourcesDrivingNumber('FMV', all), 3);
  });

  it('INDICATIVE / SUPPORTING modes count every included source (combined estimate uses all)', () => {
    assert.equal(sourcesDrivingNumber('INDICATIVE', all), 5);
    assert.equal(sourcesDrivingNumber('SUPPORTING_RANGE_ONLY', all), 5);
  });

  it('empty/direct-only inputs behave predictably', () => {
    assert.equal(sourcesDrivingNumber('FMV', []), 0);
    assert.equal(sourcesDrivingNumber('FMV', direct), 3);
  });
});
