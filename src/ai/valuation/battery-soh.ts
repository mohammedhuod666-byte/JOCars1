/**
 * EV/Hybrid Battery SOH & Degradation Impact Engine (Jordan Market)
 * فاحص صحة بطارية الهايبرد والبلج-إن والكهرباء وتأثيرها المالي على القيمة السوقية
 */

export type BatteryHealthGrade = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DEGRADED_CRITICAL';

export interface BatteryHealthResult {
  isApplicable: boolean;              // هل تنطبق على هذه السيارة (كهرباء أو هايبرد أو بلج-إن)
  powertrainType: 'EV' | 'PLUGIN_HYBRID' | 'HYBRID' | 'NONE';
  powertrainLabelAr: string;
  defaultEstimatedSoh: number;         // نسبة صحة البطارية التقديرية إحصائياً %
  selectedSoh: number;                 // النسبة المختارة أو المدخلة من فحص OBD2 %
  healthGrade: BatteryHealthGrade;
  healthGradeLabelAr: string;
  badgeColor: string;
  estimatedRemainingRangeKm?: number | null; // المدى المتبقي التقديري للشحنة (كهربائي بالكامل)
  originalFactoryRangeKm?: number | null;
  estimatedBatteryPackSizeKwh?: number | null;
  financialAdjustmentJod: number;      // الخصم أو الأثر المالي على سعر السيارة (د.أ)
  replacementOrRecellCostJod: number;  // تكلفة تبديل خلايا أو استبدال البطارية بالأردن
  adjustedFmvPriceJod: number;         // القيمة العادلة بعد تعديل صحة البطارية
  recommendations: string[];
  explanationAr: string;
  educationalGuideAr: string;          // شرح تفصيلي مبسط ومقنع للمستخدم
}

