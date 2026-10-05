'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';
import { formatNumber } from '@/lib/utils';

interface CityItem {
  slug: string;
  name: string;
  count?: number;
}

const FALLBACK_CITIES: CityItem[] = [
  { slug: 'amman', name: 'عمّان' },
  { slug: 'irbid', name: 'إربد' },
  { slug: 'zarqa', name: 'الزرقاء' },
  { slug: 'aqaba', name: 'العقبة' },
  { slug: 'mafraq', name: 'المفرق' },
  { slug: 'jerash', name: 'جرش' },
  { slug: 'ajloun', name: 'عجلون' },
  { slug: 'karak', name: 'الكرك' },
  { slug: 'salt', name: 'السلط' },
  { slug: 'madaba', name: 'مادبا' },
  { slug: 'tafileh', name: 'الطفيلة' },
  { slug: 'maan', name: 'معان' },
];

export function CitiesSection() {
  const [expanded, setExpanded] = useState(false);
  const [cities, setCities] = useState<CityItem[]>(FALLBACK_CITIES);
  const { ref, isInView } = useInScrollView(0.05);

  // Real per-city ad counts from the API (no made-up numbers).
  useEffect(() => {
    fetch('/api/cars/cities')
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d?.data)) return;
        setCities(
          d.data.map((c: { slug: string; nameAr: string; _count?: { cars?: number } }) => ({
            slug: c.slug,
            name: c.nameAr,
            count: c._count?.cars ?? 0,
          }))
        );
      })
      .catch(() => {});
  }, []);

  const visibleCities = expanded ? cities : cities.slice(0, 8);

  return (
    <section ref={ref} className="py-16 sm:py-20 bg-surface-900/40 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-surface-700/50 to-transparent" />

      <div className="container-custom">
        <div className="text-center mb-10 sm:mb-12" style={scrollStyle(isInView)}>
          <div className="flex items-center justify-center gap-3 mb-4" style={scrollStyle(isInView, { delay: 0.05 })}>
            <p className="kicker kicker-center justify-center">المدن</p>
          </div>
          <h2 className="display text-2xl sm:text-3xl md:text-4xl text-surface-50"
            style={scrollStyle(isInView, { delay: 0.1 })}>
            تصفح حسب المدينة
          </h2>
          <p className="text-surface-500 mt-2 text-sm sm:text-base"
            style={scrollStyle(isInView, { delay: 0.15 })}>
            اختر مدينتك للبحث عن سيارات بالقرب منك
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visibleCities.map((city, i) => (
            <div key={city.slug} style={scrollStyle(isInView, { delay: Math.min(i * 0.03, 0.4) })}>
              <Link
                href={`/cars?city=${city.slug}`}
                className="group flex items-center gap-3 rounded-xl bg-surface-800 border border-surface-700/50 px-4 py-3.5 transition-all duration-300 hover:border-accent-500/50 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-500/15 text-success-400 transition-all duration-300 group-hover:bg-accent-500/15 group-hover:text-accent-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-surface-200 group-hover:text-accent-300 transition-colors">
                    {city.name}
                  </span>
                  {city.count !== undefined && (
                    <span className="text-xs text-surface-500 tabular-nums">{formatNumber(city.count)} إعلان</span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center" style={scrollStyle(isInView, { delay: 0.45 })}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent-400 hover:text-accent-300 transition-colors px-4 py-2 rounded-lg hover:bg-accent-500/10"
          >
            {expanded ? (
              <>إظهار أقل <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>عرض جميع المدن <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
