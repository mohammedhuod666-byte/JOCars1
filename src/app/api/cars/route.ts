import { NextRequest, NextResponse } from 'next/server';
import prisma, { getCached, invalidateCache } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { carSchema } from '@/lib/validations';
import { sanitizePlainText } from '@/lib/sanitize';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse, jsonWithCharset } from '@/lib/api';
import { generateSlug } from '@/lib/utils';
import { generateRefCode } from '@/lib/generate-refcode';
import { uploadMultipleImages, uploadImage, cloudinary } from '@/lib/cloudinary';
import { sanitizeFeatures } from '@/lib/car-features';
import { scoreListing } from '@/lib/listing-score';
import { prepareDocument } from '@/lib/doc-upload';
import { analyzeCarPrice } from '@/ai/price-analysis';
import { notifyAdmins } from '@/lib/admin-notify';
import { createAuditLog } from '@/lib/audit';
import { moderateListing } from '@/ai/moderate';
import { compressToWebP } from '@/lib/image-compress';
import { validateUploadedImage } from '@/lib/image-validate';
import { SERVER_MAX_PUBLISH_BODY_BYTES } from '@/lib/upload-limits';
import { verifyUploadRef, isOurAssetUrl } from '@/lib/upload-token';
import { recordSignal } from '@/lib/sentinel';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: 'APPROVED', deletedAt: null };
  if (searchParams.get('showSold') === 'true') delete where.status;

  // Explicit status filter — restricted: non-admins can only see APPROVED/SOLD.
  // PENDING/REJECTED are moderation queues and must not leak to public.
  const userEarly = await authenticateRequest(request).catch(() => null);
  const isAdminEarly = userEarly?.role === 'ADMIN';
  const statusParam = searchParams.get('status');
  if (statusParam && ['APPROVED', 'PENDING', 'REJECTED', 'SOLD'].includes(statusParam)) {
    if (statusParam === 'APPROVED' || statusParam === 'SOLD') {
      where.status = statusParam;
    } else if (isAdminEarly) {
      where.status = statusParam;
    }
    // else: ignore — keep default APPROVED to prevent info disclosure
  }
  if (searchParams.get('featured') === 'true') where.featured = true;

  if (searchParams.get('isNew') === 'true') where.isNew = true;

  // Curated feeds: reels (has video) • wholesale (dealer-to-dealer) • salvage (damaged)
  if (searchParams.get('hasVideo') === 'true') {
    where.AND = [...((where.AND as any[]) || []), { videoUrl: { not: '' } }];
  }
  if (searchParams.get('wholesale') === 'true') where.isWholesale = true;
  if (searchParams.get('damaged') === 'true') where.isDamaged = true;
  if (searchParams.get('search') || searchParams.get('query')) {
    const q = searchParams.get('search') || searchParams.get('query') || '';
    const normalized = q.trim().toUpperCase().replace(/[\s-]+/g, '');
    const refCodePattern = /^[A-Z0-9]{6,7}$/;
    if (refCodePattern.test(normalized)) {
      const cleanCode = normalized.length === 6 ? normalized.slice(0, 3) + '-' + normalized.slice(3) : normalized;
      where.refCode = cleanCode;
    } else {
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { nameAr: { contains: q, mode: 'insensitive' } } },
        { brand: { nameEn: { contains: q, mode: 'insensitive' } } },
        { model: { nameAr: { contains: q, mode: 'insensitive' } } },
        { model: { nameEn: { contains: q, mode: 'insensitive' } } },
      ];
    }
  }
  if (searchParams.get('brandId')) where.brandId = searchParams.get('brandId');
  // Structured (non-free-text) facets. These only became filterable once the
  // columns existed — previously customsStatus lived in the description text
  // and isWholesale was silently dropped, so these filters could never match.
  const cst = searchParams.get('customsStatus');
  if (cst) where.customsStatus = cst;
  const acc = searchParams.get('accidentHistory');
  if (acc) where.accidentHistory = acc;
  const own = searchParams.get('ownershipSource');
  if (own) where.ownershipSource = own;
  if (searchParams.get('modelId')) where.modelId = searchParams.get('modelId');
  if (searchParams.get('cityId')) where.cityId = searchParams.get('cityId');
  if (searchParams.get('fuelType')) where.fuelType = searchParams.get('fuelType');
  if (searchParams.get('transmission')) where.transmission = searchParams.get('transmission');
  if (searchParams.get('condition')) where.condition = searchParams.get('condition');
  if (searchParams.get('bodyType')) where.bodyType = searchParams.get('bodyType');
  if (searchParams.get('drivetrain')) where.drivetrain = searchParams.get('drivetrain');
  if (searchParams.get('color')) where.color = searchParams.get('color');

  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  if (priceMin || priceMax) {
    const gte = priceMin ? parseInt(priceMin, 10) : NaN;
    const lte = priceMax ? parseInt(priceMax, 10) : NaN;
    const priceFilter: Record<string, number> = {};
    if (!Number.isNaN(gte)) priceFilter.gte = gte;
    if (!Number.isNaN(lte)) priceFilter.lte = lte;
    if (Object.keys(priceFilter).length > 0) where.price = priceFilter;
  }

  const yearMin = searchParams.get('yearMin');
  const yearMax = searchParams.get('yearMax');
  if (yearMin || yearMax) {
    const gte = yearMin ? parseInt(yearMin, 10) : NaN;
    const lte = yearMax ? parseInt(yearMax, 10) : NaN;
    const yearFilter: Record<string, number> = {};
    if (!Number.isNaN(gte)) yearFilter.gte = gte;
    if (!Number.isNaN(lte)) yearFilter.lte = lte;
    if (Object.keys(yearFilter).length > 0) where.year = yearFilter;
  }

  const kmMin = searchParams.get('kilometersMin');
  const kmMax = searchParams.get('kilometersMax');
  if (kmMin || kmMax) {
    const gte = kmMin ? parseInt(kmMin, 10) : NaN;
    const lte = kmMax ? parseInt(kmMax, 10) : NaN;
    const kmFilter: Record<string, number> = {};
    if (!Number.isNaN(gte)) kmFilter.gte = gte;
    if (!Number.isNaN(lte)) kmFilter.lte = lte;
    if (Object.keys(kmFilter).length > 0) where.kilometers = kmFilter;
  }

  if (searchParams.get('exclude')) {
    where.id = { not: searchParams.get('exclude') };
  }

  const orderBy: Record<string, string> = {};
  const allowedSortFields = ['createdAt', 'price', 'year', 'kilometers', 'views', 'featured'];
  const allowedSortOrders = ['asc', 'desc'];
  const sortBy = allowedSortFields.includes(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'createdAt';
  const sortOrder = allowedSortOrders.includes(searchParams.get('sortOrder') || '') ? searchParams.get('sortOrder')! : 'desc';
  orderBy[sortBy] = sortOrder;

  const user = userEarly;

  const cacheKey = `cars:${JSON.stringify({ where, skip, limit, orderBy: { featured: 'desc', ...orderBy } })}`;

  try {
    if (!user) {
      const cached = await getCached(cacheKey, async () => {
        const [cars, total] = await Promise.all([
          prisma.car.findMany({
            where: where as any,
            orderBy: [{ featured: 'desc' }, orderBy as any],
            skip,
            take: limit,
            include: {
              brand: { select: { id: true, nameAr: true, nameEn: true, slug: true, logo: true } },
              model: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
              city: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
              images: { select: { id: true, url: true, thumbnail: true, isCover: true, order: true }, orderBy: { order: 'asc' }, take: 1 },
              user: { select: { id: true, name: true, dealerName: true, dealerLogo: true, rating: true, badges: true } },
              auction: { select: { id: true, currentPrice: true, status: true, endDate: true, _count: { select: { bids: true } } } },
            },
          }),
          prisma.car.count({ where: where as any }),
        ]);
        return { data: redactDocuments(cars), total };
      }, 15000);
      return NextResponse.json({
        success: true,
        data: cached.data,
        pagination: {
          page, limit, total: cached.total,
          totalPages: Math.ceil(cached.total / limit),
          hasMore: skip + cached.data.length < cached.total,
        },
      });
    }

    let favoriteCarIds: Set<string> = new Set();
    if (user) {
      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id },
        select: { carId: true },
      });
      favoriteCarIds = new Set(favorites.map(f => f.carId));
    }

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where: where as any,
        orderBy: [{ featured: 'desc' }, orderBy as any],
        skip,
        take: limit,
        include: {
          brand: { select: { id: true, nameAr: true, nameEn: true, slug: true, logo: true } },
          model: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
          city: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
          images: { select: { id: true, url: true, thumbnail: true, isCover: true, order: true }, orderBy: { order: 'asc' }, take: 1 },
          user: { select: { id: true, name: true, dealerName: true, dealerLogo: true, rating: true, badges: true } },
          auction: { select: { id: true, currentPrice: true, status: true, endDate: true, _count: { select: { bids: true } } } },
        },
      }),
      prisma.car.count({ where: where as any }),
    ]);

    const data = redactDocuments(cars).map(car => ({
      ...car,
      isFavorited: favoriteCarIds.has(car.id),
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + cars.length < total,
      },
    });
  } catch (error) {
    console.error('Cars fetch error:', error);
    return errorResponse('فشل تحميل السيارات', 500);
  }
}

