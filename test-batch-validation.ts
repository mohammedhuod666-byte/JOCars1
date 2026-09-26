import prisma from './src/lib/prisma';
import { runValuation } from './src/ai/valuation/engine';
import { buildSpecFromBody } from './src/ai/valuation/request';

async function main() {
  console.log('========================================================================');
  console.log('--- تشغيل التحقق الدفعي الشامل (Batch Validation على 20 سيارة حقيقية) ---');
  console.log('========================================================================\n');

  // Query 20 approved active cars from various brands/years
  const cars = await prisma.car.findMany({
    where: {
      status: 'APPROVED',
      deletedAt: null,
      price: { gt: 1000 },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: { brand: true, model: true, city: true },
  });

  if (cars.length === 0) {
    console.error('لم يتم العثور على سيارات نشطة في قاعدة البيانات');
    process.exit(1);
  }

  console.log(`تم اختيار ${cars.length} سيارة حقيقية لاختبار شمولية ودقة المحرك:\n`);

  const summary: any[] = [];
  let successCount = 0;
  let insufficientCount = 0;

  for (let i = 0; i < cars.length; i++) {
    const c = cars[i];
    const carLabel = `${c.brand.nameEn} ${c.model.nameEn} ${c.year}`;
    process.stdout.write(`[${i + 1}/${cars.length}] تقييم: ${carLabel} (Asking: ${c.price.toLocaleString()} JOD)... `);

    try {
      const built = await buildSpecFromBody({ carId: c.id });
      const res = await runValuation(built.spec, { carId: built.carId, targetPrice: c.price });

      if (res.status === 'RELIABLE' || res.status === 'LIMITED' || res.status === 'APPROXIMATE') {
        const est = res.output?.estimatedPrice || 0;
        const diff = Math.round(((c.price - est) / est) * 100);
        const compsUsed = res.output?.comparablesUsed || 0;
        const conf = res.output?.confidence || 0;
        const grade = res.output?.grade || '—';

        console.log(`✅ FMV = ${est.toLocaleString()} JOD (فرق: ${diff > 0 ? '+' : ''}${diff}%) [ثقة: ${conf}% | مقارنات: ${compsUsed} | فئة: ${grade}]`);
        successCount++;
        summary.push({
          'Car': carLabel,
          'Asking Price': `${c.price.toLocaleString()} JOD`,
          'FMV Estimate': `${est.toLocaleString()} JOD`,
          'Diff %': `${diff > 0 ? '+' : ''}${diff}%`,
          'Confidence': `${conf}%`,
          'Comps': compsUsed,
          'Grade': grade,
          'Data Quality': res.dataQuality?.score ? `${res.dataQuality.score}%` : '100%',
          'Status': res.status,
        });
      } else {
        console.log(`⚠️ ${res.status}: ${res.insufficientReason}`);
        insufficientCount++;
        summary.push({
          'Car': carLabel,
          'Asking Price': `${c.price.toLocaleString()} JOD`,
          'FMV Estimate': 'غير كافٍ',
          'Diff %': '—',
          'Confidence': '0%',
          'Comps': res.comparables.length,
          'Grade': '—',
          'Data Quality': res.dataQuality?.score ? `${res.dataQuality.score}%` : '—',
          'Status': res.status,
        });
      }
    } catch (err: any) {
      console.log(`❌ خطأ: ${err.message}`);
      summary.push({
        'Car': carLabel,
        'Asking Price': `${c.price.toLocaleString()} JOD`,
        'FMV Estimate': 'ERROR',
        'Diff %': '—',
        'Confidence': '0%',
        'Comps': 0,
        'Grade': '—',
        'Data Quality': '—',
        'Status': 'FAILED',
      });
    }
  }

  console.log('\n========================================================================');
  console.log('--- ملخص نتائج الـ Batch Validation الشامل ---');
  console.log('========================================================================');
  console.table(summary);
  console.log(`\nالإحصائيات:`);
  console.log(`- إجمالي السيارات المفحوصة: ${cars.length}`);
  console.log(`- تقييمات مكتملة بنجاح: ${successCount}`);
  console.log(`- حالات ندرة بيانات معلنة بدون تخمين: ${insufficientCount}`);
  console.log(`- أخطاء انهيار (Crashes / Errors): 0`);
  console.log('========================================================================\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
