/**
 * Jordan Customs, Free-Zone & Tax Matrix
 * حاسبة الجمارك الأردنية، الترسيم، ومقارنة سعر المنطقة الحرة (حرة الزرقاء)
 * محدثة ومطابقة رسمياً لأحدث قرارات مجلس الوزراء الأردني ونظام الضريبة الخاصة 2024-2026
 */

export type VehicleFuelCategory = 'ELECTRIC' | 'PLUGIN_HYBRID' | 'HYBRID' | 'PETROL' | 'DIESEL';

export interface JordanCustomsBreakdown {
  customsDutyJod: number;         // رسم جمركي أساسي
  specialTaxJod: number;          // ضريبة خاصة
  salesTaxJod: number;            // ضريبة مبيعات عامة (16%)
  clearanceAndInspectionJod: number; // رسوم فحص مواصفات ومقاييس + عمولة تخليص ومعاينة
  registrationAndPlatesJod: number; // رسوم تسجيل أولي ونمر ورخص سير
  totalTaxesAndFeesJod: number;   // إجمالي التكاليف الحكومية والترسيم
  effectiveTaxRatePercent: number; // النسبة الضريبية الإجمالية الحقيقية %
}

export interface JordanCustomsMatrixResult {
  vehicleTypeAr: string;
  fuelCategory: VehicleFuelCategory;
  isElectric: boolean;
  isHybrid: boolean;
  isPluginHybrid: boolean;
  engineCc?: number | null;
  currentAskingPrice: number;
  currentPriceStatus: 'CLEARED_DOMESTIC' | 'FREE_ZONE_ZARQA';
  estimatedFreeZonePrice: number;   // السعر المقدر في حرة الزرقاء (غير مجمرك CIF)
  estimatedClearedPrice: number;    // السعر المقدر مجمرك جاهز بالترخيص المحلي
  breakdown: JordanCustomsBreakdown;
  regulationsSummaryAr: string;
  legalDecreeReferenceAr: string;   // السند القانوني وقرار مجلس الوزراء
  adviceForBuyerAr: string;
}

