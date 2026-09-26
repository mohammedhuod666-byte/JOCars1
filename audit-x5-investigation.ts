import prisma from './src/lib/prisma';
import { runValuation } from './src/ai/valuation/engine';
import { buildSpecFromBody } from './src/ai/valuation/request';
import { matchMatrix } from './src/ai/valuation/similarity';

async function investigateX5() {
  console.log('========================================================================');
  console.log('--- تحقيق معمق في تقييم BMW X5 2018 (BMW X5 2018 Investigation) ---');
  console.log('========================================================================\n');

  const car = await prisma.car.findFirst({
    where: {
      year: 2018,
      model: { nameEn: { contains: 'X5' } },
      deletedAt: null,
      status: 'APPROVED',
    },
    include: { brand: true, model: true, city: true },
  });

  if (!car) {
    console.error('لم يتم العثور على سيارة BMW X5 2018');
    process.exit(1);
  }

  console.log(`الهدف: ${car.brand.nameEn} ${car.model.nameEn} ${car.year}`);
  console.log(`السعر المعروض (Asking): ${car.price.toLocaleString()} JOD`);
  console.log(`الممشى: ${car.kilometers?.toLocaleString() || 'غير محدد'} كم | الوقود: ${car.fuelType} | الجير: ${car.transmission} | سعة المحرك: ${car.engineCapacity} CC\n`);

  const built = await buildSpecFromBody({ carId: car.id, targetPrice: car.price });
  const result = await runValuation(built.spec, { carId: car.id, targetPrice: car.price });

  console.log('--- 1. نتيجة التقييم الإجمالية ---');
  console.log(`الحالة (Status): ${result.status}`);
  console.log(`FMV المقدر: ${result.output?.estimatedPrice.toLocaleString()} JOD`);
  console.log(`النطاق السعري: ${result.output?.minPrice.toLocaleString()} - ${result.output?.maxPrice.toLocaleString()} JOD`);
  console.log(`نسبة الثقة (Confidence): ${result.output?.confidence}% (${result.output?.confidenceLabel})`);
  console.log(`المقارنات المستخدمة: ${result.output?.comparablesUsed} من أصل ${result.output?.comparablesFound} مرشح\n`);

  console.log('--- 2. إحصائيات الأسعار الإجمالية (Price Stats) ---');
  console.log(result.output?.stats);
  console.log('');

  console.log('--- 3. تفاصيل المقارنات المستخدمة الـ 5 (The 5 Included Comparables) ---');
  const included = result.comparables.filter(c => c.included);
  included.forEach((c, idx) => {
    console.log(`\n[مقارنة #${idx + 1}]:`);
    console.log(`  المصدر: ${c.sourceLabel} (${c.source}) | الرابط: ${c.url || 'لا يوجد'}`);
    console.log(`  السيارة: ${c.brand} ${c.model} ${c.year}`);
    console.log(`  السنة: ${c.year} (فارق السنوات عن الهدف: ${c.yearDiff})`);
    console.log(`  الممشى: ${c.kilometers ? c.kilometers.toLocaleString() + ' كم' : 'غير محدد'}`);
    console.log(`  المحرك: ${c.engineCc ? c.engineCc + ' CC' : 'غير محدد'} | الوقود: ${c.fuelType || 'غير محدد'} | الجير: ${c.transmission || 'غير محدد'} | الدفع: ${c.drivetrain || 'غير محدد'}`);
    console.log(`  السعر الخام (Raw Price): ${c.priceJod.toLocaleString()} JOD (${c.priceType})`);
    console.log(`  المستوى (Tier): Tier ${c.tier}`);
    console.log(`  نسبة التشابه (Similarity): ${c.similarity}%`);
    console.log(`  التشابه التفصيلي (Breakdown):`, c.simBreakdown);
    console.log(`  التعديلات السعرية (Adjustments):`, c.adjustments);
    console.log(`  السعر بعد التعديلات (Adjusted Price): ${c.adjustedPrice?.toLocaleString()} JOD`);
    console.log(`  الوزن النهائي (Final Weight): ${Math.round(c.weight * 1000) / 1000}`);

    const matrix = matchMatrix(built.spec, c);
    console.log(`  مصفوفة المطابقة الفنية:`);
    matrix.forEach(m => {
      console.log(`    - ${m.factorAr} (${m.factor}): الهدف = ${m.target} | المقارنة = ${m.comp} => [${m.verdict}]`);
    });
  });

  console.log('\n--- 4. تدقيق حساب الوسيط المرجح (Weighted Median Calculation Step-by-Step) ---');
  const items = included.map(c => ({
    title: `${c.brand} ${c.model} ${c.year} (${c.sourceLabel})`,
    price: c.adjustedPrice ?? c.priceJod,
    weight: c.weight,
    tier: c.tier,
  })).sort((a, b) => a.price - b.price);

  const totalW = items.reduce((acc, it) => acc + it.weight, 0);
  console.log(`مجموع الأوزان الكلي (Total Weights) = ${totalW.toFixed(4)}`);
  console.log(`عتبة نصف الأوزان (50% Threshold) = ${(totalW / 2).toFixed(4)}\n`);

  let cumW = 0;
  items.forEach((it, i) => {
    cumW += it.weight;
    const isMedian = cumW >= totalW / 2 && (cumW - it.weight) < totalW / 2;
    console.log(`  المرتب #${i + 1}: ${it.title} | السعر: ${it.price.toLocaleString()} JOD | الوزن: ${it.weight.toFixed(4)} | التراكمي: ${cumW.toFixed(4)} ${isMedian ? '<<< النقطة التي تحقق عندها الوسيط المرجح!' : ''}`);
  });

  console.log('\n--- 5. الإعلانات المستبعدة وأسباب استبعادها (Excluded Listings) ---');
  const excluded = result.comparables.filter(c => !c.included);
  console.log(`إجمالي المستبعدين: ${excluded.length}`);
  excluded.forEach((c, idx) => {
    console.log(`  [مستبعد #${idx + 1}]: ${c.brand} ${c.model} ${c.year} | السعر: ${c.priceJod} JOD | المصدر: ${c.sourceLabel} | السبب: ${c.excludeReason}`);
  });
}

investigateX5().catch(console.error).finally(() => prisma.$disconnect());
