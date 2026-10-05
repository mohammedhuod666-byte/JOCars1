import prisma from './src/lib/prisma';

async function main() {
  const cars = await prisma.car.findMany({
    select: { id: true, year: true, status: true, deletedAt: true, brand: { select: { nameEn: true } }, model: { select: { nameEn: true } } }
  });
  console.log(JSON.stringify(cars, null, 2));
}

main().finally(() => prisma.$disconnect());
