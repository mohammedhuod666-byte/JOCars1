'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, SlidersHorizontal, X, MapPin, Loader2, Settings, Gauge, Cpu,
  Phone, MessageCircle, ShieldCheck, Truck, Sparkles, Filter, ChevronLeft, Wrench,
  AlertTriangle, CheckCircle2, Tag, Cog, Zap, Disc, Snowflake, Lightbulb,
  Layers, Armchair, Flame, CircleDot, Layers2
} from 'lucide-react';
import type { UsedPart } from '@/types';
import { formatPrice } from '@/lib/utils';

const PART_CATEGORIES = [
  { value: '', label: 'كافة قطع الغيار', icon: Layers2 },
  { value: 'engine', label: 'المحرك وملحقاته', icon: Cpu },
  { value: 'transmission', label: 'الجير ونظام الدفع', icon: Cog },
  { value: 'hybrid', label: 'الهايبرد والكهرباء', icon: Zap },
  { value: 'brake', label: 'الفرامل وABS', icon: Disc },
  { value: 'suspension', label: 'الهيئة والتعليق', icon: Gauge },
  { value: 'cooling', label: 'التبريد والمكيف', icon: Snowflake },
  { value: 'electrical', label: 'الإنارة والكهرباء', icon: Lightbulb },
  { value: 'body', label: 'الهيكل والبودي', icon: Layers },
  { value: 'interior', label: 'المقصورة والفرش', icon: Armchair },
  { value: 'exhaust', label: 'العادم والتيربو', icon: Flame },
  { value: 'wheel', label: 'الجنوط والإطارات', icon: CircleDot },
];

const CONDITIONS = [
  { value: 'USED', label: 'مستعملة أصلية (سكراب / تشليح)' },
  { value: 'NEW', label: 'جديدة وكالة أصلية' },
  { value: 'REFURBISHED', label: 'مُجددة ومفحوصة بكفالة' },
];