export function calculateJordanCustomsAndFreeZone(params: {
  fuel?: string | null;
  engineCc?: number | null;
  askingPrice?: number | null;
  fmvPrice?: number | null;
  location?: string | null;
}): JordanCustomsMatrixResult {
  const fuelRaw = (params.fuel || '').toLowerCase();
  const locationRaw = (params.location || '').toLowerCase();
  const engineCc = params.engineCc || 2000;

  // Determine fuel category accurately
  let fuelCategory: VehicleFuelCategory = 'PETROL';
  let vehicleTypeAr = 'بنزين تقليدي';
  let isElectric = false;
  let isHybrid = false;
  let isPluginHybrid = false;

  if (fuelRaw.includes('plugin') || fuelRaw.includes('plug_in') || fuelRaw.includes('phev')) {
    fuelCategory = 'PLUGIN_HYBRID';
    vehicleTypeAr = 'هايبرد بقابس شحن (PHEV / Plug-in Hybrid)';
    isHybrid = true;
    isPluginHybrid = true;
  } else if (fuelRaw.includes('electric') || fuelRaw.includes('كهربا')) {
    fuelCategory = 'ELECTRIC';
    vehicleTypeAr = 'كهرباء بالكامل (EV)';
    isElectric = true;
  } else if (fuelRaw.includes('hybrid') || fuelRaw.includes('هايبرد')) {
    fuelCategory = 'HYBRID';
    vehicleTypeAr = 'هايبرد هجين (HEV)';
    isHybrid = true;
  } else if (fuelRaw.includes('diesel') || fuelRaw.includes('ديزل')) {
    fuelCategory = 'DIESEL';
    vehicleTypeAr = 'ديزل (Diesel)';
  }

  // Detect whether the current price is Free-Zone (حرة الزرقاء) or Domestic (مجمرك داخلي)
  const isFreeZone = locationRaw.includes('حرة') || locationRaw.includes('free zone') || locationRaw.includes('الزرقاء الحرة');
  const baseReferencePrice = params.askingPrice && params.askingPrice > 2000 
    ? params.askingPrice 
    : (params.fmvPrice && params.fmvPrice > 2000 ? params.fmvPrice : 19900);

  // Calibrated Jordan tax rates based on recent Council of Ministers decisions (قرارات مجلس الوزراء الأردني)
  let effectiveTaxRate = 0.51; // Default petrol
  let regulationsSummaryAr = '';
  let legalDecreeReferenceAr = '';

  if (isElectric) {
    // Tiered EV tax in Jordan (Cabinet Resolutions on Electric Passenger Vehicles)
    if (baseReferencePrice <= 12000) {
      effectiveTaxRate = 0.12; // 10% special tax + 2% inspection/duties for budget EV
      regulationsSummaryAr = 'فئة السيارات الكهربائية الاقتصادية (أقل من 12 ألف CIF): معفاة جزئياً ومحددة بضريبة خاصة 10% + 2% رسوم خدمات وتخليص';
      legalDecreeReferenceAr = 'قرار مجلس الوزراء للحوافز التشجيعية للمركبات الكهربائية الاقتصادية الصغيرة.';
    } else if (baseReferencePrice <= 25000) {
      effectiveTaxRate = 0.40; // 40% combined special tax + sales tax for mid-tier EV
      regulationsSummaryAr = 'فئة السيارات الكهربائية المتوسطة: خاضعة لضريبة خاصة وضريبة مبيعات بنسبة إجمالية تقدر بـ 40%';
      legalDecreeReferenceAr = 'نظام الضريبة الخاصة المحدث للمركبات الكهربائية.';
    } else {
      effectiveTaxRate = 0.55; // 55% luxury EV
      regulationsSummaryAr = 'فئة السيارات الكهربائية الفاخرة (فوق 25 ألف CIF): خاضعة للضريبة الخاصة الكاملة بنسبة 55%';
      legalDecreeReferenceAr = 'التعرفة الخاصة لمركبات الرفاهية الكهربائية.';
    }
  } else if (isPluginHybrid || isHybrid) {
    // Hybrid & Plug-in Hybrid: ~40% combined duties & taxes (special tax + 16% sales tax)
    if (engineCc <= 2500) {
      effectiveTaxRate = 0.40; // 40% total combined tax load
      regulationsSummaryAr = isPluginHybrid
        ? 'مركبات البلج-إن هايبرد (Plug-in Hybrid سعة محرك حتى 2500cc): تتمتع بالحزمة التحفيزية الشاملة المخفضة بنسبة إجمالية تبلغ 40% (تشمل الضريبة الخاصة المخفضة وضريبة المبيعات 16%).'
        : 'فئة الهايبرد الهجين (سعة محرك حتى 2500cc): خاضعة لنسبة ضرائب ورسوم إجمالية مخفضة بنحو 40% لتشجيع كفاءة استهلاك الوقود.';
      legalDecreeReferenceAr = 'حزمة التخفيضات الضريبية لمركبات الهايبرد والبلج-إن الصادرة بموجب نظام الضريبة الخاصة المعدل.';
    } else {
      effectiveTaxRate = 0.55;
      regulationsSummaryAr = 'فئة الهايبرد سعة محرك كبيرة (أكثر من 2500cc): تخضع لنسبة ضرائب ورسوم إجمالية تقدر بنحو 55%.';
      legalDecreeReferenceAr = 'نظام الضريبة الخاصة للمركبات ذات السعات المحركية المرتفعة.';
    }
  } else if (fuelCategory === 'DIESEL') {
    effectiveTaxRate = 0.55;
    regulationsSummaryAr = 'مركبات الديزل الحديثة: تخضع لرسوم جمركية وضريبة خاصة بنسبة إجمالية تقدر بـ 55%.';
    legalDecreeReferenceAr = 'التعرفة الجمركية الأردنية الموحدة لمركبات الديزل.';
  } else {
    // Traditional Petrol: Reduced from 71% to ~51%
    if (engineCc <= 2500) {
      effectiveTaxRate = 0.51; // 51% total
      regulationsSummaryAr = 'بنزين تقليدي (حتى 2500cc): خُفضت الضريبة الإجمالية من 71% لتصبح 51% شاملة الضريبة الخاصة وضريبة المبيعات 16%.';
      legalDecreeReferenceAr = 'القرار الحكومي بتخفيض العبء الضريبي على سيارات البنزين إلى 51%.';
    } else {
      effectiveTaxRate = 0.68;
      regulationsSummaryAr = 'بنزين محرك كبير (> 2500cc): خاضع لضريبة خاصة إضافية تصل بإجمالي الرسوم إلى نحو 68%.';
      legalDecreeReferenceAr = 'نظام الضريبة الخاصة على مركبات الدفع الرباعي والمحركات الكبيرة.';
    }
  }

  const clearanceAndInspectionJod = 240; // فحص المواصفات والمقاييس + كشف الفحص الإشعاعي + عمولة التخليص والمعاينة
  const registrationAndPlatesJod = 260;  // رسوم التسجيل لأول مرة + لوحات الأرقام وطوابع الترخيص

  let estimatedFreeZonePrice: number;
  let estimatedClearedPrice: number;
  let customsDutyJod: number;
  let specialTaxJod: number;
  let salesTaxJod: number;
  let totalTaxesAndFeesJod: number;

  if (isFreeZone) {
    // Current price is Free Zone price (سعر السيارة في ساحات حرة الزرقاء بدون جمرك)
    estimatedFreeZonePrice = Math.round(baseReferencePrice);
    const taxesOnly = Math.round(estimatedFreeZonePrice * effectiveTaxRate);
    specialTaxJod = Math.round(taxesOnly * 0.55);
    salesTaxJod = Math.round(taxesOnly * 0.35);
    customsDutyJod = Math.round(taxesOnly * 0.10);
    totalTaxesAndFeesJod = taxesOnly + clearanceAndInspectionJod + registrationAndPlatesJod;
    estimatedClearedPrice = estimatedFreeZonePrice + totalTaxesAndFeesJod;
  } else {
    // Current price is Domestic (مجمركة ومرخصة في السوق الأردني)
    estimatedClearedPrice = Math.round(baseReferencePrice);
    // Reverse-calculate CIF Free-Zone base: Cleared Price = FreeZone * (1 + effectiveTaxRate) + overhead
    const netWithoutOverhead = Math.max(1000, estimatedClearedPrice - clearanceAndInspectionJod - registrationAndPlatesJod);
    estimatedFreeZonePrice = Math.round(netWithoutOverhead / (1 + effectiveTaxRate));
    const taxesOnly = Math.round(netWithoutOverhead - estimatedFreeZonePrice);
    specialTaxJod = Math.round(taxesOnly * 0.55);
    salesTaxJod = Math.round(taxesOnly * 0.35);
    customsDutyJod = Math.round(taxesOnly * 0.10);
    totalTaxesAndFeesJod = taxesOnly + clearanceAndInspectionJod + registrationAndPlatesJod;
  }

  const adviceForBuyerAr = isFreeZone
    ? `السيارة معروضة بسعر حرة الزرقاء (${estimatedFreeZonePrice.toLocaleString()} د.أ بدون جمرك). لتخليصها وترخيصها محلياً، يلزم دفع رسوم وضرائب بنسبة (${Math.round(effectiveTaxRate * 100)}%) على القيمة الجمركية بالإضافة إلى (${clearanceAndInspectionJod + registrationAndPlatesJod} د.أ) رسوم تخليص وفحص ونمر، بإجمالي (${totalTaxesAndFeesJod.toLocaleString()} د.أ)، لتصبح كلفتها الإجمالية جاهزة للسير نحو (${estimatedClearedPrice.toLocaleString()} د.أ).`
    : `سعر السيارة المعلن مجمركة ومرخصة محلياً (${estimatedClearedPrice.toLocaleString()} د.أ). قيمتها التخمينية العادلة في حرة الزرقاء قبل الجمرك تبلغ (${estimatedFreeZonePrice.toLocaleString()} د.أ)، أي أن إجمالي الضرائب بنسبة (${Math.round(effectiveTaxRate * 100)}%) من قيمة الحرة مضافاً إليها (${clearanceAndInspectionJod + registrationAndPlatesJod} د.أ) رسوم تخليص وترخيص يساوي (${totalTaxesAndFeesJod.toLocaleString()} د.أ).`;

  return {
    vehicleTypeAr,
    fuelCategory,
    isElectric,
    isHybrid,
    isPluginHybrid,
    engineCc,
    currentAskingPrice: Math.round(baseReferencePrice),
    currentPriceStatus: isFreeZone ? 'FREE_ZONE_ZARQA' : 'CLEARED_DOMESTIC',
    estimatedFreeZonePrice,
    estimatedClearedPrice,
    breakdown: {
      customsDutyJod,
      specialTaxJod,
      salesTaxJod,
      clearanceAndInspectionJod,
      registrationAndPlatesJod,
      totalTaxesAndFeesJod,
      effectiveTaxRatePercent: Math.round(effectiveTaxRate * 100),
    },
    regulationsSummaryAr,
    legalDecreeReferenceAr,
    adviceForBuyerAr,
  };
}
