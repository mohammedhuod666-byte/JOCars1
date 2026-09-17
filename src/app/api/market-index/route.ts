import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';
import { chatCompletion } from '@/ai/nvidia-client';

let outlookCache: { text: string; at: number } | null = null;
const OUTLOOK_TTL = 24 * 60 * 60 * 1000;

export async function GET(_request: NextRequest) {
  try {
    const [brandGroups, fuelGroups, recent] = await Promise.all([
      prisma.car.groupBy({
        by: ['brandId'],
        where: { status: 'APPROVED', deletedAt: null },
        _count: { _all: true },
        _avg: { price: true },
        orderBy: { _count: { brandId: 'desc' } },
        take: 12,
      }).catch(() => [] as any[]),
      prisma.car.groupBy({
        by: ['fuelType'],
        where: { status: 'APPROVED', deletedAt: null },
        _count: { _all: true },
        _avg: { price: true },
      }).catch(() => [] as any[]),
      prisma.car.findMany({
        where: { status: 'APPROVED', deletedAt: null },
        select: { price: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3000,
      }).catch(() => [] as any[]),
    ]);

    const brandIds = brandGroups.map((g: any) => g.brandId);
    const brands = brandIds.length
      ? await prisma.brand.findMany({ where: { id: { in: brandIds } }, select: { id: true, nameAr: true, nameEn: true } }).catch(() => [])
      : [];
    const brandName = (id: string) => brands.find((b) => b.id === id);

    const brandStats = brandGroups.map((g: any) => ({
      brandId: g.brandId,
      nameAr: brandName(g.brandId)?.nameAr || '',
      nameEn: brandName(g.brandId)?.nameEn || '',
      count: g._count._all,
      avgPrice: Math.round(g._avg.price || 0),
    }));

    // Monthly trend (last 6 months)
    const buckets = new Map<string, { total: number; count: number }>();
    for (const c of recent as any[]) {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const b = buckets.get(key) || { total: 0, count: 0 };
      b.total += c.price || 0;
      b.count++;
      buckets.set(key, b);
    }
    const trend = [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, b]) => ({ month, avgPrice: b.count ? Math.round(b.total / b.count) : 0, count: b.count }));

    const totalListings = brandGroups.reduce((a: number, g: any) => a + g._count._all, 0);

    // AI outlook (cached 24h)
    let outlook = outlookCache && Date.now() - outlookCache.at < OUTLOOK_TTL ? outlookCache.text : null;
    if (!outlook) {
      try {
        const summary = `السوق الأردني: ${totalListings} إعلان. أبرز الماركات: ${brandStats.slice(0, 5).map((b) => `${b.nameAr} (${b.count} بمتوسط ${b.avgPrice})`).join('، ')}. الوقود: ${(fuelGroups as any[]).map((f) => `${f.fuelType} (${f._count._all})`).join('، ')}.`;
        const text = await Promise.race([
          chatCompletion([
            { role: 'system', content: 'أنت محلل سوق سيارات أردني. اكتب توقعاً مختصراً (3-4 أسطر) بالعربية حول اتجاه الأسعار والطلب.' },
            { role: 'user', content: summary },
          ], { maxTokens: 400, timeoutMs: 15000, retries: 0 }),
          new Promise<string>((resolve) => setTimeout(() => resolve(''), 16000)),
        ]);
        if (text && text.trim()) {
          outlook = text.trim();
          outlookCache = { text: outlook, at: Date.now() };
        }
      } catch { /* outlook optional */ }
    }

    return successResponse({
      brandStats,
      fuelMix: (fuelGroups as any[]).map((f) => ({ fuelType: f.fuelType, count: f._count._all, avgPrice: Math.round(f._avg.price || 0) })),
      trend,
      totalListings,
      outlook,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return errorResponse('فشل تحميل مؤشر السوق', 500);
  }
}
