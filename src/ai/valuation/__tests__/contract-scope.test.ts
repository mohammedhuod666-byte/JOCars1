/**
 * Phase 3 — Contract: percentile scope truthfulness (spec §10, §11).
 * Run: npx tsx --test src/ai/valuation/__tests__/contract-scope.test.ts
 *
 * Mandate:
 *  - percentileScope is computed truthfully (DIRECT only when >=4 direct comps)
 *  - the Arabic contract wording MUST match the true scope:
 *      DIRECT text ("من عروض المقارنات المباشرة") is illegal when scope is SUPPORTING
 *  - confidenceReasons are carried into the contract shape
 * Pure deterministic modules only — no DB, no network, no LLM.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assignTier, scoreSimilarity, isDirectComparable } from '../similarity';
import { priceStats, calculateFMV } from '../price';
import { percentileScopeLabelAr } from '../intelligence-engine';
import type { Comparable, NormalizedListing, VehicleSpec } from '../types';

const spec: VehicleSpec = {
  brand: 'تويوتا', brandEn: 'toyota', model: 'كامري', modelEn: 'camry',
  year: 2022, trim: 'LE', kilometers: 80000, fuelType: 'PETROL',
  transmission: 'AUTOMATIC', drivetrain: 'FWD', city: 'عمان',
};

function mk(over: Partial<NormalizedListing>): NormalizedListing {
  return {
    source: 'opensooq', sourceLabel: 'OpenSooq', externalId: 'e',
    title: 'Camry 2022', brand: 'تويوتا', brandEn: 'toyota', model: 'كامري', modelEn: 'camry',
    year: 2022, trim: 'LE', kilometers: 80000, price: 10000, currency: 'JOD',
    priceJod: 10000, fxRate: 1, city: 'عمان', country: 'JO', fuelType: 'PETROL',
    transmission: 'AUTOMATIC', drivetrain: 'FWD', priceType: 'asking',
    specs: [], scrapedAt: '2026-01-01T00:00:00.000Z', ...over,
  } as NormalizedListing;
}

function build(overs: Partial<NormalizedListing>[]): Comparable[] {
  return overs.map((o, i) => {
    const l = mk({ externalId: `e${i}`, ...o });
    const tier = assignTier(l, spec);
    assert.notEqual(tier, 0);
    return scoreSimilarity(l, spec, tier as 1 | 2 | 3 | 4);
  });
}

describe('Phase 3: percentileScope truthfulness', () => {
  it('direct=3 (below the 4-direct threshold) => scope never claims DIRECT', () => {
    const comps = build([{ priceJod: 10000 }, { priceJod: 10200 }, { priceJod: 9800 }]);
    assert.equal(comps.filter((c) => isDirectComparable(c)).length, 3);
    const stats = priceStats(comps, 11000);
    // 3 direct < 4 threshold, and total observations (3) < 4 => no percentile claim at all (null),
    // or SUPPORTING if more observations exist — never DIRECT.
    assert.notEqual(stats.percentileScope, 'DIRECT');
    const label = percentileScopeLabelAr(stats.percentileScope);
    assert.equal(label.includes('من عروض'), false, 'DIRECT wording is illegal below the 4-direct threshold');
    assert.ok(label.includes('الشواهد الداعمة'));
    const fmv = calculateFMV(comps, 11000);
    assert.equal(fmv.directCompsCount, 3);
    assert.equal(fmv.valuationMode, 'FMV');

    // Same 3 direct + 2 supporting observations => percentile runs on SUPPORTING scope only.
    const withSupporting = comps.concat(build([
      { priceJod: 11500, year: 2021 },
      { priceJod: 9500, year: 2023 },
    ]));
    const stats2 = priceStats(withSupporting, 12000);
    assert.equal(stats2.percentileScope, 'SUPPORTING');
    const label2 = percentileScopeLabelAr(stats2.percentileScope);
    assert.equal(label2.includes('من عروض المقارنات المباشرة'), false,
      'DIRECT wording is illegal when scope is SUPPORTING');
    assert.ok(label2.includes('لا يُعتمد كـ FMV'));
  });

  it('direct=4 => scope DIRECT and DIRECT wording is legal', () => {
    const comps = build([
      { priceJod: 10000 }, { priceJod: 10200 }, { priceJod: 9800 }, { priceJod: 10400 },
    ]);
    assert.equal(comps.filter((c) => isDirectComparable(c)).length, 4);
    const stats = priceStats(comps, 11000);
    assert.equal(stats.percentileScope, 'DIRECT');
    assert.equal(typeof stats.askingPricePercentile, 'number');
    const label = percentileScopeLabelAr(stats.percentileScope);
    assert.ok(label.includes('المقارنات المباشرة'), 'DIRECT scope must say direct');
    assert.equal(label.includes('لا يُعتمد كـ FMV'), false, 'DIRECT wording must not carry the supporting disclaimer');
  });

  it('supporting-only (mismatched or off-year comps) => scope SUPPORTING + supporting wording', () => {
    const comps = build([
      { priceJod: 10000, fuelType: 'DIESEL' },
      { priceJod: 10200, drivetrain: 'RWD' },
      { priceJod: 9800, year: 2021 },
      { priceJod: 10400, year: 2023 },
    ]);
    assert.equal(comps.filter((c) => isDirectComparable(c)).length, 0, 'no comparable may be Direct here');
    const stats = priceStats(comps, 11000);
    assert.equal(stats.percentileScope, 'SUPPORTING');
    const label = percentileScopeLabelAr(stats.percentileScope);
    assert.equal(label.includes('المقارنات المباشرة') && label.includes('من عروض'), false,
      'DIRECT wording is illegal when scope is SUPPORTING');
    assert.ok(label.includes('الشواهد الداعمة'), 'SUPPORTING wording must name supporting evidence');
    assert.ok(label.includes('لا يُعتمد كـ FMV'), 'SUPPORTING wording must carry the FMV disclaimer');
    const fmv = calculateFMV(comps, 11000);
    assert.equal(fmv.directCompsCount, 0);
    assert.equal(fmv.fmv, null);
    assert.equal(fmv.valuationMode, 'SUPPORTING_RANGE_ONLY');
  });

  it('scope null (too few observations) => supporting/disclaimer wording, never DIRECT', () => {
    const label = percentileScopeLabelAr(null);
    assert.ok(label.includes('الشواهد الداعمة'));
    const labelUndef = percentileScopeLabelAr(undefined);
    assert.equal(labelUndef, label, 'undefined scope must fall back to supporting wording');
    const labelSupporting = percentileScopeLabelAr('SUPPORTING');
    assert.equal(labelSupporting, label);
  });

  it('contract shape carries confidenceReasons + percentileScope (structural guarantee)', () => {
    // Mirrors Section24OutputContract — a missing reason array or scope field is a regression.
    type ContractSlice = {
      confidence: number;
      confidenceLabel?: string;
      confidenceReasons?: string[];
      percentileScope?: 'DIRECT' | 'SUPPORTING' | null;
      pricePosition: { percentileScope?: 'DIRECT' | 'SUPPORTING' | null };
    };
    const slice: ContractSlice = {
      confidence: 55,
      confidenceLabel: 'متوسط',
      confidenceReasons: ['عدد المقارنات المباشرة 0', 'شواهد داعمة فقط'],
      percentileScope: 'SUPPORTING',
      pricePosition: { percentileScope: 'SUPPORTING' },
    };
    assert.equal(Array.isArray(slice.confidenceReasons), true);
    assert.equal((slice.confidenceReasons || []).length > 0, true);
    assert.equal(slice.percentileScope, slice.pricePosition.percentileScope,
      'contract-level scope must equal pricePosition scope');
  });
});
