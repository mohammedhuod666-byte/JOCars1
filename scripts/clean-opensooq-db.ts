import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- Cleaning up contaminated OpenSooq records in market_listings ---');

  // 1. Find all OpenSooq listings with legacy /post/ in url
  const legacyPostListings = await prisma.marketListing.findMany({
    where: {
      url: {
        contains: '/post/',
      },
    },
  });

  console.log(`Found ${legacyPostListings.length} listings with /post/ in url`);

  for (const listing of legacyPostListings) {
    if (!listing.url) continue;
    const match = listing.url.match(/post\/(\d+)/);
    if (match) {
      const id = match[1];
      const newUrl = `https://jo.opensooq.com/ar/search/${id}`;
      await prisma.marketListing.update({
        where: { id: listing.id },
        data: { url: newUrl },
      });
      console.log(`Updated listing ${listing.id}: ${listing.url} -> ${newUrl}`);
    }
  }

  // 2. Fix known contaminated records
  // 287272368 is Mercedes CLE200
  const mercListing = await prisma.marketListing.findFirst({
    where: {
      url: { contains: '287272368' },
    },
  });
  if (mercListing) {
    await prisma.marketListing.update({
      where: { id: mercListing.id },
      data: {
        brand: 'مرسيدس بنز',
        brandEn: 'Mercedes-Benz',
        model: 'CLE 200',
        modelEn: 'CLE 200',
        url: 'https://jo.opensooq.com/ar/search/287272368',
      },
    });
    console.log(`Fixed Mercedes listing ${mercListing.id} (287272368) to brand=مرسيدس بنز, model=CLE 200`);
  }

  // 287476186 is BMW 520i F10 2013
  const bmw5Listing = await prisma.marketListing.findFirst({
    where: {
      url: { contains: '287476186' },
    },
  });
  if (bmw5Listing) {
    await prisma.marketListing.update({
      where: { id: bmw5Listing.id },
      data: {
        brand: 'بي إم دبليو',
        brandEn: 'BMW',
        model: '520',
        modelEn: '520',
        year: 2013,
        url: 'https://jo.opensooq.com/ar/search/287476186',
      },
    });
    console.log(`Fixed BMW 520 listing ${bmw5Listing.id} (287476186) to brand=بي إم دبليو, model=520, year=2013`);
  }

  console.log('Cleanup completed successfully.');
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
