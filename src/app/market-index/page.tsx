'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TrendingUp, Loader2, Sparkles, BarChart3, Fuel, Building2 } from 'lucide-react';
import Link from 'next/link';

interface IndexData {
  brandStats: { brandId: string; nameAr: string; nameEn: string; count: number; avgPrice: number }[];
  fuelMix: { fuelType: string; count: number; avgPrice: number }[];
  trend: { month: string; avgPrice: number; count: number }[];
  totalListings: number;
  outlook: string | null;
}

const FUEL_AR: Record<string, string> = {
  PETROL: 'بنزين ⛽', DIESEL: 'ديزل 🛢️', HYBRID: 'هايبرد 🔋', ELECTRIC: 'كهرباء ⚡', PLUGIN_HYBRID: 'بلج-إن 🔌',
};

export default function MarketIndexPage() {
  const [data, setData] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/market-index')
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxBrand = Math.max(...(data?.brandStats.map(b => b.count) || [1]));
  const maxTrend = Math.max(...(data?.trend.map(t => t.avgPrice) || [1]));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="container-custom max-w-6xl mx-auto px-4 py-8 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5" /> مؤشر السوق الأردني 📊
          </span>
          <h1 className="text-3xl font-extrabold mb-2">وين رايحة أسعار السيارات؟</h1>
          <p className="text-sm text-slate-400">متوسطات حقيقية من إعلانات الموقع ({data?.totalListings.toLocaleString('ar-JO') || '—'} إعلان) + توقعات الذكاء الاصطناعي</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
        ) : !data ? (
          <p className="text-center text-slate-400 py-20">تعذر تحميل المؤشر</p>
        ) : (
          <div className="space-y-6">
            {/* AI outlook */}
            {data.outlook && (
              <div className="rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/20 p-6">
                <h2 className="font-bold flex items-center gap-2 mb-2"><Sparkles className="w-5 h-5 text-indigo-400" /> توقعات الذكاء الاصطناعي</h2>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{data.outlook}</p>
              </div>
            )}

            {/* Price trend */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="font-bold flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-emerald-400" /> متوسط الأسعار — آخر 6 أشهر</h2>
              {data.trend.length === 0 ? <p className="text-xs text-slate-500">لا توجد بيانات كافية بعد</p> : (
                <div className="flex items-end gap-2" style={{ height: 180, direction: 'ltr' }}>
                  {data.trend.map(t => (
                    <div key={t.month} className="flex flex-col items-center flex-1 min-w-0">
                      <span className="text-[10px] text-slate-400 mb-1">{t.avgPrice.toLocaleString('ar-JO')}</span>
                      <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400"
                        style={{ height: `${Math.max((t.avgPrice / maxTrend) * 130, 6)}px` }} title={`${t.month}: ${t.avgPrice}`} />
                      <span className="text-[10px] text-slate-500 mt-1">{t.month.slice(5)}/{t.month.slice(2, 4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Brands */}
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
                <h2 className="font-bold flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-blue-400" /> متوسط الأسعار حسب الماركة</h2>
                <div className="space-y-2.5 max-h-96 overflow-y-auto pl-1">
                  {data.brandStats.map(b => (
                    <Link key={b.brandId} href={`/cars?brandId=${b.brandId}`} className="block group">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold group-hover:text-blue-400 transition-colors">{b.nameAr} <span className="text-slate-500 font-normal">({b.count})</span></span>
                        <span className="text-slate-300 font-bold">{b.avgPrice.toLocaleString('ar-JO')} د.أ</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-l from-blue-500 to-indigo-400" style={{ width: `${Math.max(4, (b.count / maxBrand) * 100)}%` }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Fuel mix */}
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
                <h2 className="font-bold flex items-center gap-2 mb-4"><Fuel className="w-5 h-5 text-orange-400" /> خريطة الوقود بالسوق</h2>
                <div className="space-y-3">
                  {data.fuelMix.map(f => {
                    const total = data.fuelMix.reduce((a, x) => a + x.count, 0) || 1;
                    const pct = Math.round((f.count / total) * 100);
                    return (
                      <Link key={f.fuelType} href={`/cars?fuelType=${f.fuelType}`} className="block group">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold group-hover:text-orange-400 transition-colors">{FUEL_AR[f.fuelType] || f.fuelType}</span>
                          <span className="text-slate-400">{pct}% • متوسط {f.avgPrice.toLocaleString('ar-JO')} د.أ</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-l from-orange-500 to-amber-400" style={{ width: `${pct}%` }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-4">اضغط أي ماركة أو وقود لتصفح إعلاناته مباشرة 🚗</p>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
