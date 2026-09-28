/**
 * Identity Integration Tests - Production Pipeline
 *
 * Tests that identity-matching.ts is actually used in the production valuation pipeline.
 * NOT just unit tests of identity-matching.ts in isolation.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assignTier, sameModel } from '../similarity';
import { detectTargetIdentityCluster } from '../outliers';
import { buildCanonicalIdentity, compareIdentities } from '../identity-matching';
import type { NormalizedListing, VehicleSpec } from '../types';

// ── Helper functions ────────────────────────────────────────────────────────

function mkListing(over: Partial<NormalizedListing>): NormalizedListing {
  return {
    source: 'test', sourceLabel: 'Test', externalId: 'e1',
    title: 'Test', brand: 'BMW', brandEn: 'BMW', model: 'X5', modelEn: 'X5',
    year: 2018, kilometers: 100000, price: 25000, currency: 'JOD',
    priceJod: 25000, fxRate: 1, country: 'JO', fuelType: 'PETROL',
    transmission: 'AUTOMATIC', drivetrain: 'AWD', priceType: 'asking',
    specs: [], scrapedAt: '2026-01-01T00:00:00.000Z', ...over,
  } as NormalizedListing;
}

function mkSpec(over: Partial<VehicleSpec>): VehicleSpec {
  return {
    brand: 'BMW', brandEn: 'BMW', model: 'X5', modelEn: 'X5',
    year: 2018, kilometers: 171000, fuelType: 'HYBRID',
    transmission: 'AUTOMATIC', drivetrain: 'AWD', ...over,
  } as VehicleSpec;
}

// ── Target Cluster Tests ────────────────────────────────────────────────────

describe('Target Cluster - Mileage NOT used as leakage rule', () => {
  it('same mileage alone does NOT exclude independent listing', () => {
    const target = {
      carId: null,
      spec: mkSpec({ kilometers: 171000 }),
      askingPrice: 30000,
    };
    
    // Independent listing with same mileage (but different car)
    const independentListing = mkListing({
      externalId: 'independent-1',
      kilometers: 171000, // Same mileage as target
      priceJod: 25000,
      trim: 'Different trim',
    });
    
    const { cluster, cleanListings } = detectTargetIdentityCluster([independentListing], target);
    
    // Should NOT be excluded just because of same mileage
    assert.equal(cluster.totalClusterCount, 0, 'Same mileage alone should NOT create cluster');
    assert.equal(cleanListings.length, 1, 'Independent listing should remain in clean listings');
  });

  it('same listing ID excludes as duplicate', () => {
    const target = {
      carId: 'car-123',
      spec: mkSpec({ kilometers: 171000 }),
      askingPrice: 30000,
    };
    
    // Same listing ID (duplicate/mirror)
    const duplicateListing = mkListing({
      externalId: 'car-123', // Same as target carId
      kilometers: 171000,
      priceJod: 25000,
    });
    
    const { cluster, cleanListings } = detectTargetIdentityCluster([duplicateListing], target);
    
    // Should be excluded as duplicate
    assert.equal(cluster.totalClusterCount, 1, 'Same listing ID should create cluster');
    assert.equal(cleanListings.length, 0, 'Duplicate should be excluded');
  });

  it('VIN match excludes as target', () => {
    const target = {
      carId: null,
      spec: mkSpec({ kilometers: 171000, vin: 'WBA1234567890' }),
      askingPrice: 30000,
    };
    
    // Same VIN
    const vinListing = mkListing({
      externalId: 'vin-1',
      kilometers: 171000,
      vin: 'WBA1234567890',
      priceJod: 25000,
    } as unknown as Partial<NormalizedListing>);
    
    const { cluster, cleanListings } = detectTargetIdentityCluster([vinListing], target);
    
    // Should be excluded as target
    assert.equal(cluster.totalClusterCount, 1, 'VIN match should create cluster');
    assert.equal(cleanListings.length, 0, 'VIN match should be excluded');
  });
});

// ── AssignTier Tests ─────────────────────────────────────────────────────────

describe('assignTier - Canonical Identity Integration', () => {
  it('X5 2018 xDrive40e = L1/Direct', () => {
    const spec = mkSpec({
      fuelType: 'HYBRID',
      drivetrain: 'AWD',
      description: 'BMW X5 40e xDrive PHEV AWD',
    });
    
    const comp = mkListing({
      model: 'X5',
      modelEn: 'X5',
      year: 2018,
      fuelType: 'HYBRID',
      drivetrain: 'AWD',
      trim: 'xDrive40e',
      title: 'BMW X5 2018 xDrive40e',
    });
    
    const tier = assignTier(comp, spec);
    assert.equal(tier, 1, 'X5 2018 xDrive40e should be Tier 1 (L1)');
  });

  it('X5 2018 PHEV = L2', () => {
    const spec = mkSpec({
      fuelType: 'HYBRID',
      drivetrain: 'AWD',
      description: 'BMW X5 40e xDrive PHEV AWD',
    });
    
    const comp = mkListing({
      model: 'X5',
      modelEn: 'X5',
      year: 2018,
      fuelType: 'HYBRID',
      drivetrain: 'AWD',
      title: 'BMW X5 2018 PHEV',
    });
    
    const tier = assignTier(comp, spec);
    assert.equal(tier, 2, 'X5 2018 PHEV should be Tier 2 (L2)');
  });

  it('BMW 5 Series 530 = REJECTED', () => {
    const spec = mkSpec({
      fuelType: 'HYBRID',
      drivetrain: 'AWD',
      description: 'BMW X5 40e xDrive PHEV AWD',
    });
    
    const comp = mkListing({
      model: '5 Series',
      modelEn: '5-Series',
      year: 2018,
      fuelType: 'PETROL',
      drivetrain: 'AWD',
      title: 'BMW 530 2018',
    });
    
    const tier = assignTier(comp, spec);
    assert.equal(tier, 0, 'BMW 5 Series 530 should be REJECTED (tier 0)');
  });

  it('X5 2018 xDrive40e with different mileage = still L1/Direct', () => {
    const spec = mkSpec({
      fuelType: 'HYBRID',
      drivetrain: 'AWD',
      kilometers: 171000,
      description: 'BMW X5 40e xDrive PHEV AWD',
    });
    
    const comp = mkListing({
      model: 'X5',
      modelEn: 'X5',
      year: 2018,
      fuelType: 'HYBRID',
      drivetrain: 'AWD',
      trim: 'xDrive40e',
      kilometers: 100000, // Different mileage
      title: 'BMW X5 2018 xDrive40e',
    });
    
    const tier = assignTier(comp, spec);
    assert.equal(tier, 1, 'Different mileage should NOT affect tier (still L1)');
  });

  it('X5 2018 xDrive40e with 186k mileage = still L1/Direct', () => {
    const spec = mkSpec({
      fuelType: 'HYBRID',
      drivetrain: 'AWD',
      kilometers: 171000,
      description: 'BMW X5 40e xDrive PHEV AWD',
    });
    
    const comp = mkListing({
      model: 'X5',
      modelEn: 'X5',
      year: 2018,
      fuelType: 'HYBRID',
      drivetrain: 'AWD',
      trim: 'xDrive40e',
      kilometers: 186000, // Different mileage
      title: 'BMW X5 2018 xDrive40e',
    });
    
    const tier = assignTier(comp, spec);
    assert.equal(tier, 1, 'Different mileage should NOT affect tier (still L1)');
  });
});

// ── Canonical Identity Tests ─────────────────────────────────────────────────

describe('Canonical Identity - Production Integration', () => {
  it('target identity is built correctly', () => {
    const identity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 2018', 'BMW X5 40e xDrive PHEV AWD'
    );
    
    assert.equal(identity.make, 'BMW');
    assert.equal(identity.model, 'X5');
    assert.equal(identity.year, 2018);
    assert.equal(identity.variant, '40e');
    assert.equal(identity.powertrain, 'PHEV');
    assert.equal(identity.drivetrain, 'AWD');
  });

  it('comparable identity is built correctly', () => {
    const identity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, 'xDrive40e', 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 2018 xDrive40e', undefined
    );
    
    assert.equal(identity.make, 'BMW');
    assert.equal(identity.model, 'X5');
    assert.equal(identity.year, 2018);
    assert.equal(identity.variant, '40e');
    assert.equal(identity.powertrain, 'PHEV');
    assert.equal(identity.drivetrain, 'AWD');
  });

  it('identity comparison works correctly', () => {
    const targetIdentity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 2018', 'BMW X5 40e xDrive PHEV AWD'
    );
    
    const compIdentity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, 'xDrive40e', 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 2018 xDrive40e', undefined
    );
    
    const result = compareIdentities(targetIdentity, compIdentity);
    
    assert.equal(result.isSameModel, true);
    assert.equal(result.isSameYear, true);
    assert.equal(result.isSameVariant, true);
    assert.equal(result.isSamePowertrain, true);
    assert.equal(result.isSameDrivetrain, true);
    assert.equal(result.isDirectCandidate, true);
    assert.equal(result.matchLevel, 'L1');
  });
});
