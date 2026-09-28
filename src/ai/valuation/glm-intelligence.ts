/**
 * GLM Intelligence & Explanation Layer for Fair Market Value (FMV) Engine.
 *
 * Architectural Principle:
 * REAL MARKET DATA → DETERMINISTIC CALCULATION → GLM INTERPRETATION
 *
 * Strict Rule: GLM is an EXPLANATION and INTELLIGENCE layer only.
 * It NEVER calculates, guesses, overrides, or modifies FMV, range, confidence,
 * percentiles, weights, or adjustments.
 */

import { chatCompletion } from '../nvidia-client';
import type { VehicleSpec, PriceStats, ConsensusBand, LeaveOneOutResult } from './types';

export interface GroundedClaim {
  text: string;
  evidence?: {
    metric: string;
    value: string | number | boolean | null;
  };
}

export interface DataWarning {
  code: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  text: string;
}

export interface ComparableInsight {
  comparableId?: string;
  title: string;
  text: string;
  rawPrice: number;
  adjustedPrice: number;
  weight: number;
}

export interface GlmIntelligenceOutput {
  marketSummary: string;
  keyDrivers: GroundedClaim[];
  confidenceExplanation: string;
  pricePositionExplanation: string;
  comparableInsights: ComparableInsight[];
  dataWarnings: DataWarning[];
  methodologyExplanation: string;
  limitations: string[];
  unsupportedClaims: string[];
  generatedBy: 'GLM_MODEL' | 'DETERMINISTIC_FALLBACK';
}

export interface GlmInputPayload {
  target: {
    brand: string;
    model: string;
    year: number;
    mileage: number | null;
    trim: string | null;
    fuelType: string | null;
    transmission: string | null;
    askingPrice: number | null;
  };
  evidenceQuality: {
    totalAdsChecked: number;
    eligibleComparables: number;
    sameYearComparables: number;
    primarySameYearComparables?: number;
    sameYearMismatchedPowertrain?: number;
    plusMinusOneYearComparables: number;
    supportComparables: number;
    excludedAds: number;
    sourcesSearched?: number;
    sourcesWithResults?: number;
    sourcesWithEligibleComparables?: number;
    independentSources: number;
    independentSourcesUsedInFMV?: number;
    targetClusterExcluded: number;
    confidence: number;
    confidenceLabel: string;
    status: string;
  };
  pricingResults: {
    fairMarketValue: number | null;
    range: { low: number; high: number };
    isWideRange: boolean;
    rangeDisclaimerAr: string;
    rawMedian: number;
    adjustedMedian: number;
    weightedMedian: number;
    percentiles: {
      p25: number;
      p50: number;
      p75: number;
      p85: number;
      p90: number;
    };
    askingPricePremiumPercent: number | null;
    askingPricePercentile: number | null;
    pricePositionClassification: string;
  };
  consensusBand?: ConsensusBand;
  comparables: Array<{
    id?: string | null;
    title: string;
    source: string;
    year: number | null;
    mileage: number | null;
    rawPrice: number;
    adjustedPrice: number;
    tier: number;
    tierLabel: string;
    similarity: number;
    weight: number;
    contributionPercent: number;
    adjustments: Array<{
      factor: string;
      factorAr: string;
      delta: number;
      provenance: string;
      method: string;
      formula: string;
      reason: string;
    }>;
  }>;
  exclusionsSummary: Record<string, number>;
  leaveOneOut?: {
    dominantComparableFound: boolean;
    stabilityScore: number;
    maxShiftPercent: number;
  };
}

