// E2E production audit: login → POST /api/valuations for the BMW X5 2018 40e → print audit fields.
// Run: node scripts/e2e-x5-audit.mjs
const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function post(path, body, token) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

async function get(path, token) {
  const res = await fetch(BASE + path, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

const login = await post('/api/auth/login', { email: 'admin2@jocars.com', password: 'admin123' });
if (!login.json || !login.json.success) {
  console.error('LOGIN_FAILED', login.status, (login.text || '').slice(0, 400));
  process.exit(1);
}
const token = login.json.data?.token || login.json.token;
if (!token) {
  console.error('NO_TOKEN', JSON.stringify(login.json).slice(0, 400));
  process.exit(1);
}
console.log('LOGIN_OK');

// Find the X5 2018 car
const cars = await get('/api/cars?brand=bmw&year=2018&limit=50', token);
let carId = process.env.CAR_ID || null;
if (!carId && cars.json) {
  const list = cars.json.data?.cars || cars.json.data || cars.json.cars || [];
  const x5 = list.find((c) => /x5/i.test(c.model?.nameEn || c.modelEn || c.model?.name || '') && c.year === 2018);
  if (x5) carId = x5.id;
}
if (!carId) {
  // fallback: query DB directly
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const rows = await prisma.$queryRaw`
    SELECT c.id, c."askingPrice", c.kilometers, c.year, m.name_en AS model
    FROM "Car" c JOIN "Model" m ON m.id = c."modelId"
    JOIN "Brand" b ON b.id = m."brandId"
    WHERE lower(b.name_en) = 'bmw' AND c.year = 2018 AND lower(m.name_en) LIKE '%x5%'
    ORDER BY c."createdAt" DESC LIMIT 5`;
  console.log('DB_CANDIDATES', JSON.stringify(rows));
  if (rows[0]) carId = rows[0].id;
  await prisma.$disconnect();
}
if (!carId) {
  console.error('NO_CAR_FOUND');
  process.exit(1);
}
console.log('CAR_ID', carId);

const run = await post('/api/valuations', { carId }, token);
console.log('VALUATION_STATUS', run.status);
if (!run.json) {
  console.log('RAW', (run.text || '').slice(0, 2000));
  process.exit(1);
}
const c = run.json.data?.contract || run.json.data || run.json.contract || run.json;
const d = run.json.data || {};

const comps = c.comparablesUsed || [];
const excluded = c.comparablesExcluded || [];

const audit = {
  VALUATION_MODE: c.valuationMode,
  FMV: c.fairMarketValue,
  DIRECT_COUNT: c.directCompsCount,
  SUPPORTING_COUNT: c.supportingCompsCount,
  RANGE: c.range,
  CONFIDENCE: c.confidence,
  CONFIDENCE_LABEL: c.confidenceLabel,
  TARGET_CLUSTER_COUNT: c.targetCluster?.totalClusterCount ?? 0,
  TARGET_CLUSTER_SOURCES: c.targetCluster?.sourcesInCluster || [],
  TARGET_CLUSTER_LISTINGS: (c.targetCluster?.listings || []).map((l) => ({ source: l.source, reason: l.reason })),
  UNIQUE_LISTINGS: new Set(comps.map((x) => x.id || x.title)).size,
  UNIQUE_VEHICLES: new Set(comps.map((x) => `${x.title}|${x.mileage ?? ''}`)).size,
  UNIQUE_SOURCES: new Set(comps.map((x) => x.source)).size,
  RAW_USED: comps.length,
  EXCLUDED: excluded.length,
  EXCLUSIONS_BY_REASON: excluded.reduce((acc, e) => { acc[e.reasonCategory] = (acc[e.reasonCategory] || 0) + 1; return acc; }, {}),
  COMPS: comps.map((x) => ({
    source: x.source, title: x.title, year: x.year, tier: x.tier, sim: x.similarity,
    price: x.rawPrice, direct: x.tier === 1 && !x.isPowertrainMismatch,
    powertrainMismatch: !!x.isPowertrainMismatch,
  })),
  ASKING: c.askingPrice,
  STATUS: c.status,
};
console.log(JSON.stringify(audit, null, 2));
