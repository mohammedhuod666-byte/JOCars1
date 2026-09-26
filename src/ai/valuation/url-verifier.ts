/**
 * URL Verification and Canonical Resolution Module for Valuation Engine.
 *
 * Requirements:
 * 1. Resolve canonical listing URLs (e.g. OpenSooq /ar/search/{id} instead of broken /post/{id}).
 * 2. Perform live HTTP verification with content validation (detecting fake 200s, deleted/expired pages, 404/410, and 403 blocks).
 * 3. Separate Evidence Validity (VERIFIED_AT_COLLECTION) from Current URL Availability (VALID / NOT_FOUND / REDIRECTED / BLOCKED).
 * 4. Never invent speculative URL patterns.
 * 5. Provide immutable Source Snapshots for auditability.
 */

import { createHash } from 'node:crypto';

export type UrlStatus =
  | 'VALID'
  | 'REDIRECTED'
  | 'NOT_FOUND'
  | 'UNAVAILABLE'
  | 'BLOCKED'
  | 'UNKNOWN';

export type EvidenceStatus =
  | 'VERIFIED_AT_COLLECTION'
  | 'UNVERIFIED_CRAWL'
  | 'MANUAL_ENTRY';

export interface UrlVerificationResult {
  sourceUrl: string;
  canonicalUrl: string | null;
  finalUrl: string | null;
  urlStatus: UrlStatus;
  httpStatus: number | null;
  redirectedFrom?: string | null;
  urlVerifiedAt: string; // ISO string
  evidenceStatus: EvidenceStatus;
  hasValidContent: boolean;
  contentTitle?: string | null;
  failureReason?: string | null;
}

export interface SourceSnapshot {
  source: string;
  sourceLabel: string;
  sourceUrl: string;
  canonicalUrl: string | null;
  collectedAt: string;
  verifiedAt?: string | null;
  title: string;
  price: number;
  currency: string;
  year: number | null;
  make: string;
  model: string;
  mileage: number | null;
  location: string | null;
  specsHash: string;
}

