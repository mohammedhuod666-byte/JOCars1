import prisma from '@/lib/prisma';
import { runIntelligenceValuation } from '@/ai/valuation/intelligence-engine';

/**
 * Unified Fair Price Bridge — Driven EXCLUSIVELY by the Fair Market Value Intelligence Engine.
 * All legacy hardcoded tables, depreciation heuristics, and asking-price blend formulas
 * have been permanently removed.
 */

export async function calculateFairPrice(carId: string): Promise<number | null> {
  try {
    const report = await runIntelligenceValuation({ carId });
    if (report.fairMarketValue && report.fairMarketValue > 0) {
      await prisma.car.update({
        where: { id: carId },
        data: { fairPriceEstimate: report.fairMarketValue },
      });
      return report.fairMarketValue;
    }
    return null;
  } catch (err) {
    console.error('calculateFairPrice error for car', carId, err);
    return null;
  }
}

export async function recalculateAllFairPrices(): Promise<number> {
  const cars = await prisma.car.findMany({
    where: { status: 'APPROVED', deletedAt: null },
    select: { id: true },
  });
  let done = 0;
  for (const car of cars) {
    await calculateFairPrice(car.id).catch(() => {});
    done++;
  }
  return done;
}