/**
 * Strip document URLs from any list-shaped response.
 *
 * A license photo carries the owner's personal data (name, ID). Documents are
 * verification evidence, not feed content, so they must not appear in public
 * or shared listings at all. Authorized viewers (owner/admin) request a
 * short-lived signed URL from /api/cars/[id]/documents instead.
 *
 * Applied inside the cache factory too, otherwise the cached copy would keep
 * carrying the URLs.
 */
function redactDocuments<T extends { licenseDocUrl?: string | null; inspectionDocUrl?: string | null }>(cars: T[]): T[] {
  return cars.map((c) => ({ ...c, licenseDocUrl: null, inspectionDocUrl: null }));
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await authenticateRequest(request);
  } catch (authErr) {
    console.error('Auth error during car create:', authErr);
    return unauthorizedResponse();
  }
  if (!user) return unauthorizedResponse();
  if (user.canPost === false) return errorResponse('تم إيقاف النشر لحسابك', 403);
  if (user.banStatus) return errorResponse('حسابك محظور', 403);

  try {
    // Refuse an over-budget body BEFORE parsing it. This mirrors the client guard
    // so an API caller gets the real reason instead of the platform's HTML 413
    // (which never reaches this handler at all). Reading Content-Length is safe:
    // a multipart body with no header arrives chunked and simply skips this check
    // and falls through to the measured limit after parsing.
    const declared = Number(request.headers.get('content-length') || '0');
    if (declared > SERVER_MAX_PUBLISH_BODY_BYTES) {
      return errorResponse(
        `حجم الطلب ${(declared / 1024 / 1024).toFixed(1)} ميجابايت — الحد الأقصى ` +
        `${(SERVER_MAX_PUBLISH_BODY_BYTES / 1024 / 1024).toFixed(1)} ميجابايت. ` +
        'قلل عدد الصور أو ارفع المستندات كملف PDF أصغر.',
        413,
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      const len = request.headers.get('content-length');
      console.error(`Car create: multipart parse failed (content-length: ${len || 'unknown'})`);
      return errorResponse(
        'تعذر استلام الصور — غالباً حجم الملفات كبير جداً أو انقطع الاتصال أثناء الرفع. ' +
        'قلل عدد الصور (10 كحد أقصى دفعة واحدة) وتأكد من الإنترنت ثم حاول مجدداً.',
        413,
      );
    }

    // A multipart value is a real File only if it carries a non-zero size;
    // browsers send empty file parts as empty strings, which must not satisfy
    // the publish gate.
    const realFile = (f: unknown): f is File =>
      !!f && typeof f !== 'string' && typeof (f as File).size === 'number' && (f as File).size > 0;

    // Gallery images are staged separately via /api/upload/stage and
    // arrive as a JSON array of CDN URLs — no raw bytes in this body.
    const readJsonArray = (val: unknown): string[] => {
      if (typeof val !== 'string' || !val.trim()) return [];
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed.filter((x: unknown) => typeof x === 'string' && x.startsWith('http')) : [];
      } catch { return []; }
    };
    const imageUrls = readJsonArray(formData.get('imageUrls'));
    // Gallery images staged separately arrive as CDN URLs via coverUrl;
    // legacy inline files use coverFile + coverIndex.
    const stagedCoverUrl = typeof formData.get('coverUrl') === 'string' ? formData.get('coverUrl') as string : null;
    // The wizard sends the cover as an INDEX into the gallery rather than a
    // second copy of the same bytes: duplicating it cost up to ~400KB of the
    // request body, which was enough to cross the platform ceiling on an
    // otherwise valid ad. Falls back to the legacy file, then to image 0.
    const coverIndexRaw = formData.get('coverIndex');
    const coverIndex = typeof coverIndexRaw === 'string' && /^\d+$/.test(coverIndexRaw)
      ? parseInt(coverIndexRaw, 10)
      : NaN;
    const uploadedFiles = formData.getAll('images') as File[];
    const coverFile = formData.get('coverImage') as File | null;
    // Official documents. Kept out of the `images` array on purpose: they must
    // never become CarImage rows (that would put them in the public gallery).
    const licenseDocFile = formData.get('licenseDoc') as File | null;
    const inspectionDocFile = formData.get('inspectionDoc') as File | null;
    // A report can span several pages, so the inspection document accepts
    // multiple files (one primary + extra pages stored as a JSON array).
    const extraInspectionFiles = formData.getAll('inspectionDocExtra') as File[];
    const serviceRecordFile = formData.get('serviceRecordDoc') as File | null;

    /**
     * Signed references to documents uploaded in a separate request.
     *
     * The wizard stages documents first (/api/upload/stage) so their bytes never
     * travel inside this multipart body, which is how the 4.5MB platform ceiling
     * stops being reachable. A reference is an HMAC bound to (userId, url, kind)
     * — see src/lib/upload-token.ts — so a client cannot point this listing at
     * another seller's document, cannot swap the license for the inspection
     * report, and cannot reference an arbitrary URL.
     *
     * The inline file path stays supported for API callers and small payloads.
     */
    const readRefs = (key: string): string[] => {
      const raw = formData.get(key);
      if (typeof raw !== 'string' || !raw.trim()) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
      } catch {
        return [];
      }
    };
    const verifyRef = (raw: unknown, kind: 'license' | 'inspection' | 'inspectionExtra' | 'serviceRecord') =>
      (typeof raw === 'string' && raw.trim() ? verifyUploadRef(raw.trim(), user.id, kind) : null);

    const licenseRefUrl = verifyRef(formData.get('licenseDocRef'), 'license');
    const inspectionRefUrl = verifyRef(formData.get('inspectionDocRef'), 'inspection');
    const serviceRecordRefUrl = verifyRef(formData.get('serviceRecordDocRef'), 'serviceRecord');
    const extraRefUrls = readRefs('inspectionDocExtraRefs')
      .map((r) => verifyUploadRef(r, user.id, 'inspectionExtra'))
      .filter((u): u is string => !!u)
      .slice(0, 5);

    // A ref that was supplied but did NOT verify is a tampering attempt, not a
    // missing field: never silently fall back to "no document", because that
    // would let a bad ref hide behind a truthful validation message.
    const rejectedRefs: string[] = [];
    for (const [label, raw, ok] of [
      ['licenseDocRef', formData.get('licenseDocRef'), licenseRefUrl],
      ['inspectionDocRef', formData.get('inspectionDocRef'), inspectionRefUrl],
      ['serviceRecordDocRef', formData.get('serviceRecordDocRef'), serviceRecordRefUrl],
    ] as const) {
      if (typeof raw === 'string' && raw.trim() && !ok) rejectedRefs.push(label);
    }

    // Publish gate (server-side, non-bypassable). The wizard also blocks the
    // user client-side, but an API caller could skip that — so both documents
    // are required here for every new ad. A staged reference satisfies the gate
    // exactly like an inline file does.
    const missingDocs: { field: string; message: string }[] = [];
    if (rejectedRefs.length) {
      return errorResponse(
        'مرفوع المستند غير صالح — ارفع المستند من جديد وحاول مرة أخرى',
        400,
      );
    }
    if (!licenseRefUrl && !realFile(licenseDocFile)) {
      missingDocs.push({
        field: 'licenseDoc',
        message: 'صورة ترخيص السيارة مطلوبة للتحقق من بيانات السيارة ومطابقة معلومات الإعلان',
      });
    }
    if (!inspectionRefUrl && !realFile(inspectionDocFile)) {
      missingDocs.push({
        field: 'inspectionDoc',
        message: 'صورة فحص السيارة مطلوبة كإثبات مرتبط بحالة السيارة ومطابقة معلومات الإعلان',
      });
    }
    if (missingDocs.length) {
      return jsonWithCharset(
        { success: false, error: 'مستندات السيارة غير مكتملة — لم يتم نشر الإعلان', details: missingDocs },
        { status: 422 },
      );
    }

    const data: Record<string, unknown> = {};
    let conditionDetailsStr: string | null = null;
    // Inspection chip choice (فحص كامل 7 جيد / فحص 4 جيد / …). carSchema has no
    // such field, so it used to be silently dropped and the ad card fell back
    // to a hardcoded "7 جيد". Keep it here and store it as aiConditionReport.
    let inspectionSummaryStr: string | null = null;
    for (const [key, value] of formData.entries()) {
      if (key === 'conditionDetails') { conditionDetailsStr = value as string; continue; }
      if (key === 'inspectionSummary') {
        const s = sanitizePlainText(String(value)).trim().slice(0, 120);
        inspectionSummaryStr = s || null;
        continue;
      }
      if (key !== 'images' && key !== 'coverImage' && key !== 'video'
        && key !== 'licenseDoc' && key !== 'inspectionDoc'
        && key !== 'inspectionDocExtra' && key !== 'serviceRecordDoc'
        && key !== 'coverIndex'
        && key !== 'licenseDocRef' && key !== 'inspectionDocRef'
        && key !== 'serviceRecordDocRef' && key !== 'inspectionDocExtraRefs') {
        data[key] = value;
      }
    }

    data.year = parseInt(data.year as string);
    data.kilometers = parseInt(data.kilometers as string);
    data.price = parseFloat(data.price as string);
    data.doors = parseInt((data.doors as string) || '4');
    data.ownerCount = parseInt((data.ownerCount as string) || '1');
    if (data.engineCapacity) data.engineCapacity = parseFloat(data.engineCapacity as string);
    if (data.cylinders) data.cylinders = parseInt(data.cylinders as string);
    if (data.horsepower) data.horsepower = parseInt(data.horsepower as string);
    if (data.acceleration) data.acceleration = parseFloat(data.acceleration as string);
    if (data.features) {
      data.features = JSON.stringify(sanitizeFeatures(data.features));
    }
    data.isNegotiable = data.isNegotiable === 'true';
    data.hasWarranty = data.hasWarranty === 'true';
    data.hasServiceHistory = data.hasServiceHistory === 'true';
    data.isDamaged = data.isDamaged === 'true';
    data.isWholesale = data.isWholesale === 'true';
    data.isPaintOriginal = data.isPaintOriginal !== 'false';
    // Optional numeric fields: only coerce when actually provided, otherwise
    // parseInt('') -> NaN would fail the whole listing.
    for (const k of ['seats', 'keysCount', 'firstRegistrationYear']) {
      if (data[k] !== undefined && data[k] !== '') {
        const n = parseInt(data[k] as string, 10);
        if (isNaN(n)) delete data[k];
        else data[k] = n;
      } else {
        delete data[k];
      }
    }
    if (data.isFirstOwner !== undefined) {
      data.isFirstOwner = data.isFirstOwner === 'true';
    }
    // Free-text seller declarations: sanitized, never trusted as fact.
    for (const k of ['accidentDetails', 'serviceNotes', 'customsNotes', 'lastServiceType', 'lastServiceDate']) {
      if (typeof data[k] === 'string') {
        const v = sanitizePlainText(data[k] as string).trim();
        if (v) data[k] = v.slice(0, 1500);
        else delete data[k];
      }
    }
    if (data.locationLat) data.locationLat = parseFloat(data.locationLat as string);
    if (data.locationLng) data.locationLng = parseFloat(data.locationLng as string);
    // (0,0) is the Gulf of Guinea — never a real car location in Jordan.
    // The map picker sends it for "cleared"; treat as unset instead of storing.
    if (data.locationLat === 0 && data.locationLng === 0) {
      delete data.locationLat;
      delete data.locationLng;
    }
    if (data.videoUrl === '') delete data.videoUrl;

    const validation = carSchema.safeParse(data);
    if (!validation.success) {
      console.error('Car validation failed:', JSON.stringify(validation.error.issues));
      return validationErrorResponse(validation.error);
    }

    const hasCloudinary = !!(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your-api-key' && process.env.CLOUDINARY_API_SECRET);
    let uploadedImages: { url: string; secure_url?: string }[] = [];
    let coverUrl: string | undefined;
    let licenseDocUrl: string | undefined;
    let inspectionDocUrl: string | undefined;
    let serviceRecordDocUrl: string | undefined;
    const extraInspectionDocUrls: string[] = [];

    const toCompressedBuffer = async (file: File): Promise<{ buffer: Buffer; ext: string }> => {
      const { buffer, ext } = await validateUploadedImage(file);
      if (file.type === 'image/gif') return { buffer, ext };
      const { buffer: out } = await compressToWebP(buffer, file.type);
      // compressToWebP may pass the original through (small files, failures):
      // keep the REAL extension so .webp is never written for PNG content.
      if (out === buffer || out.equals(buffer)) return { buffer, ext };
      return { buffer: out, ext: 'webp' };
    };

    // Cloudinary SDK treats a bare string as a LOCAL FILE PATH. Raw base64
    // makes it fs.open('/9j/4AAQ…') → ENAMETOOLONG and the publish dies with
    // a generic message. Every payload must be a data URI with the real mime.
    // secure_url (https) is what we persist: the site is https-only.
    const MIME_BY_EXT: Record<string, string> = {
      jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
    };
    const toDataUri = (buffer: Buffer, ext: string): string =>
      `data:${MIME_BY_EXT[ext] || 'image/jpeg'};base64,${buffer.toString('base64')}`;

    const saveLocal = async (buffer: Buffer, ext: string): Promise<string> => {
      const { writeFile, mkdir } = await import('fs/promises');
      const pathMod = await import('path');
      const safeExt = ['jpg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
      const fileName = `car_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
      const uploadsDir = pathMod.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(pathMod.join(uploadsDir, fileName), buffer);
      return `/uploads/${fileName}`;
    };

    // Documents must never land in `public/`. Stored outside the public dir and
    // served only by /api/cars/[id]/documents after an authorization check.
    const savePrivateLocal = async (buffer: Buffer, ext: string): Promise<string> => {
      const { writeFile, mkdir } = await import('fs/promises');
      const pathMod = await import('path');
      const { randomUUID } = await import('crypto');
      const safeExt = ['jpg', 'png', 'webp', 'gif', 'pdf'].includes(ext) ? ext : 'jpg';
      // Never reuse a user-supplied filename: generate our own opaque name.
      const fileName = `doc_${randomUUID()}.${safeExt}`;
      const docsDir = pathMod.join(process.cwd(), 'storage', 'car-docs');
      await mkdir(docsDir, { recursive: true });
      await writeFile(pathMod.join(docsDir, fileName), buffer);
      return `private://${fileName}`;
    };

    try {
      if (hasCloudinary) {
        // Gallery images: staged separately as CDN URLs (the structural
        // fix for "تعذر استلام البيانات"). Upload legacy inline files
        // only as fallback for API callers that still send bytes.
        if (imageUrls.length > 0) {
          // Staged images arrive as verified HTTPS Cloudinary URLs.
          // Re-validate each URL belongs to our account before trusting it.
          for (const u of imageUrls) {
            if (!isOurAssetUrl(u)) return errorResponse('رابط صورة غير صالح', 400);
          }
          uploadedImages = imageUrls.map((url) => ({ url, secure_url: url }));
        } else if (uploadedFiles.length > 0) {
          const files = await Promise.all(uploadedFiles.map(img => toCompressedBuffer(img)));
          const dataUris = files.map(f => toDataUri(f.buffer, f.ext));
          uploadedImages = await uploadMultipleImages(dataUris, 'jo-cars/cars');
        }
        // Cover resolution, cheapest path first: reuse a gallery URL when the
        // index is valid (no extra upload, no extra bytes), otherwise fall back
        // to the legacy cover file.
        if (!Number.isNaN(coverIndex) && uploadedImages[coverIndex]) {
          coverUrl = uploadedImages[coverIndex].secure_url || uploadedImages[coverIndex].url;
        } else if (stagedCoverUrl) {
          coverUrl = stagedCoverUrl;
        } else if (coverFile) {
          const cover = await toCompressedBuffer(coverFile);
          const result = await uploadImage(toDataUri(cover.buffer, cover.ext), { folder: 'jo-cars/covers' });
          coverUrl = result.secure_url;
        }
        // Documents are AUTHENTICATED Cloudinary assets: the plain CDN URL 403s for
        // everyone, and access is granted only via short-lived signed URLs that
        // /api/cars/[id]/documents mints after an ownership/role check. A
        // license carries the owner's name, so it must never be world-readable.
        const uploadDoc = async (file: File): Promise<string> => {
          const prepared = await prepareDocument(file);
          // PDFs use resource_type 'raw' so Cloudinary stores/serves them as documents.
          // The SDK's typed signature only accepts strings, so the buffer goes
          // over as a data URI — which is exactly what the string overload wants.
          if (prepared.isPdf) {
            const up = await cloudinary.uploader.upload(
              `data:application/pdf;base64,${prepared.buffer.toString('base64')}`,
              { folder: 'jo-cars/docs', resource_type: 'raw', type: 'authenticated' },
            );
            return up.secure_url;
          }
          const up = await cloudinary.uploader.upload(
            `data:${prepared.mime};base64,${prepared.buffer.toString('base64')}`,
            { folder: 'jo-cars/docs', resource_type: 'image', type: 'authenticated' },
          );
          return up.secure_url;
        };

        // A staged reference is already stored privately and verified as this
        // user's own upload, so it is used as-is: re-uploading would cost another
        // transfer and another chance to fail. Inline files take the legacy path.
        if (licenseRefUrl) {
          licenseDocUrl = licenseRefUrl;
        } else if (realFile(licenseDocFile)) {
          licenseDocUrl = await uploadDoc(licenseDocFile);
        }
        if (inspectionRefUrl) {
          inspectionDocUrl = inspectionRefUrl;
        } else if (realFile(inspectionDocFile)) {
          inspectionDocUrl = await uploadDoc(inspectionDocFile);
        }
        if (serviceRecordRefUrl) {
          serviceRecordDocUrl = serviceRecordRefUrl;
        } else if (realFile(serviceRecordFile)) {
          serviceRecordDocUrl = await uploadDoc(serviceRecordFile);
        }
        extraInspectionDocUrls.push(...extraRefUrls);
        for (const extra of extraInspectionFiles) {
          if (!realFile(extra)) continue;
          if (extraInspectionDocUrls.length >= 5) break; // bounded
          extraInspectionDocUrls.push(await uploadDoc(extra));
        }
      } else {
        // No Cloudinary: store compressed files on local disk (never data-URI in DB).
        if (uploadedFiles.length > 10) {
          return errorResponse('الحد الأقصى 10 صور لكل إعلان', 400);
        }
        for (const img of uploadedFiles) {
          const f = await toCompressedBuffer(img);
          uploadedImages.push({ url: await saveLocal(f.buffer, f.ext) });
        }
        // Same index-first rule as the Cloudinary branch above.
        if (!Number.isNaN(coverIndex) && uploadedImages[coverIndex]) {
          coverUrl = uploadedImages[coverIndex].url;
        } else if (coverFile) {
          const f = await toCompressedBuffer(coverFile);
          coverUrl = await saveLocal(f.buffer, f.ext);
        }
        // Local-storage fallback writes to a NON-public directory. `public/uploads`
        // is served statically and would make documents world-readable, which
        // is exactly what the authenticated Cloudinary path avoids above.
        if (realFile(licenseDocFile)) {
          const p = await prepareDocument(licenseDocFile);
          licenseDocUrl = await savePrivateLocal(p.buffer, p.ext);
        }
        if (realFile(inspectionDocFile)) {
          const p = await prepareDocument(inspectionDocFile);
          inspectionDocUrl = await savePrivateLocal(p.buffer, p.ext);
        }
        if (realFile(serviceRecordFile)) {
          const p = await prepareDocument(serviceRecordFile);
          serviceRecordDocUrl = await savePrivateLocal(p.buffer, p.ext);
        }
        for (const extra of extraInspectionFiles) {
          if (!realFile(extra)) continue;
          if (extraInspectionDocUrls.length >= 5) break;
          const p = await prepareDocument(extra);
          extraInspectionDocUrls.push(await savePrivateLocal(p.buffer, p.ext));
        }
      }
    } catch (uploadErr) {
      console.error('Image upload failed:', uploadErr);
      const raw = uploadErr instanceof Error ? uploadErr.message : '';
      // Arabic messages come from our own validators (real, user-actionable
      // reasons). Anything else is storage/SDK internals — never show those.
      const msg = /[\u0600-\u06FF]/.test(raw)
        ? raw
        : 'تعذّر رفع الصور على خادم التخزين — أعد المحاولة بعد قليل أو انشر الإعلان بدون صور.';
      return errorResponse(msg, 400);
    }

    const slug = generateSlug(data.brandId as string, data.modelId as string, data.year as number, Date.now().toString());
    const refCode = await generateRefCode();

    const car = await prisma.car.create({
      data: {
        ...validation.data,
        // DB requires drivetrain; explicit UNKNOWN beats a false FWD.
        drivetrain: (validation.data as any).drivetrain || 'UNKNOWN',
        conditionDetails: conditionDetailsStr,
        aiConditionReport: inspectionSummaryStr,
        slug,
        refCode,
        status: 'PENDING',
        userId: user.id,
        coverImage: coverUrl || null,
        licenseDocUrl: licenseDocUrl || null,
        inspectionDocUrl: inspectionDocUrl || null,
        serviceRecordDocUrl: serviceRecordDocUrl || null,
        inspectionDocUrls: extraInspectionDocUrls.length ? JSON.stringify(extraInspectionDocUrls) : null,
        images: uploadedImages.length > 0 ? {
          create: uploadedImages.map((img, i) => ({
            // Cloudinary returns `url` as http:// — the site is https, so a
            // plain http image is mixed content (blocked by modern browsers).
            url: img.secure_url || img.url,
            // The cover flag must agree with the cover URL above, otherwise the
            // gallery carousel and the ad card can show different first images.
            isCover: !Number.isNaN(coverIndex) ? i === coverIndex : i === 0,
            order: i,
          })),
        } : undefined,
      },
      include: {
        brand: true, model: true, city: true, images: true,
      },
    });

    // Sentinel: listing-burst signal — more than 5 cars/hour is spam behavior.
    prisma.car.count({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    }).then((n) => {
      if (n > 5) {
        recordSignal({
          userId: user.id, type: 'SPAM_LISTING',
          detail: `${n} إعلانات خلال ساعة`,
        }).catch(() => {});
      }
    }).catch(() => {});

    analyzeCarPrice({
      brand: car.brand?.nameAr || car.brand?.nameEn || '',
      model: car.model?.nameAr || car.model?.nameEn || '',
      year: car.year,
      trim: car.trim || undefined,
      kilometers: car.kilometers,
      condition: car.condition,
      fuelType: car.fuelType,
      transmission: car.transmission,
      bodyType: car.bodyType || undefined,
      engineCapacity: car.engineCapacity?.toString() || undefined,
      cylinders: car.cylinders?.toString() || undefined,
      drivetrain: car.drivetrain,
      color: car.color || undefined,
      ownerCount: car.ownerCount || undefined,
      isDamaged: car.isDamaged,
      isPaintOriginal: car.isPaintOriginal,
      hasWarranty: car.hasWarranty,
      hasServiceHistory: car.hasServiceHistory,
    }).then(async analysis => {
      await prisma.car.update({
        where: { id: car.id },
        data: {
          fairPriceEstimate: analysis.valuation.fairPrice,
          aiScore: analysis.valuation.confidence,
        },
      });
    }).catch(() => {});

    invalidateCache('cars');

    await notifyAdmins(
      'NEW_CAR',
      'إعلان جديد قيد المراجعة',
      `تم إضافة إعلان جديد: ${car.brand?.nameAr} ${car.model?.nameAr} ${car.year}`,
      '/admin/cars',
    );

    await createAuditLog({
      action: 'PUBLISH_CAR', actorId: car.userId,
      entityType: 'CAR', entityId: car.id,
      description: `نشر إعلان: ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year} — ${car.price} د.أ`,
    }).catch(() => {});

    // AI pre-moderation (fire-and-forget): obvious spam/scam gets an
    // automatic report + admin notification so reviewers see it first
    moderateListing({
      brand: car.brand?.nameAr || '', model: car.model?.nameAr || '',
      year: car.year, price: car.price, kilometers: car.kilometers || 0,
      description: car.description || '', phone: car.phone || '', fuelType: car.fuelType || '',
    }).then(async (verdict) => {
      try {
        await prisma.carLog.create({
          data: { carId: car.id, userId: car.userId, action: verdict.ok ? 'AUTO_MOD_OK' : 'AUTO_MOD_FLAGGED' },
        });
        if (!verdict.ok) {
          const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
          if (admin) {
            await prisma.report.create({
              data: {
                reason: 'AUTO_MODERATION',
                description: `إشراف ذكي تلقائي: ${verdict.issues.join('؛ ')}`,
                status: 'PENDING', userId: admin.id, carId: car.id,
              },
            });
          }
          await notifyAdmins(
            'NEW_REPORT',
            'بلاغ تلقائي من الإشراف الذكي ',
            `إعلان ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}: ${verdict.issues.join('، ')}`,
            '/admin/reports',
          );
        }
      } catch { /* moderation side-effects must never break publishing */ }
    }).catch(() => {});

    // The creator gets their own document URLs back (they are the owner and will
    // need them for the review screen); every other surface stays redacted.
    // Completeness is computed server-side from the row we just wrote, so the
    // review screen never invents its own percentage.
    const completeness = scoreListing({
      brandId: car.brandId,
      modelId: car.modelId,
      year: car.year,
      kilometers: car.kilometers,
      fuelType: car.fuelType,
      transmission: car.transmission,
      color: car.color,
      condition: car.condition,
      description: car.description,
      price: car.price,
      cityId: car.cityId,
      locationLat: car.locationLat,
      locationLng: car.locationLng,
      phone: car.phone,
      imageCount: uploadedImages.length,
      hasLicenseDoc: !!licenseDocUrl,
      hasInspectionDoc: !!inspectionDocUrl,
      videoUrl: typeof data.videoUrl === 'string' ? data.videoUrl : null,
      vin: typeof data.vin === 'string' ? data.vin : null,
      featuresCount: (() => { try { return sanitizeFeatures(car.features).length; } catch { return 0; } })(),
      customsStatus: typeof data.customsStatus === 'string' ? data.customsStatus : null,
      hasServiceHistory: car.hasServiceHistory,
      accidentHistory: car.accidentHistory,
      serviceRecordStatus: car.serviceRecordStatus,
      ownershipSource: car.ownershipSource,
    });

    return successResponse({ ...car, licenseDocUrl, inspectionDocUrl, completeness }, 201);
  } catch (error) {
    // Log a COMPACT classification, never the raw message returned to the client.
    // The name and a body-related flag are enough to tell a platform/transport
    // failure apart from a bug in our own validation, which is the distinction
    // that was impossible to make from the outside before.
    const raw = error instanceof Error ? error.message : String(error);
    const bodyRelated = /formdata|multipart|body|stream|aborted|socket|timeout/i.test(raw);
    console.error('[cars] create failed', JSON.stringify({
      name: error instanceof Error ? error.name : typeof error,
      bodyRelated,
      // A short, non-sensitive head of the message. Cloudinary URLs and ids are
      // not secrets, and this is what made the previous "too many images" message
      // impossible to diagnose.
      head: raw.slice(0, 180).replace(/\s+/g, ' '),
    }));

    /**
     * Only a genuine body/transport failure gets the "too many images" wording.
     *
     * That message used to be the fallback for EVERY unknown error, so it told
     * sellers their photo count was the problem when the real cause was an
     * upload failure. Wrong advice costs more than a vague message: the seller
     * deletes good photos, retries, and hits it again.
     */
    const msg = bodyRelated
      ? 'تعذر رفع البيانات للخادم — عادةً بسبب حجم الصور أو المستندات أو تقطع الاتصال. قلّل عدد الصور أو استخدم صوراً بجودة أقل.'
      : 'فشل النشر — كان لا بد من إشعار تقني بالمشكلة المحددة. حاول مجدداً بعد قليل.';
    return errorResponse(msg, 500);
  }
}
