'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, Car, Wrench, Cpu, MessageCircle, ArrowLeft, MapPin, Gauge, Fuel, BadgeCheck
} from 'lucide-react';

const TYPED_WORDS = ['هايبرد', 'كهرباء', 'عائلي', 'رياضي'];

type TabId = 'cars' | 'workshops' | 'parts' | 'forum';

const TABS: Record<TabId, {
  label: string;
  icon: typeof Car;
  placeholder: string;
  section: string;
  sectionLabel: string;
  chips: { label: string; query: string }[];
}> = {
  cars: {
    label: 'سيارات',
    icon: Car,
    placeholder: 'دور على ماركة أو موديل... مثال: كامري 2022',
    section: '/cars',
    sectionLabel: 'كل السيارات',
    chips: [
      { label: 'تويوتا هايبرد', query: 'تويوتا هايبرد' },
      { label: 'سيارات كهرباء', query: 'كهرباء' },
      { label: 'أحدث الإعلانات', query: '' },
    ],
  },
  workshops: {
    label: 'ورش',
    icon: Wrench,
    placeholder: 'دور على ورشة أو خدمة... مثال: صيانة هايبرد عمان',
    section: '/workshops',
    sectionLabel: 'كل الورش',
    chips: [
      { label: 'فحص كمبيوتر', query: 'فحص كمبيوتر' },
      { label: 'صيانة هايبرد', query: 'هايبرد' },
      { label: 'ورشة متنقلة', query: 'متنقلة' },
    ],
  },
  parts: {
    label: 'قطع',
    icon: Cpu,
    placeholder: 'دور على قطعة أو رقم OEM... مثال: محرك كامري',
    section: '/parts',
    sectionLabel: 'كل القطع',
    chips: [
      { label: 'محركات', query: 'محرك' },
      { label: 'جير وفتيس', query: 'جير' },
      { label: 'هيكل وبودي', query: 'بودي' },
    ],
  },
  forum: {
    label: 'منتدى',
    icon: MessageCircle,
    placeholder: 'دور بأسئلة الأعطال والاستفسارات...',
    section: '/forum',
    sectionLabel: 'كل المواضيع',
    chips: [
      { label: 'أعطال الهايبرد', query: 'هايبرد' },
      { label: 'نصائح الشراء', query: 'نصائح' },
      { label: 'أحدث النقاشات', query: '' },
    ],
  },
};

