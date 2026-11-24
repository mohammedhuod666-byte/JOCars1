/**
 * AI Negotiation Playbook & Counter-Offer Simulator
 * 
 * Generates data-backed tactical pricing and negotiation dialogue in Jordanian Arabic dialect,
 * arming buyers with psychological anchors and giving sellers transparency on negotiation room.
 */

export interface TacticalPricing {
  openingOfferJod: number;
  targetDealJod: number;
  walkAwayCeilingJod: number;
  potentialSavingsJod: number;
  openingDiscountPercent: number;
}

export interface NegotiationLeveragePoint {
  id: string;
  category: 'MILEAGE' | 'PRICE_PREMIUM' | 'MARKET_SUPPLY' | 'MAINTENANCE_BUFFER' | 'FAST_CASH';
  titleAr: string;
  impactScore: 'HIGH' | 'MEDIUM' | 'LOW';
  dataFactAr: string;
  spokenPhraseAr: string; // Dialect speech for buyer
}

export interface NegotiationPlaybookResult {
  askingPrice: number;
  fmvPrice: number;
  tacticalPricing: TacticalPricing;
  buyerAdvantageRating: 'STRONG' | 'BALANCED' | 'SELLER_MARKET';
  buyerAdvantageLabelAr: string;
  leveragePoints: NegotiationLeveragePoint[];
  sellerDefenseTipsAr: string[];
  protocolStepsAr: { stepNumber: number; titleAr: string; actionAr: string }[];
}

interface NegotiationInput {
  askingPrice: number;
  fmvPrice: number;
  actualKm: number;
  year: number;
  make: string;
  model: string;
  daysOnMarket?: number;
  directCompsCount?: number;
}

