/**
 * 3-Year Residual Value Forecast Engine (Jordan Market Dynamics)
 * 
 * Computes forecasted fair market value for Years +1, +2, and +3
 * based on Jordanian automotive depreciation curves, brand value retention tiers,
 * powertrain obsolescence risk, and projected annual mileage.
 */

export interface YearForecast {
  yearOffset: number; // 1, 2, 3
  calendarYear: number;
  projectedMileageKm: number;
  estimatedFmvJod: number;
  expectedRange: {
    min: number;
    max: number;
  };
  depreciationFromCurrentJod: number;
  depreciationPercentTotal: number;
  annualDepreciationRatePercent: number;
}

export type RetentionTier = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'HIGH_DEPRECIATION';

export interface DepreciationForecastResult {
  currentFmvJod: number;
  currentYear: number;
  projectedAnnualKm: number;
  retentionTier: RetentionTier;
  retentionTierLabelAr: string;
  retentionBadgeColor: string;
  marketVeracityAr: string;
  forecasts: YearForecast[];
  summaryInsightAr: string;
}

interface DepreciationInput {
  baseFmv: number;
  currentYear?: number;
  manufactureYear: number;
  currentMileageKm: number;
  make?: string | null;
  fuel?: string | null;
}

// Brand value retention index in Jordan
// Tier 1: Highly liquid, "شيك بالجيب" (Toyota, Lexus, Honda, Hyundai, Kia)
// Tier 2: Solid demand (Nissan, Mitsubishi, Mazda, Volkswagen)
// Tier 3: Luxury German & American (BMW, Mercedes-Benz, Audi, Ford, Chevrolet, Jeep)
// Tier 4: Fast depreciating or high maintenance risk (Land Rover, Jaguar, niche brands, older EVs)
function getBrandRetentionProfile(make: string | null | undefined, fuel: string | null | undefined): {
  tier: RetentionTier;
  tierLabelAr: string;
  badgeColor: string;
  baseAnnualRate: number;
  veracityText: string;
} {
  const normMake = (make || '').toLowerCase().trim();
  const normFuel = (fuel || '').toUpperCase().trim();

  const isTier1 = /toyota|تويوتا|lexus|لكزس|honda|هوندا|hyundai|هيونداي|kia|كيا/.test(normMake);
  const isTier2 = /nissan|نيسان|mitsubishi|ميتسوبيشي|mazda|مازدا|volkswagen|فولكس|فولكسفاجن/.test(normMake);
  const isLuxury = /bmw|بي ام|mercedes|مرسيدس|audi|أودي|porsche|بورش|land rover|رنج|جاكوار|jaguar/.test(normMake);
  const isChineseEV = /byd|changan|geely|mg|zeekr|nio|xpeng|leapmotor/.test(normMake) || (normFuel === 'ELECTRIC' && !/tesla|تيسلا/.test(normMake));

  if (isTier1) {
    return {
      tier: 'EXCELLENT',
      tierLabelAr: 'شيك بالجيب — احتفاظ فائق بالقيمة',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      baseAnnualRate: 0.055, // ~5.5% annual depreciation
      veracityText: 'تعتبر هذه العلامة من الأكثر طلباً وسيولة في السوق الأردني، وتحافظ على قيمتها السوقية بنسبة تفوق 85% على المدى المتوسط.',
    };
  }

  if (isTier2) {
    return {
      tier: 'GOOD',
      tierLabelAr: 'احتفاظ جيد ومستقر بالقيمة',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      baseAnnualRate: 0.075, // ~7.5% annual depreciation
      veracityText: 'مركبة ذات طلب متوازن وقطع غيار متوفرة، ومعدل هبوط قيمتها يتماشى تماماً مع المعدل الطبيعي للسوق.',
    };
  }

  if (isLuxury) {
    return {
      tier: 'AVERAGE',
      tierLabelAr: 'استهلاك طبيعي للفئات الفاخرة',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      baseAnnualRate: 0.095, // ~9.5% annual depreciation
      veracityText: 'السيارات الفاخرة تشهد هبوطاً تدريجياً أكبر بسبب ارتفاع كلف الصيانة والقطع بعد انتهاء فترات الضمان وكثرة الأنظمة الإلكترونية.',
    };
  }

  if (isChineseEV) {
    return {
      tier: 'HIGH_DEPRECIATION',
      tierLabelAr: 'انخفاض متسارع (تطور تكنولوجي سريع)',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      baseAnnualRate: 0.125, // ~12.5% annual depreciation
      veracityText: 'مركبات التكنولوجيا الكهربائية الحديثة تشهد نزولاً أسرع نظراً للتسارع السنوي في سعات البطاريات ونزول أسعار الموديلات الجديدة في الوكالات والحرة.',
    };
  }

  return {
    tier: 'GOOD',
    tierLabelAr: 'معدل استهلاك سوقي معتدل',
    badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    baseAnnualRate: 0.08, // ~8% annual depreciation
    veracityText: 'تتبع منحنى الإهلاك القياسي المعتمد لسوق عمان والزرقاء للسيارات العائلية.',
  };
}