// In-memory verification cache to prevent excessive requests (TTL: 1 hour)
const verificationCache = new Map<string, { result: UrlVerificationResult; cachedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Resolves the genuine canonical URL for a listing based on verified platform patterns.
 * Never invents speculative URLs.
 */
export function resolveCanonicalListingUrl(rawUrl: string, source: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const s = source.toLowerCase();

  if (s.includes('opensooq') || trimmed.includes('opensooq.com')) {
    // OpenSooq listing canonical pattern is https://jo.opensooq.com/ar/search/{id}
    // Match numeric post ID from any OpenSooq format:
    // e.g. /post/287011572, /search/287011572, /ar/search/287011572, /en/post/287011572
    const idMatch = trimmed.match(/(?:post|search)\/(\d+)/i) || trimmed.match(/\/(\d{7,10})(?:[/?#]|$)/);
    if (idMatch && idMatch[1]) {
      return `https://jo.opensooq.com/ar/search/${idMatch[1]}`;
    }
    return null;
  }

  if (s.includes('jocars') || trimmed.includes('jocars.jo')) {
    if (trimmed.startsWith('/')) {
      return `https://jocars.jo${trimmed}`;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return null;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return null;
}

export interface ContentValidationResult {
  isValid: boolean;
  isDeleted: boolean;
  isBlocked: boolean;
  urlStatus: UrlStatus;
  pageTitle?: string;
  failureReason: string | null;
}

/**
 * Validates the response body to detect "Fake 200 OK" pages (deleted, expired, or general error pages).
 */
export function validateListingPageContent(
  html: string,
  httpStatus: number
): ContentValidationResult {
  if (httpStatus === 404 || httpStatus === 410) {
    return {
      isValid: false,
      isDeleted: true,
      isBlocked: false,
      urlStatus: 'NOT_FOUND',
      failureReason: httpStatus === 410 ? 'الإعلان منتهي الصلاحية (410 Gone)' : 'الإعلان غير موجود (404 Not Found)',
    };
  }
  if (httpStatus === 403 || httpStatus === 429) {
    return {
      isValid: false,
      isDeleted: false,
      isBlocked: true,
      urlStatus: 'BLOCKED',
      failureReason: 'المصدر محمي بجدار حماية ضد التتبع الآلي (403/429)',
    };
  }

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : undefined;
  const lowerHtml = html.toLowerCase();

  // Blocked / CAPTCHA indicators
  const isBlocked =
    lowerHtml.includes('cf-browser-verification') ||
    lowerHtml.includes('ddos-guard') ||
    lowerHtml.includes('challenge') ||
    lowerHtml.includes('cloudflare') ||
    lowerHtml.includes('recaptcha') ||
    lowerHtml.includes('access denied') ||
    lowerHtml.includes('robot check');

  if (isBlocked) {
    return {
      isValid: false,
      isDeleted: false,
      isBlocked: true,
      urlStatus: 'BLOCKED',
      pageTitle,
      failureReason: 'المصدر محمي بجدار حماية ضد التتبع الآلي',
    };
  }

  // Deleted / Expired indicators
  const isDeleted =
    lowerHtml.includes('الصفحة غير موجودة') ||
    lowerHtml.includes('الإعلان غير موجود') ||
    lowerHtml.includes('page not found') ||
    lowerHtml.includes('تم حذف الإعلان') ||
    lowerHtml.includes('هذا الإعلان غير متوفر') ||
    lowerHtml.includes('منتهي الصلاحية') ||
    lowerHtml.includes('غير متوفر حالياً') ||
    lowerHtml.includes('لم يتم العثور على الصفحة') ||
    lowerHtml.includes('إعلان محذوف') ||
    lowerHtml.includes('listing not found') ||
    lowerHtml.includes('ad expired') ||
    lowerHtml.includes('listing expired') ||
    (pageTitle && (pageTitle.includes('404') || pageTitle.includes('410') || pageTitle.toLowerCase().includes('not found') || pageTitle.includes('غير موجودة')));

  if (isDeleted) {
    return {
      isValid: false,
      isDeleted: true,
      isBlocked: false,
      urlStatus: 'NOT_FOUND',
      pageTitle,
      failureReason: 'الإعلان غير موجود أو تم حذفه من المصدر الأصلي',
    };
  }

  // Car listing indicators
  const hasCarIndicators =
    lowerHtml.includes('سنة') ||
    lowerHtml.includes('ممشى') ||
    lowerHtml.includes('كيلومتر') ||
    lowerHtml.includes('سعر') ||
    lowerHtml.includes('السعر') ||
    lowerHtml.includes('jod') ||
    lowerHtml.includes('دينار') ||
    lowerHtml.includes('cars') ||
    lowerHtml.includes('سيارات') ||
    lowerHtml.includes('x5') ||
    lowerHtml.includes('bmw') ||
    lowerHtml.includes('toyota') ||
    lowerHtml.includes('mercedes') ||
    lowerHtml.includes('post-details');

  const isValid = httpStatus >= 200 && httpStatus < 300 && Boolean(hasCarIndicators);

  return {
    isValid,
    isDeleted: false,
    isBlocked: false,
    urlStatus: isValid ? 'VALID' : 'UNAVAILABLE',
    pageTitle,
    failureReason: isValid ? null : 'الصفحة لا تحتوي على مؤشرات إعلان سيارة معتمد (Fake 200)',
  };
}

/**
 * Performs genuine URL verification with redirect following and content validation.
 */
export async function verifySourceUrl(
  rawUrl: string,
  source: string = 'opensooq',
  options: { timeoutMs?: number; skipCache?: boolean } = {}
): Promise<UrlVerificationResult> {
  const timeoutMs = options.timeoutMs ?? 4000;
  const now = new Date().toISOString();

  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      sourceUrl: '',
      canonicalUrl: null,
      finalUrl: null,
      urlStatus: 'UNKNOWN',
      httpStatus: null,
      urlVerifiedAt: now,
      evidenceStatus: 'UNVERIFIED_CRAWL',
      hasValidContent: false,
      failureReason: 'الرابط مفقود أو فارغ',
    };
  }

  const canonicalUrl = resolveCanonicalListingUrl(rawUrl, source);
  const cacheKey = canonicalUrl || rawUrl;

  if (!options.skipCache) {
    const cached = verificationCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.result;
    }
  }

  // URL to check (prefer canonical)
  const targetUrl = canonicalUrl || rawUrl;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.9',
      },
    });

    clearTimeout(timer);

    const httpStatus = res.status;
    const finalUrl = res.url;
    const isRedirected = finalUrl !== targetUrl && finalUrl !== rawUrl;
    const html = await res.text();

    const contentCheck = validateListingPageContent(html, httpStatus);

    let urlStatus: UrlStatus = 'VALID';
    let failureReason: string | null = null;

    if (contentCheck.isBlocked) {
      urlStatus = 'BLOCKED';
      failureReason = 'حماية ضد التتبع الآلي (CAPTCHA / 403)';
    } else if (httpStatus === 404 || httpStatus === 410 || contentCheck.isDeleted) {
      urlStatus = 'NOT_FOUND';
      failureReason = httpStatus === 410 ? 'الإعلان منتهي الصلاحية (410 Gone)' : 'الإعلان غير موجود أو تم حذفه';
    } else if (!res.ok) {
      urlStatus = 'UNAVAILABLE';
      failureReason = `استجابة خادم غير صالحة (${httpStatus})`;
    } else if (!contentCheck.isValid) {
      urlStatus = 'UNAVAILABLE';
      failureReason = 'الصفحة لا تحتوي على مؤشرات إعلان سيارة معتمد (Fake 200)';
    } else if (isRedirected) {
      urlStatus = 'REDIRECTED';
    }

    const result: UrlVerificationResult = {
      sourceUrl: rawUrl,
      canonicalUrl,
      finalUrl,
      urlStatus,
      httpStatus,
      redirectedFrom: isRedirected ? targetUrl : undefined,
      urlVerifiedAt: now,
      evidenceStatus: 'VERIFIED_AT_COLLECTION',
      hasValidContent: contentCheck.isValid,
      contentTitle: contentCheck.pageTitle,
      failureReason: failureReason || undefined,
    };

    verificationCache.set(cacheKey, { result, cachedAt: Date.now() });
    return result;
  } catch (e: any) {
    clearTimeout(timer);
    const isTimeout = e?.name === 'AbortError' || e?.message?.includes('abort');
    const result: UrlVerificationResult = {
      sourceUrl: rawUrl,
      canonicalUrl,
      finalUrl: null,
      urlStatus: isTimeout ? 'UNAVAILABLE' : 'UNKNOWN',
      httpStatus: null,
      urlVerifiedAt: now,
      evidenceStatus: 'VERIFIED_AT_COLLECTION',
      hasValidContent: false,
      failureReason: isTimeout ? 'مهلة الاتصال انتهت (Timeout)' : (e?.message || 'فشل الاتصال بالرابط'),
    };
    return result;
  }
}

