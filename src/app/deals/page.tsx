'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CarCard } from '@/components/cars/CarCard';
import { BadgePercent, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/deals?limit=36')
      .then(r => r.json())
      .then(d => { if (d.success) setDeals(d.data.deals || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="container-custom max-w-6xl mx-auto px-4 py-8 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5 mb-3">
            <BadgePercent className="w-3.5 h-3.5" /> صفقات اليوم 
          </span>
          <h1 className="text-3xl font-extrabold mb-2">سيارات تحت سعر السوق</h1>
          <p className="text-sm text-slate-400">إعلانات سعرها أقل من تقييم الذكاء الاصطناعي العادل بـ 5% فأكثر — تتحدث تلقائياً كل يوم</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20">
            <BadgePercent className="w-14 h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">لا توجد صفقات اليوم</p>
            <p className="text-xs text-slate-500 mt-1">عُد غداً — القائمة تتجدد مع كل تقييم جديد</p>
            <Link href="/cars" className="btn btn-emerald px-5 py-2 text-xs mt-4 inline-block font-bold">تصفح كل السيارات</Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-4">{deals.length} صفقة • مرتبة بأعلى نسبة توفير</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deals.map((car) => (
                <div key={car.id} className="relative">
                  <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 text-[11px] font-black shadow-lg">
                    وفّر {car.diffPct}% (‏{car.saveAmount.toLocaleString('ar-JO')} د.أ)
                  </div>
                  <CarCard car={car} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
