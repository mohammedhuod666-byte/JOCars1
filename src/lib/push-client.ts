'use client';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function getPushStatus(): Promise<'unsupported' | 'denied' | 'off' | 'on'> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'denied') return 'denied';
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub ? 'on' : 'off';
  } catch {
    return 'off';
  }
}

export async function enablePush(token: string | null): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { ok: false, error: 'المتصفح لا يدعم الإشعارات' };
    }
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) return { ok: false, error: 'الإشعارات غير مفعلة على السيرفر' };

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, error: 'تم رفض إذن الإشعارات من المتصفح' };

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    });
    const json = sub.toJSON();

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }),
    });
    const d = await res.json();
    if (!d.success) {
      await sub.unsubscribe().catch(() => {});
      return { ok: false, error: d.error || 'فشل الحفظ' };
    }
    try { localStorage.setItem('jo-push-endpoint', json.endpoint || ''); } catch {}
    return { ok: true };
  } catch {
    return { ok: false, error: 'تعذر تفعيل الإشعارات' };
  }
}

export async function disablePush(token: string | null): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    const endpoint = sub?.endpoint || (() => { try { return localStorage.getItem('jo-push-endpoint') || ''; } catch { return ''; } })();
    if (sub) await sub.unsubscribe().catch(() => {});
    if (endpoint) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
    }
    try { localStorage.removeItem('jo-push-endpoint'); } catch {}
  } catch { /* ignore */ }
}
