import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeOdometerIntegrity } from '../odometer-analysis';
import { calculateJordanCustomsAndFreeZone } from '../customs-matrix';
import { calculateDealerArbitrage } from '../dealer-arbitrage';
import { evaluateBatteryHealthImpact } from '../battery-soh';
import { calculateDepreciationForecast } from '../depreciation-forecast';
import { simulateChassisImpact } from '../chassis-simulator';
import { generateNegotiationPlaybook } from '../negotiation-playbook';

test('1. Odometer Anomaly Detector: flags severe rollback suspects and calculates expected Jordan baseline', () => {
  const currentYear = new Date().getFullYear();
  
  // Severe rollback case: 8-year-old car with only 25,000 km (~3,100 km/yr)
  const suspiciousCar = analyzeOdometerIntegrity({
    year: currentYear - 8,
    mileage: 25000,
    fuel: 'petrol',
    askingPrice: 14000,
  });

  assert.equal(suspiciousCar.status, 'SUSPECTED_ROLLBACK');
  assert.equal(suspiciousCar.riskLevel, 'CRITICAL');
  assert.ok(suspiciousCar.anomalyScore >= 60, 'Anomaly score should be elevated for severe rollback');
  assert.ok(suspiciousCar.expectedTotalKm > 100000, 'Expected km should exceed 100,000 km');
  assert.ok(suspiciousCar.financialRiskImpactJod > 500, 'Financial risk impact should be calculated');

  // Normal usage car: 4-year-old car with 68,000 km (~17,000 km/yr)
  const normalCar = analyzeOdometerIntegrity({
    year: currentYear - 4,
    mileage: 68000,
    fuel: 'petrol',
    askingPrice: 18000,
  });

  assert.equal(normalCar.status, 'NORMAL');
  assert.equal(normalCar.riskLevel, 'LOW');
  assert.equal(normalCar.financialRiskImpactJod, 0);

  // High usage car: 2-year-old car with 95,000 km
  const taxiCar = analyzeOdometerIntegrity({
    year: currentYear - 2,
    mileage: 95000,
    fuel: 'hybrid',
    askingPrice: 15000,
  });

  assert.equal(taxiCar.status, 'EXCESSIVE_HIGH');
  assert.ok(taxiCar.financialRiskImpactJod > 0);
});

test('2. Jordan Customs & Free-Zone Matrix: calculates tiered EV and Hybrid duties accurately', () => {
  // Budget EV in Free Zone (حرة الزرقاء)
  const budgetEv = calculateJordanCustomsAndFreeZone({
    fuel: 'electric',
    askingPrice: 10000,
    location: 'حرة الزرقاء',
  });

  assert.equal(budgetEv.fuelCategory, 'ELECTRIC');
  assert.equal(budgetEv.currentPriceStatus, 'FREE_ZONE_ZARQA');
  assert.equal(budgetEv.breakdown.effectiveTaxRatePercent, 12);
  assert.ok(budgetEv.estimatedClearedPrice > budgetEv.currentAskingPrice);

  // Domestic Hybrid under 2500cc (مجمرك)
  const hybridDomestic = calculateJordanCustomsAndFreeZone({
    fuel: 'hybrid',
    engineCc: 2000,
    askingPrice: 22000,
    location: 'عمان',
  });

  assert.equal(hybridDomestic.fuelCategory, 'HYBRID');
  assert.equal(hybridDomestic.currentPriceStatus, 'CLEARED_DOMESTIC');
  assert.equal(hybridDomestic.breakdown.effectiveTaxRatePercent, 40);
  assert.ok(hybridDomestic.estimatedFreeZonePrice < hybridDomestic.currentAskingPrice);
  assert.ok(hybridDomestic.breakdown.totalTaxesAndFeesJod > 0);
});

test('3. Dealer Flipping Arbitrage Radar: calculates net spread, reconditioning, and ROI', () => {
  // Deal with substantial profit: Asking 16,000 JOD, FMV 19,500 JOD
  const goodDeal = calculateDealerArbitrage({
    askingPrice: 16000,
    fmvPrice: 19500,
    make: 'Hyundai',
    model: 'Elantra',
    year: 2021,
  });

  assert.equal(goodDeal.purchasePriceJod, 16000);
  assert.equal(goodDeal.expectedResaleFmvJod, 19500);
  assert.equal(goodDeal.grossSpreadJod, 3500);
  assert.ok(goodDeal.estimatedReconCostJod > 0);
  assert.ok(goodDeal.netFlippingProfitJod > 2800);
  assert.ok(goodDeal.netRoiPercent > 15);
  assert.equal(goodDeal.rating, 'EXCELLENT_DEAL');
  assert.ok(goodDeal.expectedDaysToFlip <= 15, 'Elantra should have high liquidity speed');

  // Overpriced car: Asking 21,000 JOD, FMV 19,000 JOD
  const lossDeal = calculateDealerArbitrage({
    askingPrice: 21000,
    fmvPrice: 19000,
    make: 'BMW',
    model: 'X5',
  });

  assert.equal(lossDeal.rating, 'OVERPRICED_NO_MARGIN');
  assert.ok(lossDeal.netFlippingProfitJod < 0);
});

