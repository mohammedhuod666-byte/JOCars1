import webpush from 'web-push';
import prisma from './prisma';

let configured = false;

function ensureConfig(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const prv = process.env.VAPID_PRIVATE_KEY || '';
  if (!pub || !prv) return false;
  if (!configured) {
    try {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:info@jocars.com',
        pub,
        prv,
      );
      configured = true;
    } catch {
      return false;
    }
  }
  return true;
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Send a push notification to all of a user's subscribed browsers (best-effort). */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!ensureConfig()) return 0;
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    let sent = 0;
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as any,
          JSON.stringify({ title: payload.title, body: payload.body, url: payload.url || '/' }),
        );
        sent++;
      } catch (err: any) {
        // 410 Gone = subscription expired → clean it up
        if (err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }));
    return sent;
  } catch {
    return 0;
  }
}
