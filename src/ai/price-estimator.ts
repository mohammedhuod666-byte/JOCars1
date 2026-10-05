/**
 * Price Estimator — Powered EXCLUSIVELY by the Fair Market Value Intelligence Engine.
 * All legacy hardcoded matrices, heuristic guesses, and asking-price blend formulas
 * have been permanently removed.
 */
import { BaseAIModule, AIProviderType, AIResult, AIProgress } from './base';
import { runIntelligenceValuation } from './valuation/intelligence-engine';
import type { VehicleSpec } from './valuation/types';

export interface PriceInput {
  brand: string;
  model: string;
  year: number;
  kilometers: number;
  condition: string;
  city: string;
  fuelType?: string;
  transmission?: string;
  engineCapacity?: number | string;
  bodyType?: string;
  drivetrain?: string;
  trim?: string;
  color?: string;
  ownerCount?: number;
  isDamaged?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  isPaintOriginal?: boolean;
  listingPrice?: number;
  odometer?: number;
  ownerId?: string;
  carId?: string;
}

export interface SimilarListing {
  site: string;
  url: string;
  price: number;
  year: number;
  km: number;
  notes?: string;
}

export interface PriceOutput {
  minPrice: number;
  // Phase-1 FMV gate: null whenever the engine produced no FMV —
  // never replaced by the listing (asking) price.
  fairPrice: number | null;
  maxPrice: number;
  confidence: number;
  reasoning: string;
  marketFactors: string[];
  similarListings: SimilarListing[];
  sources: string[];
  isRealWebSearch: boolean;
}

export class PriceEstimator extends BaseAIModule<PriceInput, PriceOutput> {
  name = 'PriceEstimator';
  version = '2.0.0';
  provider: AIProviderType = 'local';

  constructor(config: { type: AIProviderType }) {
    super(config);
  }

  async process(input: PriceInput, onProgress?: (p: AIProgress) => void): Promise<AIResult<PriceOutput>> {
    return this.execute(input, onProgress);
  }

  async execute(input: PriceInput, onProgress?: (p: AIProgress) => void): Promise<AIResult<PriceOutput>> {
    const startTime = Date.now();
    onProgress?.({ stage: 'init', progress: 20, message: 'بدء تحليل القيمة السوقية العادلة' });

    let parsedCc: number | null = null;
    if (input.engineCapacity) {
      const num = typeof input.engineCapacity === 'number'
        ? input.engineCapacity
        : parseFloat(String(input.engineCapacity).replace(/[^\d.]/g, ''));
      if (!isNaN(num) && num > 0) {
        parsedCc = num < 10 ? Math.round(num * 1000) : Math.round(num);
      }
    }

    const spec: VehicleSpec = {
      brand: input.brand,
      model: input.model,
      year: input.year,
      trim: input.trim || null,
      kilometers: input.kilometers || input.odometer || 0,
      fuelType: input.fuelType || null,
      transmission: input.transmission || null,
      condition: input.condition || 'USED',
      engineCapacity: parsedCc,
      askingPrice: input.listingPrice || null,
      city: input.city || null,
      color: input.color || null,
      bodyType: input.bodyType || null,
      drivetrain: input.drivetrain || null,
    };

    onProgress?.({ stage: 'market-search', progress: 50, message: 'مطابقة سيارات السوق الأردني' });

    const report = await runIntelligenceValuation({ spec, carId: input.carId }, {
      askingPriceOverride: input.listingPrice,
      useAiSynthesis: true,
    });

    // Phase-1 FMV gate: fairPrice is null unless the contract carries an FMV.
    const fairPrice = report.fairMarketValue ?? null;
    const minPrice = report.range.low ?? (fairPrice !== null ? Math.round(fairPrice * 0.9) : 0);
    const maxPrice = report.range.high ?? (fairPrice !== null ? Math.round(fairPrice * 1.1) : 0);

    const similarListings: SimilarListing[] = report.comparablesUsed.map((c) => ({
      site: c.source,
      url: c.sourceUrl || '',
      price: c.originalPrice,
      year: c.year || input.year,
      km: c.mileage || 0,
      notes: `${c.title} (تشابه: ${c.similarity}%)`,
    }));

    onProgress?.({ stage: 'done', progress: 100, message: 'اكتمل التقييم بنجاح' });

    return {
      success: true,
      data: {
        minPrice,
        fairPrice,
        maxPrice,
        confidence: report.confidence,
        reasoning: report.reasoning.join(' '),
        marketFactors: report.adjustments.map((a) => `${a.factorAr}: ${a.description}`),
        similarListings: similarListings.slice(0, 10),
        sources: Array.from(new Set(report.comparablesUsed.map((c) => c.source))),
        isRealWebSearch: report.comparablesUsed.length > 0,
      },
      confidence: report.confidence,
      processingTime: Date.now() - startTime,
    };
  }
}

export const priceEstimator = new PriceEstimator({ type: 'local' });
