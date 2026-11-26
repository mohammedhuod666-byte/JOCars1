const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHTTP } = require('@prisma/adapter-neon');

const adapter = new PrismaNeonHTTP(process.env.DATABASE_URL, { arrayMode: true });
const prisma = new PrismaClient({ adapter });

const ADMIN1_TO_SLUG = {
  '16': 'amman',
  '18': 'irbid',
  '17': 'zarqa',
  '02': 'balqa',
  '23': 'madaba',
  '09': 'karak',
  '19': 'maan',
  '21': 'aqaba',
  '15': 'mafraq',
  '22': 'jerash',
  '20': 'ajloun',
  '12': 'tafilah',
};

// Reject Persian/Urdu/Kurdish-only characters that GeoNames occasionally includes in alternatenames
const NON_ARABIC_SCRIPT_RE = /[پچژگکیہئےەۆێ]/;
const ARABIC_CHAR_RE = /[\u0621-\u064A]/;

function normalizeAr(str) {
  return str
    .replace(/[\u064B-\u065F\u0670]/g, '') // strip harakat
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickBestArabicName(altField) {
  if (!altField) return null;
  const candidates = altField
    .split(',')
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length >= 2 &&
        ARABIC_CHAR_RE.test(s) &&
        !NON_ARABIC_SCRIPT_RE.test(s) &&
        !/[a-zA-Z]/.test(s) &&
        !/^(استان|ضلع|محافظة|محافظه|لواء|قضاء)\s/.test(s)
    );

  if (candidates.length === 0) return null;

  // Prefer names without parentheses or slashes, and reasonable length
  candidates.sort((a, b) => {
    const aHasNoise = /[\(\)\/\-]/.test(a) ? 1 : 0;
    const bHasNoise = /[\(\)\/\-]/.test(b) ? 1 : 0;
    if (aHasNoise !== bHasNoise) return aHasNoise - bHasNoise;
    return a.length - b.length;
  });

  return candidates[0];
}

function makeSlug(nameEn, geonameId, govSlug) {
  const base = (nameEn || 'area')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${base || 'loc'}-${govSlug}-${geonameId}`;
}

async function main() {
  const joPath = path.join(__dirname, 'jo_geonames', 'JO.txt');
  if (!fs.existsSync(joPath)) {
    throw new Error(`Missing GeoNames file at ${joPath}`);
  }

  // 1. Load official 12 governorates
  const provinces = await prisma.province.findMany({
    where: { slug: { in: Object.values(ADMIN1_TO_SLUG) } },
    select: { id: true, slug: true, nameAr: true },
  });
  const slugToProv = Object.fromEntries(provinces.map((p) => [p.slug, p]));

  // 2. Load existing cities to avoid duplicates and preserve all foreign keys
  const existingCities = await prisma.city.findMany({
    select: { id: true, nameAr: true, slug: true, provinceId: true },
  });
  const existingKeySet = new Set();
  const existingSlugSet = new Set();
  for (const c of existingCities) {
    existingSlugSet.add(c.slug);
    existingKeySet.add(`${c.provinceId || 'none'}::${normalizeAr(c.nameAr)}`);
  }

  console.log(`Existing cities in DB: ${existingCities.length}`);

  // 3. Parse GeoNames JO.txt (feature_class === 'P')
  const lines = fs.readFileSync(joPath, 'utf8').split('\n').filter(Boolean);
  const toInsert = [];

  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 11) continue;
    const geonameId = cols[0];
    const nameEn = (cols[1] || '').trim();
    const altNames = cols[3] || '';
    const featureClass = cols[6];
    const admin1 = cols[10];

    if (featureClass !== 'P') continue;
    const govSlug = ADMIN1_TO_SLUG[admin1];
    const prov = slugToProv[govSlug];
    if (!prov) continue;

    const nameAr = pickBestArabicName(altNames);
    if (!nameAr) continue;

    const key = `${prov.id}::${normalizeAr(nameAr)}`;
    if (existingKeySet.has(key)) continue;

    let slug = makeSlug(nameEn, geonameId, govSlug);
    if (existingSlugSet.has(slug)) {
      slug = `${slug}-jo`;
    }

    existingKeySet.add(key);
    existingSlugSet.add(slug);

    toInsert.push({
      nameAr,
      nameEn: nameEn || nameAr,
      slug,
      provinceId: prov.id,
      isActive: true,
    });
  }

  console.log(`New unique Jordanian cities/villages to insert: ${toInsert.length}`);

const crypto = require('crypto');

  // 4. Insert in batches of 150 using raw SQL (HTTP adapter does not support Prisma transactions)
  const BATCH_SIZE = 150;
  let insertedTotal = 0;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const values = [];
    const params = [];
    let paramIdx = 1;
    for (const item of batch) {
      const id = 'cm' + crypto.randomBytes(11).toString('hex');
      values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, true)`);
      params.push(id, item.nameAr, item.nameEn, item.slug, item.provinceId);
    }
    const sql = `INSERT INTO "cities" ("id", "nameAr", "nameEn", "slug", "provinceId", "isActive") VALUES ${values.join(', ')} ON CONFLICT ("slug") DO NOTHING`;
    const count = await prisma.$executeRawUnsafe(sql, ...params);
    insertedTotal += Number(count || 0);
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: inserted ${count}`);
  }

  const finalCount = await prisma.city.count({ where: { isActive: true } });
  console.log(`Done! Inserted ${insertedTotal} new locations. Total active cities/villages in DB: ${finalCount}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