/**
 * Creates an immutable audit snapshot for a comparable at the time of valuation.
 */
export function createSourceSnapshot(
  listing: {
    source: string;
    sourceLabel?: string;
    url?: string | null;
    sourceUrl?: string | null;
    canonicalUrl?: string | null;
    title?: string | null;
    price: number;
    currency?: string;
    year: number | null;
    brand?: string;
    make?: string;
    model: string;
    kilometers?: number | null;
    mileage?: number | null;
    city?: string | null;
    location?: string | null;
    scrapedAt?: string;
    collectedAt?: string;
  },
  canonicalUrlOverride?: string | null
): SourceSnapshot {
  const srcUrl = listing.sourceUrl || listing.url || '';
  const make = listing.make || listing.brand || '';
  const model = listing.model || '';
  const year = listing.year ?? null;
  const mileage = listing.mileage !== undefined ? listing.mileage : (listing.kilometers ?? null);
  const location = listing.location || listing.city || null;
  const canonical = listing.canonicalUrl || canonicalUrlOverride || (srcUrl ? resolveCanonicalListingUrl(srcUrl, listing.source) : null);
  const rawHash = `${listing.source}:${make}:${model}:${year}:${listing.price}:${mileage}`;
  const specsHash = createHash('sha256').update(rawHash).digest('hex').slice(0, 16);

  return {
    source: listing.source,
    sourceLabel: listing.sourceLabel || listing.source,
    sourceUrl: srcUrl,
    canonicalUrl: canonical,
    collectedAt: listing.collectedAt || listing.scrapedAt || new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    title: listing.title || `${make} ${model}`,
    price: listing.price,
    currency: listing.currency || 'JOD',
    year,
    make,
    model,
    mileage,
    location,
    specsHash,
  };
}
