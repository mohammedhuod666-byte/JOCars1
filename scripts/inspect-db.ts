import prisma from '../src/lib/prisma';

async function main() {
  const postListings = await prisma.marketListing.findMany({
    where: {
      url: { contains: '/post/' },
    },
    select: { id: true, source: true, url: true, brand: true, model: true, year: true, price: true },
  });
  console.log(`Found ${postListings.length} listings with /post/ in URL:`);
  for (const p of postListings) {
    console.log(p);
  }
}

main().catch(console.error).finally(() => process.exit(0));
