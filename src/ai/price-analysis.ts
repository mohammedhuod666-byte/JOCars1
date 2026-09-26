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
    fairPrice: number;
    minPrice: number;
    maxPrice: number;
    confidence: number;
    sources: string[];
  };
  assessment: {
    position: 'below' | 'within' | 'above';
    label: string;
    color: string;
    icon: string;
    diffPercent: number;
    diffAmount: number;
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

  const fmv = report.fairMarketValue || car.price || 0;
  const minPrice = report.range.low || Math.round(fmv * 0.9);
  const maxPrice = report.range.high || Math.round(fmv * 1.1);

  const pos = report.pricePosition.classification === 'BELOW_MARKET'
    ? 'below'
    : report.pricePosition.classification === 'ABOVE_MARKET'
    ? 'above'
    : 'within';

  const label = pos === 'below'
    ? 'سعر مناسب جداً (أقل من السوق)'
    : pos === 'above'
    ? 'سعر مرتفع عن متوسط السوق'
    : 'سعر عادل ومطابق للسوق';

  const color = pos === 'below' ? 'green' : pos === 'above' ? 'red' : 'emerald';
  const icon = pos === 'below' ? 'TrendingDown' : pos === 'above' ? 'TrendingUp' : 'CheckCircle';

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
      diffPercent: report.pricePosition.differencePercent || 0,
      diffAmount: report.pricePosition.differenceAmount || 0,
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
