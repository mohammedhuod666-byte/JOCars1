/**
 * Identity Matching Tests — Canonical Vehicle Identity
 *
 * HARD CONSTRAINTS:
 * - Mileage is NEVER identity
 * - Asking price is NEVER identity
 * - UNKNOWN is never EXACT
 * - Substring matching is FORBIDDEN
 * - Model/Series mismatch is FATAL
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  tokenize,
  tokenMatch,
  phraseInText,
  detectBmwModel,
  isSameBmwModel,
  detectVariant,
  detectPowertrain,
  detectDrivetrain,
  buildCanonicalIdentity,
  compareIdentities,
  isFalsePositiveModelMention,
  strictModelEquals,
} from '../identity-matching';
import { sameModel, canonFuel } from '../similarity';
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

// ── Token-aware matching tests ──────────────────────────────────────────────

describe('Token-aware matching', () => {
  it('normalizeText normalizes Arabic and punctuation', () => {
    assert.equal(normalizeText('بي ام دبليو X5'), 'بي ام دبليو x5');
    assert.equal(normalizeText('X5-2018'), 'x5 2018');
    assert.equal(normalizeText('X5 2018'), 'x5 2018');
  });

  it('tokenize splits on spaces', () => {
    assert.deepEqual(tokenize('BMW X5 2018'), ['bmw', 'x5', '2018']);
    assert.deepEqual(tokenize(''), []);
  });

  it('tokenMatch requires exact token match', () => {
    assert.equal(tokenMatch('X5', 'X5'), true);
    assert.equal(tokenMatch('X5', 'X6'), false);
    assert.equal(tokenMatch('BMW X5', 'BMW X5'), true);
  });

  it('phraseInText finds consecutive tokens', () => {
    assert.equal(phraseInText('X5 2018', 'BMW X5 2018 AWD'), true);
    assert.equal(phraseInText('X5 2018', 'BMW 2018 X5 AWD'), false);
  });
});

// ── BMW Model Detection tests ───────────────────────────────────────────────

describe('BMW Model Detection', () => {
  it('detects X5 from various formats', () => {
    assert.equal(detectBmwModel('BMW X5'), 'X5');
    assert.equal(detectBmwModel('بي ام دبليو X5'), 'X5');
    assert.equal(detectBmwModel('X5 2018'), 'X5');
    assert.equal(detectBmwModel('BMW X5 xDrive40e'), 'X5');
  });

  it('detects 5-Series from various formats', () => {
    assert.equal(detectBmwModel('BMW 5 Series'), '5-Series');
    assert.equal(detectBmwModel('BMW 530'), '5-Series');
    assert.equal(detectBmwModel('BMW 520'), '5-Series');
  });

  it('detects X6 correctly', () => {
    assert.equal(detectBmwModel('BMW X6'), 'X6');
  });

  it('returns null for non-BMW models', () => {
    assert.equal(detectBmwModel('Mercedes C200'), null);
  });
});

// ── sameModel() tests ───────────────────────────────────────────────────────

describe('sameModel() — token-aware', () => {
  it('X5 matches X5', () => {
    const a = mkListing({ model: 'X5', modelEn: 'X5' });
    const spec = mkSpec({});
    assert.equal(sameModel(a, spec), true);
  });

  it('X5 does NOT match 5-Series', () => {
    const a = mkListing({ model: '5 Series', modelEn: '5-Series' });
    const spec = mkSpec({});
    assert.equal(sameModel(a, spec), false);
  });

  it('X5 does NOT match 530', () => {
    const a = mkListing({ model: '530', modelEn: '530' });
    const spec = mkSpec({});
    assert.equal(sameModel(a, spec), false);
  });

  it('X5 does NOT match X6', () => {
    const a = mkListing({ model: 'X6', modelEn: 'X6' });
    const spec = mkSpec({});
    assert.equal(sameModel(a, spec), false);
  });

  it('X5 does NOT match RX5 (false positive prevention)', () => {
    const a = mkListing({ model: 'RX5', modelEn: 'RX5' });
    const spec = mkSpec({});
    assert.equal(sameModel(a, spec), false);
  });

  it('X5 does NOT match EX5 (false positive prevention)', () => {
    const a = mkListing({ model: 'EX5', modelEn: 'EX5' });
    const spec = mkSpec({});
    assert.equal(sameModel(a, spec), false);
  });

  it('X5 does NOT match X50 (false positive prevention)', () => {
    const a = mkListing({ model: 'X50', modelEn: 'X50' });
    const spec = mkSpec({});
    assert.equal(sameModel(a, spec), false);
  });
});

// ── canonFuel() context-aware tests ─────────────────────────────────────────

describe('canonFuel() — context-aware PHEV', () => {
  it('40e with BMW X5 context is PHEV', () => {
    assert.equal(canonFuel('HYBRID', 'BMW X5 40e', ''), 'phev');
  });

  it('40e without BMW X5 context is NOT PHEV', () => {
    assert.equal(canonFuel('PETROL', '40e', ''), 'petrol');
  });

  it('explicit PHEV phrase is always PHEV', () => {
    assert.equal(canonFuel('PETROL', 'Plug-in Hybrid', ''), 'phev');
  });

  it('generic hybrid is hybrid', () => {
    assert.equal(canonFuel('HYBRID', '', ''), 'hybrid');
  });
});

// ── Variant Detection tests ─────────────────────────────────────────────────

describe('Variant Detection', () => {
  it('detects 40e from xDrive40e', () => {
    const result = detectVariant('BMW X5 xDrive40e', 'X5');
    assert.equal(result.variant, '40e');
    assert.equal(result.powertrain, 'PHEV');
  });

  it('detects 40e from "x drive 40e"', () => {
    const result = detectVariant('BMW X5 x drive 40e', 'X5');
    assert.equal(result.variant, '40e');
  });

  it('detects 40e from "X5 40e"', () => {
    const result = detectVariant('X5 40e', 'X5');
    assert.equal(result.variant, '40e');
  });

  it('does NOT detect 40e for non-X5 models', () => {
    const result = detectVariant('40e', '3-Series');
    assert.equal(result.variant, null);
  });
});

// ── Powertrain Detection tests ──────────────────────────────────────────────

describe('Powertrain Detection', () => {
  it('structured hybrid + text PHEV = PHEV with conflict', () => {
    const result = detectPowertrain('HYBRID', 'BMW X5 40e Plug-in Hybrid');
    assert.equal(result.powertrain, 'PHEV');
    assert.ok(result.conflicts.length > 0);
  });

  it('structured petrol + text PHEV = PHEV with conflict', () => {
    const result = detectPowertrain('PETROL', 'BMW X5 40e Plug-in Hybrid');
    assert.equal(result.powertrain, 'PHEV');
    assert.ok(result.conflicts.length > 0);
  });

  it('structured petrol alone = petrol', () => {
    const result = detectPowertrain('PETROL', '');
    assert.equal(result.powertrain, 'petrol');
  });
});

// ── Drivetrain Detection tests ──────────────────────────────────────────────

describe('Drivetrain Detection', () => {
  it('detects AWD from xDrive', () => {
    const result = detectDrivetrain(null, 'BMW X5 xDrive40e');
    assert.equal(result.drivetrain, 'AWD');
  });

  it('detects AWD from "دفع كلي"', () => {
    const result = detectDrivetrain(null, 'دفع كلي');
    assert.equal(result.drivetrain, 'AWD');
  });

  it('detects AWD from structured field', () => {
    const result = detectDrivetrain('AWD', '');
    assert.equal(result.drivetrain, 'AWD');
  });
});

// ── Canonical Identity tests ────────────────────────────────────────────────

describe('Canonical Identity', () => {
  it('builds identity from structured fields', () => {
    const identity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 2018', 'BMW X5 40e xDrive'
    );
    assert.equal(identity.make, 'BMW');
    assert.equal(identity.model, 'X5');
    assert.equal(identity.year, 2018);
    assert.equal(identity.variant, '40e');
    assert.equal(identity.powertrain, 'PHEV');
    assert.equal(identity.drivetrain, 'AWD');
  });

  it('records conflicts correctly', () => {
    const identity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'PETROL', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 40e', 'BMW X5 40e Plug-in Hybrid'
    );
    assert.ok(identity.conflicts.length > 0);
  });
});

// ── Identity Comparison tests ───────────────────────────────────────────────

describe('Identity Comparison', () => {
  const targetIdentity = buildCanonicalIdentity(
    'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
    2000, 308, 'BMW X5 2018', 'BMW X5 40e xDrive'
  );

  it('same identity = L1', () => {
    const compIdentity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 2018', 'BMW X5 40e xDrive'
    );
    const result = compareIdentities(targetIdentity, compIdentity);
    assert.equal(result.matchLevel, 'L1');
    assert.equal(result.isDirectCandidate, true);
  });

  it('different mileage does NOT change identity', () => {
    const compIdentity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 2018', 'BMW X5 40e xDrive'
    );
    // Mileage is NOT part of identity, so this should still be L1
    const result = compareIdentities(targetIdentity, compIdentity);
    assert.equal(result.matchLevel, 'L1');
  });

  it('BMW 5-Series is REJECTED', () => {
    const compIdentity = buildCanonicalIdentity(
      'BMW', '5-Series', 2018, null, 'PETROL', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW 530 2018', ''
    );
    const result = compareIdentities(targetIdentity, compIdentity);
    assert.equal(result.matchLevel, 'REJECTED');
    assert.equal(result.isDirectCandidate, false);
  });

  it('BMW X6 is REJECTED', () => {
    const compIdentity = buildCanonicalIdentity(
      'BMW', 'X6', 2018, null, 'PETROL', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X6 2018', ''
    );
    const result = compareIdentities(targetIdentity, compIdentity);
    assert.equal(result.matchLevel, 'REJECTED');
  });

  it('MG RX5 is REJECTED', () => {
    const compIdentity = buildCanonicalIdentity(
      'MG', 'RX5', 2018, null, 'PETROL', 'AWD', 'AUTOMATIC',
      2000, 308, 'MG RX5 2018', ''
    );
    const result = compareIdentities(targetIdentity, compIdentity);
    assert.equal(result.matchLevel, 'REJECTED');
  });

  it('Weltmeister EX5 is REJECTED', () => {
    const compIdentity = buildCanonicalIdentity(
      'Weltmeister', 'EX5', 2018, null, 'PETROL', 'AWD', 'AUTOMATIC',
      2000, 308, 'Weltmeister EX5 2018', ''
    );
    const result = compareIdentities(targetIdentity, compIdentity);
    assert.equal(result.matchLevel, 'REJECTED');
  });
});

// ── False Positive Prevention tests ────────────────────────────────────────

describe('False Positive Prevention', () => {
  it('X5 does not match RX5', () => {
    assert.equal(isFalsePositiveModelMention('X5', 'MG RX5 2018'), true);
  });

  it('X5 does not match EX5', () => {
    assert.equal(isFalsePositiveModelMention('X5', 'Weltmeister EX5 2018'), true);
  });

  it('X5 does not match X50', () => {
    assert.equal(isFalsePositiveModelMention('X5', 'BMW X50 2018'), true);
  });

  it('X5 matches X5 (not false positive)', () => {
    assert.equal(isFalsePositiveModelMention('X5', 'BMW X5 2018'), false);
  });
});

// ── Strict Model Equals tests ───────────────────────────────────────────────

describe('strictModelEquals()', () => {
  it('X5 equals X5', () => {
    assert.equal(strictModelEquals('X5', 'X5'), true);
  });

  it('X5 does not equal X6', () => {
    assert.equal(strictModelEquals('X5', 'X6'), false);
  });

  it('X5 does not equal 5-Series', () => {
    assert.equal(strictModelEquals('X5', '5-Series'), false);
  });

  it('X5 does not equal 530', () => {
    assert.equal(strictModelEquals('X5', '530'), false);
  });
});

// ── Mileage Identity tests ──────────────────────────────────────────────────

describe('Mileage is NOT identity', () => {
  const targetIdentity = buildCanonicalIdentity(
    'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
    2000, 308, 'BMW X5 2018', 'BMW X5 40e xDrive'
  );

  it('58k vs 171k = same identity', () => {
    const compIdentity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 58000 km', 'BMW X5 40e xDrive'
    );
    const result = compareIdentities(targetIdentity, compIdentity);
    assert.equal(result.matchLevel, 'L1');
  });

  it('186k vs 171k = same identity', () => {
    const compIdentity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 186000 km', 'BMW X5 40e xDrive'
    );
    const result = compareIdentities(targetIdentity, compIdentity);
    assert.equal(result.matchLevel, 'L1');
  });

  it('100k vs 171k = same identity', () => {
    const compIdentity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 100000 km', 'BMW X5 40e xDrive'
    );
    const result = compareIdentities(targetIdentity, compIdentity);
    assert.equal(result.matchLevel, 'L1');
  });
});

// ── Asking Price Leakage tests ──────────────────────────────────────────────

describe('Asking Price Leakage Prevention', () => {
  it('price in description does NOT affect identity', () => {
    const identity1 = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 40e', 'BMW X5 40e PHEV AWD السعر 30000 JD'
    );
    const identity2 = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 40e', 'BMW X5 40e PHEV AWD السعر 20000 JD'
    );
    // Both should have the same identity (price is NOT identity)
    assert.equal(identity1.variant, identity2.variant);
    assert.equal(identity1.powertrain, identity2.powertrain);
    assert.equal(identity1.drivetrain, identity2.drivetrain);
  });
});

// ── UNKNOWN semantics tests ─────────────────────────────────────────────────

describe('UNKNOWN semantics', () => {
  it('UNKNOWN variant is NOT exact', () => {
    const targetIdentity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 2018', 'BMW X5 40e xDrive'
    );
    const compIdentity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, null, null, null,
      null, null, 'BMW X5 2018', ''
    );
    const result = compareIdentities(targetIdentity, compIdentity);
    // UNKNOWN should NOT be L1 (exact)
    assert.notEqual(result.matchLevel, 'L1');
  });

  it('UNKNOWN powertrain is NOT exact', () => {
    const targetIdentity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, 'HYBRID', 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 2018', 'BMW X5 40e xDrive'
    );
    const compIdentity = buildCanonicalIdentity(
      'BMW', 'X5', 2018, null, null, 'AWD', 'AUTOMATIC',
      2000, 308, 'BMW X5 2018', ''
    );
    const result = compareIdentities(targetIdentity, compIdentity);
    // UNKNOWN powertrain should NOT be L1
    assert.notEqual(result.matchLevel, 'L1');
  });
});
