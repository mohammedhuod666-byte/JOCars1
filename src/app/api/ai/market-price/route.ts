import { NextRequest } from 'next/server';
import { runIntelligenceValuation } from '@/ai/valuation/intelligence-engine';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`ai-market:${ip}`, RATE_LIMITS.AI);
    if (!rateLimit.allowed) {
      return Response.json({ success: false, error: 'تم تجاوز الحد المسموح' }, { status: 429 });
    }

    const { brand, model, year, kilometers, condition } = await request.json();

    if (!brand || !year) {
      return Response.json({
        success: false,
        error: 'الرجاء إدخال الماركة وسنة الصنع على الأقل',
      }, { status: 400 });
    }

    const yearNum = parseInt(year);
    const kmNum = parseInt(kilometers) || 0;

    const report = await runIntelligenceValuation({
      spec: {
        brand,
        model: model || '',
        year: yearNum,
        kilometers: kmNum,
        condition: condition || 'GOOD',
      }
    });

    const fmv = report.fairMarketValue || 0;
    const min = report.range.low || Math.round(fmv * 0.9);
    const max = report.range.high || Math.round(fmv * 1.1);

    return Response.json({
      success: true,
      data: {
        query: { brand, model: model || '', year: yearNum, kilometers: kmNum, condition: condition || '' },
        stats: {
          totalListings: report.marketEvidence.totalListings,
          priceRange: {
            min,
            max,
            avg: fmv,
            median: fmv,
          },
          estimatedPrice: fmv,
          pricePosition: {
            label: report.pricePosition.classification === 'BELOW_MARKET'
              ? 'أقل من متوسط السوق'
              : report.pricePosition.classification === 'ABOVE_MARKET'
              ? 'أعلى من متوسط السوق'
              : 'مطابق لسعر السوق العادل',
            color: report.pricePosition.classification === 'BELOW_MARKET'
              ? 'text-green-500'
              : report.pricePosition.classification === 'ABOVE_MARKET'
              ? 'text-red-500'
              : 'text-emerald-500',
            icon: 'CheckCircle',
          },
          conditionAdjustment: 0,
          sources: Array.from(new Set(report.comparablesUsed.map(c => c.source))),
        },
        trend: { direction: 'مبني على سوق الأردن الفعلي', percent: 0, emoji: '' },
        similarCars: report.comparablesUsed.map(c => ({
          id: c.id || c.sourceUrl || '',
          slug: '',
          title: c.title,
          price: c.originalPrice,
          year: c.year || yearNum,
          kilometers: c.mileage || 0,
          condition: '',
          image: null,
          city: 'الأردن',
          source: c.source,
          url: c.sourceUrl || '',
        })),
      },
    });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err?.message || 'عذراً، حدث خطأ أثناء تحليل السوق. حاول مرة أخرى.',
    }, { status: 500 });
  }
}
