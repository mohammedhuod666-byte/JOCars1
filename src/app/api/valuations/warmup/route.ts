import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api';
import { getTuning } from '@/ai/valuation/tuning';

// POST /api/valuations/warmup
// Warms up the valuation engine by initializing connections and caches
// This endpoint is PUBLIC (no auth required) - called by client to reduce cold start latency
export async function POST(request: NextRequest) {
  try {
    // Import the tuning module to initialize it
    const tuning = await getTuning();
    
    // Pre-warm the Prisma client
    const { default: prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`.catch(() => {});
    
    return successResponse({
      success: true,
      message: 'Valuation engine warmed up successfully',
      tuning: {
        dailyQuota: tuning.dailyQuota,
        minIncluded: tuning.minIncluded,
      },
    });
  } catch (e: any) {
    return errorResponse(e?.message || 'Warmup failed', 500);
  }
}

export async function GET() {
  try {
    const tuning = await getTuning();
    
    // Pre-warm the Prisma client
    const { default: prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`.catch(() => {});
    
    return successResponse({
      success: true,
      message: 'Valuation engine warmup check completed',
      tuning: {
        dailyQuota: tuning.dailyQuota,
        minIncluded: tuning.minIncluded,
      },
    });
  } catch (e: any) {
    return errorResponse(e?.message || 'Warmup check failed', 500);
  }
}
