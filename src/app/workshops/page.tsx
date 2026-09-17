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
  Zap, Award, AlertTriangle, Calculator, CheckCircle2, ChevronDown, Headphones
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
  { value: 'rating', label: 'الأعلى تقييماً ⭐' },
  { value: 'reviews', label: 'الأكثر تقييمات 💬' },
  { value: 'newest', label: 'الأحدث 🆕' },
  { value: 'views', label: 'الأكثر مشاهدة 🔥' },
];

const CATEGORY_CHIPS = [
  { id: '', label: 'الكل', icon: '🏪' },
  { id: 'هايبرد', label: 'صيانة هايبرد وكهرباء', icon: '⚡' },
  { id: 'فحص كمبيوتر', label: 'فحص كمبيوتر وكهرباء', icon: '🛠️' },
  { id: 'ميكانيك', label: 'ميكانيك عام', icon: '🔧' },
  { id: 'برمجة', label: 'برمجة عقول ومفاتيح', icon: '💻' },
  { id: 'تغيير زيت', label: 'سرفيس وزيوت', icon: '🛢️' },
  { id: 'خدمات متنقلة', label: 'صيانة متنقلة', icon: '🚚' },
  { id: 'سحب سيارات', label: 'ونش وسحب 24/7', icon: '🚨' },
];

const PROVINCE_OPTIONS = [
  'عمّان', 'إربد', 'الزرقاء', 'العقبة', 'البلقاء', 'الكرك', 'المفرق', 'معان', 'الطفيلة', 'عجلون', 'جرش', 'مادبا'
];

