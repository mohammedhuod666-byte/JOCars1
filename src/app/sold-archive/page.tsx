'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Archive, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SoldCar {
  id: string; slug: string; price: number; soldPrice: number | null;
  year: number; kilometers: number; soldAt: string;
  brand: { nameAr: string }; model: { nameAr: string }; city: { nameAr: string };
  images: { url: string }[];
}

export default function SoldArchivePage() {
  const [cars, setCars] = useState<SoldCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cars?limit=48&showSold=true&status=SOLD')
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
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1.5 mb-3">
            <Archive className="w-3.5 h-3.5" /> أرشيف المبيعات 📚
          </span>
          <h1 className="text-3xl font-extrabold mb-2">بكم انباعت فعلاً؟</h1>
          <p className="text-sm text-slate-400">أسعار بيع حقيقية منفذة — أدق مرجع لسعر السوق قبل أن تشتري أو تبيع</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20">
            <Archive className="w-14 h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">لا توجد مبيعات موثقة بعد</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-4">{cars.length} عملية بيع موثقة</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.map((car) => (
                <div key={car.id} className="rounded-3xl overflow-hidden bg-slate-900 border border-slate-800">
                  <div className="h-44 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={car.images[0]?.url || '/images/placeholder-car.svg'} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-blue-600 text-white text-[11px] font-black">مباعة ✅</span>
                  </div>
                  <div className="p-4">
                    <p className="font-bold truncate">{car.brand?.nameAr} {car.model?.nameAr} {car.year}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{car.city?.nameAr} • {car.kilometers?.toLocaleString('ar-JO')} كم</p>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-[11px] text-slate-500">سعر البيع الفعلي</p>
                        <p className="text-lg font-black text-emerald-400">{(car.soldPrice || car.price).toLocaleString('ar-JO')} د.أ</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] text-slate-500">بتاريخ</p>
                        <p className="text-xs text-slate-300">{car.soldAt ? new Date(car.soldAt).toLocaleDateString('ar-JO') : '—'}</p>
                      </div>
                    </div>
                    <Link href={`/cars/${car.slug || car.id}`} className="block text-center mt-3 text-[11px] text-blue-400 hover:underline">عرض الإعلان الأصلي</Link>
                  </div>
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
