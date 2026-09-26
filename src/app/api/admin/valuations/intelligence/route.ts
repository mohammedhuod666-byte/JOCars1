import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { runIntelligenceValuation } from '@/ai/valuation/intelligence-engine';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const carId = searchParams.get('carId');
  if (!carId) {
    return errorResponse('يرجى تحديد carId', 400);
  }

  const askingPriceParam = searchParams.get('askingPrice');
  const askingPriceOverride = askingPriceParam ? Number(askingPriceParam) : undefined;
  const useAiSynthesis = searchParams.get('ai') === 'true';

  try {
    const report = await runIntelligenceValuation({ carId }, {
      askingPriceOverride,
      useAiSynthesis,
    });
    return successResponse(report);
  } catch (err: any) {
    return errorResponse(err?.message || 'فشل توليد تقرير الذكاء السوقي العادل', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return errorResponse('طلب غير صالح', 400);
  }

  try {
    const report = await runIntelligenceValuation({
      carId: body.carId || null,
      spec: body.spec || null,
    }, {
      askingPriceOverride: body.askingPrice !== undefined ? Number(body.askingPrice) : undefined,
      useAiSynthesis: body.useAiSynthesis === true,
    });
    return successResponse(report);
  } catch (err: any) {
    return errorResponse(err?.message || 'فشل توليد تقرير الذكاء السوقي العادل', 500);
  }
}
