'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, Car, Wrench, Cpu, MessageCircle, ArrowLeft, MapPin, Gauge, Fuel,
  ShieldCheck, Star, ChevronRight, Plus, Sparkles
} from 'lucide-react';
import type { Car as CarType } from '@/types';

const TYPED_WORDS = ['هايبرد', 'كهرباء', 'عائلية', 'اقتصادية', 'فارهة'];

type TabId = 'cars' | 'workshops' | 'parts' | 'forum';

const TABS: Record<TabId, {
  label: string;
  icon: typeof Car;
  placeholder: string;
  shortPlaceholder: string;
  section: string;
  sectionLabel: string;
  chips: { label: string; query: string }[];
}> = {
  cars: {
    label: 'السيارات',
    icon: Car,
    placeholder: 'ابحث عن ماركة، موديل، أو سنة... مثال: تويوتا كامري 2022',
    shortPlaceholder: 'ابحث عن ماركة، موديل، أو سنة...',
    section: '/cars',
    sectionLabel: 'عرض كافة السيارات',
    chips: [
      { label: 'تويوتا هايبرد', query: 'تويوتا هايبرد' },
      { label: 'سيارات كهرباء EV', query: 'كهرباء' },
      { label: 'فحص 4 جيد', query: 'فحص كامل' },
      { label: 'أحدث الإعلانات', query: '' },
    ],
  },
  workshops: {
    label: 'الورش والصيانة',
    icon: Wrench,
    placeholder: 'ابحث عن ورشة صيانة أو تخصص... مثال: فحص كمبيوتر عمان',
    shortPlaceholder: 'ابحث عن ورشة صيانة أو تخصص...',
    section: '/workshops',
    sectionLabel: 'استكشف الورش',
    chips: [
      { label: 'صيانة هايبرد', query: 'هايبرد' },
      { label: 'فحص كمبيوتر', query: 'فحص كمبيوتر' },
      { label: 'ورش متنقلة 24/7', query: 'متنقلة' },
    ],
  },
  parts: {
    label: 'قطع الغيار',
    icon: Cpu,
    placeholder: 'ابحث عن قطعة سيارة أو رقم القطعة OEM...',
    shortPlaceholder: 'ابحث عن قطعة سيارة أو رقم OEM...',
    section: '/parts',
    sectionLabel: 'تصفح قطع الغيار',
    chips: [
      { label: 'محركات وجيرات', query: 'محرك' },
      { label: 'بطاريات هايبرد', query: 'بطارية' },
      { label: 'قطع بودي وهيكل', query: 'بودي' },
    ],
  },
  forum: {
    label: 'مجتمع كارس جو',
    icon: MessageCircle,
    placeholder: 'اطرح سؤالاً عن الأعطال أو ابحث في تجارب الأعضاء...',
    shortPlaceholder: 'ابحث في أسئلة وتجارب الأعضاء...',
    section: '/forum',
    sectionLabel: 'تصفح النقاشات',
    chips: [
      { label: 'أعطال الهايبرد الشائعة', query: 'هايبرد' },
      { label: 'نصائح شراء المستعمل', query: 'نصائح' },
      { label: 'تكاليف الصيانة الدورية', query: 'صيانة' },
    ],
  },
};

