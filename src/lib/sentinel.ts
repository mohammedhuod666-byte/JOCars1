import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { sendWhatsAppToAdmins, isWhatsAppConfigured } from '@/lib/whatsapp';

// ── Sentinel: automatic protection monitor ──
// Weighted signals per user over a rolling 24h window:
//   sum >= 30 → 24h temporary ban (escalates to permanent on repeat)
//   sum >= 60 → permanent ban
// In "monitor" mode nothing is enforced — crossings only notify.
// ADMIN_PROBE (logged-in non-admin touching /admin*) always enforces a
// 7-day ban immediately, unless the emergency stop is on.

export const SIGNAL_WEIGHTS = {
  SPAM_LISTING: 8,   // each listing beyond 5/hour
  SPAM_MESSAGE: 5,   // each message beyond 10/5min
  BRUTE_FORCE: 15,   // at 5 failed logins (+25 at 10)
  ABUSE_REPORTS: 20, // 3rd pending report on their listings (+40 at 5th)
  ADMIN_PROBE: 100,  // instant-ban weight
  ADMIN_PROBE_GUEST: 1, // unauthenticated /admin hit: forensics only, never bans
  HONEYPOT: 15,      // hitting /wp-admin, /.env, /.git, ...
  RATE_ABUSE: 5,
} as const;

export type SignalType = keyof typeof SIGNAL_WEIGHTS;

const TEMP_THRESHOLD = 30;
const PERM_THRESHOLD = 60;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const TEMP_BAN_MS = 24 * 60 * 60 * 1000;
const PROBE_BAN_MS = 7 * 24 * 60 * 60 * 1000;

interface ModeState {
  mode: 'monitor' | 'enforce';
  stopped: boolean;
  at: number;
}
let modeCache: ModeState | null = null;

export async function getSentinelMode(): Promise<{ mode: 'monitor' | 'enforce'; stopped: boolean }> {
  if (modeCache && Date.now() - modeCache.at < 60000) {
    return { mode: modeCache.mode, stopped: modeCache.stopped };
  }
  try {
    const s = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
      select: { sentinelMode: true, sentinelStopped: true },
    });
    modeCache = {
      mode: s?.sentinelMode === 'enforce' ? 'enforce' : 'monitor',
      stopped: s?.sentinelStopped ?? false,
      at: Date.now(),
    };
  } catch {
    modeCache = { mode: 'monitor', stopped: false, at: Date.now() };
  }
  return { mode: modeCache.mode, stopped: modeCache.stopped };
}

export function invalidateSentinelModeCache() {
  modeCache = null;
}

async function notifyAdmins(message: string) {
  try {
    if (isWhatsAppConfigured()) await sendWhatsAppToAdmins(message);
  } catch { /* notify best-effort */ }
}

export interface RecordSignalInput {
  userId?: string | null;
  ip?: string | null;
  type: SignalType;
  weight?: number;
  detail?: string | null;
}

export async function recordSignal(input: RecordSignalInput): Promise<void> {
  try {
    await prisma.securitySignal.create({
      data: {
        userId: input.userId || null,
        ip: input.ip || null,
        type: input.type,
        weight: input.weight ?? SIGNAL_WEIGHTS[input.type] ?? 1,
        detail: input.detail || null,
      },
    });
  } catch {
    return; // monitoring must never break the request
  }
  if (input.userId) {
    evaluateUser(input.userId).catch(() => {});
  }
}

async function sumWeights(userId: string): Promise<number> {
  try {
    const agg = await prisma.securitySignal.aggregate({
      where: { userId, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } },
      _sum: { weight: true },
    });
    return agg._sum.weight || 0;
  } catch {
    return 0;
  }
}

async function priorAutoBans(userId: string): Promise<number> {
  try {
    return await prisma.auditLog.count({
      where: {
        entityType: 'USER',
        entityId: userId,
        action: { in: ['SENTINEL_BAN', 'SENTINEL_PROBE_BAN'] },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
  } catch {
    return 0;
  }
}

async function applyBan(
  userId: string,
  opts: { permanent: boolean; until: Date; reason: string; auditAction: string },
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true } });
  if (!user || user.role === 'ADMIN') return; // never auto-ban admins
  await prisma.user.update({
    where: { id: userId },
    data: {
      banStatus: opts.permanent ? 'PERMANENT' : 'TEMPORARY',
      banReason: opts.reason,
      banUntil: opts.permanent ? null : opts.until,
      isActive: false,
    },
  });
  await createAuditLog({
    action: opts.auditAction, actorId: userId,
    entityType: 'USER', entityId: userId,
    description: `حظر تلقائي (Sentinel): ${user.name} — ${opts.reason}`,
    newValue: opts.permanent ? 'PERMANENT' : 'TEMPORARY',
  }).catch(() => {});
  await notifyAdmins(
    `🛡️ *Sentinel — حظر تلقائي ${opts.permanent ? 'دائم' : 'مؤقت'}*\n\n` +
    `المستخدم: ${user.name} (${userId})\n` +
    `السبب: ${opts.reason}\n` +
    (opts.permanent ? `المدة: دائم` : `حتى: ${opts.until.toLocaleString('ar-JO')}`) +
    `\nلفك الحظر: لوحة الإدارة ← المستخدمون`,
  );
}

