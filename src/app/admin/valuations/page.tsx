'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { BarChart3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'requests', label: 'عمليات التقييم' },
  { id: 'listings', label: 'البيانات المستوردة' },
  { id: 'revalue', label: 'إعادة التقييم' },
  { id: 'errors', label: 'الأخطاء' },
  { id: 'dubious', label: 'المشكوك فيها' },
  { id: 'perf', label: 'أداء النموذج' },
  { id: 'config', label: 'الإعدادات' },
];

export default function AdminValuationsPage() {
  const { user, isAuthenticated, _hydrated } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState({ minIncluded: 2, dailyQuota: 5, staleDays: 60, simWeights: '' });
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ brand: '', model: '', year: '', kilometers: '', price: '', city: '', url: '' });
  const [manualSaving, setManualSaving] = useState(false);
  const [fleet, setFleet] = useState<any>(null);
  const [fleetPage, setFleetPage] = useState(1);
  const [revaluing, setRevaluing] = useState(false);
  const [revalueLog, setRevalueLog] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'revalue') {
        const res = await fetch(`/api/admin/valuations/revalue?page=${fleetPage}`, {
          headers: { Authorization: `Bearer ${useAuth.getState().token}` },
        });
        const d = await res.json();
        if (d.success) setFleet(d.data);
      } else {
        const res = await fetch(`/api/admin/valuations?view=${tab}&page=${page}&limit=20`, {
          headers: { Authorization: `Bearer ${useAuth.getState().token}` },
        });
        const d = await res.json();
        if (d.success) {
          setData(d.data);
          if (tab === 'config' && d.data?.stored) {
            setCfg({
              minIncluded: d.data.stored.minIncluded ?? 2,
              dailyQuota: d.data.stored.dailyQuota ?? 5,
              staleDays: d.data.stored.staleDays ?? 60,
              simWeights: d.data.stored.simWeights || '',
            });
          }
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [tab, page, fleetPage]);

  const revaluePage = async () => {
    if (!fleet?.cars?.length || revaluing) return;
    if (!confirm(`إعادة تقييم ${fleet.cars.length} سيارة بهذه الصفحة؟ (قد يستغرق دقائق)`)) return;
    setRevaluing(true);
    setRevalueLog([]);
    // Batches of 5 with progress + failure isolation per car.
    const ids: string[] = fleet.cars.map((c: any) => c.id);
    for (let i = 0; i < ids.length; i += 5) {
      const batch = ids.slice(i, i + 5);
      try {
        const res = await fetch('/api/admin/valuations/revalue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAuth.getState().token}` },
          body: JSON.stringify({ carIds: batch }),
        });
        const d = await res.json().catch(() => null);
        const ok = d?.data?.results?.filter((r: any) => r.status === 'DONE').length || 0;
        setRevalueLog((prev) => [...prev, `الدفعة ${i / 5 + 1}: ${ok}/${batch.length} نجح`]);
      } catch {
        setRevalueLog((prev) => [...prev, `الدفعة ${i / 5 + 1}: فشل الاتصال`]);
      }
    }
    setRevaluing(false);
    load();
  };

  useEffect(() => {
    if (_hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) { router.push('/'); return; }
    if (_hydrated && isAuthenticated && user?.role === 'ADMIN') load();
  }, [_hydrated, isAuthenticated, user, router, load]);

  const saveManual = async () => {
    if (!manual.brand.trim() || !manual.model.trim() || !manual.year || !manual.kilometers || !manual.price) {
      toast.error('الماركة والموديل والسنة والممشى والسعر مطلوبة');
      return;
    }
    setManualSaving(true);
    try {
      const res = await fetch('/api/admin/valuations/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAuth.getState().token}` },
        body: JSON.stringify({
          brand: manual.brand.trim(), model: manual.model.trim(),
          year: Number(manual.year), kilometers: Number(manual.kilometers),
          price: Number(manual.price), city: manual.city.trim() || undefined,
          url: manual.url.trim() || undefined,
        }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) {
        toast.success('تمت إضافة المقارنة اليدوية');
        setManual({ brand: '', model: '', year: '', kilometers: '', price: '', city: '', url: '' });
        setShowManual(false);
        load();
      } else {
        toast.error(d?.error || 'فشل الحفظ');
      }
    } catch {
      toast.error('تعذر الاتصال');
    } finally {
      setManualSaving(false);
    }
  };

  const saveConfig = async () => {    setSaving(true);
    try {
      let weights: Record<string, number> | undefined;
      if (cfg.simWeights.trim()) {
        try {
          weights = JSON.parse(cfg.simWeights);
        } catch {
          toast.error('أوزان التشابه ليست JSON صالحاً');
          setSaving(false);
          return;
        }
      }
      const res = await fetch('/api/admin/valuations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAuth.getState().token}` },
        body: JSON.stringify({
          minIncluded: Number(cfg.minIncluded),
          dailyQuota: Number(cfg.dailyQuota),
          staleDays: Number(cfg.staleDays),
          ...(weights ? { simWeights: weights } : {}),
        }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) toast.success('تم حفظ الإعدادات');
      else toast.error(d?.error || 'فشل الحفظ');
    } catch {
      toast.error('تعذر الاتصال');
    } finally {
      setSaving(false);
    }
  };

  if (_hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) return null;

  const rows = data?.rows || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">محرك التقييم (Valuation Engine)</h1>
          <p className="text-sm text-gray-500">مراقبة كاملة بدل الصندوق الأسود — كل رقم قابل للتتبع</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border ${tab === t.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'listings' && (
        <div className="card p-4 mb-4">
          <button onClick={() => setShowManual(v => !v)} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold">
            {showManual ? 'إغلاق' : '+ إضافة مقارنة يدوية موثقة'}
          </button>
          {showManual && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              {([
                ['brand', 'الماركة *'], ['model', 'الموديل *'], ['year', 'السنة *'], ['kilometers', 'الممشى *'],
                ['price', 'السعر (د.أ) *'], ['city', 'المدينة'], ['url', 'رابط الإعلان'],
              ] as const).map(([k, label]) => (
                <input key={k} value={(manual as any)[k]} onChange={(e) => setManual({ ...manual, [k]: e.target.value })}
                  placeholder={label} dir={k === 'url' ? 'ltr' : undefined}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-2 text-sm outline-none" />
              ))}
              <button onClick={saveManual} disabled={manualSaving} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-50 col-span-2 md:col-span-1">
                {manualSaving ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : tab === 'revalue' ? (
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <p className="text-sm text-gray-500 ml-auto">إجمالي المعتمدة: {fleet?.total || 0} — دفعات من 5 سيارات (متسلسل، مع عزل الفشل وإعادة المحاولة بالصفحة التالية)</p>
            <button onClick={revaluePage} disabled={revaluing || !fleet?.cars?.length}
              className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold disabled:opacity-50">
              {revaluing ? 'جارٍ التقييم...' : 'إعادة تقييم هذه الصفحة'}
            </button>
            <button disabled={fleetPage <= 1} onClick={() => setFleetPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 rounded-xl border text-sm disabled:opacity-40">السابق</button>
            <button onClick={() => setFleetPage((p) => p + 1)}
              className="px-3 py-2 rounded-xl border text-sm">التالي</button>
          </div>
          {revalueLog.length > 0 && (
            <div className="mb-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs space-y-1">
              {revalueLog.map((l, i) => <p key={i}>{l}</p>)}
            </div>
          )}
          <div className="space-y-2">
            {(fleet?.cars || []).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs">
                <span className="font-bold">{c.title} — {Number(c.price).toLocaleString()} د.أ</span>
                <span className="text-gray-400">
                  {c.lastValuation
                    ? `آخر تقييم: ${c.lastValuation.estimated?.toLocaleString() || c.lastValuation.status} (${new Date(c.lastValuation.at).toLocaleDateString('ar-JO')})`
                    : 'بلا تقييم'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : tab === 'perf' && data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card p-4"><p className="text-xs text-gray-400">كل الطلبات</p><p className="text-2xl font-black">{data.totalReq}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-400">مكتملة</p><p className="text-2xl font-black text-emerald-500">{data.doneReq}</p></div>
          <div className="card p-4"><p className="text-xs text-gray-400">متوسط الثقة</p><p className="text-2xl font-black text-blue-500">{data.avgConfidence}%</p></div>
          <div className="card p-4"><p className="text-xs text-gray-400">متوسط العينة</p><p className="text-2xl font-black">{data.avgComparables}</p></div>
          <div className="card p-4 col-span-2 md:col-span-4">
            <p className="text-xs text-gray-400 mb-2">آخر 14 يوماً (عدد / متوسط ثقة)</p>
            <div className="space-y-1">
              {(data.byDay || []).map((d: any) => (
                <div key={d.day} className="flex items-center gap-2 text-xs">
                  <span className="w-24 text-gray-400 dir-ltr">{d.day}</span>
                  <div className="h-3 rounded bg-blue-500/70" style={{ width: `${Math.min(100, d.count * 10)}%` }} />
                  <span className="text-gray-500">{d.count} • {d.avgConfidence ?? '—'}%</span>
                </div>
              ))}
              {(data.byDay || []).length === 0 && <p className="text-xs text-gray-400">لا بيانات بعد</p>}
            </div>
          </div>
        </div>
      ) : tab === 'config' && data ? (
        <div className="card p-6 max-w-2xl space-y-4">
          <p className="text-sm text-gray-500">الأوزان الحالية الفعالة: <span className="dir-ltr">{JSON.stringify((data.effective || {}).simWeights || {})}</span></p>
          {(['minIncluded', 'dailyQuota', 'staleDays'] as const).map((k) => (
            <div key={k}>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                {k === 'minIncluded' ? 'أدنى عينة (رفض تام تحتها — افتراضي 2)' : k === 'dailyQuota' ? 'الحصة اليومية/مستخدم' : 'عمر الإعلان الشاذ (يوم)'}
              </label>
              <input type="number" value={(cfg as any)[k]} onChange={(e) => setCfg({ ...cfg, [k]: Number(e.target.value) })}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-2 text-sm outline-none" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">أوزان التشابه JSON (اختياري — فارغ = الافتراضي)</label>
            <textarea value={cfg.simWeights} onChange={(e) => setCfg({ ...cfg, simWeights: e.target.value })} rows={3} dir="ltr"
              placeholder='{"brandModel":30,"year":15,...}'
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-2 text-sm outline-none font-mono" />
          </div>
          <button onClick={saveConfig} disabled={saving} className="px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold disabled:opacity-50">
            {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {(tab === 'listings'
                    ? ['المصدر', 'السيارة', 'السنة', 'كم', 'السعر', 'الحالة', 'الجمع']
                    : tab === 'dubious'
                      ? ['الطلب', 'التقدير', 'الثقة', 'العينة', 'التاريخ']
                      : ['الطلب', 'المستخدم', 'الحالة', 'التقدير', 'الثقة', 'العينة', 'التاريخ']).map((h) => (
                    <th key={h} className="text-right p-3 font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    {tab === 'listings' ? (
                      <>
                        <td className="p-3">{r.source}</td>
                        <td className="p-3">{r.brand} {r.model}</td>
                        <td className="p-3">{r.year || '—'}</td>
                        <td className="p-3">{r.kilometers?.toLocaleString() || '—'}</td>
                        <td className="p-3 font-bold">{Number(r.priceJod).toLocaleString()} د.أ</td>
                        <td className="p-3 text-xs">{r.status}</td>
                        <td className="p-3 text-xs text-gray-400">{new Date(r.scrapedAt).toLocaleDateString('ar-JO')}</td>
                      </>
                    ) : tab === 'dubious' ? (
                      <>
                        <td className="p-3 font-mono text-xs"><Link href={`/api/valuations/${r.requestId}`} className="text-blue-500 hover:underline">{r.requestId.slice(0, 8)}</Link></td>
                        <td className="p-3 font-bold">{Number(r.estimatedPrice).toLocaleString()}</td>
                        <td className="p-3 text-rose-500 font-bold">{r.confidence}%</td>
                        <td className="p-3">{r.comparablesUsed}</td>
                        <td className="p-3 text-xs text-gray-400">{new Date(r.calculatedAt).toLocaleDateString('ar-JO')}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 font-mono text-xs"><Link href={`/api/valuations/${r.id}`} className="text-blue-500 hover:underline">{r.id.slice(0, 8)}</Link></td>
                        <td className="p-3">{r.user?.name || 'زائر'}</td>
                        <td className="p-3 text-xs">{r.status}</td>
                        <td className="p-3 font-bold">{r.result ? Number(r.result.estimatedPrice).toLocaleString() : '—'}</td>
                        <td className="p-3">{r.result ? `${r.result.confidence}% (${r.result.confidenceLabel})` : '—'}</td>
                        <td className="p-3">{r.result?.comparablesUsed ?? r._count?.comparables ?? 0}</td>
                        <td className="p-3 text-xs text-gray-400">{new Date(r.createdAt).toLocaleString('ar-JO')}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">لا بيانات</p>}
          </div>
        </div>
      )}
    </div>
  );
}
