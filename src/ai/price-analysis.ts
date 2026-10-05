/**
 * Price Analysis — Backed 100% by the Fair Market Value Intelligence Engine.
 * All legacy hardcoded tables and heuristics are permanently removed.
 */
import { runIntelligenceValuation } from './valuation/intelligence-engine';
import type { VehicleSpec } from './valuation/types';

export interface CarData {
  brand: string;
  model: string;
  year: number;
  trim?: string;
  kilometers: number;
  condition: string;
  fuelType: string;
  transmission: string;
  bodyType?: string;
  engineCapacity?: string;
  cylinders?: string;
  drivetrain?: string;
  color?: string;
  ownerCount?: number;
  isDamaged?: boolean;
  isPaintOriginal?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  isNegotiable?: boolean;
  price?: number;
  cityId?: string;
}

export interface PriceFactor {
  name: string;
  impact: number;
  description: string;
  icon: string;
}

export interface SimilarCar {
  id: string;
  title: string;
  price: number;
  year: number;
  kilometers: number;
  condition: string;
  city: string;
  image: string | null;
  similarity: number;
  source: string;
}

export interface PriceAnalysis {
  valuation: {
    // Phase-1 FMV gate: null whenever the engine produced no FMV
    // (valuationMode !== 'FMV'). Never falls back to the asking price.
    fairPrice: number | null;
    minPrice: number;
    maxPrice: number;
    confidence: number;
    sources: string[];
  };
  assessment: {
    position: 'below' | 'within' | 'above' | 'unknown';
    label: string;
    color: string;
    icon: string;
    diffPercent: number | null;
    diffAmount: number | null;
    explanation: string;
  };
  factors: PriceFactor[];
  similarCars: SimilarCar[];
  marketListings: SimilarCar[];
  summary: {
    headline: string;
    detail: string;
    recommendation: string;
  };
}

export async function analyzeCarPrice(car: CarData): Promise<PriceAnalysis> {
  const spec: VehicleSpec = {
    brand: car.brand,
    model: car.model,
    year: car.year,
    trim: car.trim || null,
    kilometers: car.kilometers,
    fuelType: car.fuelType || null,
    transmission: car.transmission || null,
    condition: car.condition || 'USED',
    engineCapacity: car.engineCapacity ? Number(car.engineCapacity) : null,
    askingPrice: car.price || null,
  };

  const report = await runIntelligenceValuation({ spec }, {
    askingPriceOverride: car.price,
    useAiSynthesis: true,
  });

  // Phase-1 FMV gate: the ONLY admissible FMV is the contract's fairMarketValue,
  // which is null for every non-FMV mode. The asking price must never stand in
  // for a missing fair price.
  const fmv = report.fairMarketValue ?? null;
  const minPrice = report.range.low ?? (fmv !== null ? Math.round(fmv * 0.9) : 0);
  const maxPrice = report.range.high ?? (fmv !== null ? Math.round(fmv * 1.1) : 0);

  const classification = report.pricePosition.classification;
  const pos = fmv === null || classification === 'UNKNOWN'
    ? 'unknown'
    : classification === 'BELOW_MARKET'
    ? 'below'
    : classification === 'ABOVE_MARKET'
    ? 'above'
    : 'within';

  // 'unknown' position with a NON-null fmv means: FMV exists but there is no
  // asking price to compare against — never claim "لا تتوفر قيمة سوقية عادلة".
  const label = pos === 'below'
    ? 'سعر مناسب جداً (أقل من السوق)'
    : pos === 'above'
    ? 'سعر مرتفع عن متوسط السوق'
    : pos === 'within'
    ? 'سعر عادل ومطابق للسوق'
    : fmv !== null
    ? 'قيمة سوقية عادلة متوفرة (لا يوجد سعر معروض للمقارنة)'
    : 'لا تتوفر قيمة سوقية عادلة للمقارنة (أدلة داعمة فقط)';

  const color = pos === 'below' ? 'green' : pos === 'above' ? 'red' : pos === 'unknown' ? 'gray' : 'emerald';
  const icon = pos === 'unknown' ? (fmv !== null ? 'Info' : 'AlertTriangle')
    : pos === 'below' ? 'TrendingDown' : pos === 'above' ? 'TrendingUp' : 'CheckCircle';

  const comps: SimilarCar[] = report.comparablesUsed.map((c) => ({
    id: c.id || c.sourceUrl || '',
    title: c.title,
    price: c.originalPrice,
    year: c.year || car.year,
    kilometers: c.mileage || 0,
    condition: car.condition,
    city: 'الأردن',
    image: null,
    similarity: c.similarity,
    source: c.source,
  }));

  return {
    valuation: {
      fairPrice: fmv,
      minPrice,
      maxPrice,
      confidence: report.confidence,
      sources: Array.from(new Set(report.comparablesUsed.map((c) => c.source))),
    },
    assessment: {
      position: pos,
      label,
      color,
      icon,
      // Phase-1: differences are only reported against a real FMV.
      diffPercent: fmv !== null ? (report.pricePosition.differencePercent ?? null) : null,
      diffAmount: fmv !== null ? (report.pricePosition.differenceAmount ?? null) : null,
      explanation: report.reasoning.join(' '),
    },
    factors: report.adjustments.map((a) => ({
      name: a.factorAr,
      impact: 0,
      description: a.description,
      icon: 'Tag',
    })),
    similarCars: comps.slice(0, 4),
    marketListings: comps.slice(4),
    summary: {
      headline: label,
      detail: report.reasoning[0] || '',
      recommendation: report.marketInsights[0] || 'تحقق من فحص السيارة الميكانيكي والفني قبل الشراء.',
    },
  };
}
