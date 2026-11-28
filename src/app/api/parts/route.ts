import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { sanitizePlainText, sanitizeHtml } from '@/lib/security/sanitize';
import { validateUploadedImage } from '@/lib/media/image-validate';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];

const PART_TYPES = ['engine', 'transmission', 'body', 'electrical', 'suspension', 'brake', 'cooling', 'exhaust', 'interior', 'wheel', 'turbo', 'ac', 'other'];
const PART_TYPES_AR = ['محرك', 'جير', 'هيكل', 'كهرباء', 'تعليق', 'فرامل', 'تبريد', 'عادم', 'داخلي', 'جنط', 'توربو', 'مكيف', 'أخرى'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24')));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: 'APPROVED', deletedAt: null };

  if (searchParams.get('search')) {
    const q = searchParams.get('search') || '';
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { partNumber: { contains: q } },
    ];
  }
  if (searchParams.get('partType')) where.partType = searchParams.get('partType');
  if (searchParams.get('brandId')) where.brandId = searchParams.get('brandId');
  if (searchParams.get('cityId')) where.cityId = searchParams.get('cityId');
  if (searchParams.get('condition')) where.condition = searchParams.get('condition');

  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  if (priceMin || priceMax) {
    where.price = {};
    if (priceMin) (where.price as Record<string, number>).gte = parseInt(priceMin);
    if (priceMax) (where.price as Record<string, number>).lte = parseInt(priceMax);
  }

  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  try {
    const [parts, total] = await Promise.all([
      prisma.usedPart.findMany({
        where: where as any,
        orderBy: { [sortBy]: sortOrder },
        skip, take: limit,
        include: {
          user: { select: { id: true, name: true, dealerName: true, rating: true, ratingCount: true } },
          brand: { select: { id: true, nameAr: true, nameEn: true, logo: true } },
          city: { select: { id: true, nameAr: true, nameEn: true } },
        },
      }),
      prisma.usedPart.count({ where: where as any }),
    ]);

    return NextResponse.json({
      success: true,
      data: parts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: skip + parts.length < total },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'فشل تحميل القطع' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, error: 'يرجى تسجيل الدخول أولاً لنشر إعلان قطع غيار' }, { status: 401 });
  if (user.canPost === false) return NextResponse.json({ error: 'تم إيقاف النشر لحسابك' }, { status: 403 });

  try {
    const contentType = request.headers.get('content-type') || '';
    let data: Record<string, any> = {};
    let urls: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const uploadedFiles = formData.getAll('images') as File[];
      for (const [key, value] of formData.entries()) {
        if (key !== 'images') data[key] = value;
      }

      const saveFile = async (file: File) => {
        // Validates magic bytes + dimensions; throws Arabic error on bad files.
        // Let it throw: the outer catch returns 500 — convert to a clean 400.
        try {
          await validateUploadedImage(file);
        } catch (imgErr) {
          throw new Error(imgErr instanceof Error ? imgErr.message : 'ملف صورة غير صالح');
        }
        const bytes = await file.arrayBuffer();
        if (!bytes || bytes.byteLength === 0) return null;
        const buffer = Buffer.from(bytes);
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) return null;
        if (buffer.length > 10 * 1024 * 1024) return null;
        // Preferred: Cloudinary (persistent across deploys, CDN-served).
        // Local disk writes silently vanish on serverless hosts (Vercel).
        const hasCloudinary = !!(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
        if (hasCloudinary) {
          const { uploadImage } = await import('@/lib/media/cloudinary');
          const mime = file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
          const result = await uploadImage(`data:${mime};base64,${buffer.toString('base64')}`, {
            folder: 'jo-cars/parts',
          });
          return result.secure_url;
        }
        const filename = `part-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const dir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, filename), buffer);
        return `/uploads/${filename}`;
      };

      try {
        for (const img of uploadedFiles) {
          if (typeof img !== 'string') {
            const url = await saveFile(img);
            if (url) urls.push(url);
          }
        }
      } catch (imgErr) {
        return NextResponse.json({ success: false, error: imgErr instanceof Error ? imgErr.message : 'ملف صورة غير صالح' }, { status: 400 });
      }
    } else {
      data = await request.json();
      if (Array.isArray(data.images)) {
        urls = data.images;
      }
    }

    const price = parseFloat(data.price as string) || 0;
    const quantity = parseInt((data.quantity as string) || '1') || 1;
    const isNegotiable = data.isNegotiable === true || data.isNegotiable === 'true';
    const hasWarranty = data.hasWarranty === true || data.hasWarranty === 'true';
    const hasDelivery = data.hasDelivery === true || data.hasDelivery === 'true';
    const deliveryFee = data.deliveryFee ? parseFloat(data.deliveryFee as string) : null;

    if (!data.title || !data.partType || !price || !data.phone) {
      return NextResponse.json({ error: 'العنوان، النوع، السعر، والهاتف مطلوب' }, { status: 400 });
    }

    const slug = `part-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const bare = await prisma.usedPart.create({
      data: {
        title: sanitizePlainText(data.title as string),
        slug,
        description: data.description ? sanitizeHtml(data.description as string) : null,
        partType: data.partType as string,
        brandId: (data.brandId as string) || null,
        partNumber: (data.partNumber as string) || null,
        oemNumber: (data.oemNumber as string) || null,
        originCountry: (data.originCountry as string) || null,
        compatibleModels: Array.isArray(data.compatibleModels)
          ? JSON.stringify(data.compatibleModels)
          : (typeof data.compatibleModels === 'string' ? data.compatibleModels : '[]'),
        condition: (data.condition as string) || 'USED',
        price,
        currency: (data.currency as string) || 'JOD',
        quantity,
        phone: data.phone as string,
        whatsapp: (data.whatsapp as string) || null,
        cityId: (data.cityId as string) || null,
        isNegotiable,
        hasWarranty,
        warrantyPeriod: (data.warrantyPeriod as string) || null,
        hasDelivery,
        deliveryFee,
        status: 'PENDING',
        userId: user.id,
        images: JSON.stringify(urls),
        coverImage: urls[0] || null,
      },
    });

    const part = await prisma.usedPart.findUnique({
      where: { id: bare.id },
      include: {
        user: { select: { id: true, name: true, dealerName: true } },
        brand: { select: { id: true, nameAr: true, nameEn: true } },
        city: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    return NextResponse.json({ success: true, data: part }, { status: 201 });
  } catch (error) {
    console.error('Part create error:', error);
    return NextResponse.json({ success: false, error: 'فشل إضافة القطعة' }, { status: 500 });
  }
}
