/**
 * Odometer Rollback & Usage Anomaly Detector (Jordan Market Baseline)
 * فاحص التلاعب بالعداد ومطابقة الممشى الإحصائي للسوق الأردني
 */

export type OdometerStatus =
  | 'NORMAL'                  // ممشى طبيعي متناسق
  | 'LOW_USAGE'               // ممشى منخفض مقبول (استخدام خفيف/سيارة ثانية)
  | 'SUSPECTED_ROLLBACK'      // اشتباه تلاعب بالعداد (ممشى غير منطقي لسنة الصنع)
  | 'EXCESSIVE_HIGH'          // ممشى مرتفع جداً (اشتباه تطبيقات أو خطوط خارجية)
  | 'BRAND_NEW';              // سيارة جديدة / عداد زيرو

export type OdometerRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface OdometerAnalysisResult {
  actualKm: number;
  vehicleAgeYears: number;
  expectedAnnualKm: number;
  expectedTotalKm: number;
  expectedKmRange: {
    min: number;
    max: number;
  };
  actualAnnualKm: number;
  status: OdometerStatus;
  statusLabelAr: string;
  riskLevel: OdometerRiskLevel;
  anomalyScore: number; // 0 - 100 (0 = normal, 100 = extreme red flag)
  verdictAr: string;
  explanationAr: string;
  recommendations: string[];
  financialRiskImpactJod: number;
}

