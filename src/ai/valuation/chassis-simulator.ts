/**
 * Jordanian Chassis & Body Impact Simulator ("كرت الفحص الأردني")
 * 
 * Accurately models market price deductions based on chassis and structural condition
 * as practiced in Amman & Zarqa vehicle inspection centers (Autocheck, Al-Shareef, etc.).
 */

export type ChassisGradeId =
  | 'FOUR_CLEAN'          // 4 جيد (فحص كامل كرت أبيض)
  | 'THREE_CLEAN_DENT'    // 3 جيد (دقة على الراس / قصعة خفيفة)
  | 'TWO_CLEAN_REAR'      // 2 جيد (قصعات أو ضربة ع الراس خلفي)
  | 'ONE_CLEAN_ACCIDENT'  // 1 جيد (مضروب ومصلح أمامي وخلفي)
  | 'REPLACED_FRONT'      // غيار واجهة كاملة (مصلح)
  | 'CUT_WELDED';         // مقصوص وموصول (شلهوب / سالفج حاد)

export interface ChassisGradeOption {
  id: ChassisGradeId;
  nameAr: string;
  badge: string;
  descriptionAr: string;
  discountPercentage: number; // e.g. 0.04 = 4%
  marketResaleEase: 'EASY' | 'MODERATE' | 'DIFFICULT' | 'VERY_DIFFICULT';
  marketResaleEaseLabelAr: string;
  inspectionTipsAr: string[];
}

export interface ChassisSimulationResult {
  baseFmvJod: number;
  currentSelectedGrade: ChassisGradeId;
  options: {
    id: ChassisGradeId;
    nameAr: string;
    badge: string;
    descriptionAr: string;
    adjustedPriceJod: number;
    discountJod: number;
    discountPercentage: number;
    resaleEaseLabelAr: string;
    isClean: boolean;
  }[];
  activeSelection: {
    id: ChassisGradeId;
    nameAr: string;
    badge: string;
    adjustedPriceJod: number;
    discountJod: number;
    discountPercentage: number;
    descriptionAr: string;
    adviceAr: string;
  };
}

export const CHASSIS_GRADES: ChassisGradeOption[] = [
  {
    id: 'FOUR_CLEAN',
    nameAr: '4 جيد (فحص كامل كرت أبيض)',
    badge: '4 جيد',
    descriptionAr: 'الشواصي الأربعة سليمة 100% وخالية من أي حوادث أو تعديل أو لحام.',
    discountPercentage: 0.0,
    marketResaleEase: 'EASY',
    marketResaleEaseLabelAr: 'سريعة البيع ومطلوبة جداً',
    inspectionTipsAr: [
      'تعتبر السيارة ذات أعلى قيمة سوقية وأسهل تداولاً في الأردن',
      'تأكد فقط من سلامة المحرك والقير وبككس الفحص'
    ],
  },
  {
    id: 'THREE_CLEAN_DENT',
    nameAr: '3 جيد + دقة ع الراس / قصعة',
    badge: '3 جيد (قصعة)',
    descriptionAr: '3 شواصي جيدة وشاصي واحد يحمل دقة أو قصعة خفيفة على الرأس غير مؤثرة على الميزان.',
    discountPercentage: 0.045, // ~4.5%
    marketResaleEase: 'EASY',
    marketResaleEaseLabelAr: 'مقبولة جداً في السوق',
    inspectionTipsAr: [
      'عيب سطحي شائع جداً ناتج عن مطب أو رصيف خفيف',
      'فرصة ممتازة للتفاوض وتوفير مبلغ ملحوظ دون التأثير على أمان السيارة'
    ],
  },
  {
    id: 'TWO_CLEAN_REAR',
    nameAr: '2 جيد + ضربة ع الراس / قصعة خلفية',
    badge: '2 جيد',
    descriptionAr: 'شواصي خلفية تحمل ضربة أو تعديل مع بقاء الشواصي الأمامية بحالة سليمة.',
    discountPercentage: 0.09, // ~9%
    marketResaleEase: 'MODERATE',
    marketResaleEaseLabelAr: 'متوسطة الطلب (تتطلب خصم مغرٍ)',
    inspectionTipsAr: [
      'تتطلب فحصاً دقيقاً لعدم وجود انحراف في ميزانية العجلات الخلفية (Camber/Toe)',
      'يجب ألا يقبل المشتري دفع سعر قريب من الـ 4 جيد'
    ],
  },
  {
    id: 'ONE_CLEAN_ACCIDENT',
    nameAr: 'مضروب ومصلح (حادث متوسط)',
    badge: 'مضروب ومصلح',
    descriptionAr: 'تعرضت السيارة لحادث أثر على الشاصي وتم سحبه وتصليحه في المخرطة.',
    discountPercentage: 0.18, // ~18%
    marketResaleEase: 'DIFFICULT',
    marketResaleEaseLabelAr: 'صعبة البيع — مشتري محدد',
    inspectionTipsAr: [
      'تأكد من عمل أكياس الهواء (Airbags) وعدم إلغائها بمقاومات إلكترونية',
      'احذر من اهتزاز السيارة على سرعات فوق 100 كم/ساعة'
    ],
  },
  {
    id: 'REPLACED_FRONT',
    nameAr: 'غيار واجهة أمامية كاملة',
    badge: 'غيار واجهة',
    descriptionAr: 'حادث أمامي قوي استوجب قص وتغيير الصدر والواجهة الأمامية بالكامل.',
    discountPercentage: 0.26, // ~26%
    marketResaleEase: 'DIFFICULT',
    marketResaleEaseLabelAr: 'حركة تداول بطيئة جداً',
    inspectionTipsAr: [
      'يجب فحص حساسات الرادار والتحكم بالمسار بعناية فائقة',
      'الخصم السعري يجب أن يكون كبيراً لتعويض صعوبة البيع مستقبلاً'
    ],
  },
  {
    id: 'CUT_WELDED',
    nameAr: 'شاصي مقصوص وموصول (شلهوب)',
    badge: 'قص وتلحيم (شلهوب)',
    descriptionAr: 'قص كامل بالشاصي مع لحام وتجميع شاصي من مركبة أخرى (خطر سلامة).',
    discountPercentage: 0.38, // ~38%
    marketResaleEase: 'VERY_DIFFICULT',
    marketResaleEaseLabelAr: 'ركود كامل وصعوبة ترخيص/تأمين',
    inspectionTipsAr: [
      'يواجه المشتري صعوبة بالغة في إعادة البيع ورفض بعض شركات التأمين للتأمين الشامل',
      'لا يُنصح بشرائها إلا لأغراض الاستخدام الشاق مع فارق سعر ضخم جداً'
    ],
  },
];