export const GLM_SYSTEM_PROMPT = `أنت محرك التحليل والتفسير الذكي (GLM Intelligence & Explanation Layer) لنظام تقييم السيارات في الأردن.

مهمتك الصارمة:
تفسير وتحليل بيانات السوق المحسوبة مسبقاً والمقدمة لك بشكل منظم وموثق.
أنت طبقة فهم وتوضيح (Intelligence & Explanation) ولست مصدر الحقيقة الرقمي.

القواعد الصارمة والقطعية:
1. ممنوع اختراع أي رقم، سعر، نسبة مئوية، أو سيارة مقارنة غير واردة في البيانات المدخلة.
2. ممنوع اختراع أسعار بيع نهائية (Sold Prices) أو افتراض نسب خصم وتفاوض جزافية (مثل "يوجد خصم 5%").
3. ممنوع تغيير أو إعادة حساب: Fair Market Value، النطاق السعري، درجة الثقة، الشرائح المئوية، أو أوزان المقارنات.
4. ممنوع إعادة إدخال أي إعلان مستبعد أو إعلان من عنقود سيارة الهدف (Target Cluster).
5. إذا كانت مقارنات نفس السنة المباشرة (primarySameYearComparables = 0) أو حالة التقييم INSUFFICIENT_DIRECT_EVIDENCE:
   - يجب التصريح بوضوح بغياب المقارنات المباشرة وأن التقييم مبني على شواهد ثانوية/داعمة فقط.
   - ممنوع منعاً باتاً الادعاء بوجود مقارنات مباشرة من نفس سنة الصنع تقود الوزن الأكبر في التقييم.
6. إذا كان عدد المصادر المستقلة المستخدمة مصدر واحد (independentSources = 1):
   - يجب التصريح بوضوح بأن التقييم مبني على مصدر مستقل واحد، مع الإشارة إلى أن هذا يحد من تنوع الأدلة.
7. يجب ربط كل استنتاج (Insight) بدليله الرقمي (Claim Grounding) عبر ذكر اسم المقياس وقيمته.
8. التمييز الصارم بين علاوة السعر المطلوب عن السعر العادل (Premium vs FMV) وبين الشريحة المئوية في السوق (Percentile).
9. أعد الناتج بصيغة JSON صالحة حصراً ومطابقة للعقد التالي دون أي نصوص تمهيدية:

{
  "marketSummary": "ملخص وضع السوق للسيارة بناءً على البيانات المتوفرة فقط",
  "keyDrivers": [
    { "text": "شرح أثر عامل معين", "evidence": { "metric": "اسم_المقياس", "value": "القيمة" } }
  ],
  "confidenceExplanation": "تفسير سبب ارتفاع أو انخفاض درجة الثقة بناءً على جودة الأدلة",
  "pricePositionExplanation": "تفسير موقع السعر المطلوب للسيارة مقارنة بالسعر العادل وبالشريحة السوقية",
  "comparableInsights": [
    { "title": "عنوان المقارنة", "text": "ملاحظة تفسيرية على المقارنة وتعديلاتها", "rawPrice": 0, "adjustedPrice": 0, "weight": 0 }
  ],
  "dataWarnings": [
    { "code": "رمز_التحذير", "severity": "HIGH|MEDIUM|LOW", "text": "نص التحذير الصريح للمشتري" }
  ],
  "methodologyExplanation": "شرح مبسط للمنهجية الحسابية المطبقة",
  "limitations": [
    "الحدود الموضوعية لما لا يمكن استنتاجه من البيانات الحالية"
  ],
  "unsupportedClaims": []
}`;

/**
 * Generate a 100% deterministic structured explanation if GLM fails, times out, or is skipped.
 */
