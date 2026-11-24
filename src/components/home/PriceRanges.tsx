'use client';

import Link from 'next/link';
import { Banknote, Sparkles } from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';

const priceRanges = [
  { label: 'أقل من 5,000 د.أ', sub: 'اقتصادية وشعبية', min: 0, max: 5000, accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { label: '5,000 - 10,000 د.أ', sub: 'فئة متوسطة عملية', min: 5000, max: 10000, accent: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { label: '10,000 - 20,000 د.أ', sub: 'هايبرد وكهرباء حديثة', min: 10000, max: 20000, accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { label: '20,000 - 40,000 د.أ', sub: 'سيارات فارهة وSUV', min: 20000, max: 40000, accent: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { label: 'أكثر من 40,000 د.أ', sub: 'نخبة السيارات الفاخرة', min: 40000, max: 0, accent: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
];

export function PriceRanges() {
  const { ref, isInView } = useInScrollView(0.05);

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-[#080a0f] border-t border-white/[0.06] relative overflow-hidden">
      <div className="container-custom relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16 space-y-3" style={scrollStyle(isInView)}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-bold mx-auto">
            <Banknote className="w-3.5 h-3.5 text-amber-400" />
            <span>نطاقات الميزانية</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            تصفح حسب ميزانيتك
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            حدد النطاق السعري المناسب لك واستعرض السيارات المطابقة لميزانيتك بدقة.
          </p>
        </div>

        {/* Ranges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {priceRanges.map((range, i) => {
            const href = range.max === 0
              ? `/cars?minPrice=${range.min}`
              : `/cars?minPrice=${range.min}&maxPrice=${range.max}`;

            return (
              <div key={range.label} style={scrollStyle(isInView, { delay: Math.min(i * 0.05, 0.4) })}>
                <Link
                  href={href}
                  className="group relative flex flex-col items-center gap-3 rounded-3xl border border-white/[0.08] bg-[#111520]/80 p-6 transition-all duration-300 hover:border-amber-400/40 hover:bg-[#161c2b] hover:-translate-y-1.5 text-center overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform duration-300 ${range.accent}`}>
                    <Banknote className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {range.label}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {range.sub}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