const TICKER = [
  'تويوتا', 'مرسيدس بنز', 'بي إم دبليو', 'هيونداي', 'كيا', 'نيسان', 'لكزس', 'فورد',
  'عمان', 'إربد', 'الزرقاء', 'العقبة', 'فحص 4 جيد معتمد', 'جمرك خالص', 'بطاريات هايبرد مكفولة'
];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('cars');
  const [word, setWord] = useState(TYPED_WORDS[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<{ cars: number; cities: number; brands: number } | null>(null);
  const [featuredCar, setFeaturedCar] = useState<CarType | null>(null);
  const [carLoading, setCarLoading] = useState(true);

  // Fetch real platform stats and dynamic featured car
  useEffect(() => {
    Promise.all([
      fetch('/api/cars?limit=1').then((r) => r.json()).catch(() => null),
      fetch('/api/cars/cities').then((r) => r.json()).catch(() => null),
      fetch('/api/cars/brands').then((r) => r.json()).catch(() => null),
    ]).then(([carsRes, citiesRes, brandsRes]) => {
      const totalCars = typeof carsRes?.pagination?.total === 'number'
        ? carsRes.pagination.total
        : (Number(carsRes?.pagination?.total) || 0);
      const cities = Array.isArray(citiesRes?.data) ? citiesRes.data.length : 12;
      const brands = Array.isArray(brandsRes?.data) ? brandsRes.data.length : 71;
      setStats({
        cars: totalCars,
        cities: Math.max(cities, 12),
        brands: Math.max(brands, 70),
      });
    }).catch(() => {});

    // Dynamically fetch top featured car (prioritize user-marked featured: true)
    fetch('/api/cars?featured=true&limit=1')
      .then((res) => res.json())
      .then(async (data) => {
        let car = data.data?.[0];
        if (!car) {
          // If none explicitly marked featured, display the latest approved car
          const fallback = await fetch('/api/cars?limit=1').then((r) => r.json()).catch(() => ({}));
          car = fallback.data?.[0];
        }
        setFeaturedCar(car || null);
        setCarLoading(false);
      })
      .catch(() => setCarLoading(false));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('ar-JO').format(n);

  useEffect(() => {
    const current = TYPED_WORDS[wordIndex];
    const speed = isDeleting ? 40 : 80;
    const timer = setTimeout(() => {
      if (!isDeleting && word.length < current.length) {
        setWord(current.slice(0, word.length + 1));
        return;
      }
      if (!isDeleting && word.length === current.length) {
        setTimeout(() => setIsDeleting(true), 1800);
        return;
      }
      if (isDeleting && word.length > 0) {
        setWord(current.slice(0, word.length - 1));
        return;
      }
      if (isDeleting && word.length === 0) {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % TYPED_WORDS.length);
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [isDeleting, word, wordIndex]);

  const tab = TABS[activeTab];

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    setSearchQuery('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const goSection = (path: string, query: string) => {
    router.push(query ? `${path}?search=${encodeURIComponent(query)}` : path);
  };

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      inputRef.current?.focus();
      return;
    }
    goSection(TABS[activeTab].section, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeTab, router]);

  return (
    <section className="relative overflow-hidden bg-[#080a0f] text-slate-100 pt-3 sm:pt-6 pb-10 sm:pb-16 lg:pb-20">
      {/* Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Column (Copy + Search Dock) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-right">
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-400/30 text-amber-300 text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>سوق السيارات الأردني المعتمد</span>
            </div>

            {/* Display Headline */}
            <div className="space-y-5 sm:space-y-6">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.5] sm:leading-[1.4]">
                <span className="block mb-1 sm:mb-2">بيع، اشترِ، وتملّك</span>
                <span className="inline-block py-1 bg-gradient-to-l from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                  سيارة {word}
                </span>
                <span className="inline-block w-1 h-[0.75em] bg-amber-400 mr-2 align-middle animate-pulse shadow-[0_0_10px_#f59e0b]" />
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-7 sm:leading-relaxed max-w-xl pt-1">
                حراج سيارات متكامل، فحص كروت الشواصي، ورش صيانة متخصصة، وسوق قطع غيار أصلية — تجربة شراء وبيع موثوقة في الأردن.
              </p>
            </div>

            {/* Segmented Glass Category Switcher */}
            <div className="space-y-3">
              <div role="tablist" className="grid grid-cols-2 sm:flex sm:flex-wrap p-1 sm:p-1.5 rounded-2xl bg-[#121622]/90 border border-white/[0.08] backdrop-blur-xl shadow-lg gap-1 sm:gap-1.5 max-w-full">
                {(Object.keys(TABS) as TabId[]).map((id) => {
                  const t = TABS[id];
                  const Icon = t.icon;
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={active}
                      type="button"
                      onClick={() => switchTab(id)}
                      className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                        active
                          ? 'text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 shadow-md shadow-amber-500/25'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modern Search Dock */}
              <form onSubmit={handleSearch} className="rounded-2xl sm:rounded-3xl bg-[#111520]/95 border border-white/[0.1] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 focus-within:border-amber-400/60 focus-within:shadow-[0_20px_50px_-10px_rgba(245,158,11,0.15)]">
                <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#181d2c] border border-white/[0.06] flex items-center justify-center text-amber-400 shrink-0">
                    <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={typeof window !== 'undefined' && window.innerWidth < 640 ? tab.shortPlaceholder : tab.placeholder}
                    aria-label={`بحث في ${tab.label}`}
                    className="flex-1 bg-transparent text-xs sm:text-sm md:text-base text-white outline-none placeholder:text-slate-400 placeholder:truncate px-1 min-w-0"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm px-3.5 sm:px-8 h-9 sm:h-12 shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                  >
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                    <span>بحث</span>
                  </button>
                </div>

                {/* Popular Tags & Section Link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 sm:px-5 py-2 sm:py-3 border-t border-white/[0.06] bg-[#0c0f17]/90 text-xs">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <span className="text-slate-400 font-semibold text-[10px] sm:text-[11px]">الأكثر بحثاً:</span>
                    {tab.chips.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => goSection(tab.section, chip.query)}
                        className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-300 font-medium hover:text-amber-300 hover:border-amber-400/40 hover:bg-amber-400/10 transition-all cursor-pointer text-[10px] sm:text-[11px]"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                  <Link
                    href={tab.section}
                    className="text-[11px] font-bold text-amber-400 flex items-center gap-1 hover:gap-2 transition-all self-end sm:self-auto"
                  >
                    <span>{tab.sectionLabel}</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </form>
            </div>

            {/* Platform Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-lg pt-1">
                {[
                  { value: fmt(stats.cars), label: 'سيارة معروضة', sub: 'تحديث يومي' },
                  { value: fmt(stats.cities), label: 'محافظة وموقع', sub: 'تغطية المملكة' },
                  { value: fmt(stats.brands), label: 'ماركة عالمية', sub: 'جميع الوكالات' },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 sm:p-3.5 rounded-2xl bg-[#121622]/80 border border-white/[0.08] backdrop-blur-md hover:border-amber-400/30 transition-colors text-right"
                  >
                    <p className="text-lg sm:text-2xl font-black text-white tabular-nums tracking-tight">
                      {s.value}
                    </p>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-200 mt-0.5">{s.label}</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{s.sub}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Dynamic Featured Car Showcase */}
          <div className="lg:col-span-5 relative w-full">
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">

              {carLoading ? (
                <div className="rounded-3xl border border-white/[0.1] bg-[#111520]/80 p-4 animate-pulse space-y-4">
                  <div className="h-56 sm:h-64 rounded-2xl bg-white/[0.04]" />
                  <div className="h-4 bg-white/[0.06] rounded w-2/3" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                </div>
              ) : featuredCar ? (
                /* Dynamic Real Car Card (Shows the car added and marked as featured!) */
                (() => {
                  const carName = `${featuredCar.brand?.nameAr || ''} ${featuredCar.model?.nameAr || ''} ${featuredCar.year || ''}`.trim() || 'سيارة معروضة';
                  const carSub = featuredCar.trim || (featuredCar.brand?.nameEn ? `${featuredCar.brand.nameEn} ${featuredCar.model?.nameEn || ''}` : '');
                  const carImage = (featuredCar as any).coverImage || featuredCar.images?.[0]?.url || '/hero-porsche.jpg';
                  const carKm = featuredCar.kilometers ? `${fmt(featuredCar.kilometers)} كم` : '0 كم';
                  const carCity = featuredCar.city?.nameAr || 'الأردن';
                  const carPrice = featuredCar.price ? fmt(featuredCar.price) : '0';
                  const customsLabel = featuredCar.customsStatus === 'DUTY_PAID' ? 'مجمركة بالكامل' : (featuredCar.customsStatus || 'جمرك خالص');
                  const inspectionLabel = (featuredCar as any).aiConditionReport || 'فحص معتمد';

                  return (
                    <Link
                      href={`/cars/${featuredCar.id}`}
                      className="block relative rounded-2xl sm:rounded-3xl border border-white/[0.12] bg-[#111520]/95 backdrop-blur-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] p-2.5 sm:p-4 overflow-hidden group hover:border-amber-400/50 transition-all duration-300 max-w-full"
                    >
                      {/* Image Container with realistic proportions for phones & iPads */}
                      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 border border-white/[0.08]">
                        <Image
                          src={carImage}
                          alt={carName}
                          fill
                          priority
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-transparent to-black/30" />

                        {/* Top Badges */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#090b10]/90 border border-amber-400/50 backdrop-blur-md shadow-lg">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-[11px] font-black text-amber-300">
                            {featuredCar.featured ? 'إعلان مميز VIP' : 'سيارة مختارة'}
                          </span>
                        </div>

                        {/* Condition / Inspection Tag */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#090b10]/85 border border-white/20 text-slate-200 backdrop-blur-md text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{inspectionLabel}</span>
                        </div>
                      </div>

                      {/* Car Information */}
                      <div className="pt-3.5 sm:pt-4 px-1 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {carSub && (
                              <p className="text-[11px] sm:text-xs text-slate-400 font-semibold truncate">
                                {carSub}
                              </p>
                            )}
                            <h3 className="text-base sm:text-lg font-black text-white mt-0.5 group-hover:text-amber-400 transition-colors truncate">
                              {carName}
                            </h3>
                          </div>
                          <div className="text-left shrink-0">
                            <p className="text-lg sm:text-xl font-black text-amber-400 tabular-nums">
                              {carPrice} <span className="text-xs font-bold text-slate-300">د.أ</span>
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-emerald-400 font-bold">
                              {customsLabel}
                            </p>
                          </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 border-t border-white/[0.06] text-[11px] sm:text-xs font-semibold text-slate-300">
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.03]">
                            <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="tabular-nums truncate">{carKm}</span>
                          </div>
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.03]">
                            <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">
                              {featuredCar.fuelType === 'PLUGIN_HYBRID'
                                ? 'هايبرد بلق إن'
                                : featuredCar.fuelType === 'HYBRID'
                                ? 'هايبرد'
                                : featuredCar.fuelType === 'ELECTRIC'
                                ? 'كهرباء'
                                : featuredCar.fuelType === 'DIESEL'
                                ? 'ديزل'
                                : featuredCar.fuelType === 'PETROL'
                                ? 'بنزين'
                                : featuredCar.fuelType || 'بنزين'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.03]">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{carCity}</span>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-1">
                          <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.06] group-hover:bg-amber-400 group-hover:text-slate-950 font-bold text-xs text-slate-200 border border-white/[0.08] group-hover:border-amber-400 transition-all duration-200">
                            <span>معاينة تفاصيل السيارة</span>
                            <ChevronRight className="w-4 h-4 rotate-180" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })()
              ) : (
                /* VIP Showcase Slot Placeholder (When 0 cars exist in DB) */
                <div className="relative rounded-2xl sm:rounded-3xl border border-white/[0.12] bg-[#111520]/95 backdrop-blur-2xl p-6 sm:p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-inner">
                    <Star className="w-7 h-7 sm:w-8 sm:h-8 fill-amber-400/30" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-bold mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>مساحة الإعلان المميز VIP</span>
                  </div>

                  <h3 className="text-base sm:text-xl font-black text-white mb-2">
                    ميّز سيارتك في الواجهة الأولى
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto mb-6">
                    عند نشر إعلانك وتحديده كإعلان مميز، ستتصدر سيارتك واجهة المنصة هنا مباشرة أمام المشترين والمهتمين في الأردن.
                  </p>

                  <Link
                    href="/cars/add"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    <span>أضف أول سيارة مميزة الآن</span>
                  </Link>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