export function calculateDepreciationForecast(input: DepreciationInput): DepreciationForecastResult {
  const currentFmv = Math.max(500, Math.round(input.baseFmv));
  const currentCalendarYear = input.currentYear || new Date().getFullYear();
  const vehicleAge = Math.max(0, currentCalendarYear - input.manufactureYear);
  const currentMileage = Math.max(0, input.currentMileageKm);

  // Jordan average annual driving mileage ~ 18,000 km
  const annualKm = 18500;

  const profile = getBrandRetentionProfile(input.make, input.fuel);

  // Non-linear aging attenuation: older cars (e.g. 10+ years) depreciate at a slower percentage of their current price
  // than newer cars (0-3 years) which lose large nominal amounts.
  const ageAttenuation = vehicleAge >= 10 ? 0.75 : vehicleAge >= 6 ? 0.88 : 1.05;

  const forecasts: YearForecast[] = [];
  let previousPrice = currentFmv;

  for (let offset = 1; offset <= 3; offset++) {
    const calendarYear = currentCalendarYear + offset;
    const projectedMileageKm = currentMileage + (annualKm * offset);

    // Progressive annual rate with mild diminishing drop
    const stepRate = Math.min(0.18, Math.max(0.04, profile.baseAnnualRate * ageAttenuation * (1 - (offset * 0.05))));
    const estimatedFmvJod = Math.max(500, Math.round(previousPrice * (1 - stepRate) / 50) * 50);

    const depreciationFromCurrentJod = currentFmv - estimatedFmvJod;
    const depreciationPercentTotal = Math.round((depreciationFromCurrentJod / currentFmv) * 1000) / 10;
    const annualDepreciationRatePercent = Math.round(stepRate * 1000) / 10;

    // Tolerance range (±5% to ±7% based on future maintenance condition)
    const rangeTolerance = 0.05 + (offset * 0.015);
    const min = Math.round((estimatedFmvJod * (1 - rangeTolerance)) / 50) * 50;
    const max = Math.round((estimatedFmvJod * (1 + rangeTolerance)) / 50) * 50;

    forecasts.push({
      yearOffset: offset,
      calendarYear,
      projectedMileageKm,
      estimatedFmvJod,
      expectedRange: { min, max },
      depreciationFromCurrentJod,
      depreciationPercentTotal,
      annualDepreciationRatePercent,
    });

    previousPrice = estimatedFmvJod;
  }

  const finalForecast = forecasts[2];
  const retainedValuePercent = Math.round((finalForecast.estimatedFmvJod / currentFmv) * 100);

  const summaryInsightAr = `يتوقع أن تحتفظ هذه السيارة بنحو ${retainedValuePercent}% من قيمتها الحالية بعد 3 سنوات (بحدود ${finalForecast.estimatedFmvJod.toLocaleString()} د.أ عند ممشى متوقع ${finalForecast.projectedMileageKm.toLocaleString()} كم)، شريطة الحفاظ على نظافة الهيكل والصيانة الدورية.`;

  return {
    currentFmvJod: currentFmv,
    currentYear: currentCalendarYear,
    projectedAnnualKm: annualKm,
    retentionTier: profile.tier,
    retentionTierLabelAr: profile.tierLabelAr,
    retentionBadgeColor: profile.badgeColor,
    marketVeracityAr: profile.veracityText,
    forecasts,
    summaryInsightAr,
  };
}
