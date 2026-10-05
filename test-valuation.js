const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const cars = await prisma.car.findMany({
    where: { brand: { nameEn: 'bmw' }, year: 2018, status: 'APPROVED' },
    select: { id: true, slug: true, brand: { select: { nameEn: true, nameAr: true } } },
    take: 1
  });
  if (cars.length === 0) {
    console.log("No BMW 2018 found");
    return;
  }
  const car = cars[0];
  console.log(`Testing with car ${car.id}`);

  // Test the engine directly to avoid auth issues
  const { runValuation } = require('./src/ai/valuation/engine');
  const { buildSpecFromBody } = require('./src/ai/valuation/request');
  
  const built = await buildSpecFromBody({ carId: car.id });
  const result = await runValuation(built.spec, { carId: built.carId });
  
  console.log("Valuation Result:", JSON.stringify({
      estimatedPrice: result.output?.estimatedPrice,
      grade: result.output?.grade,
      comparablesUsed: result.output?.comparablesUsed,
      confidence: result.output?.confidenceLabel,
      comparables: result.comparables.map(c => ({ year: c.year, price: c.priceJod, tier: c.tier, sim: c.similarity }))
  }, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
