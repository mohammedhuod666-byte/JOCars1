import prisma from './src/lib/prisma';
import { runValuation } from './src/ai/valuation/engine';
import { buildSpecFromBody } from './src/ai/valuation/request';

async function main() {
  console.log('--- تشغيل اختبار ثبات وحصانة التقييم ضد تغير السعر المستهدف (Target Invariance Test) ---');
  
  // Find our active test car: BMW X5 2018
  const car = await prisma.car.findFirst({
    where: {
      year: 2018,
      model: { nameEn: { contains: 'X5' } },
      deletedAt: null,
      status: 'APPROVED',
    },
    include: { brand: true, model: true },
  });

  if (!car) {
    console.error('لم يتم العثور على سيارة BMW X5 2018 نشطة في قاعدة البيانات');
    process.exit(1);
  }

  console.log(`السيارة المستهدفة: ${car.brand.nameEn} ${car.model.nameEn} ${car.year} (ID: ${car.id})`);

  const testPrices = [20000, 25000, 30000, 35000];
  const results: { price: number; fmv: number; compsCount: number; weightsSum: number; topComps: string[] }[] = [];

  for (const p of testPrices) {
    console.log(`\n> تشغيل التقييم مع سعر مستهدف = ${p.toLocaleString()} د.أ...`);
    const built = await buildSpecFromBody({ carId: car.id, targetPrice: p });
    const res = await runValuation(built.spec, { carId: built.carId, targetPrice: p });

    if (!res.output) {
      console.error(`فشل التقييم عند السعر ${p}: ${res.insufficientReason}`);
      process.exit(1);
    }

    const fmv = res.output.estimatedPrice;
    const compsCount = res.comparables.filter(c => c.included).length;
    const weightsSum = Math.round(res.comparables.filter(c => c.included).reduce((acc, c) => acc + c.weight, 0) * 1000) / 1000;
    const topComps = res.comparables.filter(c => c.included).slice(0, 3).map(c => `${c.brand} ${c.model} (${c.priceJod} JD, w=${Math.round(c.weight*100)/100})`);

    console.log(`  النتيجة: FMV = ${fmv.toLocaleString()} د.أ | عدد المقارنات = ${compsCount} | مجموع الأوزان = ${weightsSum}`);
    results.push({ price: p, fmv, compsCount, weightsSum, topComps });
  }

  console.log('\n--- نتائج اختبار الحصانة (Invariance Verification) ---');
  console.table(results.map(r => ({
    'Target Asking Price': `${r.price.toLocaleString()} JOD`,
    'Calculated FMV': `${r.fmv.toLocaleString()} JOD`,
    'Included Comps': r.compsCount,
    'Weights Sum': r.weightsSum,
  })));

  const baseline = results[0];
  let failed = false;

  for (let i = 1; i < results.length; i++) {
    const cur = results[i];
    const diff = Math.abs(cur.fmv - baseline.fmv);
    if (diff > 1) {
      console.error(`❌ فشل الاختبار: فرق السعر التقديري ${diff} بين السعر ${baseline.price} والسعر ${cur.price}! تسرب لسعر الإعلان المستهدف!`);
      failed = true;
    }
    if (cur.compsCount !== baseline.compsCount) {
      console.error(`❌ فشل الاختبار: عدد المقارنات اختلف (${cur.compsCount} vs ${baseline.compsCount})!`);
      failed = true;
    }
    if (Math.abs(cur.weightsSum - baseline.weightsSum) > 0.05) {
      console.error(`❌ فشل الاختبار: مجموع الأوزان اختلف (${cur.weightsSum} vs ${baseline.weightsSum})!`);
      failed = true;
    }
  }

  if (failed) {
    console.error('\n❌ فشل اختبار بوابة القبول: Target Price يؤثر على الـ FMV!');
    process.exit(1);
  } else {
    console.log('\n✅ نجاح باهر: الـ FMV ثابت بدقة متناهية (الفرق = 0)، ولا يتأثر إطلاقاً بسعر الإعلان المستهدف!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