test('4. EV/Hybrid Battery SOH: evaluates degradation and financial deduction on market value', () => {
  const currentYear = new Date().getFullYear();

  // EV with degraded battery (68% SOH)
  const degradedEv = evaluateBatteryHealthImpact({
    fuel: 'electric',
    make: 'Volkswagen',
    model: 'ID.4',
    year: currentYear - 3,
    mileage: 80000,
    baseFmvPrice: 22000,
    customSohInput: 68,
  });

  assert.equal(degradedEv.isApplicable, true);
  assert.equal(degradedEv.powertrainType, 'EV');
  assert.equal(degradedEv.selectedSoh, 68);
  assert.equal(degradedEv.healthGrade, 'DEGRADED_CRITICAL');
  assert.ok(degradedEv.financialAdjustmentJod < -1000, 'Degraded EV battery should carry severe deduction');
  assert.equal(degradedEv.adjustedFmvPriceJod, 22000 + degradedEv.financialAdjustmentJod);
  assert.ok(degradedEv.estimatedRemainingRangeKm! < degradedEv.originalFactoryRangeKm!);

  // Hybrid with healthy battery (94% SOH)
  const healthyHybrid = evaluateBatteryHealthImpact({
    fuel: 'hybrid',
    make: 'Toyota',
    model: 'Prius',
    year: currentYear - 2,
    mileage: 35000,
    baseFmvPrice: 17500,
    customSohInput: 94,
  });

  assert.equal(healthyHybrid.healthGrade, 'EXCELLENT');
  assert.equal(healthyHybrid.financialAdjustmentJod, 0);
  assert.equal(healthyHybrid.adjustedFmvPriceJod, 17500);

  // Petrol car (Not applicable)
  const petrolCar = evaluateBatteryHealthImpact({
    fuel: 'petrol',
    baseFmvPrice: 12000,
  });

  assert.equal(petrolCar.isApplicable, false);
  assert.equal(petrolCar.powertrainType, 'NONE');
  assert.equal(petrolCar.financialAdjustmentJod, 0);
});

test('5. 3-Year Residual Value Forecast: models brand-specific retention curves accurately', () => {
  // Toyota Camry (Tier 1 - "شيك بالجيب")
  const toyota = calculateDepreciationForecast({
    baseFmv: 20000,
    manufactureYear: 2020,
    currentMileageKm: 60000,
    make: 'Toyota',
    fuel: 'HYBRID',
  });

  assert.equal(toyota.retentionTier, 'EXCELLENT');
  assert.equal(toyota.forecasts.length, 3);
  assert.ok(toyota.forecasts[0].estimatedFmvJod < 20000);
  assert.ok(toyota.forecasts[2].estimatedFmvJod > 14000, 'Toyota should retain strong value after 3 years');
  assert.equal(toyota.forecasts[0].projectedMileageKm, 60000 + 18500);

  // BMW Luxury (Steeper post-warranty curve)
  const bmw = calculateDepreciationForecast({
    baseFmv: 25000,
    manufactureYear: 2017,
    currentMileageKm: 240000,
    make: 'BMW',
    fuel: 'GASOLINE',
  });

  assert.equal(bmw.retentionTier, 'AVERAGE');
  assert.equal(bmw.forecasts.length, 3);
  assert.ok(bmw.forecasts[0].depreciationFromCurrentJod > 0);
});

test('6. Chassis & Body Simulator: calculates Jordanian market inspection card discounts', () => {
  const baseFmv = 20000;

  // 4 Clean (4 جيد - كرت أبيض)
  const fourClean = simulateChassisImpact(baseFmv, 'FOUR_CLEAN');
  assert.equal(fourClean.activeSelection.discountJod, 0);
  assert.equal(fourClean.activeSelection.adjustedPriceJod, 20000);

  // 3 Clean with Dent on Head (3 جيد ودقة/قصعة)
  const threeClean = simulateChassisImpact(baseFmv, 'THREE_CLEAN_DENT');
  assert.ok(threeClean.activeSelection.discountJod > 0);
  assert.equal(threeClean.activeSelection.discountPercentage, 4.5);
  assert.equal(threeClean.activeSelection.adjustedPriceJod, 20000 - threeClean.activeSelection.discountJod);

  // Replaced Front (غيار واجهة)
  const replacedFront = simulateChassisImpact(baseFmv, 'REPLACED_FRONT');
  assert.equal(replacedFront.activeSelection.discountPercentage, 26);
  assert.ok(replacedFront.activeSelection.discountJod >= 5000);

  // Cut & Welded (شلهوب)
  const cutWelded = simulateChassisImpact(baseFmv, 'CUT_WELDED');
  assert.equal(cutWelded.activeSelection.discountPercentage, 38);
  assert.ok(cutWelded.activeSelection.adjustedPriceJod < 13000);
});

test('7. AI Negotiation Playbook: generates tactical anchors and authentic Jordanian phrases', () => {
  // Car asked for 24,000 with FMV of 20,000 (Overpriced asking)
  const playbook = generateNegotiationPlaybook({
    askingPrice: 24000,
    fmvPrice: 20000,
    actualKm: 240000,
    year: 2017,
    make: 'BMW',
    model: 'X5',
  });

  assert.equal(playbook.buyerAdvantageRating, 'STRONG');
  assert.ok(playbook.tacticalPricing.openingOfferJod < 20000, 'Opening offer should anchor below FMV');
  assert.equal(playbook.tacticalPricing.targetDealJod, 20000);
  assert.ok(playbook.tacticalPricing.walkAwayCeilingJod <= 21000);
  assert.ok(playbook.leveragePoints.length >= 3);
  
  // Checks spoken dialect presence
  const hasSpokenDialect = playbook.leveragePoints.some(pt => pt.spokenPhraseAr.includes('عشان نتوكل على الله') || pt.spokenPhraseAr.includes('كاش'));
  assert.ok(hasSpokenDialect, 'Should generate authentic Jordanian spoken negotiation phrases');
});