export function generateDeterministicExplanation(payload: GlmInputPayload): GlmIntelligenceOutput {
  const { target, evidenceQuality, pricingResults, comparables } = payload;
  const primarySameYear = evidenceQuality.primarySameYearComparables ?? evidenceQuality.sameYearComparables;
  const totalComps = evidenceQuality.eligibleComparables;
  const isDirect = evidenceQuality.status !== 'INSUFFICIENT_DIRECT_EVIDENCE' && primarySameYear > 0;

  const keyDrivers: GroundedClaim[] = [
    {
      text: isDirect
        ? `توفرت ${primarySameYear} مقارنات مباشرة من نفس سنة الصنع (${target.year}) قادت الوزن الأكبر في التقييم.`
        : `لم تتوفر أي مقارنات مباشرة مؤهلة من نفس سنة الصنع (${target.year})، وتم الاعتماد على شواهد ثانوية/داعمة من فئات أو سنوات أخرى.`,
      evidence: { metric: 'primarySameYearComparables', value: primarySameYear },
    },
    {
      text: `تم فحص وتدقيق ${evidenceQuality.totalAdsChecked} إعلاناً في السوق، واستبعاد ${evidenceQuality.excludedAds} إعلاناً عبر بوابات الهوية والسلامة السعرية.`,
      evidence: { metric: 'excludedAds', value: evidenceQuality.excludedAds },
    },
    {
      text: evidenceQuality.independentSources <= 1
        ? `اعتمد التقييم على مصدر مستقل واحد (${evidenceQuality.independentSources}) بعد تصفية التكرارات، مما يحد من تنوع العينة.`
        : `اعتمد التقييم على عينة من ${totalComps} مقارنات مؤهلة من ${evidenceQuality.independentSources} مصادر مستقلة.`,
      evidence: { metric: 'independentSources', value: evidenceQuality.independentSources },
    },
  ];

  const dataWarnings: DataWarning[] = [];

  if (!isDirect) {
    dataWarnings.push({
      code: 'NO_SAME_YEAR_EVIDENCE',
      severity: 'HIGH',
      text: `غياب إعلانات مباشرة مطابقة لموديل ${target.year} والمحرك؛ جميع المقارنات المعتمدة هي شواهد ثانوية أو داعمة.`,
    });
  }

  if (totalComps < 5) {
    dataWarnings.push({
      code: 'LIMITED_SAMPLE_SIZE',
      severity: 'MEDIUM',
      text: `حجم العينة المعتمدة محدود (${totalComps} سيارات)، ما يجعل النطاق السعري استرشادياً يتطلب الفحص الميداني.`,
    });
  }

  if (pricingResults.isWideRange) {
    dataWarnings.push({
      code: 'WIDE_PRICE_DISPERSION',
      severity: 'MEDIUM',
      text: pricingResults.rangeDisclaimerAr,
    });
  }

  dataWarnings.push({
    code: 'ASKING_PRICES_ONLY',
    severity: 'LOW',
    text: 'التقييم مستند إلى أسعار العرض والإعلان المعلنة في السوق الأردني، وليس أسعار العقود المنفذة بعد التفاوض.',
  });

  let pricePositionExplanation = 'لم يتم تحديد سعر مطلوب للسيارة المستهدفة للمقارنة.';
  if (target.askingPrice && target.askingPrice > 0) {
    if (pricingResults.fairMarketValue !== null) {
      const diffPct = pricingResults.askingPricePremiumPercent ?? 0;
      const diffAmt = Math.abs(target.askingPrice - pricingResults.fairMarketValue);
      const pRank = pricingResults.askingPricePercentile;

      if (diffPct > 5) {
        pricePositionExplanation = `السعر المطلوب (${target.askingPrice.toLocaleString()} د.أ) أعلى بـ ${diffPct}% (${diffAmt.toLocaleString()} د.أ) عن السعر العادل التقديري (${pricingResults.fairMarketValue.toLocaleString()} د.أ). ` +
          (pRank !== null ? `ويقع عند الشريحة المئوية P${pRank} بين عروض السوق المتاحة.` : '');
      } else if (diffPct < -5) {
        pricePositionExplanation = `السعر المطلوب (${target.askingPrice.toLocaleString()} د.أ) أقل بـ ${Math.abs(diffPct)}% (${diffAmt.toLocaleString()} د.أ) عن السعر العادل التقديري (${pricingResults.fairMarketValue.toLocaleString()} د.أ) ويعتبر فرصة سعرية.` +
          (pRank !== null ? ` ويقع عند الشريحة المئوية P${pRank}.` : '');
      } else {
        pricePositionExplanation = `السعر المطلوب (${target.askingPrice.toLocaleString()} د.أ) متوافق تماماً مع النطاق العادل للقيمة السوقية.`;
      }
    } else {
      const pRank = pricingResults.askingPricePercentile;
      pricePositionExplanation = `السعر المطلوب (${target.askingPrice.toLocaleString()} د.أ) لا يمكن مقارنته بقيمة سوقية عادلة قاطعة لغياب مقارنات مباشرة متطابقة، وتم الاستناد إلى نطاق شواهد داعمة` +
        (pRank !== null ? ` (يقع السعر عند الشريحة P${pRank} من مجمل الشواهد).` : '.');
    }
  }

  const comparableInsights: ComparableInsight[] = comparables.map((c) => {
    const yearAdj = c.adjustments.find((a) => a.factor === 'year')?.delta ?? 0;
    const kmAdj = c.adjustments.find((a) => a.factor === 'mileage')?.delta ?? 0;
    const adjParts: string[] = [];
    if (yearAdj !== 0) adjParts.push(`فارق السنة: ${yearAdj > 0 ? `+${yearAdj}` : yearAdj} د.أ`);
    if (kmAdj !== 0) adjParts.push(`فارق الممشى: ${kmAdj > 0 ? `+${kmAdj}` : kmAdj} د.أ`);

    return {
      comparableId: c.id ?? undefined,
      title: c.title,
      text: `${c.tierLabel} | السعر الأصلي: ${c.rawPrice.toLocaleString()} د.أ ← بعد التعديل: ${c.adjustedPrice.toLocaleString()} د.أ (الوزن: ${c.weight}, المساهمة: ${c.contributionPercent}%). ${adjParts.join(', ')}`,
      rawPrice: c.rawPrice,
      adjustedPrice: c.adjustedPrice,
      weight: c.weight,
    };
  });

  return {
    marketSummary: isDirect
      ? `تحليل سوق سيارات ${target.brand} ${target.model} موديل ${target.year} في الأردن يظهر استقراراً مبنياً على مقارنات مباشرة من نفس السنة.`
      : `الأدلة المباشرة لموديل ${target.brand} ${target.model} ${target.year} غير متوفرة في معروض السوق الحالي (غياب مقارنات مباشرة بنفس المحرك وسنة الصنع). تم الاعتماد على ${totalComps} شواهد ثانوية/داعمة كتقدير استرشادي${evidenceQuality.independentSources <= 1 ? ' من مصدر مستقل واحد' : ''}.`,
    keyDrivers,
    confidenceExplanation: isDirect
      ? `درجة الثقة (${evidenceQuality.confidence}%) تعكس توفر مقارنات مباشرة متطابقة في الموديل وسنة الصنع.`
      : `درجة الثقة (${evidenceQuality.confidence}%) محدودة لغياب مقارنات مباشرة من نفس سنة الصنع (${target.year}) والاعتماد على شواهد ثانوية/داعمة${evidenceQuality.independentSources <= 1 ? ' من مصدر مستقل واحد' : ''}.`,
    pricePositionExplanation,
    comparableInsights,
    dataWarnings,
    methodologyExplanation: 'تطبيق الوسيط المرجح (Weighted Median) على الأسعار المعدلة حسابياً وفق مصفوفة مطابقة المواصفات وبوابات التحقق من الهوية.',
    limitations: [
      'عدم توفر صفقات بيع مسجلة رسمياً؛ الاعتماد حصراً على إعلانات العرض النشطة.',
      'الحالة الميكانيكية الدقيقة تتطلب فحصاً فنياً في مركز فحص معتمد (فحص الشاسي والمحرك والبطارية).',
    ],
    unsupportedClaims: [],
    generatedBy: 'DETERMINISTIC_FALLBACK',
  };
}