const TICKER = ['تويوتا', 'هيونداي', 'كيا', 'مرسيدس', 'بي إم دبليو', 'نيسان', 'هوندا', 'لكزس', 'فورد', 'شيفروليه', 'عمان', 'إربد', 'الزرقاء', 'فحص موثوق', 'جمرك خالص'];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('cars');
  const [word, setWord] = useState(TYPED_WORDS[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<{ cars: number; cities: number; brands: number } | null>(null);

  // Real platform totals (no made-up numbers).
  useEffect(() => {
    Promise.all([
      fetch('/api/cars?limit=1').then((r) => r.json()).catch(() => null),
      fetch('/api/cars/cities').then((r) => r.json()).catch(() => null),
      fetch('/api/cars/brands').then((r) => r.json()).catch(() => null),
    ]).then(([carsRes, citiesRes, brandsRes]) => {
      const cars = Number(carsRes?.pagination?.total) || 0;
      const cities = Array.isArray(citiesRes?.data) ? citiesRes.data.length : 0;
      const brands = Array.isArray(brandsRes?.data) ? brandsRes.data.length : 0;
      if (cars > 0 || cities > 0 || brands > 0) setStats({ cars, cities, brands });
    }).catch(() => {});
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('ar-JO').format(n);

  useEffect(() => {
    const current = TYPED_WORDS[wordIndex];
    const speed = isDeleting ? 45 : 85;
    const timer = setTimeout(() => {
      if (!isDeleting && word.length < current.length) {
        setWord(current.slice(0, word.length + 1));
        return;
      }
      if (!isDeleting && word.length === current.length) {
        setTimeout(() => setIsDeleting(true), 1600);
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
    <section className="relative overflow-hidden bg-surface-950 text-surface-100">
      {/* ticker */}
      <div className="border-b-2 border-surface-700 bg-surface-900 overflow-hidden" dir="ltr">
        <div className="marquee-track py-2" dir="rtl">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="mx-4 text-[11px] font-black text-surface-500 whitespace-nowrap">
              {t} <span className="text-gold-100 mr-4">•</span>
            </span>
          ))}
        </div>
      </div>

      <div className="container-custom relative z-10 pt-12 pb-14 lg:pt-16 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Copy + search */}
          <div className="space-y-6">
            <p className="sticker w-fit rotate-[-2deg]">
              <BadgeCheck className="w-4 h-4" />
              سوق السيارات الأردني
            </p>

            <h1 className="display text-5xl sm:text-6xl lg:text-[4rem] text-surface-50">
              بيع واشتري
              <br />
              <span className="text-gold-100">{word}</span>
              <span className="inline-block w-[4px] h-[0.85em] bg-gold-100 mr-2 align-middle animate-pulse" />
            </h1>

            <p className="text-surface-400 text-sm sm:text-base leading-relaxed max-w-xl border-r-4 border-gold-100 pr-4">
              حراج سيارات، ورش معتمدة، قطع أصلية، ومجتمع خبراء —
              كل شيء للسيارة بمكان واحد في الأردن.
            </p>

            {/* Tabs */}
            <div role="tablist" aria-label="أقسام البحث" className="flex flex-wrap items-center gap-2">
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
                    className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer border-2 ${
                      active
                        ? 'bg-gold-100 text-gold-900 border-gold-100 rotate-[-1deg]'
                        : 'bg-surface-900 text-surface-300 border-surface-700 hover:border-surface-500 hover:text-surface-100'
                    }`}
                    style={active ? { boxShadow: '4px 4px 0 rgba(255,198,64,0.35)' } : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch}>
              <div className="rounded-2xl bg-surface-900 border-2 border-surface-600 focus-within:border-gold-100 transition-colors overflow-hidden" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.4)' }}>
                <div className="flex items-center gap-2 p-2">
                  <tab.icon className="w-5 h-5 text-gold-100 mr-2 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={tab.placeholder}
                    aria-label={`بحث في ${tab.label}`}
                    className="h-12 flex-1 bg-transparent text-sm sm:text-base text-surface-50 outline-none placeholder:text-surface-500 px-1 min-w-0"
                  />
                  <button type="submit" className="btn-hard h-12 px-6 sm:px-8 shrink-0">
                    <Search className="w-4 h-4" strokeWidth={3} />
                    <span>دوّر</span>
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t-2 border-surface-700 bg-surface-950/60">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {tab.chips.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => goSection(tab.section, chip.query)}
                        className="text-surface-400 font-bold hover:text-gold-100 transition-colors cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                  <Link
                    href={tab.section}
                    className="text-[11px] font-black text-gold-100 flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap"
                  >
                    {tab.sectionLabel}
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </form>

            {/* Stats — real totals from the API */}
            {stats && (
              <div className="grid grid-cols-3 gap-3 max-w-lg">
                {[
                  { value: fmt(stats.cars), label: 'إعلان نشط' },
                  { value: fmt(stats.cities), label: 'مدينة مغطاة' },
                  { value: fmt(stats.brands), label: 'ماركة متوفرة' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-surface-900 border-2 border-surface-700 px-3 py-3 text-center">
                    <p className="text-xl font-black text-surface-50 tabular-nums">{s.value}</p>
                    <p className="text-[11px] text-surface-500 font-bold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visual polaroids */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none h-[440px] sm:h-[520px]">
            {/* back card */}
            <div className="absolute top-6 left-2 w-[62%] rotate-[-5deg] rounded-2xl overflow-hidden border-2 border-surface-600 bg-surface-900" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.4)' }}>
              <Image
                src="/background.webp"
                alt="سوق السيارات"
                width={560}
                height={420}
                sizes="(max-width: 1024px) 60vw, 30vw"
                className="w-full h-44 sm:h-56 object-cover"
                style={{ filter: 'saturate(0.8)' }}
              />
              <p className="px-4 py-3 text-xs font-black text-surface-300">من الحراج مباشرة — عمان</p>
            </div>

            {/* front card */}
            <div className="absolute bottom-0 right-0 w-[78%] rotate-[2deg] rounded-2xl overflow-hidden border-2 border-gold-100/70 bg-surface-900" style={{ boxShadow: '8px 8px 0 rgba(255,198,64,0.25)' }}>
              <Image
                src="/hero-porsche.jpg"
                alt="سيارة معروضة في سوق كارس جو الأردن"
                width={760}
                height={560}
                priority
                sizes="(max-width: 1024px) 80vw, 40vw"
                className="w-full h-56 sm:h-72 object-cover object-center"
                style={{ filter: 'saturate(0.85) contrast(1.05)' }}
              />
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-[11px] text-surface-500 font-bold">إعلان مميز اليوم</p>
                  <p className="font-black text-surface-50 text-sm">كامري 2022 — فحص كامل</p>
                </div>
                <p className="text-lg font-black text-gold-100 tabular-nums whitespace-nowrap">18,500 <span className="text-[11px]">د.أ</span></p>
              </div>
              <div className="flex items-center gap-4 px-4 pb-3 text-[11px] text-surface-400 font-bold">
                <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-gold-100" /> 45,000 كم</span>
                <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5 text-gold-100" /> هايبرد</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gold-100" /> عمان</span>
              </div>
            </div>

            {/* stamp */}
            <div className="absolute top-0 right-4 w-24 h-24 rounded-full bg-gold-100 text-gold-900 flex flex-col items-center justify-center text-center rotate-[8deg]" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.5)' }}>
              <span className="text-2xl font-black leading-none tabular-nums">100%</span>
              <span className="text-[10px] font-black leading-tight mt-1">فحص<br />موثوق</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
