/**
 * Jordan Free Zone Import Landing Cost & Duty Engine (حاسبة استيراد حرة الزرقاء)
 * 
 * Computes exact landed cost to Zarqa Free Zone from USA auctions, UAE, China, or Korea,
 * including ocean freight, Aqaba port charges, overland transport, and target showroom profit.
 */

export type OriginCountry = 'USA_AUCTION' | 'UAE_DUBAI' | 'CHINA_EV' | 'KOREA';
export type ForeignCurrency = 'USD' | 'AED' | 'CNY';

export interface ImportCalculationInput {
  origin: OriginCountry;
  purchasePriceForeign: number;
  currency: ForeignCurrency;
  fuelType: 'GASOLINE' | 'HYBRID' | 'ELECTRIC';
  engineCc?: number;
  isInspectedSalvage?: boolean;
  targetProfitPercent?: number; // e.g. 12%
}

export interface ImportCalculationResult {
  purchasePriceForeign: number;
  currency: ForeignCurrency;
  exchangeRateToJod: number;
  purchasePriceJod: number;
  oceanFreightJod: number;
  portHandlingAndTransitJod: number; // Aqaba port fees + Zarqa carrier transport
  customsFreeZoneDepositJod: number; // رسوم تنظيم بيانات الإيداع بالحرة
  totalLandedFreeZoneCostJod: number; // واصل حرة الزرقاء (غير مجمرك)
  estimatedClearedDutiesJod: number; // في حال رغب التاجر بتجمركها محلياً
  totalClearedDomesticCostJod: number; // مجمرك وجاهز
  suggestedFreeZoneSalePriceJod: number; // بسعر الحرة مع ربح 12%
  suggestedDomesticSalePriceJod: number; // بالسوق الداخلي مع ربح 12%
  projectedNetProfitJod: number;
  roiPercent: number;
  originLabelAr: string;
  notesAr: string[];
}

export function calculateImportToZarqa(input: ImportCalculationInput): ImportCalculationResult {
  const targetProfitPct = input.targetProfitPercent ?? 12;

  // Currency conversion to JOD
  let rate = 0.709; // USD default
  if (input.currency === 'AED') rate = 0.193;
  if (input.currency === 'CNY') rate = 0.098;

  const purchasePriceJod = Math.round(input.purchasePriceForeign * rate);

  // Freight & Transport charges
  let oceanFreightUsd = 1800; // USA East coast default
  let originLabelAr = 'مزادات أمريكا (Copart / IAAI / Manheim)';

  if (input.origin === 'UAE_DUBAI') {
    oceanFreightUsd = 650; // Overland / RORO from UAE
    originLabelAr = 'سوق الإمارات ودبي (العوير / الشارقة)';
  } else if (input.origin === 'CHINA_EV') {
    oceanFreightUsd = 2200; // China 40ft container share / RORO
    originLabelAr = 'المصانع والموانئ الصينية (سيارات كهربائية)';
  } else if (input.origin === 'KOREA') {
    oceanFreightUsd = 1600; // Incheon / Busan RORO
    originLabelAr = 'مزادات كوريا الجنوبية (إنشون)';
  }

  const oceanFreightJod = Math.round(oceanFreightUsd * 0.709);

  // Aqaba port handling, manifest clearance, and truck car-carrier transport to Zarqa Free Zone
  const portHandlingAndTransitJod = 340;
  // Free zone customs deposit and storage
  const customsFreeZoneDepositJod = 120;

  // Total landed in Zarqa Free Zone (غير مجمرك)
  const totalLandedFreeZoneCostJod =
    purchasePriceJod + oceanFreightJod + portHandlingAndTransitJod + customsFreeZoneDepositJod;

  // Estimated Customs & Taxes if cleared locally in Jordan
  let effectiveTaxRate = 0.55; // Petrol <=1600cc default
  if (input.fuelType === 'HYBRID') {
    effectiveTaxRate = 0.40;
  } else if (input.fuelType === 'ELECTRIC') {
    effectiveTaxRate = totalLandedFreeZoneCostJod <= 10000 ? 0.10 : 0.45;
  } else if (input.fuelType === 'GASOLINE' && (input.engineCc || 2000) > 2500) {
    effectiveTaxRate = 0.85;
  } else if (input.fuelType === 'GASOLINE' && (input.engineCc || 2000) > 1600) {
    effectiveTaxRate = 0.68;
  }

  const estimatedClearedDutiesJod = Math.round(totalLandedFreeZoneCostJod * effectiveTaxRate);
  const totalClearedDomesticCostJod = totalLandedFreeZoneCostJod + estimatedClearedDutiesJod + 350; // + plates and registration

  // Target Profit & Suggested Selling Prices
  const projectedNetProfitJod = Math.round(totalLandedFreeZoneCostJod * (targetProfitPct / 100));
  const suggestedFreeZoneSalePriceJod = totalLandedFreeZoneCostJod + projectedNetProfitJod;
  const suggestedDomesticSalePriceJod = totalClearedDomesticCostJod + projectedNetProfitJod;
  const roiPercent = targetProfitPct;

  const notesAr = [
    `التكلفة الإجمالية واصل حرة الزرقاء غير مجمرك: (${totalLandedFreeZoneCostJod.toLocaleString()} د.أ).`,
    `في حال بيعها بالمنطقة الحرة بربح (${targetProfitPct}%)، السعر المقترح للزبون هو (${suggestedFreeZoneSalePriceJod.toLocaleString()} د.أ).`,
    `في حال رغبة الزبون باستلامها مجمركة ومرخصة، التكلفة بعد الجمرك والترخيص (${totalClearedDomesticCostJod.toLocaleString()} د.أ) وسعر البيع المجمرك (${suggestedDomesticSalePriceJod.toLocaleString()} د.أ).`,
  ];

  return {
    purchasePriceForeign: input.purchasePriceForeign,
    currency: input.currency,
    exchangeRateToJod: rate,
    purchasePriceJod,
    oceanFreightJod,
    portHandlingAndTransitJod,
    customsFreeZoneDepositJod,
    totalLandedFreeZoneCostJod,
    estimatedClearedDutiesJod,
    totalClearedDomesticCostJod,
    suggestedFreeZoneSalePriceJod,
    suggestedDomesticSalePriceJod,
    projectedNetProfitJod,
    roiPercent,
    originLabelAr,
    notesAr,
  };
}
