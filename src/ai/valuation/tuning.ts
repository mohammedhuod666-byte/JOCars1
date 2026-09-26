/**
 * Tunable valuation config (spec: admin settings, no redeploy).
 * DB row overrides code defaults; cached 60s.
 */
import prisma from '@/lib/prisma';
import { SIM_WEIGHTS, MIN_INCLUDED_FOR_ESTIMATE, MIN_INCLUDED_FOR_RANGE_ONLY } from './types';

export interface ValuationTuning {
  simWeights: Record<string, number>;
  minIncluded: number;
  minRangeOnly: number;
  dailyQuota: number;
  staleDays: number;
}

let cache: { at: number; value: ValuationTuning } | null = null;

export async function getTuning(): Promise<ValuationTuning> {
  const fallback: ValuationTuning = {
    simWeights: { ...SIM_WEIGHTS },
    minIncluded: 2, // graduated framework: 0-1 refuse, 2-3 approximate, 4-6 limited, 7+ full
    minRangeOnly: MIN_INCLUDED_FOR_RANGE_ONLY,
    dailyQuota: 5,
    staleDays: 60,
  };
  if (cache && Date.now() - cache.at < 60000) return cache.value;
  try {
    const row = await prisma.valuationConfig.findUnique({ where: { id: 'default' } });
    if (row) {
      let weights = fallback.simWeights;
      try {
        const parsed = JSON.parse(row.simWeights || '{}');
        const keys = Object.keys(SIM_WEIGHTS);
        const valid = keys.every((k) => typeof parsed[k] === 'number' && parsed[k] >= 0);
        if (valid && keys.reduce((a, k) => a + parsed[k], 0) > 0) weights = parsed;
      } catch { /* keep defaults */ }
      cache = {
        at: Date.now(),
        value: {
          simWeights: weights,
          minIncluded: row.minIncluded || fallback.minIncluded,
          minRangeOnly: row.minRangeOnly || fallback.minRangeOnly,
          dailyQuota: row.dailyQuota || fallback.dailyQuota,
          staleDays: row.staleDays || fallback.staleDays,
        },
      };
      return cache.value;
    }
  } catch { /* keep defaults */ }
  cache = { at: Date.now(), value: fallback };
  return fallback;
}

export function invalidateTuningCache() {
  cache = null;
}
