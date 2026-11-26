'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  Search, SlidersHorizontal, X, MapPin, Star, Wrench, Store,
  Filter, Calendar, MessageCircle, Phone, Sparkles,
  ChevronLeft, ChevronRight, ShieldCheck, Clock, Plus, Truck,
  Award, AlertTriangle, Calculator
} from 'lucide-react';

interface Workshop {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  emergencyPhone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  workingHours: string;
  workingDays: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  priceRange: string | null;
  recommendPercent: number;
  isMobileService: boolean;
  hasTowingService: boolean;
  hasWarranty: boolean;
  warrantyPeriod: string | null;
  hasWaitingArea: boolean;
  offersSpareParts: boolean;
  discountOffer: string | null;
  provinceId: string | null;
  cityId: string | null;
  services: { id: string; name: string; category: string | null }[];
  brands: { id: string; brand: string }[];
  user: { id: string; name: string; image: string | null; phone: string | null; whatsapp: string | null };
}

const SORT_OPTIONS = [
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'reviews', label: 'الأكثر تقييمات' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'views', label: 'الأكثر مشاهدة' },
];

const CATEGORY_CHIPS = [
  { id: '', label: 'الكل' },
  { id: 'هايبرد', label: 'هايبرد وكهرباء' },
  { id: 'فحص كمبيوتر', label: 'فحص كمبيوتر' },
  { id: 'ميكانيك', label: 'ميكانيك عام' },
  { id: 'برمجة', label: 'برمجة ومفاتيح' },
  { id: 'تغيير زيت', label: 'سرفيس وزيوت' },
  { id: 'خدمات متنقلة', label: 'صيانة متنقلة' },
  { id: 'سحب سيارات', label: 'ونش وسحب 24/7' },
];

const PROVINCE_OPTIONS = [
  'عمّان', 'إربد', 'الزرقاء', 'العقبة', 'البلقاء', 'الكرك', 'المفرق', 'معان', 'الطفيلة', 'عجلون', 'جرش', 'مادبا'
];

const ESTIMATOR_SERVICES: Record<string, { label: string; searchKey: string; min: number; max: number; note: string }> = {
  oil_change: { label: 'تغيير زيت وفلتر أصلي', searchKey: 'تغيير زيت', min: 25, max: 55, note: 'يعتمد على نوع الزيت (تخليقي بالكامل) وسعة المحرك' },
  computer_scan: { label: 'فحص كمبيوتر وشامل', searchKey: 'فحص كمبيوتر', min: 10, max: 25, note: 'يشمل قراءة جميع الأعطال وكشوف الميكانيك' },
  hybrid_check: { label: 'فحص بطارية وجهاز الهايبرد', searchKey: 'هايبرد', min: 15, max: 35, note: 'اختبار خلايا البطارية والأنظمة الكهروميكانيكية' },
  brake_pads: { label: 'تبديل بريكات أمامي وخلفي', searchKey: 'ميكانيك', min: 30, max: 80, note: 'شامل الفحمات والتركيب والخراطة' },
  spark_plugs: { label: 'تبديل بواجي وتنظيف بخاخات', searchKey: 'ميكانيك', min: 25, max: 60, note: 'تحسين مصروف البنزين وعزم السيارة' },
  ac_recharge: { label: 'تعبئة غاز مكيف وفحص التسريب', searchKey: 'فحص كمبيوتر', min: 15, max: 30, note: 'غاز أمريكي/إيطالي أصلي مع زيت الكمبروسر' },
  tires_balance: { label: 'ميزان مائي وترصيص إطارات', searchKey: 'ميكانيك', min: 10, max: 25, note: 'ضبط الهيئة الأمامية والخلفية' },
};

const CAR_TYPE_MULTIPLIER: Record<string, number> = {
  'بنزين': 1,
  'هايبرد': 1.15,
  'كهرباء': 1.2,
};

