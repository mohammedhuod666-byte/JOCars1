/**
 * Valuation engine types — deterministic pipeline, LLM explains only.
 * All money math happens in JOD floats; display rounds to whole dinars.
 */

export interface VehicleSpec {
  brand: string;      // Arabic or English, normalized downstream
  brandEn?: string | null;
  model: string;
  modelEn?: string | null;
  year: number;
  trim?: string | null;
  kilometers: number;
  fuelType?: string | null;
  transmission?: string | null;
  drivetrain?: string | null;
  condition?: string | null;
  city?: string | null;
  engineCapacity?: number | null; // cc
  horsepower?: number | null; // HP
  cylinders?: number | null;
  specs?: string[];   // extras: sunroof, leather, ...
}

export interface NormalizedListing {
  source: string;     // adapter id, e.g. 'opensooq' | 'jocars'
  sourceLabel: string;
  externalId?: string | null;
  url?: string | null;
  brand: string;
  brandEn?: string | null;
  model: string;
  modelEn?: string | null;
  year: number | null;
  trim?: string | null;
  kilometers: number | null;
  price: number;      // original currency
  currency: string;
  priceJod: number;   // converted
  fxRate: number;
  city?: string | null;
  country: string;
  fuelType?: string | null;
  transmission?: string | null;
  drivetrain?: string | null;
  horsepower?: number | null;
  cylinders?: number | null;
  engineCc?: number | null;
  specProvenance?: Record<string, 'FEED' | 'DERIVED'>;
  priceType: 'asking' | 'sold' | 'unknown';
  condition?: string | null;
  specs: string[];
  listingDate?: string | null;
  scrapedAt: string;  // ISO
}

export interface Comparable extends NormalizedListing {
  tier: 1 | 2 | 3 | 4;
  yearDiff: number; // |listing year - target year| (0 when unknown)
  similarity: number; // 0-100
  simBreakdown: Record<string, number>;
  adjustedPrice: number | null;
  adjustments: { factor: string; factorAr: string; delta: number }[];
  weight: number;
  included: boolean;
  excludeReason?: string | null;
  ageDays: number;
  isDuplicateOf?: string | null;
}

export interface PriceStats {
  weightedMedian: number;
  weightedAvg: number;
  median: number;
  p25: number;
  p75: number;
  iqr: number;
}

export interface ValuationOutput {
  estimatedPrice: number;
  minPrice: number;
  maxPrice: number;
  grade: 'approximate' | 'limited' | 'full';
  funnel: FunnelStep[];
  profile: { spec: VehicleSpec; missingFields: string[]; provenance: Record<string, 'USER_PROVIDED' | 'UNKNOWN'> };
  priceBasis: { sold: number; asking: number };
  confidence: number; // 0-100
  confidenceLabel: 'مرتفع' | 'متوسط' | 'منخفض';
  confidenceReasons: string[];
  comparablesUsed: number;
  comparablesFound: number;
  sourcesUsed: number;
  sources: { source: string; label: string; count: number }[];
  method: string;
  stats: PriceStats;
  factors: { factor: string; impact: 'high' | 'medium' | 'low' }[];
  pipeline: { stage: string; stageAr: string; ms: number; detail: string }[];
  modelVersion: string;
  dataVersion: string;
  targetDiffPct: number | null;
  insufficientReason?: string | null;
}

/** Per-stage funnel audit (spec §9): where listings disappear, with reasons. */
export interface FunnelStep {
  stage: string;
  stageAr: string;
  before: number;
  after: number;
  rejected: number;
  notes: string[];
}

/** Tunable similarity weights (spec §3). Sum = 100. */
export const SIM_WEIGHTS = {
  brandModel: 30,
  year: 15,
  trim: 10,
  kilometers: 15,
  engineTrans: 10,
  drivetrain: 5,
  specs: 5,
  condition: 5,
  market: 5,
};

export const MIN_INCLUDED_FOR_ESTIMATE = 5;
export const MIN_INCLUDED_FOR_RANGE_ONLY = 3;