const ESTIMATOR_SERVICES: Record<string, { label: string; min: number; max: number; note: string }> = {
  oil_change: { label: 'تغيير زيت وفلتر أصلي', min: 25, max: 55, note: 'يعتمد على نوع الزيت وسعة المحرك' },
  computer_scan: { label: 'فحص كمبيوتر وشامل', min: 10, max: 25, note: 'يشمل قراءة جميع الأعطال وكشوف الميكانيك' },
  hybrid_check: { label: 'فحص بطارية وجهاز الهايبرد', min: 15, max: 35, note: 'اختبار خلايا البطارية والأنظمة الكهروميكانيكية' },
  brake_pads: { label: 'تبديل بريكات أمامي وخلفي', min: 30, max: 80, note: 'شامل الفحمات والتركيب والخراطة' },
  spark_plugs: { label: 'تبديل بواجي وتنظيف بخاخات', min: 25, max: 60, note: 'تحسين مصروف البنزين وعزم السيارة' },
  ac_recharge: { label: 'تعبئة غاز مكيف وفحص التسريب', min: 15, max: 30, note: 'غاز أمريكي/إيطالي أصلي مع زيت الكمبروسر' },
  tires_balance: { label: 'ميزان مائي وترصيص إطارات', min: 10, max: 25, note: 'ضبط الهيئة الأمامية والخلفية' },
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-b border-emerald-500/10 py-12 md:py-16">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container-custom relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>دليل ورش السيارات الأول في المملكة الأردنية</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                اعثر على أفضل <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">ورش الصيانة</span> الموثوقة
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                احجز موعداً فورياً، قارن الأسعار، وتواصل مباشرة مع فنيين متخصصين وصيانة هايبرد وكهرباء معتمدة في كافة المحافظات.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <button
                onClick={() => setShowCostEstimator(true)}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold text-sm hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                حاسبة تكاليف الإصلاح
              </button>

              {isAuthenticated ? (
                <Link
                  href="/workshops/create"
                  className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  أضف ورشتك الآن
                </Link>
              ) : (
                <Link
                  href="/auth/login?redirect=/workshops/create"
                  className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
                >
                  <Store className="w-4 h-4 text-emerald-400" />
                  سجّل ورشتك مجاناً
                </Link>
              )}
            </div>
          </div>

          {/* Quick Roadside Assistance Alert Widget */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-rose-950/60 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white text-sm font-bold flex items-center gap-2">
                  عطل مفاجئ على الطريق أو بحاجة لـ ونش سحب 24/7؟
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  ابحث عن الورش التي تقدم خدمة الونش السريع أو الصيانة المتنقلة الفورية في موقعك.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setHasTowingOnly(true); setPage(1); }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 transition-colors"
            >
              عرض الورش ذات خدمة الونش والطوارئ 🚨
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom pt-8">
        {/* Quick Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          {CATEGORY_CHIPS.map((chip) => {
            const isActive = filterService === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => { setFilterService(chip.id); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Main Filter Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchWorkshops(); } }}
                placeholder="ابحث باسم الورشة، المدينة، أو تخصص الفحص..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 text-white px-4 py-3.5 pr-11 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl border text-sm font-semibold transition-all ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>الفلاتر</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-emerald-500 text-slate-950 text-xs rounded-full flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="px-4 py-3.5 rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 text-sm outline-none focus:border-emerald-500 appearance-none cursor-pointer font-medium"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <button
                onClick={() => { setPage(1); fetchWorkshops(); }}
                className="px-6 py-3.5 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/20"
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
                className="p-6 rounded-3xl border border-slate-800 bg-slate-900/95 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-400" />
                    تصفية نتائج البحث المتقدمة
                  </h3>
                  {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="text-xs text-rose-400 hover:underline">
                      مسح كافة الفلاتر ({activeFilterCount})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">المحافظة</label>
                    <select
                      value={filterProvince}
                      onChange={(e) => { setFilterProvince(e.target.value); setPage(1); }}
                      className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="">جميع المحافظات</option>
                      {PROVINCE_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Feature Checkboxes */}
                  <div className="col-span-1 sm:col-span-2 md:col-span-2 flex flex-wrap items-center gap-3 pt-4 sm:pt-6">
                    <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${verifiedOnly ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      <input type="checkbox" checked={verifiedOnly} onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }} className="hidden" />
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>ورش معتمدة وموثّقة فقط</span>
                    </label>

                    <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${isMobileOnly ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      <input type="checkbox" checked={isMobileOnly} onChange={(e) => { setIsMobileOnly(e.target.checked); setPage(1); }} className="hidden" />
                      <Truck className="w-3.5 h-3.5" />
                      <span>خدمة صيانة متنقلة</span>
                    </label>

                    <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${hasTowingOnly ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      <input type="checkbox" checked={hasTowingOnly} onChange={(e) => { setHasTowingOnly(e.target.checked); setPage(1); }} className="hidden" />
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>خدمة ونش وطوارئ 24/7</span>
                    </label>

                    <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${hasWarrantyOnly ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      <input type="checkbox" checked={hasWarrantyOnly} onChange={(e) => { setHasWarrantyOnly(e.target.checked); setPage(1); }} className="hidden" />
                      <Award className="w-3.5 h-3.5" />
                      <span>تقدم كفالة وضمان إصلاح</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-400 text-sm font-medium">
            {loading ? 'جاري التحميل...' : `عرض ${total} ورشة صيانة متوفرة`}
          </p>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 animate-pulse">
                <div className="h-44 bg-slate-800 rounded-2xl" />
                <div className="h-5 bg-slate-800 rounded w-2/3" />
                <div className="h-4 bg-slate-800 rounded w-1/2" />
                <div className="h-10 bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : workshops.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8">
            <Store className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">لم نجد ورشات تطابق البحث</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              جرب تغيير خيارات التصفية أو إلغاء تحديد بعض الفلاتر لعرض نتائج أكثر.
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all"
            >
              إعادة ضبط جميع الفلاتر
            </button>
          </div>
        ) : (
          /* Workshop Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workshops.map((ws) => (
              <motion.div
                key={ws.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative rounded-3xl border border-slate-800/80 bg-slate-900/80 hover:bg-slate-900 hover:border-emerald-500/40 transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-emerald-500/5"
              >
                {/* Cover Image & Badges */}
                <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                  {ws.coverImage ? (
                    <Image
                      src={ws.coverImage}
                      alt={ws.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
                      <Wrench className="w-14 h-14 text-slate-800" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
                    {ws.isVerified && (
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center gap-1 shadow-md">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        ورشة معتمدة
                      </span>
                    )}
                    {ws.hasTowingService && (
                      <span className="px-2 py-1 rounded-xl text-[10px] font-bold bg-rose-600/90 text-white flex items-center gap-1">
                        🚨 ونش 24/7
                      </span>
                    )}
                  </div>

                  {/* Discount Offer Badge */}
                  {ws.discountOffer && (
                    <div className="absolute bottom-3 right-3 left-3 bg-emerald-500/90 backdrop-blur-md text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl truncate">
                      🏷️ {ws.discountOffer}
                    </div>
                  )}
                </div>

                {/* Card Main Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-12 h-12 rounded-2xl border-2 border-slate-700 bg-slate-950 overflow-hidden shrink-0 relative flex items-center justify-center">
                        {ws.logo ? (
                          <Image src={ws.logo} alt={ws.name} fill className="object-cover" />
                        ) : (
                          <Wrench className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/workshops/${ws.id}`}>
                          <h3 className="font-bold text-white text-base hover:text-emerald-400 transition-colors truncate">
                            {ws.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{ws.address || 'الأردن'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rating & Stats */}
                    <div className="flex items-center justify-between text-xs py-2 border-y border-slate-800/80 my-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center text-amber-400">
                          <Star className="w-4 h-4 fill-amber-400" />
                        </div>
                        <span className="font-bold text-white text-sm">{ws.rating > 0 ? ws.rating.toFixed(1) : '5.0'}</span>
                        <span className="text-slate-500">({ws.reviewCount} تقييم)</span>
                      </div>

                      {ws.hasWarranty && (
                        <span className="text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                          🛡️ كفالة {ws.warrantyPeriod || ''}
                        </span>
                      )}
                    </div>

                    {/* Services Chips */}
                    {ws.services && ws.services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {ws.services.slice(0, 4).map((s) => (
                          <span key={s.id} className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-[11px] font-medium">
                            {s.name}
                          </span>
                        ))}
                        {ws.services.length > 4 && (
                          <span className="px-2 py-1 rounded-xl bg-slate-800 text-slate-400 text-[10px]">
                            +{ws.services.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/workshops/${ws.id}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md shadow-emerald-600/15"
                      >
                        عرض الصفحة
                      </Link>

                      <Link
                        href={`/workshops/${ws.id}#book`}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        حجز موعد
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {(ws.phone || ws.user?.phone) && (
                        <a
                          href={`tel:${ws.phone || ws.user?.phone}`}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                        >
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>اتصال</span>
                        </a>
                      )}
                      {(ws.whatsapp || ws.user?.whatsapp || ws.phone) && (
                        <a
                          href={`https://wa.me/${(ws.whatsapp || ws.phone || '').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-400" />
                          <span>واتساب</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pNum = i + 1;
              return (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                    page === pNum
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Interactive AI Repair Cost Estimator Modal */}
      <AnimatePresence>
        {showCostEstimator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowCostEstimator(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-amber-500/30 bg-slate-900 p-6 md:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg">حاسبة تقدير تكاليف الصيانة في الأردن</h3>
                    <p className="text-slate-400 text-xs">تقدير متوسط أسعار الخدمات لدى الورش المعتمدة</p>
                  </div>
                </div>

                <button onClick={() => setShowCostEstimator(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الخدمة المطلوبة</label>
                  <select
                    value={estSelected}
                    onChange={(e) => setEstSelected(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-amber-400"
                  >
                    {Object.entries(ESTIMATOR_SERVICES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع محرك / فئة السيارة</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['بنزين', 'هايبرد', 'كهرباء'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setEstCarType(type)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          estCarType === type
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimation Result Display */}
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                    <span>التكلفة التقريبية المتوقعة:</span>
                    <span>شامل أجور اليد والقطع</span>
                  </div>
                  <div className="text-3xl font-black text-white flex items-baseline gap-2">
                    <span>{ESTIMATOR_SERVICES[estSelected].min} - {ESTIMATOR_SERVICES[estSelected].max}</span>
                    <span className="text-sm font-bold text-amber-400">دينار أردني (د.أ)</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed pt-1">
                    💡 {ESTIMATOR_SERVICES[estSelected].note}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const label = ESTIMATOR_SERVICES[estSelected].label;
                    setFilterService(label.split(' ')[0]);
                    setShowCostEstimator(false);
                    setPage(1);
                  }}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors"
                >
                  ابحث عن ورش تقدم هذه الخدمة 🔍
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
