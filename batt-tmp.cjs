const jwt = require('jsonwebtoken');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
let secret = fs.readFileSync('.env', 'utf8').match(/^JWT_SECRET=(.*)$/m)[1].trim();
if ((secret.startsWith('"') && secret.endsWith('"')) || (secret.startsWith("'") && secret.endsWith("'"))) secret = secret.slice(1, -1);
const prisma = new PrismaClient();
let n = 0;
async function val(J, body, label) {
  n++;
  const t0 = Date.now();
  const r = await fetch('http://127.0.0.1:3000/api/valuations', { method: 'POST', headers: J, body: JSON.stringify(body), signal: AbortSignal.timeout(180000) });
  const j = await r.json().catch(() => ({}));
  const d = j.data || {};
  const rep = d.report || {};
  console.log(`${label}: HTTP:${r.status} ${((Date.now() - t0) / 1000).toFixed(0)}s status=${d.status}` +
    (d.status === 'DONE' ? ` EST=${rep.estimatedPrice} CONF=${rep.confidence}% grade=${rep.grade} used=${rep.comparablesUsed}/${rep.comparablesFound} src=${rep.sourcesUsed} funnel=[${(rep.funnel || []).map(f => f.stageAr + ':' + f.after).join(',')}]` : ` reason=${(d.reason || '').slice(0, 60)}`));
  return d.requestId;
}
(async () => {
  await new Promise((r) => setTimeout(r, 10000));
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true, email: true } });
  const J = { Authorization: 'Bearer ' + jwt.sign({ userId: admin.id, email: admin.email, role: 'ADMIN' }, secret, { expiresIn: '60m' }), 'Content-Type': 'application/json' };
  // 1: target car from the report link
  await val(J, { carId: 'cmreujmxv000j8u46kv8ntkaw' }, '1-TARGET-X5-2023 ');
  // 2: popular car (corolla via spec)
  await val(J, { spec: { brand: 'تويوتا', brandEn: 'toyota', model: 'كورولا', modelEn: 'corolla', year: 2020, kilometers: 90000, fuelType: 'PETROL', transmission: 'AUTOMATIC', city: 'عمان' } }, '2-POPULAR-COROLLA');
  // 3: rare car
  await val(J, { spec: { brand: 'مورغان', model: 'بلس 8', year: 1962, kilometers: 12000 } }, '3-RARE            ');
  // 4: no trim
  await val(J, { spec: { brand: 'هيونداي', brandEn: 'hyundai', model: 'سوناتا', modelEn: 'sonata', year: 2021, kilometers: 70000 } }, '4-NO-TRIM         ');
  // 5: no engine/fuel
  await val(J, { spec: { brand: 'كيا', brandEn: 'kia', model: 'سبورتاج', modelEn: 'sportage', year: 2022, kilometers: 50000, city: 'إربد' } }, '5-NO-ENGINE       ');
  // 6: high mileage
  await val(J, { spec: { brand: 'تويوتا', brandEn: 'toyota', model: 'هايلوكس', modelEn: 'hilux', year: 2016, kilometers: 350000, fuelType: 'DIESEL' } }, '6-HIGH-KM         ');
  // 7: new car km=0
  await val(J, { spec: { brand: 'تويوتا', brandEn: 'toyota', model: 'كامري', modelEn: 'camry', year: 2025, kilometers: 0 } }, '7-NEW-KM0         ');
  // 8: used average
  await val(J, { spec: { brand: 'نيسان', brandEn: 'nissan', model: 'سنترا', modelEn: 'sentra', year: 2019, kilometers: 120000, fuelType: 'PETROL' } }, '8-USED-AVG        ');
  // 9: USD currency target price
  await val(J, { spec: { brand: 'هوندا', brandEn: 'honda', model: 'سيفيك', modelEn: 'civic', year: 2021, kilometers: 60000 }, targetPrice: 15000 }, '9-USD-TARGET      ');
  // 10: duplicate-heavy market (same spec twice to observe dedupe path live)
  await val(J, { spec: { brand: 'هيونداي', brandEn: 'hyundai', model: 'إلنترا', modelEn: 'elantra', year: 2020, kilometers: 100000 } }, '10-DUP-MARKET      ');
  await prisma.$disconnect();
})().catch((e) => console.log('TEST-ERR:' + e.message));