export default function WorkshopsPage() {
  const { isAuthenticated } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCostEstimator, setShowCostEstimator] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters State
  const [sortBy, setSortBy] = useState('rating');
  const [filterService, setFilterService] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [isMobileOnly, setIsMobileOnly] = useState(false);
  const [hasTowingOnly, setHasTowingOnly] = useState(false);
  const [hasWarrantyOnly, setHasWarrantyOnly] = useState(false);

  // Estimator Form State
  const [estSelected, setEstSelected] = useState('oil_change');
  const [estCarType, setEstCarType] = useState('بنزين');

  const fetchWorkshops = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterService) params.append('service', filterService);
      if (filterProvince) params.append('province', filterProvince);
      if (verifiedOnly) params.append('verifiedOnly', 'true');
      if (isMobileOnly) params.append('mobile', 'true');
      if (hasTowingOnly) params.append('towing', 'true');
      if (hasWarrantyOnly) params.append('warranty', 'true');
      params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('limit', '12');

      const res = await fetch(`/api/workshops?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
        setWorkshops(json.data.workshops || []);
        setTotalPages(json.data.pagination?.totalPages || 1);
        setTotal(json.data.pagination?.total || 0);
      } else {
        setWorkshops([]);
      }
    } catch {
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterService, filterProvince, verifiedOnly, isMobileOnly, hasTowingOnly, hasWarrantyOnly, sortBy, page]);

  useEffect(() => { fetchWorkshops(); }, [fetchWorkshops]);

  const resetFilters = () => {
    setSearch('');
    setFilterService('');
    setFilterProvince('');
    setVerifiedOnly(false);
    setIsMobileOnly(false);
    setHasTowingOnly(false);
    setHasWarrantyOnly(false);
    setSortBy('rating');
    setPage(1);
  };

  const activeFilterCount = [
    filterService, filterProvince, verifiedOnly, isMobileOnly, hasTowingOnly, hasWarrantyOnly
  ].filter(Boolean).length;

  const estBase = ESTIMATOR_SERVICES[estSelected];
  const estMult = CAR_TYPE_MULTIPLIER[estCarType] || 1;
  const estMin = Math.round(estBase.min * estMult);
  const estMax = Math.round(estBase.max * estMult);

  return (
    <div className="min-h-screen bg-[#0e1013] text-slate-100 pb-28 md:pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#151a22] via-[#11151b] to-[#0e1013] border-b border-white/[0.06] py-7 sm:py-12">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#ffc640]/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="container-custom max-w-6xl relative z-10 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffc640]/10 border border-[#ffc640]/25 text-[#ffc640] text-[11px] sm:text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>دليل ورش الصيانة المعتمد في الأردن</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                اعثر على أفضل <span className="text-[#ffc640]">ورش الصيانة</span> الموثوقة
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                احجز موعدك فوراً، قدّر تكلفة الإصلاح، وتواصل مباشرة مع فنيين متخصصين في الهايبرد والكهرباء والميكانيك في كافة المحافظات.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowCostEstimator(true)}
                className="flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-2xl bg-[#ffc640] hover:bg-[#ffd266] text-[#0e1013] font-black text-xs sm:text-sm shadow-lg shadow-[#ffc640]/15 transition-all cursor-pointer"
              >
                <Calculator className="w-4 h-4 shrink-0" />
                <span>حاسبة التكاليف</span>
              </button>

              {isAuthenticated ? (
                <Link
                  href="/workshops/create"
                  className="flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-black text-xs sm:text-sm transition-all"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>أضف ورشتك</span>
                </Link>
              ) : (
                <Link
                  href="/auth/login?redirect=/workshops/create"
                  className="flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 font-bold text-xs sm:text-sm transition-all"
                >
                  <Store className="w-4 h-4 text-[#ffc640] shrink-0" />
                  <span>سجّل ورشتك</span>
                </Link>
              )}
            </div>
          </div>

          {/* Roadside Emergency Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161215] border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white text-xs sm:text-sm font-black">
                  عطل مفاجئ على الطريق أو بحاجة لـ ونش سحب 24/7؟
                </h4>
                <p className="text-slate-400 text-[11px] sm:text-xs mt-0.5">
                  اعرض الورش التي توفر ونش سحب سريع أو صيانة متنقلة فورية لموقعك.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setHasTowingOnly(prev => !prev); setPage(1); }}
              className={`h-9 sm:h-10 px-4 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                hasTowingOnly
                  ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
              }`}
            >
              {hasTowingOnly ? 'عرض جميع الورش' : 'عرض ورش الونش والطوارئ'}
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom max-w-6xl pt-5 sm:pt-7">
        {/* Quick Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 no-scrollbar mb-4">
          {CATEGORY_CHIPS.map((chip) => {
            const isActive = filterService === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => { setFilterService(chip.id); setPage(1); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#ffc640] text-[#0e1013] border-[#ffc640] shadow-md shadow-[#ffc640]/15'
                    : 'bg-[#14181f] text-slate-300 border-white/[0.08] hover:border-white/20 hover:text-white'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Search & Filter Controls */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col md:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchWorkshops(); } }}
                placeholder="ابحث باسم الورشة، المنطقة، أو التخصص..."
                className="w-full h-11 sm:h-12 rounded-2xl border border-white/[0.08] bg-[#14181f] text-white pr-10 pl-10 text-xs sm:text-sm outline-none focus:border-[#ffc640] transition-all placeholder:text-slate-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setPage(1); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-11 sm:h-12 flex items-center justify-center gap-1.5 px-3 sm:px-4 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-[#ffc640]/15 border-[#ffc640]/40 text-[#ffc640]'
                    : 'bg-[#14181f] border-white/[0.08] text-slate-300 hover:border-white/20'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
                <span>الفلاتر</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-[#ffc640] text-[#0e1013] text-[11px] rounded-full flex items-center justify-center font-black">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="h-11 sm:h-12 px-3 sm:px-4 rounded-2xl border border-white/[0.08] bg-[#14181f] text-slate-200 text-xs sm:text-sm outline-none focus:border-[#ffc640] cursor-pointer font-bold"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => { setPage(1); fetchWorkshops(); }}
                className="h-11 sm:h-12 px-4 sm:px-6 bg-[#ffc640] hover:bg-[#ffd266] text-[#0e1013] rounded-2xl text-xs sm:text-sm font-black transition-colors cursor-pointer"
              >
                بحث
              </button>
            </div>
          </div>

          {/* Expanded Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#14181f] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-white text-xs sm:text-sm flex items-center gap-2">
                      <Filter className="w-4 h-4 text-[#ffc640]" />
                      <span>تصفية نتائج البحث المتقدمة</span>
                    </h3>
                    {activeFilterCount > 0 && (
                      <button type="button" onClick={resetFilters} className="text-xs text-rose-400 hover:underline font-bold cursor-pointer">
                        مسح الكل ({activeFilterCount})
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">المحافظة</label>
                      <select
                        value={filterProvince}
                        onChange={(e) => { setFilterProvince(e.target.value); setPage(1); }}
                        className="w-full h-11 px-3 rounded-xl border border-white/[0.08] bg-[#0e1013] text-white text-xs sm:text-sm outline-none focus:border-[#ffc640]"
                      >
                        <option value="">جميع المحافظات</option>
                        {PROVINCE_OPTIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2 flex flex-wrap items-end gap-2">
                      <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${verifiedOnly ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-[#0e1013] border-white/[0.08] text-slate-400'}`}>
                        <input type="checkbox" checked={verifiedOnly} onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }} className="hidden" />
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>ورش معتمدة فقط</span>
                      </label>

                      <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${isMobileOnly ? 'bg-sky-500/15 border-sky-500/40 text-sky-300' : 'bg-[#0e1013] border-white/[0.08] text-slate-400'}`}>
                        <input type="checkbox" checked={isMobileOnly} onChange={(e) => { setIsMobileOnly(e.target.checked); setPage(1); }} className="hidden" />
                        <Truck className="w-3.5 h-3.5" />
                        <span>صيانة متنقلة</span>
                      </label>

                      <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${hasTowingOnly ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : 'bg-[#0e1013] border-white/[0.08] text-slate-400'}`}>
                        <input type="checkbox" checked={hasTowingOnly} onChange={(e) => { setHasTowingOnly(e.target.checked); setPage(1); }} className="hidden" />
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>ونش وطوارئ 24/7</span>
                      </label>

                      <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${hasWarrantyOnly ? 'bg-[#ffc640]/15 border-[#ffc640]/40 text-[#ffc640]' : 'bg-[#0e1013] border-white/[0.08] text-slate-400'}`}>
                        <input type="checkbox" checked={hasWarrantyOnly} onChange={(e) => { setHasWarrantyOnly(e.target.checked); setPage(1); }} className="hidden" />
                        <Award className="w-3.5 h-3.5" />
                        <span>كفالة وضمان</span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Counter & Active Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <p className="text-slate-400 text-xs sm:text-sm font-semibold">
            {loading ? 'جاري تحميل الورش...' : `تم العثور على ${total} ورشة صيانة`}
          </p>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-bold text-[#ffc640] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>إعادة ضبط الفلاتر</span>
            </button>
          )}
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#14181f] p-4 space-y-4 animate-pulse">
                <div className="h-40 bg-white/[0.05] rounded-2xl" />
                <div className="h-5 bg-white/[0.05] rounded w-2/3" />
                <div className="h-4 bg-white/[0.05] rounded w-1/2" />
                <div className="h-10 bg-white/[0.05] rounded-xl" />
              </div>
            ))}
          </div>
        ) : workshops.length === 0 ? (
          <div className="text-center py-16 bg-[#14181f] rounded-3xl border border-white/[0.08] p-6">
            <Store className="w-14 h-14 mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg sm:text-xl font-black text-white mb-2">لم نجد ورشات تطابق البحث</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-5 max-w-md mx-auto">
              جرب تغيير خيارات التصفية أو إلغاء تحديد بعض الفلاتر لعرض نتائج أكثر.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-3 bg-[#ffc640] hover:bg-[#ffd266] text-[#0e1013] rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer"
            >
              إعادة ضبط جميع الفلاتر
            </button>
          </div>
        ) : (
          /* Workshop Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workshops.map((ws) => {
              const phoneNum = ws.phone || ws.user?.phone;
              const waNum = ws.whatsapp || ws.user?.whatsapp || ws.phone;
              return (
                <motion.div
                  key={ws.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#14181f] hover:border-[#ffc640]/40 transition-all duration-300 flex flex-col overflow-hidden shadow-xl"
                >
                  {/* Cover Image */}
                  <Link href={`/workshops/${ws.id}`} className="relative h-40 sm:h-44 w-full bg-[#0a0c0f] overflow-hidden block">
                    {ws.coverImage ? (
                      <Image
                        src={ws.coverImage}
                        alt={ws.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 384px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#161b24] to-[#0e1013] flex items-center justify-center">
                        <Wrench className="w-12 h-12 text-slate-700" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#14181f] via-transparent to-black/30" />

                    {/* Top Badges */}
                    <div className="absolute top-3 right-3 left-3 flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {ws.isVerified && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-[#ffc640] text-[#0e1013] flex items-center gap-1 shadow-md">
                            <ShieldCheck className="w-3 h-3" />
                            <span>معتمدة</span>
                          </span>
                        )}
                        {ws.hasTowingService && (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-600/90 text-white backdrop-blur-md">
                            ونش 24/7
                          </span>
                        )}
                        {ws.isMobileService && (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-sky-500/90 text-white backdrop-blur-md">
                            متنقلة
                          </span>
                        )}
                      </div>
                    </div>

                    {ws.discountOffer && (
                      <div className="absolute bottom-3 right-3 max-w-[calc(100%-1.5rem)] bg-emerald-500/95 text-slate-950 text-[11px] font-black px-2.5 py-1 rounded-lg truncate shadow-md">
                        {ws.discountOffer}
                      </div>
                    )}
                  </Link>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl border border-white/10 bg-[#0e1013] overflow-hidden shrink-0 relative flex items-center justify-center">
                          {ws.logo ? (
                            <Image src={ws.logo} alt={ws.name} fill className="object-cover" sizes="48px" />
                          ) : (
                            <Wrench className="w-5 h-5 text-[#ffc640]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/workshops/${ws.id}`}>
                            <h3 className="font-black text-white text-sm sm:text-base hover:text-[#ffc640] transition-colors truncate">
                              {ws.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#ffc640] shrink-0" />
                            <span className="truncate">{ws.address || 'الأردن'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rating, Hours & Warranty Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-2.5 border-y border-white/[0.06]">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-[#ffc640] text-[#ffc640]" />
                          <span className="font-black text-white text-sm">{ws.rating > 0 ? ws.rating.toFixed(1) : '5.0'}</span>
                          <span className="text-slate-500">({ws.reviewCount})</span>
                        </div>

                        {ws.workingHours && (
                          <span className="text-slate-400 text-[11px] flex items-center gap-1 truncate max-w-[140px]">
                            <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{ws.workingHours}</span>
                          </span>
                        )}

                        {ws.hasWarranty && (
                          <span className="text-emerald-400 text-[11px] font-bold">
                            كفالة {ws.warrantyPeriod || ''}
                          </span>
                        )}
                      </div>

                      {/* Services Chips */}
                      {ws.services && ws.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {ws.services.slice(0, 3).map((s) => (
                            <span key={s.id} className="px-2.5 py-1 rounded-lg bg-[#0e1013] border border-white/[0.06] text-slate-300 text-[11px] font-semibold">
                              {s.name}
                            </span>
                          ))}
                          {ws.services.length > 3 && (
                            <span className="px-2 py-1 rounded-lg bg-[#0e1013] border border-white/[0.06] text-slate-400 text-[11px] font-bold">
                              +{ws.services.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/workshops/${ws.id}`}
                          className="h-10 flex items-center justify-center gap-1.5 rounded-xl bg-[#ffc640] hover:bg-[#ffd266] text-[#0e1013] font-black text-xs transition-colors"
                        >
                          عرض الورشة
                        </Link>
                        <Link
                          href={`/workshops/${ws.id}#book`}
                          className="h-10 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>حجز موعد</span>
                        </Link>
                      </div>

                      {(phoneNum || waNum) && (
                        <div className="flex items-center gap-2 text-xs">
                          {phoneNum && (
                            <a
                              href={`tel:${phoneNum}`}
                              className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl bg-[#0e1013] border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/20 font-bold transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#ffc640]" />
                              <span>اتصال</span>
                            </a>
                          )}
                          {waNum && (
                            <a
                              href={`https://wa.me/${waNum.replace(/[^0-9]/g, '').replace(/^0/, '962')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl bg-[#0e1013] border border-white/[0.08] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 font-bold transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>واتساب</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 rounded-xl border border-white/[0.08] bg-[#14181f] text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pNum = i + 1;
              return (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setPage(pNum)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    page === pNum
                      ? 'bg-[#ffc640] text-[#0e1013] shadow-md shadow-[#ffc640]/15'
                      : 'bg-[#14181f] border border-white/[0.08] text-slate-300 hover:text-white'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 rounded-xl border border-white/[0.08] bg-[#14181f] text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Repair Cost Estimator Modal */}
      <AnimatePresence>
        {showCostEstimator && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCostEstimator(false)} />

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-[#ffc640]/30 bg-[#14181f] p-5 sm:p-7 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ffc640]/15 border border-[#ffc640]/30 text-[#ffc640] flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base sm:text-lg">حاسبة تقدير تكاليف الصيانة</h3>
                    <p className="text-slate-400 text-xs">تقدير متوسط الأسعار لدى الورش المعتمدة في الأردن</p>
                  </div>
                </div>

                <button type="button" onClick={() => setShowCostEstimator(false)} className="p-2 hover:bg-white/[0.06] rounded-xl text-slate-400 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">نوع الخدمة المطلوبة</label>
                  <select
                    value={estSelected}
                    onChange={(e) => setEstSelected(e.target.value)}
                    className="w-full h-11 sm:h-12 px-4 rounded-xl border border-white/[0.08] bg-[#0e1013] text-white text-xs sm:text-sm outline-none focus:border-[#ffc640]"
                  >
                    {Object.entries(ESTIMATOR_SERVICES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">نوع محرك السيارة</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['بنزين', 'هايبرد', 'كهرباء'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEstCarType(type)}
                        className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          estCarType === type
                            ? 'bg-[#ffc640] text-[#0e1013] border-[#ffc640]'
                            : 'bg-[#0e1013] text-slate-400 border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#ffc640]/10 border border-[#ffc640]/25 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#ffc640] font-bold">
                    <span>التكلفة التقريبية المتوقعة</span>
                    <span>شامل أجور اليد والقطع</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-2">
                    <span>{estMin} - {estMax}</span>
                    <span className="text-xs sm:text-sm font-bold text-[#ffc640]">دينار أردني (د.أ)</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed pt-1">
                    {estBase.note}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFilterService(estBase.searchKey);
                  setShowCostEstimator(false);
                  setPage(1);
                }}
                className="w-full h-12 rounded-xl bg-[#ffc640] hover:bg-[#ffd266] text-[#0e1013] font-black text-sm transition-colors cursor-pointer"
              >
                ابحث عن ورش تقدم هذه الخدمة
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
