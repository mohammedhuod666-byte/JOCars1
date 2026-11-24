'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CarGrid } from '@/components/cars/CarGrid';
import { ArrowLeft, Star, Sparkles, ShieldCheck, Plus, Award, CheckCircle2 } from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';
import type { Car } from '@/types';

export function FeaturedCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref, isInView } = useInScrollView(0.05);

  useEffect(() => {
    fetch('/api/cars?featured=true&limit=6')
      .then((res) => res.json())
      .then(async (data) => {
        let list = data.data || [];
        if (list.length === 0) {
          const fallbackRes = await fetch('/api/cars?limit=6').then(r => r.json()).catch(() => ({}));
          list = fallbackRes.data || [];
        }
        setCars(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section ref={ref} className="py-20 sm:py-28 relative bg-[#080a0f] overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/[0.07] rounded-full blur-[140px] pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16" style={scrollStyle(isInView)}>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-bold">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>مختارات النخبة الموثوقة</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              السيارات المميزة في الأردن
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
              أفضل عروض السيارات المفحوصة والمكفولة من المعارض والوكلاء والملاك المعتمدين في المملكة.
            </p>
          </div>

          <Link
            href="/cars/add"
            className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 px-6 py-3.5 text-xs sm:text-sm font-black transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] w-fit"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>أضف سيارتك في المعرض المميز</span>
          </Link>
        </div>

        {loading ? (
          <CarGrid cars={[]} loading={true} />
        ) : cars.length > 0 ? (
          <CarGrid cars={cars} featured />
        ) : (
          <div className="relative rounded-3xl bg-gradient-to-br from-[#121622]/90 via-[#161c2b]/80 to-[#10141f]/90 border border-white/[0.1] backdrop-blur-2xl p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            <div className="w-20 h-20 rounded-3xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center mx-auto mb-6 text-amber-400 shadow-inner">
              <Award className="w-10 h-10" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
              كن أول من يعرض سيارته في قسم النخبة المميز!
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto mb-8">
              سوق السيارات الأردني مفتوح الآن. أضف إعلان سيارتك ليظهر في واجهة الموقع لآلاف الباحثين عن سيارات للشراء في كافة محافظات المملكة.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mb-8 text-right">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">ظهور فوري في الصفحة الأولى</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">فحص موثوق وتقرير معتمد</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">نشر مجاني خلال دقيقتين</span>
              </div>
            </div>

            <Link
              href="/cars/add"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span>إضافة إعلان سيارة جديد الآن</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
