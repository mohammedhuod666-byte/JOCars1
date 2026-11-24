'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpLeft, Sparkles, ShieldCheck } from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';

interface FeaturedBrand {
  slug: string;
  nameAr: string;
  nameEn: string;
  country: string;
  accent: string;
  badge?: string;
  logoUrl: string;
}

const FEATURED_BRANDS: FeaturedBrand[] = [
  {
    slug: 'toyota',
    nameAr: 'تويوتا',
    nameEn: 'TOYOTA',
    country: 'اليابان',
    accent: 'hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]',
    badge: 'الأكثر مبيعاً',
    logoUrl: '/images/brands/toyota.png',
  },
  {
    slug: 'mercedes',
    nameAr: 'مرسيدس بنز',
    nameEn: 'MERCEDES',
    country: 'ألمانيا',
    accent: 'hover:border-slate-300/60 hover:shadow-[0_0_25px_rgba(226,232,240,0.2)]',
    badge: 'فخامة مطلقة',
    logoUrl: '/images/brands/mercedes.png',
  },
  {
    slug: 'bmw',
    nameAr: 'بي إم دبليو',
    nameEn: 'BMW',
    country: 'ألمانيا',
    accent: 'hover:border-sky-500/50 hover:shadow-[0_0_25px_rgba(14,165,233,0.2)]',
    badge: 'أداء رياضي',
    logoUrl: '/images/brands/bmw.png',
  },
  {
    slug: 'hyundai',
    nameAr: 'هيونداي',
    nameEn: 'HYUNDAI',
    country: 'كوريا',
    accent: 'hover:border-blue-500/50 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]',
    badge: 'هايبرد واقتصادي',
    logoUrl: '/images/brands/hyundai.png',
  },
  {
    slug: 'kia',
    nameAr: 'كيا',
    nameEn: 'KIA',
    country: 'كوريا',
    accent: 'hover:border-rose-500/50 hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]',
    badge: 'طلب مرتفع',
    logoUrl: '/images/brands/kia.png',
  },
  {
    slug: 'nissan',
    nameAr: 'نيسان',
    nameEn: 'NISSAN',
    country: 'اليابان',
    accent: 'hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]',
    badge: 'اعتمادية يابانية',
    logoUrl: '/images/brands/nissan.png',
  },
  {
    slug: 'lexus',
    nameAr: 'لكزس',
    nameEn: 'LEXUS',
    country: 'اليابان',
    accent: 'hover:border-amber-400/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]',
    badge: 'فخامة واعتمادية',
    logoUrl: '/images/brands/lexus.png',
  },
  {
    slug: 'land-rover',
    nameAr: 'لاند روفر',
    nameEn: 'LAND ROVER',
    country: 'بريطانيا',
    accent: 'hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]',
    badge: 'دفع رباعي فاره',
    logoUrl: '/images/brands/land-rover.png',
  },
  {
    slug: 'honda',
    nameAr: 'هوندا',
    nameEn: 'HONDA',
    country: 'اليابان',
    accent: 'hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]',
    badge: 'محركات قوية',
    logoUrl: '/images/brands/honda.png',
  },
  {
    slug: 'porsche',
    nameAr: 'بورش',
    nameEn: 'PORSCHE',
    country: 'ألمانيا',
    accent: 'hover:border-amber-400/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]',
    badge: 'قمة الرياضية',
    logoUrl: '/images/brands/porsche.png',
  },
  {
    slug: 'ford',
    nameAr: 'فورد',
    nameEn: 'FORD',
    country: 'أمريكا',
    accent: 'hover:border-blue-500/50 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]',
    badge: 'قوة وتحمل',
    logoUrl: '/images/brands/ford.png',
  },
  {
    slug: 'mitsubishi',
    nameAr: 'ميتسوبيشي',
    nameEn: 'MITSUBISHI',
    country: 'اليابان',
    accent: 'hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]',
    badge: 'صلابة وموثوقية',
    logoUrl: '/images/brands/mitsubishi.png',
  },
];

export function BrandsSection() {
  const { ref, isInView } = useInScrollView(0.05);

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-[#080a0f] border-t border-white/[0.06] relative overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-500/[0.04] rounded-full blur-[160px] pointer-events-none" />

      <div className="container-custom relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3" style={scrollStyle(isInView)}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-bold mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>وكالات وماركات معتمدة</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            تصفح سياراتك حسب الماركة
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            اختر شركتك المفضلة واستعرض كافة الموديلات، أسعار السوق، والمواصفات المتوفرة في الأردن.
          </p>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {FEATURED_BRANDS.map((brand, i) => (
            <div key={brand.slug} style={scrollStyle(isInView, { delay: i * 0.03 })}>
              <Link
                href={`/cars?search=${encodeURIComponent(brand.nameAr)}`}
                className={`group relative flex flex-col items-center justify-between p-5 rounded-3xl bg-[#111520]/85 border border-white/[0.08] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 ${brand.accent} text-center overflow-hidden h-full min-h-[170px]`}
              >
                {/* Subtle top indicator line on hover */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Country Badge */}
                <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-bold mb-3">
                  <span>{brand.country}</span>
                  <span className="text-amber-400/80 group-hover:text-amber-300 transition-colors">
                    <ArrowUpLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:-translate-x-0.5" />
                  </span>
                </div>

                {/* Official Brand Logo */}
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center p-2.5 group-hover:scale-110 group-hover:bg-white/[0.09] group-hover:border-white/[0.2] transition-all duration-300 mb-3 shadow-inner">
                  <img
                    src={brand.logoUrl}
                    alt={`${brand.nameAr} - ${brand.nameEn}`}
                    className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Names */}
                <div className="space-y-0.5">
                  <h3 className="font-black text-white text-base group-hover:text-amber-300 transition-colors">
                    {brand.nameAr}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                    {brand.nameEn}
                  </p>
                </div>

                {/* Tag */}
                {brand.badge && (
                  <div className="mt-3 w-full pt-2 border-t border-white/[0.05]">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                      {brand.badge}
                    </span>
                  </div>
                )}
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
