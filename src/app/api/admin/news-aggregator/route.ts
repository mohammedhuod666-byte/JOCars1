import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { isCronAuthorized } from '@/lib/cron-auth';
import { chatCompletion } from '@/ai/nvidia-client';
import { getExpressiveNewsImage } from '@/lib/news-image';

/**
 * Car-news importer v2 — fast, multi-source, cars-only.
 *
 * Stage 1 (parallel, ~2s): Google News RSS targeted queries (JO/ar) +
 *   Jordanian homepage scrapes (Ammon, Khaberni, Roya, Alghad).
 * Stage 2 (parallel pool): title pre-filter → fetch body → body MUST
 *   verify (≥2 car signals) → negative-topic rejection → normalized dedup.
 * Stage 3 (parallel pool): og:image cover + 2-line AI summary.
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Scraping + AI summaries can run long — allow the full window on Vercel too.
export const maxDuration = 300;

// Structured RSS feeds (real article URLs — fastest & most reliable)
const RSS_SOURCES = [
  { name: 'RSS', nameAr: 'الغد (RSS)', url: 'https://www.alghad.com/rss' },
];

const HTML_SOURCES = [
  { name: 'Ammon', nameAr: 'عمون', url: 'https://www.ammonnews.net/', baseUrl: 'https://www.ammonnews.net' },
  { name: 'Khaberni', nameAr: 'خبرني', url: 'https://www.khaberni.com/', baseUrl: 'https://www.khaberni.com' },
  { name: 'Royanews', nameAr: 'رؤيا', url: 'https://royanews.tv/', baseUrl: 'https://royanews.tv' },
  { name: 'AlGhad', nameAr: 'الغد', url: 'https://www.alghad.com/', baseUrl: 'https://www.alghad.com' },
  { name: 'Alwakeel', nameAr: 'الوكيل', url: 'https://www.alwakeelnews.com/', baseUrl: 'https://www.alwakeelnews.com' },
  { name: 'Jo24', nameAr: 'جو24', url: 'https://jo24.net/', baseUrl: 'https://jo24.net' },
];

// Fair share per source so one outlet can't crowd out the rest
const PER_SOURCE_CAP = 10;

// Strong = almost certainly car-related when found in a TITLE
const STRONG_TITLE = [
  'سيارة', 'سيارات', 'مركبة', 'مركبات', 'بنزين', 'ديزل', 'سولار', 'وقود', 'محروقات',
  'جمرك', 'جمارك', 'ترخيص', 'تسجيل المركبات', 'شحن السيارات', 'هايبرد', 'كهربائية',
  'تويوتا', 'هوندا', 'نيسان', 'كيا', 'هيونداي', 'مرسيدس', 'بي إم', 'أودي', 'لكزس',
  'فولكس', 'تسلا', 'بي واي دي', 'جيلي', 'شانجان', 'إم جي', 'شيري', 'هافال',
  'كامري', 'كورولا', 'النترا', 'سوناتا', 'توسان', 'سبورتاج', 'لاند كروزر', 'باترول',
  'فحص فني', 'دائرة الترخيص', 'مخالفات السير', 'وارد السيارات', 'تخليص السيارات',
  'أسعار المحروقات', 'لجنة تسعير', 'أقساط السيارات', 'معرض السيارات', 'وكيل سيارات',
  'بطارية السيارة', 'قطع الغيار', 'المنطقة الحرة', 'موتور', 'دراجة نارية',
];

// Body verification signals (need ≥2, or 1 strong)
const BODY_SIGNALS = [
  ...STRONG_TITLE,
  'لتر', 'قرش', 'فلس', 'تعرفة', 'كيلوواط', 'سعة المحرك', 'موديل', 'عداد',
  'دينار', 'الترخيص', 'الجمارك', 'الفحص', 'الصيانة', 'التأمين', 'الاستهلاك',
];

// Reject phrases (war/tragedy/news that merely mention a vehicle)
const NEGATIVE_PHRASES = [
  'قصف', 'شهيد', 'شهداء', 'احتلال', 'غزة', 'حرب اليمن', 'الحرب الروسية',
  'أوكرانيا', 'داعش', 'إرهاب', 'اغتيال', 'مجزرة', 'عدوان', 'صاروخ', 'مسيرة',
  'كرة القدم', 'الدوري', 'المنتخب', 'مسلسل', 'فيلم', 'مهرجان', 'حفلة',
  'طقس', 'وفيات', 'عزاء', 'انتخابات', 'مجلس النواب', 'الأعيان',
  'طبخ', 'وصفة', 'أبراج', 'الذهب', 'الدولار', 'البورصة',
  'الجامعات', 'التوجيهي', 'كورونا',
];

// Jordan relevance markers — local news ranks first
const JO_MARKERS = [
  'الأردن', 'الأردنية', 'المملكة', 'عمان', 'الزرقاء', 'إربد', 'العقبة',
  'المفرق', 'الكرك', 'معان', 'جرش', 'السلط', 'مادبا', 'الطفيلة', 'محلي',
  'الحكومة', 'النواب',
];

// Arabic word-boundary matching:
// - blocks glued matches: 'تركيا' must NOT match brand 'كيا'
// - allows attached prefixes: 'والبنزين'، 'للسيارات'، 'بالكامري' (و/ب/ل/ك/ف + ال)
// - ignores tashkeel diacritics
function includesWord(text: string, word: string): boolean {
  const AR = '\\u0600-\\u06FF';
  const clean = (text || '').replace(/[\u064B-\u065F\u0670]/g, '');
  try {
    const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^${AR}])([وبلفك]ال|ال|[وبلفك])?${esc}([^${AR}]|$)`);
    return re.test(clean);
  } catch {
    return clean.includes(word);
  }
}

function titleHasStrong(title: string): boolean {
  return STRONG_TITLE.some((k) => includesWord(title, k));
}

function titleIsNegative(title: string): boolean {
  if (NEGATIVE_PHRASES.some((k) => title.includes(k))) return true;
  if (titleHasStrong(title)) return false; // strong car signal wins
  // Clearly non-car topics with no car signal at all
  return ['الزواج', 'الطلاق', 'السرطان', 'التوجيهي'].some((k) => title.includes(k));
}

function jordanScore(title: string, body: string): number {
  const t = `${title} ${body.slice(0, 500)}`;
  let s = 0;
  for (const m of JO_MARKERS) if (t.includes(m)) s += 2;
  for (const k of STRONG_TITLE) if (includesWord(t, k)) s += 1;
  return s;
}
function normalizeAr(s: string): string {
  return (s || '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function bodyVerifies(body: string): boolean {
  if (!body || body.length < 150) return false;
  const sample = body.slice(0, 2000);
  let hits = 0;
  for (const k of BODY_SIGNALS) {
    if (includesWord(sample, k)) {
      hits++;
      if (hits >= 2) return true;
    }
  }
  return hits >= 2;
}

function classifyCategory(title: string): string {
  if (/ديزل|بنزين|وقود|محروقات|بترول|نفط|محطة|تعرفة|تسعير/.test(title)) return 'FUEL_PRICES';
  if (/جمرك|تسجيل|ترخيص|ضريبة|استيراد|رسوم|تخليص/.test(title)) return 'CUSTOMS';
  if (/مراجعة|تجربة|اختبار|تقييم|مقارنة/.test(title)) return 'REVIEWS';
  if (/مبيعات|سوق|تقسيط|قسط|تمويل|تأمين|وكالة|معرض/.test(title)) return 'MARKET';
  if (/صيانة|إصلاح|فحص|نصيحة|إرشاد|بطارية|شحن/.test(title)) return 'TIPS';
  return 'NEWS';
}

interface Candidate {
  url: string;
  title: string;
  source: string;
  pubDate?: string;
  group?: string; // which query/source-group produced it (for stats)
}

async function fetchRSS(source: { name: string; nameAr: string; url: string }): Promise<{ items: Candidate[]; ok: boolean }> {
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en;q=0.9' },
    });
    if (!res.ok) return { items: [], ok: false };
    const xml = await res.text();
    const items: Candidate[] = [];
    const seen = new Set<string>();
    const itemRe = /<item>([\s\S]*?)<\/item>/gi;
    let m;
    while ((m = itemRe.exec(xml)) !== null) {
      const block = m[1];
      const title = (block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      const link = (block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '').trim();
      const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || '').trim();
      if (!title || !link || title.length < 12) continue;
      if (!titleHasStrong(title) || titleIsNegative(title)) continue;
      const key = normalizeAr(title).slice(0, 40);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ url: link, title, source: source.nameAr, pubDate, group: source.nameAr });
      if (items.length >= 25) break;
    }
    return { items, ok: true };
  } catch {
    return { items: [], ok: false };
  }
}

async function fetchHomepage(source: { name: string; nameAr: string; url: string; baseUrl: string }): Promise<{ items: Candidate[]; ok: boolean }> {
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(9000),
      headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en;q=0.9' },
    });
    if (!res.ok) return { items: [], ok: false };
    const html = await res.text();
    const items: Candidate[] = [];
    const seen = new Set<string>();
    const re = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      const url = m[1].trim();
      const title = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
      if (!url || url === '#' || /^(javascript|tel:|mailto:)/i.test(url)) continue;
      // Skip social/video embeds and index pages — no article body to verify
      if (/youtube\.com|youtu\.be|facebook\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com/i.test(url)) continue;
      if (/\/(category|tag|section|author|page|video|videos|archive)([\/?#]|$)/i.test(url)) continue;
      if (title.length < 15 || title.length > 220) continue;
      if (!titleHasStrong(title) || titleIsNegative(title)) continue;
      const fullUrl = url.startsWith('http') ? url : `${source.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
      const key = normalizeAr(title).slice(0, 40);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ url: fullUrl, title, source: source.nameAr });
    }
    return { items, ok: true };
  } catch {
    return { items: [], ok: false };
  }
}

async function fetchBody(url: string): Promise<{ body: string; image: string | null }> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(9000),
      redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en;q=0.9' },
    });
    if (!res.ok) return { body: '', image: null };
    const html = await res.text();

    // og:image cover
    let image: string | null = null;
    const og = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (og && og[1].startsWith('http')) image = og[1];

    const paragraphs: string[] = [];
    const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pm;
    while ((pm = pRe.exec(html)) !== null) {
      const text = pm[1].replace(/<[^>]+>/g, '').trim();
      if (text.length > 30 && text.length < 2000 && !/اشترك|تابعنا|اقرأ أيضا|مواضيع ذات صلة/i.test(text.slice(0, 40))) {
        paragraphs.push(text);
      }
      if (paragraphs.length >= 14) break;
    }
    return { body: paragraphs.join('\n\n'), image };
  } catch {
    return { body: '', image: null };
  }
}

async function aiSummary(title: string, body: string): Promise<string | null> {
  try {
    const text = await Promise.race([
      chatCompletion([
        { role: 'system', content: 'لخص الخبر التالي بسطرين فقط بالعربية الفصحى المبسطة، بدون مقدمات.' },
        { role: 'user', content: `${title}\n\n${body.slice(0, 1200)}` },
      ], { maxTokens: 200, timeoutMs: 12000, retries: 0 }),
      new Promise<string>((resolve) => setTimeout(() => resolve(''), 13000)),
    ]);
    const t = (text || '').trim();
    return t.length > 20 ? t : null;
  } catch {
    return null;
  }
}

// Simple concurrency pool
async function pool<T, R>(items: T[], size: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const workers = new Array(Math.min(size, items.length)).fill(null).map(async () => {
    while (idx < items.length) {
      const i = idx++;
      try { results[i] = await fn(items[i], i); } catch { results[i] = undefined as unknown as R; }
    }
  });
  await Promise.all(workers);
  return results;
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  // Admin button OR internal scheduler (same cron secret as backups)
  const cronSecret = process.env.BACKUP_CRON_SECRET;
  const headerSecret = request.headers.get('x-cron-secret') || '';
  const isCron = (!!cronSecret && headerSecret === cronSecret) || isCronAuthorized(request);
  if ((!user || user.role !== 'ADMIN') && !isCron) return unauthorizedResponse();

  const authorId = user?.id || (await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } }).catch(() => null))?.id;
  if (!authorId) return errorResponse('لا يوجد حساب مدير لتوثيق المقالات', 500);

  const started = Date.now();
  const body = await request.json().catch(() => ({}));
  const limit = Math.min(30, Math.max(3, parseInt(body.limit) || 12));
  const withSummary = body.summarize !== false;

  try {
    // ── Stage 1: gather candidates in parallel (RSS + homepages) ──
    const [rssResults, homeResults] = await Promise.all([
      Promise.all(RSS_SOURCES.map((s) => fetchRSS(s).then((r) => ({ ...r, source: s })))),
      Promise.all(HTML_SOURCES.map((s) => fetchHomepage(s).then((r) => ({ ...r, source: s })))),
    ]);

    const sourceStats: Record<string, { fetched: number; kept: number; ok: boolean }> = {};
    let candidates: Candidate[] = [];

    // Fair share per source (cap) so one outlet can't crowd out the rest
    rssResults.forEach((r) => {
      sourceStats[r.source.nameAr] = { fetched: r.items.length, kept: 0, ok: r.ok };
      candidates.push(...r.items.slice(0, PER_SOURCE_CAP).map((it) => ({ ...it, group: r.source.nameAr })));
    });
    homeResults.forEach((r) => {
      sourceStats[r.source.nameAr] = { fetched: r.items.length, kept: 0, ok: r.ok };
      candidates.push(...r.items.slice(0, PER_SOURCE_CAP).map((it) => ({ ...it, group: r.source.nameAr })));
    });

    // Title pre-filter (fast): strong signal + not negative
    candidates = candidates.filter((c) => titleHasStrong(c.title) && !titleIsNegative(c.title));

    // Dedup by normalized title + URL (before expensive body fetch)
    const seenTitle = new Set<string>();
    const seenUrl = new Set<string>();
    candidates = candidates.filter((c) => {
      const key = normalizeAr(c.title).slice(0, 50);
      if (!key || seenTitle.has(key) || seenUrl.has(c.url)) return false;
      seenTitle.add(key);
      seenUrl.add(c.url);
      return true;
    }).slice(0, 40);

    // Dedup against DB
    const existing = await prisma.article.findMany({ select: { title: true } }).catch(() => [] as { title: string }[]);
    const existingKeys = new Set(existing.map((a) => normalizeAr(a.title).slice(0, 50)));
    candidates = candidates.filter((c) => !existingKeys.has(normalizeAr(c.title).slice(0, 50)));

    // ── Stage 2: body verification (parallel pool) ──
    const bodies = await pool(candidates, 6, async (c) => fetchBody(c.url));
    const verified: (Candidate & { body: string; image: string | null })[] = [];
    candidates.forEach((c, i) => {
      const b = bodies[i];
      if (b && bodyVerifies(b.body)) {
        verified.push({ ...c, body: b.body, image: b.image });
      }
    });
    // recount kept per source
    Object.keys(sourceStats).forEach((k) => { sourceStats[k].kept = 0; });
    verified.forEach((v) => {
      if (v.group && sourceStats[v.group]) sourceStats[v.group].kept++;
    });

    const picked = verified
      .map((v) => ({ ...v, rank: jordanScore(v.title, v.body) }))
      .sort((a, b) => b.rank - a.rank)
      .slice(0, limit);

    // ── Stage 3: AI summaries + covers (parallel pool) ──
    const summaries = withSummary
      ? await pool(picked, 5, async (p) => aiSummary(p.title, p.body))
      : picked.map(() => null);

    // ── Persist ──
    const created: { title: string; slug: string; source: string }[] = [];
    const existingNow = new Set(existingKeys);
    for (let i = 0; i < picked.length; i++) {
      const p = picked[i];
      const key = normalizeAr(p.title).slice(0, 50);
      if (existingNow.has(key)) continue;
      existingNow.add(key);

      const summary = summaries[i];
      const excerpt = (summary || p.body.slice(0, 280)).slice(0, 300);
      const content = summary
        ? `**الخلاصة الذكية **\n${summary}\n\n---\n${p.body}\n\n---\n*المصدر: [${p.source}](${p.url})*`
        : `${p.body}\n\n---\n*المصدر: [${p.source}](${p.url})*`;

      const cat = classifyCategory(p.title + ' ' + p.body.slice(0, 300));
      const slug = `news-${Date.now().toString(36)}-${i}`;
      try {
        const row = await prisma.article.create({
          data: {
            title: p.title,
            slug,
            content,
            excerpt,
            image: p.image || getExpressiveNewsImage(p.title, cat),
            category: cat,
            tags: JSON.stringify([]),
            published: true,
            publishedAt: p.pubDate ? new Date(p.pubDate) : new Date(),
            authorId,
          },
          select: { title: true, slug: true },
        });
        created.push({ title: row.title, slug: row.slug, source: p.source });
      } catch { /* duplicate slug race — skip */ }
    }

    const secs = Math.round((Date.now() - started) / 1000);
    return successResponse({
      message: `تم استيراد ${created.length} خبر سيارات  خلال ${secs} ثانية (فحص ${candidates.length} مرشحاً)`,
      created,
      checked: candidates.length,
      verified: verified.length,
      seconds: secs,
      sources: sourceStats,
    });
  } catch (error) {
    return errorResponse('فشل جلب الأخبار: ' + (error as Error).message, 500);
  }
}

export async function GET(request: NextRequest) {
  // Vercel Cron fires GET + Authorization: Bearer <CRON_SECRET> — trigger the
  // daily import when authorized; otherwise fall through to the listing below.
  if (process.env.BACKUP_CRON_SECRET && isCronAuthorized(request)) return POST(request);
  try {
    const [articles, todayCount] = await Promise.all([
      prisma.article.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, title: true, slug: true, category: true, published: true, publishedAt: true, createdAt: true },
      }),
      prisma.article.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }).catch(() => 0),
    ]);
    return successResponse({
      articles,
      todayCount,
      sources: [
        ...RSS_SOURCES.map((s) => ({ name: s.nameAr, url: s.url })),
        ...HTML_SOURCES.map((s) => ({ name: s.nameAr, url: s.url })),
      ],
    });
  } catch {
    return errorResponse('فشل تحميل الأخبار', 500);
  }
}