/**
 * Execute GLM Intelligence Layer with strict validation and deterministic fallback.
 */
export async function runGlmIntelligence(
  payload: GlmInputPayload,
  options: { timeoutMs?: number; enabled?: boolean } = {}
): Promise<GlmIntelligenceOutput> {
  const fallback = generateDeterministicExplanation(payload);

  if (options.enabled === false) {
    return fallback;
  }

  try {
    const userPrompt = `حلّل وفسّر بيانات التقييم التالية بصيغة JSON حصراً وفق القواعد المحددة:\n${JSON.stringify(payload, null, 2)}`;

    const responseText = await chatCompletion([
      { role: 'system', content: GLM_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], {
      modelId: 'glm',
      timeoutMs: options.timeoutMs || 12000,
    });

    if (!responseText || responseText.trim().length < 50) {
      return fallback;
    }

    // Extract JSON block safely
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallback;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate essential keys
    if (
      typeof parsed.marketSummary !== 'string' ||
      !Array.isArray(parsed.keyDrivers) ||
      typeof parsed.confidenceExplanation !== 'string'
    ) {
      return fallback;
    }

    return {
      marketSummary: parsed.marketSummary.slice(0, 500),
      keyDrivers: Array.isArray(parsed.keyDrivers) && parsed.keyDrivers.length > 0 ? parsed.keyDrivers : fallback.keyDrivers,
      confidenceExplanation: parsed.confidenceExplanation.slice(0, 400),
      pricePositionExplanation: parsed.pricePositionExplanation ? parsed.pricePositionExplanation.slice(0, 400) : fallback.pricePositionExplanation,
      comparableInsights: Array.isArray(parsed.comparableInsights) && parsed.comparableInsights.length > 0 ? parsed.comparableInsights : fallback.comparableInsights,
      dataWarnings: Array.isArray(parsed.dataWarnings) && parsed.dataWarnings.length > 0 ? parsed.dataWarnings : fallback.dataWarnings,
      methodologyExplanation: parsed.methodologyExplanation ? parsed.methodologyExplanation.slice(0, 300) : fallback.methodologyExplanation,
      limitations: Array.isArray(parsed.limitations) && parsed.limitations.length > 0 ? parsed.limitations : fallback.limitations,
      unsupportedClaims: Array.isArray(parsed.unsupportedClaims) ? parsed.unsupportedClaims : [],
      generatedBy: 'GLM_MODEL',
    };
  } catch {
    // Pure resilience: fallback guarantees system never fails
    return fallback;
  }
}