export function simulateChassisImpact(
  baseFmv: number,
  selectedGradeId: ChassisGradeId = 'FOUR_CLEAN'
): ChassisSimulationResult {
  const fmv = Math.max(500, Math.round(baseFmv));

  const options = CHASSIS_GRADES.map((grade) => {
    const discountJod = Math.round((fmv * grade.discountPercentage) / 50) * 50;
    const adjustedPriceJod = Math.max(500, fmv - discountJod);
    return {
      id: grade.id,
      nameAr: grade.nameAr,
      badge: grade.badge,
      descriptionAr: grade.descriptionAr,
      adjustedPriceJod,
      discountJod,
      discountPercentage: Math.round(grade.discountPercentage * 1000) / 10,
      resaleEaseLabelAr: grade.marketResaleEaseLabelAr,
      isClean: grade.id === 'FOUR_CLEAN',
    };
  });

  const active = options.find((o) => o.id === selectedGradeId) || options[0];
  const activeDef = CHASSIS_GRADES.find((g) => g.id === active.id) || CHASSIS_GRADES[0];

  const adviceAr =
    active.id === 'FOUR_CLEAN'
      ? 'السعر الحالي يمثل القيمة السوقية العادلة الكاملة لمركبة فحص 4 جيد خالية من الملاحظات الهيكلية.'
      : `في حال كانت نتيجة فحص كرت الشاصي (${active.nameAr})، فإن العرف التجاري في السوق الأردني يفرض خصماً مباشراً لا يقل عن (${active.discountJod.toLocaleString()} د.أ) ليكون السعر العادل للشراء هو (${active.adjustedPriceJod.toLocaleString()} د.أ).`;

  return {
    baseFmvJod: fmv,
    currentSelectedGrade: active.id,
    options,
    activeSelection: {
      id: active.id,
      nameAr: active.nameAr,
      badge: active.badge,
      adjustedPriceJod: active.adjustedPriceJod,
      discountJod: active.discountJod,
      discountPercentage: active.discountPercentage,
      descriptionAr: active.descriptionAr,
      adviceAr,
    },
  };
}
