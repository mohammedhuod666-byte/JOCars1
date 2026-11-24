/**
 * Dealer Arbitrage & Flipping Profit Radar (Jordan Market)
 * رادار اقتناص الفرص وهامش ربح التاجر وحساب سرعة التسييل
 */

export type DealOpportunityRating =
  | 'EXCELLENT_DEAL'          // 💎 صيد ثمين وفرصة ربح عالية
  | 'GOOD_MARGIN'             // 🟢 هامش ربح تجاري جيد
  | 'TIGHT_MARGIN'            // 🟡 هامش ضيق / مخاطرة
  | 'OVERPRICED_NO_MARGIN';   // 🔴 غير مجدية تجارياً

export interface DealerArbitrageResult {
  purchasePriceJod: number;
  expectedResaleFmvJod: number;
  estimatedReconCostJod: number;       // تكلفة التجهيز والصيانة التجميلية
  transferAndPaperworkJod: number;     // رسوم نقل الملكية والمعاملات
  totalCapitalRequiredJod: number;     // إجمالي رأس المال المطلوب
  grossSpreadJod: number;              // الفارق الإجمالي
  netFlippingProfitJod: number;        // صافي الربح المتوقع
  netRoiPercent: number;               // العائد على رأس المال %
  rating: DealOpportunityRating;
  ratingLabelAr: string;
  ratingBadgeColor: string;
  expectedDaysToFlip: number;          // سرعة البيع المتوقعة بالأيام
  liquiditySpeedAr: string;            // تصنيف السيولة (سريعة جداً، جيدة، متوسطة)
  breakdownNotes: string[];
  dealerAdviceAr: string;
}

export function calculateDealerArbitrage(params: {
  askingPrice?: number | null;
  fmvPrice?: number | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
}): DealerArbitrageResult {
  const purchase = Math.round(params.askingPrice || 0);
  const fmv = Math.round(params.fmvPrice || 0);

  // Dynamic reconditioning estimate based on car value
  // Luxury or higher value cars need slightly higher recon budgets (detailing, tires, minor paint)
  let baseRecon = 250;
  if (purchase > 30000) baseRecon = 550;
  else if (purchase > 18000) baseRecon = 380;
  else if (purchase > 10000) baseRecon = 300;

  const transferFees = 120; // رسوم نقل ملكية ورسوم فحص دوري
  const totalCapital = purchase + baseRecon + transferFees;
  const grossSpread = fmv - purchase;
  const netProfit = fmv - totalCapital;
  const netRoi = totalCapital > 0 ? Number(((netProfit / totalCapital) * 100).toFixed(1)) : 0;

  // Model popularity and liquidity in Jordan
  const modelStr = `${params.make || ''} ${params.model || ''}`.toLowerCase();
  const isHighVelocity = /elantra|camry|prius|ioniq|optima|sonata|tucson|sportage|id\.4|id4|corolla|yaris|civic|accent/i.test(modelStr);
  const isLuxury = /bmw|mercedes|audi|porsche|land rover|range rover|lexus/i.test(modelStr);

  let expectedDaysToFlip = 18;
  let liquiditySpeedAr = 'سيولة سريعة ومطلوبة بالسوق';

  if (isHighVelocity) {
    expectedDaysToFlip = 10;
    liquiditySpeedAr = 'سيولة فائقة السرعة (طراز شعبي واسع الطلب)';
  } else if (isLuxury) {
    expectedDaysToFlip = 32;
    liquiditySpeedAr = 'سيولة متوسطة (فئة فاخرة تحتاج زبون نخبوي)';
  }

  let rating: DealOpportunityRating = 'TIGHT_MARGIN';
  let ratingLabelAr = 'هامش ربح ضيق / مخاطرة متوسطة';
  let ratingBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  let dealerAdviceAr = 'الهامش الحالي لا يترك مساحة كافية للتفاوض مع المشتري القادم بعد خصم التجهيز.';

  if (netProfit >= 1400 && netRoi >= 6.5) {
    rating = 'EXCELLENT_DEAL';
    ratingLabelAr = '💎 صيد ثمين وفرصة ربح تاجر ممتازة';
    ratingBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    dealerAdviceAr = `السيارة معروضة بأقل من قيمتها السوقية بفارق مجزٍ (${grossSpread.toLocaleString()} د.أ). بعد التجهيز ونقل الملكية يبقى صافي ربح مقدر بنحو (${netProfit.toLocaleString()} د.أ) بعائد (${netRoi}%). فرصة مناسبة للشراء السريع.`;
  } else if (netProfit >= 650 && netRoi >= 3.5) {
    rating = 'GOOD_MARGIN';
    ratingLabelAr = '🟢 هامش ربح تجاري جيد ومجزٍ';
    ratingBadgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    dealerAdviceAr = `هامش تجاري مقبول يترك ربحاً صافياً يقارب (${netProfit.toLocaleString()} د.أ). يُنصح بالتفاوض على السعر المطلوب لتوسيع الهامش قبل إتمام الشراء.`;
  } else if (netProfit <= 0) {
    rating = 'OVERPRICED_NO_MARGIN';
    ratingLabelAr = '🔴 غير مجدية للتجارة (السعر أعلى من القيمة العادلة)';
    ratingBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    dealerAdviceAr = 'السعر المطلوب لا يترك أي هامش ربح تجاري، بل يضع التاجر في منطقة خسارة بعد احتساب مصاريف التجهيز والترخيص.';
  }

  return {
    purchasePriceJod: purchase,
    expectedResaleFmvJod: fmv,
    estimatedReconCostJod: baseRecon,
    transferAndPaperworkJod: transferFees,
    totalCapitalRequiredJod: totalCapital,
    grossSpreadJod: grossSpread,
    netFlippingProfitJod: netProfit,
    netRoiPercent: netRoi,
    rating,
    ratingLabelAr,
    ratingBadgeColor,
    expectedDaysToFlip,
    liquiditySpeedAr,
    breakdownNotes: [
      `تكلفة التجهيز المقدرة (${baseRecon.toLocaleString()} د.أ) تشمل: بولش نانو، تنظيف داخلي وخارجي عميق، فحص زيوت وتلقيطات دهان سريعة.`,
      `رسوم الترسيم والمعاملات (${transferFees.toLocaleString()} د.أ) تشمل: كشف فحص ونقل الملكية.`,
      `دوران رأس المال المتوقع: في حدود ${expectedDaysToFlip} يوماً بحسب سرعة الطلب على هذا الطراز بالأردن.`,
    ],
    dealerAdviceAr,
  };
}
