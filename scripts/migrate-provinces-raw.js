const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHTTP } = require('@prisma/adapter-neon');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaNeonHTTP(connectionString, { arrayMode: true });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Migrating Province IDs via raw SQL ---');

  const irbid = await prisma.province.findFirst({ where: { slug: 'irbid' } });
  const balqa = await prisma.province.findFirst({ where: { slug: 'balqa' } });
  const tafilah = await prisma.province.findFirst({ where: { slug: 'tafilah' } });
  const jerash = await prisma.province.findFirst({ where: { slug: 'jerash' } });
  const mafraq = await prisma.province.findFirst({ where: { slug: 'mafraq' } });

  // Migrate Ramtha to Irbid
  const ramtha = await prisma.province.findFirst({ where: { nameAr: 'الرمثا' } });
  if (ramtha && irbid) {
    await prisma.$executeRawUnsafe(`UPDATE cities SET "provinceId" = '${irbid.id}' WHERE "provinceId" = '${ramtha.id}'`);
    console.log('Updated Ramtha -> Irbid');
  }

  // Migrate Salt to Balqa
  const salt = await prisma.province.findFirst({ where: { nameAr: 'السلط' } });
  if (salt && balqa) {
    await prisma.$executeRawUnsafe(`UPDATE cities SET "provinceId" = '${balqa.id}' WHERE "provinceId" = '${salt.id}'`);
    console.log('Updated Salt -> Balqa');
  }

  // Migrate Hassa to Tafilah
  const hassa = await prisma.province.findFirst({ where: { nameAr: 'الحسا' } });
  if (hassa && tafilah) {
    await prisma.$executeRawUnsafe(`UPDATE cities SET "provinceId" = '${tafilah.id}' WHERE "provinceId" = '${hassa.id}'`);
    console.log('Updated Hassa -> Tafilah');
  }

  // Space Tafilah
  const spaceTafilah = await prisma.province.findFirst({ where: { nameAr: 'الطفيلة ' } });
  if (spaceTafilah && tafilah) {
    await prisma.$executeRawUnsafe(`UPDATE cities SET "provinceId" = '${tafilah.id}' WHERE "provinceId" = '${spaceTafilah.id}'`);
    console.log('Updated Tafilah space -> Tafilah');
  }

  // Space Jerash
  const spaceJerash = await prisma.province.findFirst({ where: { nameAr: 'جرش ' } });
  if (spaceJerash && jerash) {
    await prisma.$executeRawUnsafe(`UPDATE cities SET "provinceId" = '${jerash.id}' WHERE "provinceId" = '${spaceJerash.id}'`);
    console.log('Updated Jerash space -> Jerash');
  }

  // Migrate Mafraq city to Mafraq province
  if (mafraq) {
    await prisma.$executeRawUnsafe(`UPDATE cities SET "provinceId" = '${mafraq.id}' WHERE "nameAr" = 'المفرق'`);
  }

  console.log('Done raw updates!');
}

main().catch(console.error);
