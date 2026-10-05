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
    const fmv = report.fairMarketValue && report.fairMarketValue > 0 ? report.fairMarketValue : null;
    // Phase-1 FMV gate: always write — null clears any stale value so no
    // unproven number can linger as "السعر العادل" on the listing page.
    await prisma.car.update({
      where: { id: carId },
      data: { fairPriceEstimate: fmv },
    });
    return fmv;
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
