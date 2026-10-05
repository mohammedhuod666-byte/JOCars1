'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_LABEL: Record<string, string> = {
  SPAM_LISTING: 'سبام إعلانات',
  SPAM_MESSAGE: 'سبام رسائل',
  BRUTE_FORCE: 'تخمين دخول',
  ABUSE_REPORTS: 'بلاغات ضده',
  ADMIN_PROBE: 'محاولة دخول الإدارة',
  ADMIN_PROBE_GUEST: 'طرق باب الإدارة (زائر)',
  HONEYPOT: 'مسار فخ',
  RATE_ABUSE: 'تجاوز معدل',
};

interface Stats {
  byType: { type: string; count: number; weight: number }[];
  bans24h: number;
  wouldBans24h: number;
}

export default function AdminSentinelPage() {
  const { user, isAuthenticated, _hydrated } = useAuth();
  const router = useRouter();
  const [signals, setSignals] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [mode, setMode] = useState<'monitor' | 'enforce'>('monitor');
  const [stopped, setStopped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '30' });
    if (typeFilter) params.set('type', typeFilter);
    try {
      const res = await fetch(`/api/admin/sentinel?${params.toString()}`, {
        headers: { Authorization: `Bearer ${useAuth.getState().token}` },
      });
      const d = await res.json();
      if (d.success) {
        setSignals(d.data.signals || []);
        setStats(d.data.stats || null);
        setMode(d.data.mode || 'monitor');
        setStopped(!!d.data.stopped);
        setTotal(d.data.total || 0);
        setTotalPages(d.data.totalPages || 1);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, typeFilter]);

  useEffect(() => {
    if (_hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) { router.push('/'); return; }
    if (_hydrated && isAuthenticated && user?.role === 'ADMIN') load();
  }, [_hydrated, isAuthenticated, user, router, load]);

  const setModeApi = async (body: Record<string, unknown>, msg: string) => {
    if (!confirm(msg + '\nهل أنت متأكد؟')) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/sentinel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAuth.getState().token}` },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) {
        setMode(d.data.mode);
        setStopped(d.data.stopped);
        toast.success('تم الحفظ');
      } else {
        toast.error(d?.error || 'فشل الحفظ');
      }
    } catch {
      toast.error('تعذر الاتصال');
    } finally {
      setSaving(false);
    }
  };

  if (_hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الحارس الأمني (Sentinel)</h1>
          <p className="text-sm text-gray-500">مراقبة تلقائية للسلوك المشبوه — الوضع الحالي: {stopped ? 'موقوف طوارئ' : mode === 'monitor' ? 'مراقبة (بدون حظر)' : 'تفعيل (حظر تلقائي)'}</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card p-4">
            <p className="text-xs text-gray-400">حظر تلقائي (24h)</p>
            <p className="text-2xl font-black text-red-500">{stats.bans24h}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400">كان سيُحظر (مراقبة)</p>
            <p className="text-2xl font-black text-amber-500">{stats.wouldBans24h}</p>
          </div>
          {(stats.byType || []).slice(0, 2).map(b => (
            <div key={b.type} className="card p-4">
              <p className="text-xs text-gray-400">{TYPE_LABEL[b.type] || b.type}</p>
              <p className="text-2xl font-black text-gray-700 dark:text-gray-200">{b.count}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card p-4 mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200 ml-2">التحكم:</span>
        <button disabled={saving} onClick={() => setModeApi({ mode: 'monitor' }, 'التحول لوضع المراقبة (تسجيل بدون حظر)؟')}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${mode === 'monitor' && !stopped ? 'bg-blue-500 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-500'}`}>
          مراقبة
        </button>
        <button disabled={saving} onClick={() => setModeApi({ mode: 'enforce' }, 'التحول لوضع التفعيل (حظر تلقائي حقيقي)؟')}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${mode === 'enforce' && !stopped ? 'bg-red-500 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-500'}`}>
          تفعيل الحظر
        </button>
        <button disabled={saving} onClick={() => setModeApi({ stopped: !stopped }, stopped ? 'إعادة تشغيل الحارس؟' : 'إيقاف طوارئ: يوقف كل الحظر التلقائي فوراً؟')}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${stopped ? 'bg-green-500 text-white' : 'bg-gray-800 text-white dark:bg-gray-700'}`}>
          {stopped ? 'إعادة التشغيل' : 'إيقاف طوارئ'}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-2 text-sm outline-none">
          <option value="">كل الأنواع</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="text-xs text-gray-400">إجمالي الإشارات: {total}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
      ) : signals.length === 0 ? (
        <div className="text-center py-16"><ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">لا إشارات — الوضع هادئ</p></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">النوع</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">المستخدم</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">التفاصيل</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">IP</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">الوزن</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {signals.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.type === 'ADMIN_PROBE' ? 'bg-red-100 dark:bg-red-500/10 text-red-600' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600'}`}>
                        {TYPE_LABEL[s.type] || s.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      {s.user ? (
                        <Link href="/admin/users" className="text-blue-500 hover:underline">{s.user.name}</Link>
                      ) : <span className="text-gray-400">زائر</span>}
                      {s.user?.banStatus && <span className="mr-2 text-xs text-red-500">(محظور)</span>}
                    </td>
                    <td className="p-4 text-xs text-gray-500 max-w-[250px] truncate" title={s.detail || ''}>{s.detail || '—'}</td>
                    <td className="p-4 text-xs text-gray-400 dir-ltr">{s.ip || '—'}</td>
                    <td className="p-4 text-sm font-bold text-gray-600 dark:text-gray-300">{s.weight}</td>
                    <td className="p-4 text-xs text-gray-400">{new Date(s.createdAt).toLocaleString('ar-JO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40">السابق</button>
          <span className="text-sm text-gray-500">صفحة {page} من {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40">التالي</button>
        </div>
      )}

      <div className="card p-4 mt-6 text-xs text-gray-500 leading-7">
        <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">قواعد الحارس:</p>
        <p>• مجموع 30+ نقطة/24h ← حظر مؤقت 24 ساعة (دائم عند التكرار أو 60+).</p>
        <p>• دخول غير-مدير على /admin* ← حظر فوري 7 أيام (يعمل دائماً).</p>
        <p>• الأوزان: سبام إعلانات 8، سبام رسائل 5، تخمين دخول 15، بلاغات 20، فخ 15.</p>
        <p>• المدراء لا يُحظرون تلقائياً أبداً. كل إجراء مسجل بالتدقيق + واتساب.</p>
      </div>
    </div>
  );
}
