import prisma from '../src/lib/prisma';
import { fetchOpenSooqListings } from '../src/lib/opensooq-scrape';

async function main() {
  const ml = await prisma.marketListing.findMany({
    where: {
      OR: [
        { model: { contains: 'X5', mode: 'insensitive' } },
        { modelEn: { contains: 'X5', mode: 'insensitive' } },
        { trim: { contains: 'X5', mode: 'insensitive' } }
      ]
    },
    select: { id: true, source: true, trim: true, year: true, priceJod: true, kilometers: true, model: true, modelEn: true }
  });
  console.log('Total X5 in MarketListing:', ml.length);
  for (const m of ml) console.log(m);

  console.log('--- Testing fetchOpenSooqListings for BMW X5 ---');
  const res = await fetchOpenSooqListings('BMW', 'X5', 2018);
  const scraped = res?.listings || [];
  console.log('Scraped count:', scraped.length);
  for (const s of scraped.slice(0, 10)) {
    console.log({
      title: s.title,
      price: s.price,
      year: s.year,
      url: s.url
    });
  }
}

main().catch(console.error).finally(() => process.exit(0));
