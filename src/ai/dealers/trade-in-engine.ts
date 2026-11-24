/**
 * Instant Trade-In Valuation Matrix (حاسبة سيارات البدل السريعة للمعرض)
 * 
 * Computes wholesale in-take price for incoming customer cars,
 * applying Jordan showroom margins, reconditioning costs, and net cash difference.
 */

export type TradeInCondition = 'FOUR_CLEAN' | 'THREE_CLEAN' | 'TWO_CLEAN' | 'NEEDS_REPAIR';

export interface TradeInInput {
  customerCarPriceEstimated: number; // Customer car base FMV
  customerCarYear: number;
  customerCarKm: number;
  condition: TradeInCondition;
  showroomCarPrice: number; // Target car in showroom
  dealerTargetMarginPercent?: number; // Default 12%
}

export interface TradeInResult {
  customerCarMarketValueJod: number;
  conditionAdjustmentJod: number;
  conditionLabelAr: string;
  reconditioningEstimateJod: number;
  wholesaleIntakePriceJod: number; // Suggested offer to customer
  wholesaleDiscountPercent: number;
  showroomCarPriceJod: number;
  netCashToCollectJod: number; // Difference customer pays to dealer
  dealerExpectedProfitOnDealJod: number;
  dealVerdictAr: string;
  tradeInTipsAr: string[];
}

export function calculateTradeInSwap(input: TradeInInput): TradeInResult {
  const baseMarket = Math.max(500, Math.round(input.customerCarPriceEstimated));
  const showroomPrice = Math.max(500, Math.round(input.showroomCarPrice));
  const marginPct = input.dealerTargetMarginPercent ?? 12;

  // Condition adjustment
  let conditionDiscountRate = 0;
  let conditionLabelAr = '4 جيد (كرت أبيض)';
  let reconCost = 250; // standard wash, detailing, transfer

  if (input.condition === 'THREE_CLEAN') {
    conditionDiscountRate = 0.045;
    conditionLabelAr = '3 جيد + دقة/قصعة';
    reconCost = 350;
  } else if (input.condition === 'TWO_CLEAN') {
    conditionDiscountRate = 0.09;
    conditionLabelAr = '2 جيد (قصعة خلفية)';
    reconCost = 500;
  } else if (input.condition === 'NEEDS_REPAIR') {
    conditionDiscountRate = 0.20;
    conditionLabelAr = 'مضروب ومصلح / بحاجة صيانة';
    reconCost = 900;
  }

  // Mileage penalty if excessive (> 22,000 km/yr)
  const carAge = Math.max(1, new Date().getFullYear() - input.customerCarYear);
  const annualKm = input.customerCarKm / carAge;
  if (annualKm > 22000) {
    reconCost += 200; // Tire / fluid buffer
  }

  const conditionAdjustmentJod = Math.round((baseMarket * conditionDiscountRate) / 50) * 50;
  const adjustedMarketValue = baseMarket - conditionAdjustmentJod;

  // Wholesale dealer margin (10% to 15%)
  const marginDeduction = Math.round((adjustedMarketValue * (marginPct / 100)) / 50) * 50;
  
  // Suggested wholesale intake offer
  const wholesaleIntakePriceJod = Math.max(500, adjustedMarketValue - marginDeduction - reconCost);
  const wholesaleDiscountPercent = Math.round(((baseMarket - wholesaleIntakePriceJod) / baseMarket) * 1000) / 10;

  // Net cash customer must pay
  const netCashToCollectJod = Math.max(0, showroomPrice - wholesaleIntakePriceJod);

  // Dealer expected net profit on the entire trade-in cycle
  const dealerExpectedProfitOnDealJod = marginDeduction;

  const dealVerdictAr =
    netCashToCollectJod > 0
      ? `صفقة بدل رابحة: يُقبض من الزبون مبلغ (${netCashToCollectJod.toLocaleString()} د.أ) نقداً مع استلام سيارته بسعر تجاري (${wholesaleIntakePriceJod.toLocaleString()} د.أ)، مع تحقيق هامش ربح محمي بنحو (${dealerExpectedProfitOnDealJod.toLocaleString()} د.أ).`
      : `تتجاوز قيمة سيارة الزبون سيارة المعرض، يُرد للزبون فارق (${Math.abs(showroomPrice - wholesaleIntakePriceJod).toLocaleString()} د.أ).`;

  const tradeInTipsAr = [
    'اشترط فحص الشاصي والمحرك والكمبيوتر في مركز معتمد قبل توقيع عقد البدل النهائي.',
    'تأكد من خلو سيارة الزبون من أي مخالفات سير أو حجوزات مالية لدى إدارة السير والترخيص.',
    'احتفظ بهامش التجهيز البالغ ' + reconCost + ' د.أ لتغطية نفقات البوليش والدراي كلين ونقل الملكية.',
  ];

  return {
    customerCarMarketValueJod: baseMarket,
    conditionAdjustmentJod,
    conditionLabelAr,
    reconditioningEstimateJod: reconCost,
    wholesaleIntakePriceJod,
    wholesaleDiscountPercent,
    showroomCarPriceJod: showroomPrice,
    netCashToCollectJod,
    dealerExpectedProfitOnDealJod,
    dealVerdictAr,
    tradeInTipsAr,
  };
}
