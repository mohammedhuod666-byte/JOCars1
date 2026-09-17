import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit';
import { generateSlug } from '@/lib/utils';
import { generateRefCode } from '@/lib/generate-refcode';

interface BulkRow {
  brand?: string; model?: string; year?: number | string; price?: number | string;
  kilometers?: number | string; fuelType?: string; transmission?: string;
  phone?: string; city?: string; color?: string; description?: string;
  condition?: string; engineCapacity?: number | string;
}

const FUEL_TYPES = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUGIN_HYBRID'];
const MAX_ROWS = 50;

/**
 * POST /api/cars/bulk-import { cars: BulkRow[] }
 * Creates PENDING listings for dealers (names resolved to brand/model/city IDs).
 */
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();
  if (user.canPost === false) return errorResponse('تم إيقاف النشر لحسابك', 403);

  const rateLimit = checkRateLimit(`bulk-import:${user.id}`, { windowMs: 10 * 60 * 1000, maxRequests: 5 });
  if (!rateLimit.allowed) return errorResponse('حد الاستيراد: 5 عمليات كل 10 دقائق', 429);

  try {
    const body = await request.json();
    const rows: BulkRow[] = Array.isArray(body.cars) ? body.cars.slice(0, MAX_ROWS) : [];
    if (rows.length === 0) return errorResponse('لا توجد صفوف للاستيراد (الحد 50)', 400);

    const [brands, cities] = await Promise.all([
      prisma.brand.findMany({ select: { id: true, nameAr: true, nameEn: true } }),
      prisma.city.findMany({ select: { id: true, nameAr: true, nameEn: true } }),
    ]);
    const norm = (s: unknown) => String(s || '').trim().toLowerCase();
    const findBrand = (name: string) => brands.find(b => norm(b.nameAr) === norm(name) || norm(b.nameEn) === norm(name));
    const findCity = (name: string) => cities.find(c => norm(c.nameAr) === norm(name) || norm(c.nameEn) === norm(name));

    const created: string[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const brand = r.brand ? findBrand(r.brand) : null;
        if (!brand) throw new Error(`الماركة غير معروفة: ${r.brand || '—'}`);

        const model = r.model
          ? await prisma.carModel.findFirst({
              where: {
                brandId: brand.id,
                OR: [{ nameAr: r.model.trim() }, { nameEn: r.model.trim() }],
              },
              select: { id: true },
            })
          : null;
        if (!model) throw new Error(`الموديل غير معروف: ${r.model || '—'}`);

        const year = parseInt(String(r.year || ''), 10);
        if (!year || year < 1990 || year > 2030) throw new Error(`سنة غير صالحة: ${r.year || '—'}`);

        const price = parseFloat(String(r.price || ''));
        if (!price || price <= 0) throw new Error(`سعر غير صالح: ${r.price || '—'}`);

        const kilometers = Math.max(0, parseInt(String(r.kilometers ?? '0'), 10) || 0);
        const fuelType = String(r.fuelType || 'PETROL').toUpperCase();
        if (!FUEL_TYPES.includes(fuelType)) throw new Error(`نوع وقود غير صالح: ${r.fuelType}`);

        const city = r.city ? findCity(r.city) : null;
        if (!city) throw new Error(`المدينة غير معروفة: ${r.city || '—'}`);

        const phone = String(r.phone || user.phone || '').replace(/[^0-9+]/g, '');
        if (!phone) throw new Error('رقم الهاتف مطلوب');

        const refCode = await generateRefCode().catch(() => null);
        const uniq = `${Date.now().toString(36)}${i}${Math.random().toString(36).slice(2, 6)}`;
        const car = await prisma.car.create({
          data: {
            brandId: brand.id,
            modelId: model.id,
            year,
            price,
            kilometers,
            fuelType,
            transmission: 'AUTOMATIC',
            drivetrain: 'FWD',
            condition: 'GOOD',
            cityId: city.id,
            phone,
            color: String(r.color || ''),
            description: String(r.description || ''),
            engineCapacity: r.engineCapacity ? parseInt(String(r.engineCapacity), 10) || null : null,
            status: 'PENDING',
            userId: user.id,
            slug: `${generateSlug(brand.nameEn, r.model!.trim(), year, uniq)}`,
            refCode: refCode || undefined,
          },
          select: { id: true },
        });
        created.push(car.id);
      } catch (e: any) {
        errors.push({ row: i + 1, error: e?.message || 'خطأ غير معروف' });
      }
    }

    await createAuditLog({
      action: 'PUBLISH_CAR', actorId: user.id,
      entityType: 'CAR', entityId: `${created.length}-bulk`,
      description: `استيراد جماعي CSV: ${created.length} ناجح / ${errors.length} فاشل`,
    }).catch(() => {});

    return successResponse({ created: created.length, failed: errors.length, errors: errors.slice(0, 20) }, 201);
  } catch {
    return errorResponse('فشل الاستيراد الجماعي', 500);
  }
}
