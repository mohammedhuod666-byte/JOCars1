'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { getPushStatus, enablePush, disablePush } from '@/lib/push-client';

/** Toggle button for browser push notifications (price drops, new matches). */
export function PushBell({ className = '' }: { className?: string }) {
  const { isAuthenticated, token } = useAuth();
  const [status, setStatus] = useState<'loading' | 'unsupported' | 'denied' | 'off' | 'on'>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushStatus().then(setStatus);
  }, []);

  const toggle = async () => {
    if (!isAuthenticated) {
      toast.error('سجل الدخول أولاً لتفعيل الإشعارات');
      return;
    }
    setBusy(true);
    if (status === 'on') {
      await disablePush(token);
      setStatus('off');
      toast.success('تم إيقاف إشعارات المتصفح');
    } else {
      const r = await enablePush(token);
      if (r.ok) {
        setStatus('on');
        toast.success('تم تفعيل الإشعارات! ستصلك تنبيهات انخفاض الأسعار');
      } else {
        toast.error(r.error || 'فشل التفعيل');
        const s = await getPushStatus();
        setStatus(s);
      }
    }
    setBusy(false);
  };

  if (status === 'loading') {
    return (
      <button disabled className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-400 ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> ...
      </button>
    );
  }

  if (status === 'unsupported' || status === 'denied') {
    return (
      <span title={status === 'denied' ? 'الإشعارات مرفوضة من إعدادات المتصفح' : 'متصفحك لا يدعم الإشعارات'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-400 ${className}`}>
        <BellOff className="w-3.5 h-3.5" /> الإشعارات غير متاحة
      </span>
    );
  }

  const on = status === 'on';
  return (
    <button onClick={toggle} disabled={busy}
      title={on ? 'إيقاف إشعارات المتصفح' : 'تفعيل إشعارات انخفاض الأسعار'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
        on
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
      } ${className}`}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
      {on ? 'الإشعارات مفعّلة ' : 'فعّل إشعارات الأسعار'}
    </button>
  );
}
