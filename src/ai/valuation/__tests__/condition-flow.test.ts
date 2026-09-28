/**
 * Phase 4 — Condition data flow (spec §5):
 * Target condition -> normalized conditionScore/provenance -> similarity/adjustment.
 * Invariants:
 *  - declared enum => INFERRED score (never CONFIRMED: no inspection backs it)
 *  - absent/unknown/untrusted => { null, 'UNKNOWN' } — NEVER assumes EXCELLENT
 *  - UNKNOWN target condition must not fabricate any condition adjustment
 * Pure deterministic modules only — no DB, no network, no LLM.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTargetCondition } from '../spec-extract';
import { adjustComparable, calibrate } from '../adjust';
import { assignTier, scoreSimilarity } from '../similarity';
import type { Comparable, NormalizedListing, VehicleSpec } from '../types';

const baseSpec: VehicleSpec = {
  brand: 'تويوتا', brandEn: 'toyota', model: 'كامري', modelEn: 'camry',
  year: 2022, trim: 'LE', kilometers: 80000, fuelType: 'PETROL',
  transmission: 'AUTOMATIC', drivetrain: 'FWD', city: 'عمان',
};

function mkListing(over: Partial<NormalizedListing>): NormalizedListing {
  return {
    source: 'opensooq', sourceLabel: 'OpenSooq', externalId: 'e1',
    title: 'Camry 2022', brand: 'تويوتا', brandEn: 'toyota', model: 'كامري', modelEn: 'camry',
    year: 2022, trim: 'LE', kilometers: 80000, price: 10000, currency: 'JOD',
    priceJod: 10000, fxRate: 1, city: 'عمان', country: 'JO', fuelType: 'PETROL',
    transmission: 'AUTOMATIC', drivetrain: 'FWD', priceType: 'asking',
    specs: [], scrapedAt: '2026-01-01T00:00:00.000Z', ...over,
  } as NormalizedListing;
}

function mkComparable(over: Partial<NormalizedListing>): Comparable {
  const l = mkListing(over);
  const tier = assignTier(l, baseSpec);
  assert.notEqual(tier, 0);
  return scoreSimilarity(l, baseSpec, tier as 1 | 2 | 3 | 4);
}

describe('Phase 4: normalizeTargetCondition (target condition -> score/provenance)', () => {
  it('declared enum maps to a deterministic score with INFERRED provenance (never CONFIRMED)', () => {
    const cases: Array<[string, number]> = [
      ['EXCELLENT', 90], ['VERY_GOOD', 80], ['GOOD', 70],
      ['FAIR', 55], ['NEEDS_MAINTENANCE', 40], ['NEEDS_INSPECTION', 30],
    ];
    for (const [cond, score] of cases) {
      const r = normalizeTargetCondition(cond);
      assert.equal(r.conditionScore, score, cond);
      assert.equal(r.conditionCertainty, 'INFERRED', `${cond} must be INFERRED (declared, not inspected)`);
    }
    // case/whitespace tolerant
    assert.equal(normalizeTargetCondition('  very good ').conditionScore, 80);
    assert.equal(normalizeTargetCondition('excellent').conditionCertainty, 'INFERRED');
  });

  it('absent condition stays UNKNOWN (null score) — never assumes EXCELLENT', () => {
    for (const v of [null, undefined, '']) {
      const r = normalizeTargetCondition(v);
      assert.equal(r.conditionScore, null);
      assert.equal(r.conditionCertainty, 'UNKNOWN');
    }
  });

  it('untrusted/unknown values stay UNKNOWN — never maps to 90/EXCELLENT', () => {
    for (const v of ['UNKNOWN', 'ممتازة?', 'SOME_LEGACY_TEXT', 'N/A', 'null']) {
      const r = normalizeTargetCondition(v);
      assert.equal(r.conditionScore, null, `${v} must not produce a score`);
      assert.equal(r.conditionCertainty, 'UNKNOWN', `${v} must stay UNKNOWN`);
      assert.notEqual(r.conditionScore, 90);
    }
  });
});

describe('Phase 4: target condition flows into similarity scoring', () => {
  it('UNKNOWN target condition (no score, no string) => neutral 0.5, not a fabricated advantage', () => {
    // baseSpec carries no conditionScore and no condition string => condition part must stay neutral.
    const sim = scoreSimilarity(
      mkListing({ conditionScore: 95, conditionCertainty: 'CONFIRMED', condition: 'فحص كامل' }),
      baseSpec, 1,
    );
    assert.equal(sim.simBreakdown.condition, 50,
      `UNKNOWN target condition must be neutral 50 (0.5 on the 0-100 scale), got ${sim.simBreakdown.condition}`);
  });

  it('both scores known => graded condition similarity (score-based, not binary)', () => {
    const spec = { ...baseSpec, conditionScore: 90, conditionCertainty: 'INFERRED' };
    const comp = mkComparable({ conditionScore: 95, conditionCertainty: 'CONFIRMED', condition: 'فحص كامل' });
    const sim = scoreSimilarity(mkListing({ conditionScore: 95, conditionCertainty: 'CONFIRMED' }), spec, comp.tier);
    const expected = (1 - (Math.abs(90 - 95) / 100) * 0.8) * 100; // 96 on the 0-100 scale
    assert.ok(Math.abs(sim.simBreakdown.condition - expected) < 1e-6,
      `expected ${expected}, got ${sim.simBreakdown.condition}`);
    assert.ok(sim.simBreakdown.condition < 100 && sim.simBreakdown.condition > 50);
  });
});

describe('Phase 4: target condition flows into price adjustment (adjust.ts)', () => {
  const cal = calibrate([]);

  it('target INFERRED score + comp CONFIRMED score => condition adjustment applied with provenance', () => {
    const spec = { ...baseSpec, conditionScore: 70, conditionCertainty: 'INFERRED' }; // GOOD
    const r = mkComparable({ conditionScore: 95, conditionCertainty: 'CONFIRMED', condition: 'فحص كامل' });
    const out = adjustComparable(r, spec, cal);
    const cond = out.adjustments.filter((a) => a.factor === 'condition');
    assert.equal(cond.length, 1, 'condition adjustment must fire when both scores known');
    const diff = 70 - 95; // -25 points
    assert.ok(cond[0].delta < 0, 'target is worse than comp => negative delta');
    assert.equal(cond[0].provenance, 'MARKET_DERIVED', 'comp CONFIRMED => MARKET_DERIVED');
    assert.ok(cond[0].formula.includes('0.0015'), 'score-differential formula');
    // bound: |delta| <= 8% of price
    assert.ok(Math.abs(cond[0].delta) <= Math.round(10000 * 0.08), '8% cap respected');
  });

  it('UNKNOWN target condition => NO condition adjustment is fabricated', () => {
    const spec = { ...baseSpec, condition: null, conditionScore: null, conditionCertainty: 'UNKNOWN' };
    const r = mkComparable({ conditionScore: 95, conditionCertainty: 'CONFIRMED', condition: 'فحص كامل' });
    const out = adjustComparable(r, spec, cal);
    assert.equal(out.adjustments.filter((a) => a.factor === 'condition').length, 0,
      'unknown target condition must produce zero condition deltas');
  });

  it('legacy declared enum without score (untrusted path) still uses the conservative rank branch, not EXCELLENT', () => {
    const spec = { ...baseSpec, condition: 'GOOD', conditionScore: null, conditionCertainty: 'UNKNOWN' };
    const r = mkComparable({ condition: 'EXCELLENT', conditionScore: null, conditionCertainty: 'UNKNOWN' });
    const out = adjustComparable(r, spec, cal);
    const cond = out.adjustments.filter((a) => a.factor === 'condition');
    assert.equal(cond.length, 1, 'rank branch fires when scores are missing but both enums known');
    assert.ok(cond[0].delta < 0, 'target GOOD < comp EXCELLENT => negative delta');
    assert.equal(cond[0].provenance, 'CONSERVATIVE_HEURISTIC');
    assert.ok(Math.abs(cond[0].delta) <= Math.round(10000 * 0.06), '6% rank cap respected');
  });
});
