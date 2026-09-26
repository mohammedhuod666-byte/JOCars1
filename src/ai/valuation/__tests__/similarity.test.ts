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
  it('fuel mismatch demotes to tier 2 with capped similarity', () => {
    const t = assignTier(mkListing({ fuelType: 'PETROL' }), spec);
    assert.equal(t, 2, 'Should be tier 2');
    const s = scoreSimilarity(mkListing({ fuelType: 'PETROL' }), spec, 2);
    assert.ok(s.similarity <= 95, 'Similarity should be <= 95');
  });
});
