'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CarCard } from '@/components/cars/CarCard';
import { Factory, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function WholesalePage() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cars?limit=48&wholesale=true')
      .then(r => r.json())
      .then(d => setCars(d.data?.cars || d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="container-custom max-w-6xl mx-auto px-4 py-8 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1.5 mb-3">
            <Factory className="w-3.5 h-3.5" /> سوق الجملة 
          </span>
          <h1 className="text-3xl font-extrabold mb-2">بيع جملة: تاجر → تاجر</h1>
          <p className="text-sm text-slate-400">سيارات معروضة بسعر الجملة من التجار مباشرة. فعّل خيار «بيع جملة» من إعلانك ليظهر هنا.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20">
            <Factory className="w-14 h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">لا توجد عروض جملة حالياً</p>
            <Link href="/cars/add" className="btn btn-emerald px-5 py-2 text-xs mt-4 inline-block font-bold">اعرض سيارتك جملة</Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-4">{cars.length} عرض جملة</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
