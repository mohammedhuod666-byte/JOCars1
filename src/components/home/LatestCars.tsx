'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CarGrid } from '@/components/cars/CarGrid';
import { ArrowLeft, Clock, Sparkles, Plus, Car, Wrench, Cpu, MessageSquare } from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';
import type { Car as CarType } from '@/types';

export function LatestCars() {
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref, isInView } = useInScrollView(0.05);

  useEffect(() => {
    fetch('/api/cars?sortBy=createdAt&sortOrder=desc&limit=9')
      .then((res) => res.json())
      .then((data) => {
        setCars(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-[#0b0e15] border-t border-white/[0.06] relative overflow-hidden">
      {/* Ambient Top Light Beam */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-sky-500/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16" style={scrollStyle(isInView)}>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-400/10 border border-sky-400/25 text-sky-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>إعلانات أضيفت اليوم</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              أحدث السيارات المضافة حديثاً
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
              تصفح أحدث إعلانات حراج السيارات في الأردن فور نزولها مباشرة مع تقارير الفحص والأسعار المعتمدة.
            </p>
          </div>

          <Link
            href="/cars"
            className="group inline-flex items-center gap-2.5 rounded-2xl border border-white/[0.1] bg-[#121622]/80 hover:bg-[#1a2030] hover:border-sky-400/40 px-5 py-3 text-xs sm:text-sm font-bold text-slate-200 hover:text-white transition-all shadow-lg w-fit"
          >
            <span>عرض كل سيارات الحراج</span>
            <ArrowLeft className="w-4 h-4 text-sky-400 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <CarGrid cars={[]} loading={true} />
        ) : cars.length > 0 ? (
          <CarGrid cars={cars} />
        ) : (
          <div className="rounded-3xl bg-[#111520]/70 border border-white/[0.08] backdrop-blur-xl p-8 sm:p-10 max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-400/20 text-sky-400 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mb-2">
              لا توجد إعلانات سيارات مسجلة حالياً
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-6">
              كن السبّاق بنشر سيارتك، أو استكشف الأقسام الحية الأخرى المتوفرة الآن في المنصة:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto mb-6">
              <Link
                href="/workshops"
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-sky-400/30 transition-all text-center group"
              >
                <Wrench className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">دليل الورش</span>
              </Link>
              <Link
                href="/parts"
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-cyan-400/30 transition-all text-center group"
              >
                <Cpu className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">قطع الغيار</span>
              </Link>
              <Link
                href="/forum"
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-purple-400/30 transition-all text-center group"
              >
                <MessageSquare className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">المنتدى والنقاش</span>
              </Link>
              <Link
                href="/ownership-cost"
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-amber-400/30 transition-all text-center group"
              >
                <Car className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">حاسبة التكلفة</span>
              </Link>
            </div>

            <Link
              href="/cars/add"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-xs px-6 py-3 shadow-md shadow-sky-500/20 hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>نشر إعلان سيارة الآن</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