export default function PartsPage() {
  const [parts, setParts] = useState<UsedPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [partType, setPartType] = useState('');
  const [condition, setCondition] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([]);
  const [cityId, setCityId] = useState('');
  const [brands, setBrands] = useState<{ id: string; nameAr: string }[]>([]);
  const [brandId, setBrandId] = useState('');

  useEffect(() => {
    fetchParts();
    fetch('/api/cars/cities').then((r) => r.json()).then((d) => setCities(d.data || [])).catch(() => {});
    fetch('/api/cars/brands').then((r) => r.json()).then((d) => setBrands(d.data || [])).catch(() => {});
  }, []);

  const fetchParts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (partType) params.append('partType', partType);
    if (condition) params.append('condition', condition);
    if (cityId) params.append('cityId', cityId);
    if (brandId) params.append('brandId', brandId);
    try {
      const res = await fetch(`/api/parts?${params}`);
      const data = await res.json();
      setParts(data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getImages = (part: UsedPart): string[] => {
    try {
      return JSON.parse(part.images || '[]');
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 pb-24">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#121622] via-[#0d1017] to-[#080a0f] border-b border-white/[0.08] py-10 sm:py-16">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-custom relative z-10 max-w-6xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>سوق قطع الغيار المتخصص في الأردن</span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                سوق <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">قطع الغيار الأصلية والمستعملة</span>
              </h1>

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                ابحث واشترِ محركات، جيرات، بطاريات هايبرد، هيئات كاملة، وقطع بودي مفحوصة ومكفولة في عمان والزرقاء وإربد وكافة محافظات المملكة.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/parts/add"
                className="flex items-center justify-center gap-2 px-5 sm:px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all cursor-pointer active:scale-95 w-full sm:w-auto"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>أضف إعلان قطعة غيار</span>
              </Link>
            </div>

          </div>

          {/* Anti-Scam Buyer Guidance Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-300 font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>ميثاق كارس جو للشراء الآمن: طابق رقم OEM وافحص القطعة في الورشة قبل دفع أي مبالغ. يُحظر دفع العربون مسبقاً.</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-black self-end sm:self-auto shrink-0 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              معاينة وتجربة قبل الدفع
            </span>
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2 scrollbar-none">
            {PART_CATEGORIES.map((cat) => {
              const isSelected = partType === cat.value;
              const IconComp = cat.icon;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setPartType(cat.value);
                    setTimeout(fetchParts, 0);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20 scale-[1.02]'
                      : 'bg-[#121622] text-slate-300 border-white/[0.08] hover:border-amber-400/40 hover:text-white'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      <div className="container-custom max-w-6xl pt-6 sm:pt-8 space-y-6">
        
        {/* Search & Main Filters Bar */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchParts()}
              placeholder="ابحث عن اسم القطعة، رقم OEM، أو الموديل المتوافق..."
              className="w-full h-12 rounded-2xl border border-white/[0.08] bg-[#121622] text-white px-4 pr-11 text-xs sm:text-sm outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                showFilters
                  ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                  : 'bg-[#121622] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>فلترة متقدمة</span>
            </button>

            <button
              onClick={fetchParts}
              className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              بحث
            </button>
          </div>
        </div>

        {/* Extended Filters Card */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-5 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-4 overflow-hidden shadow-2xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">حالة القطعة</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-white/[0.08] bg-[#0c0e15] text-white text-xs outline-none focus:border-amber-400"
                  >
                    <option value="">جميع الحالات</option>
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value} className="bg-[#121622]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">ماركة السيارة</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-white/[0.08] bg-[#0c0e15] text-white text-xs outline-none focus:border-amber-400"
                  >
                    <option value="">جميع الماركات (تويوتا، كيا، هيونداي...)</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id} className="bg-[#121622]">
                        {b.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">المحافظة</label>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-white/[0.08] bg-[#0c0e15] text-white text-xs outline-none focus:border-amber-400"
                  >
                    <option value="">جميع المحافظات</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#121622]">
                        {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={fetchParts}
                  className="px-5 py-2.5 bg-amber-400 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-300 transition-colors cursor-pointer"
                >
                  تطبيق الفلترة
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Parts Grid Listing */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
            <p className="text-slate-400 text-xs animate-pulse font-medium">جاري جلب قائمة قطع الغيار المتاحة...</p>
          </div>
        ) : parts.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-[#121622] border border-white/[0.08] space-y-4">
            <Cpu className="w-14 h-14 mx-auto text-slate-600" />
            <h3 className="text-lg sm:text-xl font-bold text-white">لا توجد قطع غيار مطابقة للبحث حالياً</h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
              جرب تغيير كلمات البحث، إزالة بعض الفلاتر، أو أضف إعلان طلب قطعة في المنتدى ليتواصل معك أصحاب محلات السكراب.
            </p>
            <Link
              href="/parts/add"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>كن أول من يضيف هذه القطعة</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {parts.map((part, index) => {
              const images = getImages(part);
              const isNew = part.condition === 'NEW';
              const isRefurbished = part.condition === 'REFURBISHED';

              return (
                <motion.div
                  key={part.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link
                    href={`/parts/${part.slug}`}
                    className="group block rounded-3xl bg-[#121622] border border-white/[0.08] overflow-hidden hover:border-amber-400/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/5 flex flex-col h-full"
                  >
                    
                    {/* Image Thumbnail Header */}
                    <div className="aspect-[16/10] bg-[#0c0e15] relative overflow-hidden">
                      {images[0] ? (
                        <img
                          src={images[0]}
                          alt={part.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <Cpu className="w-12 h-12" />
                        </div>
                      )}

                      {/* Top Condition Badges */}
                      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1">
                        {isNew && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500 text-slate-950 shadow-md">
                            جديدة وكالة
                          </span>
                        )}
                        {isRefurbished && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-400 text-slate-950 shadow-md">
                            مُجددة ومفحوصة
                          </span>
                        )}
                        {!isNew && !isRefurbished && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/75 backdrop-blur-md text-slate-300 border border-white/10">
                            مستعملة أصلية
                          </span>
                        )}
                      </div>

                      {/* Warranty & Delivery Badges */}
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                        {part.hasWarranty && (
                          <span className="px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>مكفولة</span>
                          </span>
                        )}
                        {part.hasDelivery && (
                          <span className="px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-cyan-400 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            <span>توصيل</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                          {part.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          {part.brand && (
                            <span className="font-semibold text-slate-300">
                              {part.brand.nameAr}
                            </span>
                          )}
                          {part.oemNumber && (
                            <span className="font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.06] text-amber-300">
                              OEM: {part.oemNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price & Location Row */}
                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <div>
                          <p className="text-lg font-black text-amber-400">{formatPrice(part.price)}</p>
                          {part.isNegotiable && (
                            <span className="text-[10px] font-semibold text-emerald-400">قابل للتفاوض</span>
                          )}
                        </div>

                        {part.city && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{part.city.nameAr}</span>
                          </span>
                        )}
                      </div>

                    </div>

                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
