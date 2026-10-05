import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { createAuditLog } from '@/lib/audit';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: 'default',
          siteName: 'JO Cars',
          siteNameAr: 'سوق السيارات',
          metaDescription: 'أكبر سوق لبيع وشراء السيارات في الأردن',
          metaKeywords: 'سيارات,بيع,شراء,الأردن',
          contactEmail: 'admin@jocars.com',
          contactPhone: '0790000000',
          fuelTypes: '["PETROL","DIESEL","HYBRID","ELECTRIC","PLUGIN_HYBRID"]',
          bodyTypes: '["SUV","SEDAN","HATCHBACK","COUPE","CONVERTIBLE","WAGON","PICKUP","VAN","MINIVAN","CROSSOVER","SPORTS","LUXURY"]',
        },
      });
    }

    const user = await authenticateRequest(request);
    if (!user || user.role !== 'ADMIN') {
      const publicFields = {
        siteName: settings.siteName,
        siteNameAr: settings.siteNameAr,
        logo: settings.logo,
        logoDark: settings.logoDark,
        favicon: settings.favicon,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        accentColor: settings.accentColor,
        currency: settings.currency,
        currencyAr: settings.currencyAr,
        maintenance: settings.maintenance,
        maintenanceMessage: settings.maintenanceMessage,
        homeHeroTitle: settings.homeHeroTitle,
        homeHeroSubtitle: settings.homeHeroSubtitle,
        homeShowFeatured: settings.homeShowFeatured,
        homeShowCities: settings.homeShowCities,
        homeShowBrands: settings.homeShowBrands,
        homeShowStats: settings.homeShowStats,
      };
      return successResponse(publicFields);
    }

    return successResponse(settings);
  } catch {
    return errorResponse('فشل تحميل الإعدادات', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const data: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      if (key === 'logo' || key === 'logoDark' || key === 'favicon') {
        if (value instanceof File && value.size > 0) {
          const ext = value.name.split('.').pop() || 'png';
          const bytes = await value.arrayBuffer();
          // Preferred: Cloudinary — local disk writes vanish on serverless hosts.
          const hasCloudinary = !!(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
          if (hasCloudinary) {
            const { uploadImage } = await import('@/lib/cloudinary');
            const mime = value.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            const result = await uploadImage(`data:${mime};base64,${Buffer.from(bytes).toString('base64')}`, {
              folder: 'jo-cars/settings',
              publicId: key,
            });
            data[key] = result.secure_url;
          } else {
            const filename = `${key}-${Date.now()}.${ext}`;
            const dir = path.join(process.cwd(), 'public', 'uploads', 'settings');
            await mkdir(dir, { recursive: true });
            await writeFile(path.join(dir, filename), Buffer.from(bytes));
            data[key] = `/uploads/settings/${filename}`;
          }
        }
      } else if (key === 'taxPercent') {
        data[key] = parseFloat(value as string) || 0;
      } else if (key === 'maintenance') {
        data[key] = value === 'true';
      } else if (key === 'homeShowFeatured' || key === 'homeShowCities' || key === 'homeShowBrands' || key === 'homeShowStats') {
        data[key] = value === 'true';
      } else if (value !== 'undefined' && value !== 'null') {
        data[key] = value;
      }
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data } as any,
    });

    await createAuditLog({
      action: 'UPDATE_SITE_SETTINGS', actorId: user.id,
      entityType: 'SiteSettings', entityId: 'default',
      description: 'تحديث إعدادات الموقع',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return successResponse(settings);
  } catch (error) {
    console.error('Settings update error:', error);
    return errorResponse('فشل تحديث الإعدادات', 500);
  }
}
