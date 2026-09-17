import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse } from '@/lib/api';
import { AI_MODELS, DEFAULT_MODEL } from '@/ai/nvidia-client';
import { isPushConfigured } from '@/lib/push';
import { isWhatsAppConfigured } from '@/lib/whatsapp';
import { isEmailConfigured } from '@/lib/backup';

let cache: { at: number; data: unknown } | null = null;
const CACHE_TTL = 60 * 1000;

/** Public system status (no secrets exposed) — cached 60s. */
export async function GET(_request: NextRequest) {
  try {
    if (cache && Date.now() - cache.at < CACHE_TTL) {
      return successResponse({ ...(cache.data as object), cached: true });
    }

    const started = Date.now();
    const dbStart = Date.now();
    let dbOk = false;
    let dbMs = 0;
    try {
      await prisma.user.count();
      dbOk = true;
      dbMs = Date.now() - dbStart;
    } catch { /* db down */ }

    let lastBackup: { name: string; status: string; createdAt: Date; size: number } | null = null;
    try {
      lastBackup = await prisma.backup.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { name: true, status: true, createdAt: true, size: true },
      });
    } catch { /* table may not exist yet */ }

    const data = {
      status: dbOk ? 'operational' : 'degraded',
      uptimeSec: Math.round(process.uptime()),
      responseMs: Date.now() - started,
      services: {
        database: { ok: dbOk, latencyMs: dbMs },
        ai: {
          ok: Boolean(process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY),
          model: AI_MODELS[DEFAULT_MODEL]?.model || DEFAULT_MODEL,
          failovers: Object.keys(AI_MODELS).length,
          note: 'نماذج NVIDIA الحية مع محرك عربي احتياطي',
        },
        backups: {
          auto: Boolean(process.env.BACKUP_CRON_SECRET),
          every: '5 ساعات + يومي للأخبار + أسبوعي للتقارير',
          last: lastBackup,
        },
        push: { ok: isPushConfigured(), note: 'إشعارات المتصفح' },
        whatsapp: { ok: isWhatsAppConfigured(), note: 'رموز الدخول والتنبيهات' },
        email: { ok: isEmailConfigured(), note: 'إرسال النسخ الاحتياطية' },
      },
      updatedAt: new Date().toISOString(),
    };

    cache = { at: Date.now(), data };
    return successResponse({ ...data, cached: false });
  } catch {
    return successResponse({ status: 'degraded', services: {}, updatedAt: new Date().toISOString() });
  }
}