export function generateNegotiationPlaybook(input: NegotiationInput): NegotiationPlaybookResult {
  const asking = Math.max(500, Math.round(input.askingPrice));
  const fmv = Math.max(500, Math.round(input.fmvPrice));
  const km = Math.max(0, input.actualKm);

  // Price discrepancy
  const diffFromFmv = asking - fmv;
  const isAskingAboveFmv = diffFromFmv > 0;

  // Opening offer calculation:
  // If asking is above FMV: anchor below FMV so the negotiation settles near FMV.
  // If asking is already at or below FMV: offer ~5% below asking to leave room for customary 200-500 JOD closing buffer.
  let openingOfferJod: number;
  let targetDealJod: number;
  let walkAwayCeilingJod: number;

  if (isAskingAboveFmv) {
    // Overpriced: open at FMV - 7%
    openingOfferJod = Math.round((fmv * 0.93) / 50) * 50;
    targetDealJod = fmv;
    walkAwayCeilingJod = Math.round((fmv * 1.03) / 50) * 50;
  } else {
    // Fair or already below market: open ~6% below asking, target ~3% below asking, never exceed asking price
    openingOfferJod = Math.round((asking * 0.94) / 50) * 50;
    targetDealJod = Math.round((asking * 0.97) / 50) * 50;
    walkAwayCeilingJod = asking;
  }

  // Safety bounds
  openingOfferJod = Math.min(openingOfferJod, targetDealJod - 200);
  const potentialSavingsJod = Math.max(0, asking - targetDealJod);
  const openingDiscountPercent = Math.round(((asking - openingOfferJod) / asking) * 1000) / 10;

  // Leverage points generation
  const leveragePoints: NegotiationLeveragePoint[] = [];

  // Point 1: Mileage factor
  const expectedNormalKm = Math.max(1, (new Date().getFullYear() - input.year)) * 18000;
  if (km > expectedNormalKm + 25000) {
    leveragePoints.push({
      id: 'mileage_high',
      category: 'MILEAGE',
      titleAr: 'الممشى المرتفع فوق المعدل السنوي',
      impactScore: 'HIGH',
      dataFactAr: `السيارة قاطعة (${km.toLocaleString()} كم)، وهو أعلى من متوسط موديل ${input.year} في الأردن المقدر بنحو (${expectedNormalKm.toLocaleString()} كم).`,
      spokenPhraseAr: `"السيارة ما شاء الله وقفتها حلوة، بس ممشاها عالي شوي (واصلة ${km.toLocaleString()} كم) وبدها ميزانية صيانة قادمة للقطع الاستهلاكية والكوشوك، فراعينا بالسعر عشان نتوكل على الله."`,
    });
  }

  // Point 2: Market price comparison
  if (isAskingAboveFmv) {
    leveragePoints.push({
      id: 'market_price_premium',
      category: 'PRICE_PREMIUM',
      titleAr: 'السعر المطلوب أعلى من متوسط السوق الفعلي',
      impactScore: 'HIGH',
      dataFactAr: `السعر المطلوب (${asking.toLocaleString()} د.أ) يتجاوز القيمة العادلة المعتمدة البالغة (${fmv.toLocaleString()} د.أ) بفارق (${diffFromFmv.toLocaleString()} د.أ).`,
      spokenPhraseAr: `"شفنا السوق وعروض ${input.make} ${input.model} موديل ${input.year} النظيفة ممسوكة على حدود الـ ${fmv.toLocaleString()} د.أ، وإنت طالب ${asking.toLocaleString()} د.أ، إحنا شرايين وجادين بس أعطينا سعر السوق العادل."`,
    });
  }

  // Point 3: Ready cash & immediate closing
  leveragePoints.push({
    id: 'ready_cash',
    category: 'FAST_CASH',
    titleAr: 'سلاح الكاش الجاهز والتخليص الفوري',
    impactScore: 'MEDIUM',
    dataFactAr: 'البائعون في السوق الأردني يفضلون التنازل عن 300 - 800 د.أ مقابل إنهاء البيع نقداً في نفس اليوم دون انتظار موافقات بنكية.',
    spokenPhraseAr: `"أنا عربوني بجيبي وفلوسي كاش جاهزة، إذا بنتفق اليوم بننزل فوراً عالفحص وترخيص غرب عمان أو شمال عمان وبنفرغ بدون تأخير وتعطيل."`,
  });

  // Point 4: Transfer & Technical prep fees
  leveragePoints.push({
    id: 'inspection_transfer',
    category: 'MAINTENANCE_BUFFER',
    titleAr: 'كلف نقل الملكية والفحص الشامل',
    impactScore: 'LOW',
    dataFactAr: 'رسوم نقل الملكية وتأمين ونفقات الفحص الفني للكمبيوتر والشاصي تتراوح بين 180 و 350 دينار.',
    spokenPhraseAr: `"احسب حساب رسوم نقل الملكية والفحص والتأمين بتكلفني مبلغ، خلّي السعر يشيل شوي من هاي المصاريف."`,
  });

  // Rating
  const buyerAdvantageRating = isAskingAboveFmv ? 'STRONG' : 'BALANCED';
  const buyerAdvantageLabelAr = isAskingAboveFmv
    ? 'موقف المشتري قوي جداً (مساحة تفاوض واسعة)'
    : 'موقف متوازن (سعر الإعلان قريب من الواقع)';

  const sellerDefenseTipsAr = [
    'إذا كان كرت فحص السيارة 4 جيد وبحالة الوكالة، تمسك بالسعر وأكد أن نظافة السيارة تعوض فارق الممشى.',
    'أظهر للمشتري فواتير الصيانة الدورية وتغيير الزيوت وسلامة الإطارات لإثبات جاهزية السيارة.',
    'لا تستعجل بالنزول عند أول عرض إذا كان الفرق كبيراً؛ قدم خصماً رمزياً (100 - 250 د.أ) تقديراً للجدية.'
  ];

  const protocolStepsAr = [
    {
      stepNumber: 1,
      titleAr: 'المعاينة والفحص البصري أولاً',
      actionAr: 'لا تفاوض على الهاتف إطلاقاً! عاين السيارة على أرض الواقع وأظهر الاهتمام قبل ذكر أي رقم.'
    },
    {
      stepNumber: 2,
      titleAr: 'إطلاق العرض الافتتاحي (Anchor Offer)',
      actionAr: `ابدأ بسعر (${openingOfferJod.toLocaleString()} د.أ) بهدوء مع ذكر نقطة الممشى وقطع الصيانة.`
    },
    {
      stepNumber: 3,
      titleAr: 'التثبيت عند السعر العادل (Target Deal)',
      actionAr: `استقر تدريجياً عند (${targetDealJod.toLocaleString()} د.أ) مستخدماً ورقة الفحص الفني والكاش الفوري.`
    },
    {
      stepNumber: 4,
      titleAr: 'حد الانسحاب النهائي (Walk Away)',
      actionAr: isAskingAboveFmv
        ? `إذا أصر البائع على سعر أعلى من (${walkAwayCeilingJod.toLocaleString()} د.أ)، اشكره بلباقة واترك رقمك، فالخيارات البديلة متوفرة في السوق بسعر أفضل.`
        : `سعر الإعلان (${asking.toLocaleString()} د.أ) أصلاً أقل من القيمة السوقية العادلة (${fmv.toLocaleString()} د.أ)؛ فإذا أصر البائع على التمسك بسعره دون خصم إضافي تبقى الصفقة رابحة بشرط سلامة الفحص الفني.`
    }
  ];

  return {
    askingPrice: asking,
    fmvPrice: fmv,
    tacticalPricing: {
      openingOfferJod,
      targetDealJod,
      walkAwayCeilingJod,
      potentialSavingsJod,
      openingDiscountPercent,
    },
    buyerAdvantageRating,
    buyerAdvantageLabelAr,
    leveragePoints,
    sellerDefenseTipsAr,
    protocolStepsAr,
  };
}
