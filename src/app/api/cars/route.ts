import { NextRequest, NextResponse } from 'next/server';
import prisma, { getCached, invalidateCache } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { carSchema } from '@/lib/validations';
import { sanitizePlainText } from '@/lib/sanitize';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';
import { generateSlug } from '@/lib/utils';
import { generateRefCode } from '@/lib/generate-refcode';
import { uploadMultipleImages, uploadImage } from '@/lib/cloudinary';
import { sanitizeFeatures } from '@/lib/car-features';
import { analyzeCarPrice } from '@/ai/price-analysis';
import { notifyAdmins } from '@/lib/admin-notify';
import { createAuditLog } from '@/lib/audit';
import { moderateListing } from '@/ai/moderate';
import { compressToWebP } from '@/lib/image-compress';
import { validateUploadedImage } from '@/lib/image-validate';
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
        return { data: cars, total };
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

    const data = cars.map(car => ({
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
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      const len = request.headers.get('content-length');
      console.error(`Car create: multipart parse failed (content-length: ${len || 'unknown'})`);
      return errorResponse(
        'تعذر استلام الصور — غالباً حجم الملفات كبير جداً أو انقطع الاتصال أثناء الرفع. قلل عدد الصور (10 كحد أقصى دفعة واحدة) وتأكد من الإنترنت ثم حاول مجدداً.',
        413,
      );
    }

    const uploadedFiles = formData.getAll('images') as File[];
    const coverFile = formData.get('coverImage') as File | null;

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
      if (key !== 'images' && key !== 'coverImage' && key !== 'video') {
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

    try {
      if (hasCloudinary) {
        if (uploadedFiles.length > 0) {
          const files = await Promise.all(uploadedFiles.map(img => toCompressedBuffer(img)));
          const dataUris = files.map(f => toDataUri(f.buffer, f.ext));
          uploadedImages = await uploadMultipleImages(dataUris, 'jo-cars/cars');
        }
        if (coverFile) {
          const cover = await toCompressedBuffer(coverFile);
          const result = await uploadImage(toDataUri(cover.buffer, cover.ext), { folder: 'jo-cars/covers' });
          coverUrl = result.secure_url;
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
        if (coverFile) {
          const f = await toCompressedBuffer(coverFile);
          coverUrl = await saveLocal(f.buffer, f.ext);
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
        images: uploadedImages.length > 0 ? {
          create: uploadedImages.map((img, i) => ({
            // Cloudinary returns `url` as http:// — the site is https, so a
            // plain http image is mixed content (blocked by modern browsers).
            url: img.secure_url || img.url,
            isCover: i === 0,
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

    return successResponse(car, 201);
  } catch (error) {
    console.error('Car create error:', error);
    // Never leak raw internals (e.g. undici "Failed to parse body as
    // FormData") — map known technical failures to actionable Arabic.
    const raw = error instanceof Error ? error.message : '';
    const msg = /formdata|multipart|body/i.test(raw)
      ? 'تعذر استلام البيانات — قلل عدد الصور وحجمها وتأكد من الإنترنت ثم حاول مجدداً.'
      : 'فشل إضافة السيارة';
    return errorResponse(msg, 500);
  }
}
