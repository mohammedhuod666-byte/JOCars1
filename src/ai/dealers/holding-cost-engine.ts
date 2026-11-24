/**
 * Showroom Inventory Holding Cost & Liquidation Tracker (حاسبة كلفة الركود اليومية)
 * 
 * Computes daily holding cost, capital lockup, and liquidation alert triggers for dealer inventory.
 */

export interface HoldingCostInput {
  carPurchaseCostJod: number;
  currentAskingPriceJod: number;
  daysOnLot: number;
  dailyFacilityFeeJod?: number; // Rent, security, washing (default 3.5 JOD/day)
  annualCostOfCapitalPercent?: number; // Bank loan interest / opportunity cost (default 8%)
}

export interface HoldingCostResult {
  daysOnLot: number;
  dailyHoldingCostJod: number;
  totalHoldingCostAccumulatedJod: number;
  breakdown: {
    facilityAndMaintenanceCostJod: number;
    capitalInterestCostJod: number;
    marketDepreciationErosionJod: number;
  };
  initialProjectedProfitJod: number;
  currentNetProfitRemainingJod: number;
  profitErosionPercent: number;
  isLiquidationRecommended: boolean;
  liquidationStatusLabelAr: string;
  liquidationBadgeColor: string;
  suggestedLiquidationPriceJod: number;
  adviceAr: string;
}

export function calculateHoldingCost(input: HoldingCostInput): HoldingCostResult {
  const purchaseCost = Math.max(500, Math.round(input.carPurchaseCostJod));
  const asking = Math.max(500, Math.round(input.currentAskingPriceJod));
  const days = Math.max(0, input.daysOnLot);
  const facilityDaily = input.dailyFacilityFeeJod ?? 3.5;
  const capitalRateAnnual = (input.annualCostOfCapitalPercent ?? 8) / 100;

  // Daily capital cost
  const capitalDaily = (purchaseCost * capitalRateAnnual) / 365;

  // Market depreciation (approximated at 0.7% per month = ~0.023% daily)
  const marketDepreciationDaily = (purchaseCost * 0.007) / 30;

  const dailyHoldingCostJod = Math.round((facilityDaily + capitalDaily + marketDepreciationDaily) * 100) / 100;

  const facilityTotal = Math.round(facilityDaily * days);
  const capitalTotal = Math.round(capitalDaily * days);
  const depreciationTotal = Math.round(marketDepreciationDaily * days);
  const totalHoldingCostAccumulatedJod = facilityTotal + capitalTotal + depreciationTotal;

  const initialProjectedProfitJod = asking - purchaseCost;
  const currentNetProfitRemainingJod = initialProjectedProfitJod - totalHoldingCostAccumulatedJod;
  const profitErosionPercent = Math.min(
    100,
    Math.max(0, Math.round((totalHoldingCostAccumulatedJod / Math.max(1, initialProjectedProfitJod)) * 100))
  );

  const isLiquidationRecommended = days >= 45 || currentNetProfitRemainingJod <= 300;

  let liquidationStatusLabelAr = 'حالة دوران نشطة (طبيعية)';
  let liquidationBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

  if (days > 60) {
    liquidationStatusLabelAr = '⚠️ ركود حرج (تآكل كامل للأرباح)';
    liquidationBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (days >= 35) {
    liquidationStatusLabelAr = 'تنبيه بطء تداول (اقتراب حد التسييل)';
    liquidationBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }

  // Suggested fast liquidation price (break-even + 250 JOD minimal fee)
  const suggestedLiquidationPriceJod = Math.round((purchaseCost + totalHoldingCostAccumulatedJod + 250) / 50) * 50;

  const adviceAr =
    days >= 45
      ? `السيارة معروضة منذ (${days} يوماً) وقد استنزفت (${totalHoldingCostAccumulatedJod.toLocaleString()} د.أ) من كلف التخزين وفوائد رأس المال. ننصح بتسييلها فوراً لأي مشتري كاش بسعر (${suggestedLiquidationPriceJod.toLocaleString()} د.أ) لإعادة تدوير رأس المال في بضاعة أسرع طلباً.`
      : `السيارة ضمن النطاق الزمني الطبيعي للمعرض (${days} يوماً)، وصافي الربح المتبقي بعد كلف الوقوف هو (${currentNetProfitRemainingJod.toLocaleString()} د.أ).`;

  return {
    daysOnLot: days,
    dailyHoldingCostJod,
    totalHoldingCostAccumulatedJod,
    breakdown: {
      facilityAndMaintenanceCostJod: facilityTotal,
      capitalInterestCostJod: capitalTotal,
      marketDepreciationErosionJod: depreciationTotal,
    },
    initialProjectedProfitJod,
    currentNetProfitRemainingJod,
    profitErosionPercent,
    isLiquidationRecommended,
    liquidationStatusLabelAr,
    liquidationBadgeColor,
    suggestedLiquidationPriceJod,
    adviceAr,
  };
}
