import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assignTier, scoreSimilarity } from '../similarity';
import type { VehicleSpec, NormalizedListing } from '../types';

const spec: VehicleSpec = {
  brand: 'BMW', model: 'X5', year: 2018, fuelType: 'PHEV', kilometers: 100000
};

function mkListing(overrides: Partial<NormalizedListing>): NormalizedListing {
  return {
    source: 'test', sourceLabel: 'test',
    brand: 'BMW', model: 'X5', year: 2018, kilometers: 100000,
    price: 30000, currency: 'JOD', priceJod: 30000, fxRate: 1,
    country: 'JO', priceType: 'asking', specs: [], scrapedAt: new Date().toISOString(),
    ...overrides
  };
}

describe('powertrain priority', () => {
  it('PHEV target vs petrol comp demotes to tier 3 (secondary/support, never Direct)', () => {
    // Corrected expectation (verified against git HEAD before Phase 2): since commit
    // "demote PHEV powertrain" the PHEV/petrol same-year case returns tier 3, not 2.
    // Tier 3 means supporting evidence only — it can never enter Direct/FMV.
    const t = assignTier(mkListing({ fuelType: 'PETROL' }), spec);
    assert.equal(t, 3, 'Should be tier 3 (secondary)');
    const s = scoreSimilarity(mkListing({ fuelType: 'PETROL' }), spec, 3);
    assert.ok(s.similarity <= 95, 'Similarity should be <= 95');
    assert.equal(s.isDirectEligible, false, 'PHEV/petrol mismatch must never be Direct');
  });
});