export function analyzeOdometerIntegrity(params: {
  year: number | null | undefined;
  mileage: number | null | undefined;
  fuel?: string | null;
  askingPrice?: number | null;
}): OdometerAnalysisResult {
  const currentYear = new Date().getFullYear();
  const carYear = params.year || currentYear;
  const actualKm = Math.max(0, Math.round(params.mileage || 0));
  const ageYears = Math.max(0.5, currentYear - carYear);
  const fuel = (params.fuel || '').toLowerCase();

  // Baseline annual consumption in Jordan:
  // Hybrid & EV commuters in Jordan average slightly higher (~18,000 - 22,000 km/yr)
  // Regular private petrol averages ~15,000 - 18,000 km/yr
  const isHybridOrEV = fuel.includes('hybrid') || fuel.includes('هايبرد') || fuel.includes('electric') || fuel.includes('كهربا');
  const baseAnnualExpected = isHybridOrEV ? 19000 : 16500;
  const minAnnualExpected = isHybridOrEV ? 11000 : 9500;
  const maxAnnualExpected = isHybridOrEV ? 27000 : 24000;

  const expectedTotalKm = Math.round(ageYears * baseAnnualExpected);
  const minExpectedKm = Math.round(ageYears * minAnnualExpected);
  const maxExpectedKm = Math.round(ageYears * maxAnnualExpected);
  const actualAnnualKm = Math.round(actualKm / ageYears);

  // New vehicles (0-1 year old)
  if (ageYears <= 1 && actualKm <= 20000) {
    return {
      actualKm,
      vehicleAgeYears: ageYears,
      expectedAnnualKm: baseAnnualExpected,
      expectedTotalKm,
      expectedKmRange: { min: 0, max: 20000 },
      actualAnnualKm,
      status: 'BRAND_NEW',
      statusLabelAr: 'سيارة شبه زيرو / حديثة العهد',
      riskLevel: 'LOW',
      anomalyScore: 0,
      verdictAr: 'الممشى طبيعي ومطابق للسيارات الحديثة.',
      explanationAr: `السيارة موديل ${carYear} والممشى المسجل (${actualKm.toLocaleString()} كم) متناسق مع حداثة المركبة.`,
      recommendations: ['التأكد من ضمان الوكالة وتاريخ أول صيانة دورية'],
      financialRiskImpactJod: 0,
    };
  }

  // Suspiciously low mileage (Potential Rollback / تنزيل عداد)
  // Example: car is 6+ years old, but km is less than 4,500 km/year without verified agency garage stamps
  const isSevereRollbackSuspect = ageYears >= 4 && actualAnnualKm < 4500 && actualKm < 40000;
  const isModerateRollbackSuspect = ageYears >= 5 && actualAnnualKm < 6500 && actualKm < 60000;

  if (isSevereRollbackSuspect || isModerateRollbackSuspect) {
    const kmDeficit = expectedTotalKm - actualKm;
    const anomalyScore = Math.min(95, Math.round(60 + (kmDeficit / expectedTotalKm) * 40));
    // Tampered odometers on high-value cars cause ~1,500 to 4,000 JOD valuation distortion
    const basePrice = params.askingPrice || 15000;
    const financialImpact = Math.round(Math.min(basePrice * 0.22, Math.max(800, (kmDeficit / 10000) * 180)));

    return {
      actualKm,
      vehicleAgeYears: ageYears,
      expectedAnnualKm: baseAnnualExpected,
      expectedTotalKm,
      expectedKmRange: { min: minExpectedKm, max: maxExpectedKm },
      actualAnnualKm,
      status: 'SUSPECTED_ROLLBACK',
      statusLabelAr: 'اشتباه تلاعب بالعداد (ممشى غير منطقي)',
      riskLevel: isSevereRollbackSuspect ? 'CRITICAL' : 'HIGH',
      anomalyScore,
      verdictAr: 'الممشى المسجل منخفض جداً بشكل غير طبيعي نسبة لعمر السيارة في الأردن.',
      explanationAr: `السيارة موديل ${carYear} (عمرها ${Math.round(ageYears)} سنوات) بممشى ${actualKm.toLocaleString()} كم فقط، أي بمعدل (${actualAnnualKm.toLocaleString()} كم/سنة)، بينما المعدل الطبيعي الأردني لا يقل عن ${minAnnualExpected.toLocaleString()} كم/سنة (المتوقع إحصائياً: ${minExpectedKm.toLocaleString()} – ${maxExpectedKm.toLocaleString()} كم).`,
      recommendations: [
        'طلب فحص كمبيوتر احترافي لوحدة التحكم في المحرك (ECU) وناقل الحركة (TCU) ومقارنة ساعات التشغيل',
        'طلب كتاب رسمي أو فواتير صيانة مختومة من الوكالة تثبت تسلسل قراءة العداد',
        'مراجعة فحص دورة الفحص الفني السابقة في الترخيص أو تقرير فحص المنطقة الحرة (كارفاكس / أوتوشيك إذا كانت مستوردة)',
      ],
      financialRiskImpactJod: financialImpact,
    };
  }

  // Low usage but plausible (e.g. 6,500 - 10,000 km/yr)
  if (actualKm < minExpectedKm) {
    return {
      actualKm,
      vehicleAgeYears: ageYears,
      expectedAnnualKm: baseAnnualExpected,
      expectedTotalKm,
      expectedKmRange: { min: minExpectedKm, max: maxExpectedKm },
      actualAnnualKm,
      status: 'LOW_USAGE',
      statusLabelAr: 'ممشى منخفض (استخدام قليل)',
      riskLevel: 'MEDIUM',
      anomalyScore: 35,
      verdictAr: 'ممشى أقل من متوسط السوق، ميزة إيجابية بشرط إثبات الصيانة.',
      explanationAr: `الممشى (${actualKm.toLocaleString()} كم) يعكس استخداماً خفيفاً بمعدل (${actualAnnualKm.toLocaleString()} كم/سنة). يرفع من قيمة السيارة السوقية إذا كانت الصيانة الدورية منتظمة.`,
      recommendations: [
        'مطابقة تاريخ آخر صيانة بالوكالة أو المركز المعتمد للتأكد من عدم توقف العداد',
        'فحص حالة الإطارات، المقود، ودواسات البنزين والفرامل للتأكد من مطابقتها للممشى القليل',
      ],
      financialRiskImpactJod: 0,
    };
  }

  // Excessive high usage (e.g. > 35,000 km/yr or > maxExpectedKm)
  if (actualKm > maxExpectedKm && actualAnnualKm > 28000) {
    const excessKm = actualKm - expectedTotalKm;
    const anomalyScore = Math.min(85, Math.round(50 + (excessKm / expectedTotalKm) * 35));
    const basePrice = params.askingPrice || 12000;
    const financialImpact = Math.round(Math.min(basePrice * 0.25, Math.max(500, (excessKm / 10000) * 160)));

    return {
      actualKm,
      vehicleAgeYears: ageYears,
      expectedAnnualKm: baseAnnualExpected,
      expectedTotalKm,
      expectedKmRange: { min: minExpectedKm, max: maxExpectedKm },
      actualAnnualKm,
      status: 'EXCESSIVE_HIGH',
      statusLabelAr: 'ممشى مرتفع (استخدام مكثف / خطوط أو تطبيقات)',
      riskLevel: 'HIGH',
      anomalyScore,
      verdictAr: 'الممشى أعلى من المعدل السنوي المعتاد في السوق المحلي.',
      explanationAr: `معدل استهلاك السيارة يبلغ (${actualAnnualKm.toLocaleString()} كم/سنة) وهو مؤشر على استخدام مكثف (تطبيقات نقل ذكي، سفريات خارجية، أو سيارة شركات).`,
      recommendations: [
        'فحص شامل لنظام التعليق، العكوس، وعلبة التروس (الجير)',
        'فحص كفاءة المحرك وضغط السلندرات (Compression Test)',
        'التفاوض على تخفيض السعر بما لا يقل عن ' + financialImpact.toLocaleString() + 'د.أ لتعويض الاستهلاك المرتفع',
      ],
      financialRiskImpactJod: financialImpact,
    };
  }

  // Normal usage (Balanced)
  return {
    actualKm,
    vehicleAgeYears: ageYears,
    expectedAnnualKm: baseAnnualExpected,
    expectedTotalKm,
    expectedKmRange: { min: minExpectedKm, max: maxExpectedKm },
    actualAnnualKm,
    status: 'NORMAL',
    statusLabelAr: 'ممشى طبيعي ومثالي',
    riskLevel: 'LOW',
    anomalyScore: 10,
    verdictAr: 'الممشى يتوافق تماماً مع الاستهلاك السنوي المعتاد للسيارات الخاصة في الأردن.',
    explanationAr: `الممشى المسجل (${actualKm.toLocaleString()} كم) بمعدل (${actualAnnualKm.toLocaleString()} كم/سنة) يقع ضمن النطاق الطبيعي المتوقع (${minExpectedKm.toLocaleString()} – ${maxExpectedKm.toLocaleString()} كم).`,
    recommendations: ['إجراء الفحص الفني المعتاد والتحقق من مواعيد تبديل الزيوت والفلاتر الدورية'],
    financialRiskImpactJod: 0,
  };
}