export function evaluateBatteryHealthImpact(params: {
  fuel?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileage?: number | null;
  baseFmvPrice?: number | null;
  customSohInput?: number | null;
}): BatteryHealthResult {
  const fuelRaw = (params.fuel || '').toLowerCase();
  const currentYear = new Date().getFullYear();
  const carYear = params.year || currentYear;
  const ageYears = Math.max(0, currentYear - carYear);
  const mileageKm = params.mileage || 0;
  const baseFmv = Math.round(params.baseFmvPrice || 19900);

  const isPHEV = fuelRaw.includes('plugin') || fuelRaw.includes('plug_in') || fuelRaw.includes('phev');
  const isEV = !isPHEV && (fuelRaw.includes('electric') || fuelRaw.includes('كهربا'));
  const isHybrid = isPHEV || fuelRaw.includes('hybrid') || fuelRaw.includes('هايبرد');

  if (!isEV && !isHybrid) {
    return {
      isApplicable: false,
      powertrainType: 'NONE',
      powertrainLabelAr: 'بنزين / ديزل تقليدي',
      defaultEstimatedSoh: 100,
      selectedSoh: 100,
      healthGrade: 'EXCELLENT',
      healthGradeLabelAr: 'غير منطبق (مركبة غير كهربائية)',
      badgeColor: 'bg-slate-800 text-slate-400',
      financialAdjustmentJod: 0,
      replacementOrRecellCostJod: 0,
      adjustedFmvPriceJod: baseFmv,
      recommendations: [],
      explanationAr: 'هذا الفاحص مخصص للمركبات الكهربائية بالكامل (EV) والهجينة والبلج-إن هايبرد (Hybrid / PHEV).',
      educationalGuideAr: 'مركبات البنزين التقليدية لا تحتوي على بطارية جر ليثيوم عالية الجهد، ومقياس SOH لا ينطبق عليها.',
    };
  }

  // Statistical degradation estimation for Jordan climate:
  // ~1.6% per year + ~0.7% per 20,000 km for EV; ~2.2% per year for older Hybrids/PHEVs
  const ageDegradation = ageYears * (isEV ? 1.6 : isPHEV ? 2.1 : 2.0);
  const mileageDegradation = (mileageKm / 20000) * (isEV ? 0.7 : 1.1);
  const totalEstimatedLoss = Math.min(45, Math.round(ageDegradation + mileageDegradation));
  const defaultEstimatedSoh = Math.max(55, Math.min(100, 100 - totalEstimatedLoss));

  const effectiveSoh = params.customSohInput !== undefined && params.customSohInput !== null
    ? Math.max(50, Math.min(100, Math.round(params.customSohInput)))
    : defaultEstimatedSoh;

  // Approximate battery sizes & ranges for popular Jordan EV/Hybrid/PHEV cars
  const modelStr = `${params.make || ''} ${params.model || ''}`.toLowerCase();
  let factoryRangeKm = isEV ? 420 : isPHEV ? 50 : 900;
  let packSizeKwh = isEV ? 65 : isPHEV ? 12 : 1.8;
  let recellCostJod = isEV ? 2800 : isPHEV ? 1400 : 750;

  // Specific profiles for well-known cars in Jordan
  if (modelStr.includes('x5') || (params.make?.toLowerCase().includes('bmw') && isPHEV)) {
    // BMW X5 xDrive40e / xDrive50e Plug-in Hybrid
    factoryRangeKm = ageYears >= 6 ? 31 : 85; // e.g. 2017 X5 40e was ~31km pure electric; newer 50e is ~85km
    packSizeKwh = ageYears >= 6 ? 9.2 : 25.7;
    recellCostJod = 1450;
  } else if (modelStr.includes('id.4') || modelStr.includes('id4')) {
    factoryRangeKm = 550;
    packSizeKwh = 84;
    recellCostJod = 3200;
  } else if (modelStr.includes('ioniq') && isEV) {
    factoryRangeKm = 380;
    packSizeKwh = 58;
    recellCostJod = 2600;
  } else if (modelStr.includes('prius')) {
    factoryRangeKm = 950;
    packSizeKwh = 1.4;
    recellCostJod = 750;
  } else if (modelStr.includes('leaf')) {
    factoryRangeKm = 240;
    packSizeKwh = 40;
    recellCostJod = 1800;
  }

  const remainingRangeKm = Math.round(factoryRangeKm * (effectiveSoh / 100));

  let healthGrade: BatteryHealthGrade = 'GOOD';
  let healthGradeLabelAr = 'جيد جداً (ضمن الاستهلاك الطبيعي)';
  let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  let financialAdjustmentJod = 0;

  if (effectiveSoh >= 90) {
    healthGrade = 'EXCELLENT';
    healthGradeLabelAr = 'ممتاز (حالة المصنع أو شبه جديدة)';
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    financialAdjustmentJod = 0; // No deduction
  } else if (effectiveSoh >= 80) {
    healthGrade = 'GOOD';
    healthGradeLabelAr = 'جيد جداً (استهلاك طبيعي متوقع)';
    badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    financialAdjustmentJod = isEV ? -300 : isPHEV ? -200 : -100;
  } else if (effectiveSoh >= 70) {
    healthGrade = 'FAIR';
    healthGradeLabelAr = 'متوسط (هبوط في كفاءة التخزين والمدى)';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    financialAdjustmentJod = isEV ? -950 : isPHEV ? -550 : -350;
  } else {
    healthGrade = 'DEGRADED_CRITICAL';
    healthGradeLabelAr = 'متدني (تتطلب تبديل خلايا أو صيانة حتمية)';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    financialAdjustmentJod = isEV ? -2200 : isPHEV ? -1100 : -650;
  }

  const adjustedFmvPriceJod = Math.max(1000, baseFmv + financialAdjustmentJod);

  const recommendations: string[] = [];
  if (effectiveSoh < 75) {
    recommendations.push('طلب تقرير تفصيلي لفارق الجهد بين الخلايا (Cell Delta Voltage) في مركز فحص متخصص — أي فارق يتجاوز 0.05V يعني وجود خلايا تالفة.');
    recommendations.push(`استخدام هبوط كفاءة البطارية كورقة تفاوض قوية وخصم ما لا يقل عن (${Math.abs(financialAdjustmentJod).toLocaleString()} د.أ) من السعر النهائي.`);
  } else {
    recommendations.push('الحفاظ على نسبة الشحن اليومي بين 20% و80% لإطالة العمر الافتراضي لخلايا الليثيوم وتجنب ترك السيارة مفرغة لفترات طويلة.');
    recommendations.push('تجنب الشحن السريع المتكرر (DC Fast Charge) في درجات الحرارة العالية صيفاً لتقليل الإجهاد الحراري.');
  }

  const explanationAr = isEV
    ? `صحة البطارية الحالية (${effectiveSoh}%) تمنح السيارة مدى كهربائياً يقارب (${remainingRangeKm} كم) مقارنة بمدى المصنع (${factoryRangeKm} كم). الأثر المالي على القيمة السوقية هو تعديل بمقدار (${financialAdjustmentJod === 0 ? '0' : financialAdjustmentJod.toLocaleString()} د.أ).`
    : isPHEV
    ? `بطارية البلج-إن هايبرد الحالية تعمل بكفاءة (${effectiveSoh}%) وتمنح مدى قيادة كهربائي خالص يقارب (${remainingRangeKm} كم) قبل تدخل محرك البنزين. الأثر المالي المترتب هو تعديل بمقدار (${financialAdjustmentJod === 0 ? '0' : financialAdjustmentJod.toLocaleString()} د.أ).`
    : `صحة بطارية الهايبرد التقديرية (${effectiveSoh}%). البطارية بحالة (${healthGradeLabelAr}) وتعمل على تحقيق التوفير في استهلاك الوقود بصورة مستقرة.`;

  const educationalGuideAr = `مقياس SOH (State of Health) هو أهم معيار فني ومالي عند شراء سيارة هايبرد أو كهرباء في الأردن. يمثل النسبة المئوية المتبقية من سعة البطارية الأصلية عند تصنيعها. يتم فحصه وقراءته عبر مدخل الكمبيوتر (OBD2) في مراكز الفحص المعتمدة، ويعكس مباشرة المسافة التي تقطعها السيارة بالشحنة الواحدة ومقدار التوفير في استهلاك البنزين.`;

  return {
    isApplicable: true,
    powertrainType: isEV ? 'EV' : isPHEV ? 'PLUGIN_HYBRID' : 'HYBRID',
    powertrainLabelAr: isEV 
      ? 'كهربائية بالكامل (Pure Electric EV)' 
      : isPHEV 
      ? 'هايبرد بقابس شحن (Plug-in Hybrid PHEV)' 
      : 'هايبرد هجين ذاتي الشحن (Hybrid HEV)',
    defaultEstimatedSoh,
    selectedSoh: effectiveSoh,
    healthGrade,
    healthGradeLabelAr,
    badgeColor,
    estimatedRemainingRangeKm: remainingRangeKm,
    originalFactoryRangeKm: factoryRangeKm,
    estimatedBatteryPackSizeKwh: packSizeKwh,
    financialAdjustmentJod,
    replacementOrRecellCostJod: recellCostJod,
    adjustedFmvPriceJod,
    recommendations,
    explanationAr,
    educationalGuideAr,
  };
}
