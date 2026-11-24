const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHTTP } = require('@prisma/adapter-neon');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is missing!');
  process.exit(1);
}

const adapter = new PrismaNeonHTTP(connectionString, { arrayMode: true });
const prisma = new PrismaClient({ adapter });

// The 12 Official Governorates of Jordan
const GOVERNORATES = [
  { slug: 'amman', nameAr: 'عمان', nameEn: 'Amman' },
  { slug: 'irbid', nameAr: 'إربد', nameEn: 'Irbid' },
  { slug: 'zarqa', nameAr: 'الزرقاء', nameEn: 'Zarqa' },
  { slug: 'balqa', nameAr: 'البلقاء', nameEn: 'Balqa' },
  { slug: 'madaba', nameAr: 'مادبا', nameEn: 'Madaba' },
  { slug: 'karak', nameAr: 'الكرك', nameEn: 'Karak' },
  { slug: 'maan', nameAr: 'معان', nameEn: 'Ma\'an' },
  { slug: 'aqaba', nameAr: 'العقبة', nameEn: 'Aqaba' },
  { slug: 'mafraq', nameAr: 'المفرق', nameEn: 'Mafraq' },
  { slug: 'jerash', nameAr: 'جرش', nameEn: 'Jerash' },
  { slug: 'ajloun', nameAr: 'عجلون', nameEn: 'Ajloun' },
  { slug: 'tafilah', nameAr: 'الطفيلة', nameEn: 'Tafilah' },
];

async function main() {
  console.log('--- Normalizing 12 Jordanian Governorates ---');

  const govMap = {};

  for (const g of GOVERNORATES) {
    let prov = await prisma.province.findFirst({
      where: {
        OR: [
          { slug: g.slug },
          { nameAr: g.nameAr },
          { nameAr: g.nameAr + ' ' },
          { nameAr: g.nameAr.replace('إ', 'ا') },
        ]
      }
    });

    if (!prov) {
      prov = await prisma.province.create({
        data: {
          slug: g.slug,
          nameAr: g.nameAr,
          nameEn: g.nameEn,
          isActive: true
        }
      });
      console.log(`Created governorate: ${g.nameAr}`);
    } else {
      prov = await prisma.province.update({
        where: { id: prov.id },
        data: {
          slug: g.slug,
          nameAr: g.nameAr,
          nameEn: g.nameEn,
          isActive: true
        }
      });
      console.log(`Updated governorate: ${g.nameAr}`);
    }

    govMap[g.slug] = prov;
  }

  // Handle Ramtha -> Irbid
  const ramthaProv = await prisma.province.findFirst({ where: { nameAr: 'الرمثا' } });
  if (ramthaProv && govMap['irbid']) {
    const updated = await prisma.city.updateMany({
      where: { provinceId: ramthaProv.id },
      data: { provinceId: govMap['irbid'].id }
    });
    console.log(`Migrated ${updated.count} cities from الرمثا to إربد.`);
  }

  // Handle Salt -> Balqa
  const saltProv = await prisma.province.findFirst({ where: { nameAr: 'السلط' } });
  if (saltProv && govMap['balqa']) {
    const updated = await prisma.city.updateMany({
      where: { provinceId: saltProv.id },
      data: { provinceId: govMap['balqa'].id }
    });
    console.log(`Migrated ${updated.count} cities from السلط to البلقاء.`);
  }

  // Handle Hassa & Tafilah space -> Tafilah
  const hassaProv = await prisma.province.findFirst({ where: { nameAr: 'الحسا' } });
  if (hassaProv && govMap['tafilah']) {
    await prisma.city.updateMany({
      where: { provinceId: hassaProv.id },
      data: { provinceId: govMap['tafilah'].id }
    });
  }

  const spaceTafilah = await prisma.province.findFirst({ where: { nameAr: 'الطفيلة ' } });
  if (spaceTafilah && govMap['tafilah']) {
    await prisma.city.updateMany({
      where: { provinceId: spaceTafilah.id },
      data: { provinceId: govMap['tafilah'].id }
    });
  }

  const spaceJerash = await prisma.province.findFirst({ where: { nameAr: 'جرش ' } });
  if (spaceJerash && govMap['jerash']) {
    await prisma.city.updateMany({
      where: { provinceId: spaceJerash.id },
      data: { provinceId: govMap['jerash'].id }
    });
  }

  console.log('--- Finished Governorates Normalization ---');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
