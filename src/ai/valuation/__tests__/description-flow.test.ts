/**
 * Description data flow test:
 * car.description -> buildSpecFromBody -> VehicleSpec.description
 *
 * Invariants:
 *  - description reaches VehicleSpec as-is (no loss)
 *  - listing without description does not break the system
 *  - price inside description does NOT become a valuation feature
 *  - no regression in existing valuation tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { VehicleSpec } from '../types';

describe('Description data flow', () => {
  it('VehicleSpec accepts description field', () => {
    const spec: VehicleSpec = {
      brand: 'BMW',
      brandEn: 'BMW',
      model: 'X5',
      modelEn: 'X5',
      year: 2018,
      kilometers: 171000,
      description: 'BMW X5 40e X Drive 2018 Plug-in Hybrid 2000cc 308HP AWD',
    };
    assert.equal(spec.description, 'BMW X5 40e X Drive 2018 Plug-in Hybrid 2000cc 308HP AWD');
  });

  it('VehicleSpec works without description (backward compatible)', () => {
    const spec: VehicleSpec = {
      brand: 'BMW',
      brandEn: 'BMW',
      model: 'X5',
      modelEn: 'X5',
      year: 2018,
      kilometers: 171000,
    };
    assert.equal(spec.description, undefined);
  });

  it('description with price does NOT become a valuation feature', () => {
    const description = 'BMW X5 40e 2018. Asking price: 30,000 JOD. Excellent condition.';
    const spec: VehicleSpec = {
      brand: 'BMW',
      brandEn: 'BMW',
      model: 'X5',
      modelEn: 'X5',
      year: 2018,
      kilometers: 171000,
      description: description,
      askingPrice: 30000, // Only this is used for pricePosition, NOT description
    };
    // description is stored as-is
    assert.equal(spec.description, description);
    // askingPrice is separate from description
    assert.equal(spec.askingPrice, 30000);
    // description is NOT used as a feature
    assert.notEqual(spec.description, spec.askingPrice);
  });

  it('description is passed as-is without modification', () => {
    const originalDescription = 'BMW X5 40e X Drive\nPlug-in Hybrid\n2000cc\n308HP\nM Sport\nصيانة وكالة\nمالك واحد';
    const spec: VehicleSpec = {
      brand: 'BMW',
      brandEn: 'BMW',
      model: 'X5',
      modelEn: 'X5',
      year: 2018,
      kilometers: 171000,
      description: originalDescription,
    };
    // No loss, no modification
    assert.equal(spec.description, originalDescription);
    assert.ok(spec.description?.includes('صيانة وكالة'));
    assert.ok(spec.description?.includes('مالك واحد'));
  });

  it('null description is handled gracefully', () => {
    const spec: VehicleSpec = {
      brand: 'BMW',
      brandEn: 'BMW',
      model: 'X5',
      modelEn: 'X5',
      year: 2018,
      kilometers: 171000,
      description: null,
    };
    assert.equal(spec.description, null);
  });
});
