import { NextRequest } from 'next/server';
import { runIntelligenceValuation } from '@/ai/valuation/intelligence-engine';
import { getJordanMarketTrend } from '@/ai/valuation/market-trends';
import type { VehicleSpec } from '@/ai/valuation/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.brand || !body.model || !body.year) {
      return Response.json(
        {
          success: false,
          error: 'Missing required vehicle fields: brand, model, and year are mandatory.',
        },
        { status: 400 }
      );
    }

    const spec: VehicleSpec = {
      brand: String(body.brand).trim(),
      brandEn: body.brandEn ? String(body.brandEn).trim() : null,
      model: String(body.model).trim(),
      modelEn: body.modelEn ? String(body.modelEn).trim() : null,
      year: parseInt(String(body.year), 10),
      kilometers: body.kilometers != null ? parseInt(String(body.kilometers), 10) : null,
      trim: body.trim ? String(body.trim).trim() : null,
      fuelType: body.fuelType ? String(body.fuelType).trim() : null,
      transmission: body.transmission ? String(body.transmission).trim() : 'AUTOMATIC',
      drivetrain: body.drivetrain ? String(body.drivetrain).trim() : null,
      condition: body.condition ? String(body.condition).trim() : 'GOOD',
      city: body.city ? String(body.city).trim() : 'عمان',
    };

    const result = await runIntelligenceValuation(
      { spec },
      { askingPriceOverride: body.askingPrice ? Number(body.askingPrice) : null }
    );

    const trend = getJordanMarketTrend(spec.fuelType, spec.year, spec.brand);

    const fmv = result.fairMarketValue ?? result.range?.low ?? null;
    const minPrice = result.range?.low ?? null;
    const maxPrice = result.range?.high ?? null;

    return Response.json({
      success: true,
      partnerValuation: {
        vehicle: {
          brand: spec.brand,
          model: spec.model,
          year: spec.year,
          kilometers: spec.kilometers,
          trim: spec.trim,
          fuelType: spec.fuelType,
          condition: spec.condition,
          city: spec.city,
        },
        fairMarketValueJod: fmv,
        priceRangeJod: minPrice != null && maxPrice != null ? { min: minPrice, max: maxPrice } : null,
        confidencePercent: result.confidence || 65,
        valuationStatus: result.status,
        marketVelocity: {
          demandIndex: trend.demandIndex,
          liquidityLevel: trend.liquidityScore,
          estimatedDaysOnMarket: trend.avgDaysOnMarket,
          priceTrendDirection: trend.priceTrendDirection,
          marketNotice: trend.regulatoryNoticeAr,
        },
        evidence: {
          comparablesAnalyzed: result.marketEvidence?.totalListings || 0,
          verifiedCompsUsed: result.marketEvidence?.usedComparables || 0,
          independentSourcesUsed: result.marketEvidence?.independentSourcesUsedInFMV || 1,
        },
        certifiedTimestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: err?.message || 'Internal valuation error occurred',
      },
      { status: 500 }
    );
  }
}
