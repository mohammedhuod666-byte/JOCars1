'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
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
    <section ref={ref} className="py-20 sm:py-28 bg-[#0b0e15] border-t border-white/[0.06] relative overflow-hidden">
      <div className="container-custom relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16 space-y-3" style={scrollStyle(isInView)}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 text-xs font-bold mx-auto">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>محافظات ومدن المملكة</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            تصفح سياراتك حسب المدينة
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            ابحث عن سيارات بالقرب منك في عمان، الزرقاء، إربد، وكافة المحافظات الأردنية.
          </p>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {visibleCities.map((city, i) => (
            <div key={city.slug} style={scrollStyle(isInView, { delay: Math.min(i * 0.03, 0.4) })}>
              <Link
                href={`/cars?city=${city.slug}`}
                className="group flex items-center gap-3.5 rounded-2xl bg-[#111520]/80 border border-white/[0.08] p-4 transition-all duration-300 hover:border-emerald-400/40 hover:bg-[#161c2b] hover:-translate-y-1"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                    {city.name}
                  </span>
                  {city.count !== undefined && (
                    <span className="text-xs text-slate-400 tabular-nums font-medium">{formatNumber(city.count)} إعلان نشط</span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Toggle Button */}
        <div className="mt-8 text-center" style={scrollStyle(isInView, { delay: 0.45 })}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-5 py-2.5 rounded-xl bg-[#121622] border border-white/[0.08] hover:border-white/[0.2] transition-all cursor-pointer"
          >
            {expanded ? (
              <>إظهار عدد أقل <ChevronUp className="w-4 h-4 text-emerald-400" /></>
            ) : (
              <>عرض باقي المحافظات ({cities.length}) <ChevronDown className="w-4 h-4 text-emerald-400" /></>
            )}
          </button>
        </div>

      </div>
    </section>
  );
}
