import prisma from './src/lib/prisma';

async function main() {
  // 1. Search Car table
  const cars = await prisma.car.findMany({
    where: {
      OR: [
        { fairPriceEstimate: { in: [24440, 24500, 24400] } },
        { id: 'cmui9bbmw00i710xa2pa3801b' }
      ]
    }
  });
  console.log('Cars found:', cars.map(c => ({ id: c.id, price: c.price, fairPriceEstimate: c.fairPriceEstimate })));

  // 2. Search ValuationResult
  const results = await prisma.valuationResult.findMany({
    where: { request: { carId: 'cmui9bbmw00i710xa2pa3801b' } },
    include: { request: true },
    orderBy: { calculatedAt: 'desc' },
    take: 5
  });
  console.log('\nTop 5 ValuationResults for cmui9bbmw00i710xa2pa3801b:');
  for (const r of results) {
    console.log(`- Result ID: ${r.id}, reqId: ${r.requestId}, est: ${r.estimatedPrice}, min: ${r.minPrice}, max: ${r.maxPrice}, conf: ${r.confidence}, at: ${r.calculatedAt}, reqStatus: ${r.request?.status}`);
    console.log(`  Stats:`, r.stats);
  }
}

main().finally(() => prisma.$disconnect());
