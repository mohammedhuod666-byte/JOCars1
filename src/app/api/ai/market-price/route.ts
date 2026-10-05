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

    // Phase-1 FMV gate: null whenever the engine produced no FMV — the asking
    // price must never stand in for a missing fair price (was `|| 0`, which
    // rendered as a fake "0 د.أ" fair value).
    const fmv = report.fairMarketValue ?? null;
    const min = report.range.low ?? (fmv !== null ? Math.round(fmv * 0.9) : null);
    const max = report.range.high ?? (fmv !== null ? Math.round(fmv * 1.1) : null);
    const hasFmv = fmv !== null;
    const classification = report.pricePosition.classification;

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
          // Label keys on whether an FMV ACTUALLY exists (hasFmv). A FMV-mode
          // result with no asking price has classification UNKNOWN but still
          // carries a real fairMarketValue — it must NOT be labeled "لا تتوفر
          // قيمة سوقية عادلة" while a number is displayed next to it.
          pricePosition: {
            label: !hasFmv
              ? 'لا تتوفر قيمة سوقية عادلة (أدلة داعمة فقط)'
              : classification === 'UNKNOWN'
              ? 'قيمة سوقية عادلة (FMV) متوفرة — لا يوجد سعر معروض للمقارنة'
              : classification === 'BELOW_MARKET'
              ? 'أقل من متوسط السوق'
              : classification === 'ABOVE_MARKET'
              ? 'أعلى من متوسط السوق'
              : 'مطابق لسعر السوق العادل',
            color: !hasFmv
              ? 'text-amber-500'
              : classification === 'UNKNOWN'
              ? 'text-blue-500'
              : classification === 'BELOW_MARKET'
              ? 'text-green-500'
              : classification === 'ABOVE_MARKET'
              ? 'text-red-500'
              : 'text-emerald-500',
            icon: !hasFmv ? 'HelpCircle' : 'Info',
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
