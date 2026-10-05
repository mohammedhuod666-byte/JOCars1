'use client';

import Link from 'next/link';
import { Banknote } from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';

const priceRanges = [
  { label: 'أقل من 5,000', min: 0, max: 5000, accent: 'bg-success-500/15 text-success-400' },
  { label: '5,000 - 10,000', min: 5000, max: 10000, accent: 'bg-accent-500/15 text-accent-400' },
  { label: '10,000 - 20,000', min: 10000, max: 20000, accent: 'bg-purple-500/15 text-purple-400' },
  { label: '20,000 - 40,000', min: 20000, max: 40000, accent: 'bg-gold-100/15 text-gold-200' },
  { label: 'أكثر من 40,000', min: 40000, max: 0, accent: 'bg-error-500/15 text-error-400' },
];

export function PriceRanges() {
  const { ref, isInView } = useInScrollView(0.05);

  return (
    <section ref={ref} className="py-16 sm:py-20 relative">
      <div className="container-custom">
        <div className="text-center mb-10 sm:mb-12" style={scrollStyle(isInView)}>
          <p className="kicker kicker-center justify-center mb-3">الميزانية</p>
          <h2 className="display text-2xl sm:text-3xl md:text-4xl text-surface-50"
            style={scrollStyle(isInView, { delay: 0.1 })}>
            تصفح حسب الميزانية
          </h2>
          <p className="text-surface-500 mt-2 text-sm sm:text-base"
            style={scrollStyle(isInView, { delay: 0.15 })}>
            اختر النطاق السعري المناسب لميزانيتك
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {priceRanges.map((range, i) => {
            const href = range.max === 0
              ? `/cars?minPrice=${range.min}`
              : `/cars?minPrice=${range.min}&maxPrice=${range.max}`;

            return (
              <div key={range.label} style={scrollStyle(isInView, { delay: Math.min(i * 0.05, 0.4) })}>
                <Link
                  href={href}
                  className="group relative flex flex-col items-center gap-3 rounded-xl border border-surface-700/50 bg-surface-800 p-5 transition-all duration-300 hover:border-accent-500/40 hover:shadow-card-hover hover:-translate-y-1 overflow-hidden active:scale-[0.98]"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gold-100 opacity-0 group-hover:opacity-60 transition-opacity duration-300" />

                  <span className={`relative flex items-center justify-center w-12 h-12 rounded-lg transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6 ${range.accent}`}><Banknote className="w-6 h-6" /></span>
                  <span className="relative text-sm font-semibold text-surface-200 text-center leading-tight">
                    {range.label}
                  </span>
                  <span className="relative text-xs text-surface-500">دينار أردني</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
