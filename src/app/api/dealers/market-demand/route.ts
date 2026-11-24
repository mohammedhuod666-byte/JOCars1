import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api';
import { getJordanMarketDemandHeatmap } from '@/ai/dealers/demand-heatmap-engine';

export async function GET(request: NextRequest) {
  const data = getJordanMarketDemandHeatmap();
  return successResponse(data);
}