async function evaluateUser(userId: string): Promise<void> {
  const { mode, stopped } = await getSentinelMode();
  if (stopped) return;
  // Already banned (auto or manual) → don't re-ban or re-notify on every
  // subsequent signal; the existing ban stands.
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { banStatus: true, banUntil: true },
  }).catch(() => null);
  if (current?.banStatus && (!current.banUntil || new Date(current.banUntil) > new Date())) return;
  const total = await sumWeights(userId);
  if (total < TEMP_THRESHOLD) return;

  const repeat = await priorAutoBans(userId);
  const permanent = total >= PERM_THRESHOLD || repeat > 0;

  if (mode === 'monitor') {
    // Monitor mode: notify once per day that this user WOULD have been banned.
    const dayAgo = new Date(Date.now() - WINDOW_MS);
    const already = await prisma.auditLog.count({
      where: { entityType: 'USER', entityId: userId, action: 'SENTINEL_WOULD_BAN', createdAt: { gte: dayAgo } },
    }).catch(() => 1);
    if (already > 0) return;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }).catch(() => null);
    await createAuditLog({
      action: 'SENTINEL_WOULD_BAN', actorId: userId,
      entityType: 'USER', entityId: userId,
      description: `وضع المراقبة: ${user?.name || userId} تجاوز العتبة (مجموع ${total}) — كان سيُحظر ${permanent ? 'دائماً' : 'مؤقتاً 24h'}`,
      newValue: String(total),
    }).catch(() => {});
    await notifyAdmins(
      `👁️ *Sentinel (مراقبة): تجاوز عتبة*\n\nالمستخدم: ${user?.name || userId}\nمجموع النقاط: ${total}\nالإجراء لو كان التفعيل يعمل: حظر ${permanent ? 'دائم' : 'مؤقت 24 ساعة'}\nراجع: لوحة الإدارة ← سجل الحماية`,
    );
    return;
  }

  // Enforce mode.
  await applyBan(userId, {
    permanent,
    until: new Date(Date.now() + TEMP_BAN_MS),
    reason: permanent
      ? `سلوك مشبوه متكرر (مجموع نقاط المراقبة ${total} خلال 24 ساعة)`
      : `نشاط مشبوه (مجموع نقاط المراقبة ${total} خلال 24 ساعة) — حظر تلقائي 24 ساعة`,
    auditAction: 'SENTINEL_BAN',
  });
}

/** Message-burst check: more than 10 messages / 5 min is spam behavior. */
export async function trackMessageSent(userId: string): Promise<void> {
  try {
    const n = await prisma.message.count({
      where: { senderId: userId, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
    });
    if (n > 10) {
      await recordSignal({ userId, type: 'SPAM_MESSAGE', detail: `${n} رسائل خلال 5 دقائق` });
    }
  } catch { /* monitoring must never break the request */ }
}

/** Non-admin touching /admin* — immediate 7-day ban (explicit standing order). */
export async function enforceProbeBan(userId: string, userName: string, path: string, ip?: string | null): Promise<void> {
  try {
    const { stopped } = await getSentinelMode();
    await prisma.securitySignal.create({
      data: { userId, ip: ip || null, type: 'ADMIN_PROBE', weight: SIGNAL_WEIGHTS.ADMIN_PROBE, detail: `محاولة دخول: ${path}` },
    }).catch(() => {});
    if (stopped) return;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user || user.role === 'ADMIN') return;
    // Already banned → log the signal only (no re-ban, no WhatsApp flood).
    const ban = await prisma.user.findUnique({ where: { id: userId }, select: { banStatus: true, banUntil: true } }).catch(() => null);
    if (ban?.banStatus && (!ban.banUntil || new Date(ban.banUntil) > new Date())) return;
    const until = new Date(Date.now() + PROBE_BAN_MS);
    await prisma.user.update({
      where: { id: userId },
      data: {
        banStatus: 'TEMPORARY',
        banReason: `محاولة دخول غير مصرح لصفحة الإدارة (${path}) — حظر تلقائي 7 أيام`,
        banUntil: until,
        isActive: false,
      },
    });
    await createAuditLog({
      action: 'SENTINEL_PROBE_BAN', actorId: userId,
      entityType: 'USER', entityId: userId,
      description: `حظر تلقائي 7 أيام: ${userName} حاول دخول ${path}`,
      newValue: 'TEMPORARY_7D',
      ip: ip || undefined,
    }).catch(() => {});
    await notifyAdmins(
      `🚨 *Sentinel — محاولة اختراق لوحة الإدارة*\n\nالمستخدم: ${userName} (${userId})\nالمسار: ${path}\nIP: ${ip || 'غير معروف'}\nالإجراء: حظر تلقائي 7 أيام`,
    );
  } catch { /* never break the request */ }
}
