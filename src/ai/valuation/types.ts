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
  color?: string | null;
  doors?: number | null;
  bodyType?: string | null;
  vin?: string | null;
  askingPrice?: number | null;
  specs?: string[];   // extras: sunroof, leather, ...
}

export interface NormalizedListing {
  source: string;     // adapter id, e.g. 'opensooq' | 'jocars'
  sourceLabel: string;
  externalId?: string | null;
  url?: string | null;
  title?: string | null;
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
  matrix?: MatchMatrixRow[];
}

export interface PriceStats {
  weightedMedian: number;
  weightedAvg: number;
  median: number;
  p25: number;
  p50: number;
  p75: number;
  p85: number;
  p90: number;
  iqr: number;
  askingPricePercentile?: number | null;
  askingPricePremiumPercent?: number | null;
}

export interface DataQualityReport {
  passed: boolean;
  score: number; // 0-100
  checks: { field: string; labelAr: string; status: 'VALID' | 'MISSING' | 'INVALID'; detail?: string }[];
}

export interface ValuationOutput {
  estimatedPrice: number;
  minPrice: number;
  maxPrice: number;
  grade: 'approximate' | 'limited' | 'full';
  funnel: FunnelStep[];
  profile: {
    spec: VehicleSpec;
    missingFields: string[];
    provenance: Record<string, 'USER_PROVIDED' | 'SOURCE_VERIFIED' | 'SOURCE_DERIVED' | 'UNKNOWN'>;
  };
  dataQuality?: DataQualityReport;
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
  roundedDisplayPrice?: number;
  auditTrace?: ValuationAuditTrace;
}

export interface MatchMatrixRow {
  factor: string;
  factorAr: string;
  target: string;
  comp: string;
  verdict: 'MATCH' | 'CLOSE' | 'DIFFERENT' | 'UNKNOWN';
}

export interface TargetIdentityCluster {
  targetFingerprint: string;
  listings: {
    id?: string;
    source: string;
    url?: string | null;
    title?: string;
    price: number;
    kilometers?: number | null;
    year?: number | null;
    reason: string;
  }[];
  totalClusterCount: number;
  sourcesInCluster: string[];
}

export interface ConsensusBand {
  low: number;
  high: number;
  median: number;
  count: number;
  spread: number;
}

export interface LeaveOneOutResult {
  comparableId: string;
  comparableTitle: string;
  price: number;
  weight: number;
  fmvWithout: number;
  absoluteShift: number;
  percentShift: number;
  isDominant: boolean;
}

export interface IdentityCheckResult {
  consistent: boolean;
  reason?: string;
  detectedModel?: string;
  detectedBrand?: string;
}

export interface ValuationAuditTrace {
  targetSnapshot: Record<string, any>;
  dataQuality: DataQualityReport;
  targetCluster?: TargetIdentityCluster;
  identityConflictExclusions?: { title: string; source: string; reason: string }[];
  marketSearchResults: { total: number; sources: { source: string; count: number }[] };
  yearDistribution: Record<string, number>;
  targetExclusions: string[];
  suspiciousPriceExclusions: { title: string; price: number; reason: string }[];
  duplicateExclusions: string[];
  tierAssignments: { tier1: number; tier2: number; tier3: number; tier4: number };
  primaryComparablesCount: number;
  secondaryComparablesCount: number;
  consensusBand?: ConsensusBand;
  leaveOneOutAnalysis?: LeaveOneOutResult[];
  effectiveComparableWeight: number;
  comparablesAudit: {
    source: string;
    sourceUrl?: string | null;
    listingId?: string | null;
    year: number | null;
    make: string;
    model: string;
    trim?: string | null;
    engine?: string | null;
    engineCc?: number | null;
    horsepower?: number | null;
    cylinders?: number | null;
    fuel?: string | null;
    transmission?: string | null;
    drivetrain?: string | null;
    mileage?: number | null;
    body?: string | null;
    condition?: string | null;
    location?: string | null;
    color?: string | null;
    doors?: number | null;
    features?: string[];
    rawPrice: number;
    normalizedPrice: number;
    tier: number;
    tierLabel?: string;
    identityStatus?: string;
    isPrimary: boolean;
    similarity: number;
    simBreakdown: Record<string, number>;
    rawWeight: number;
    finalWeight: number;
    priceAdjustments: { factor: string; factorAr: string; delta: number }[];
    included: boolean;
    excludeReason?: string | null;
    matchMatrix: MatchMatrixRow[];
  }[];
  rawWeightsSum: number;
  finalWeightsSum: number;
  robustStatistic: PriceStats;
  finalFmv: number;
  displayFmv: number;
  confidence: number;
  status: string;
  sensitivity: {
    baselineFmv: number;
    removals: { index: number; title: string; fmvWithout: number; delta: number; deltaPct: number }[];
  };
}

export function roundDisplayPrice(price: number, confidence: number): number {
  if (price <= 0) return 0;
  const step = confidence >= 75 ? 50 : confidence >= 50 ? 100 : 250;
  return Math.round(price / step) * step;
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
