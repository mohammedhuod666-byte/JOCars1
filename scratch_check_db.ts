import prisma from './src/lib/prisma';

async function main() {
  const cars = await prisma.car.findMany({
    where: {
      model: { nameEn: { contains: 'X5', mode: 'insensitive' } }
    },
    include: { brand: true, model: true }
  });

  console.log(`Found ${cars.length} X5 cars:`);
  for (const car of cars) {
    console.log(`- Car ID: ${car.id}, Brand: ${car.brand?.nameEn}, Model: ${car.model?.nameEn}, Year: ${car.year}, Price: ${car.price}, fairPriceEstimate: ${car.fairPriceEstimate}`);
    const reqs = await prisma.valuationRequest.findMany({
      where: { carId: car.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { result: true }
    });
    console.log(`  Requests count: ${reqs.length}`);
    for (const r of reqs) {
      console.log(`    Request ${r.id}: status=${r.status}, createdAt=${r.createdAt}, resultEst=${r.result?.estimatedPrice}, resultConf=${r.result?.confidence}`);
    }
  }

  // Also check latest valuation requests in DB regardless of carId
  const latestReqs = await prisma.valuationRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { result: true }
  });
  console.log('\nLatest 5 ValuationRequests in DB:');
  for (const r of latestReqs) {
    console.log(`- Req ${r.id}: carId=${r.carId}, status=${r.status}, createdAt=${r.createdAt}, est=${r.result?.estimatedPrice}, conf=${r.result?.confidence}`);
  }
}

main().finally(() => prisma.$disconnect());
