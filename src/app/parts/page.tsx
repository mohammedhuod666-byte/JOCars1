'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, SlidersHorizontal, X, MapPin, Loader2, Settings, Gauge, Cpu,
  Phone, MessageCircle, ShieldCheck, Truck, Sparkles, Filter, ChevronLeft, Wrench
} from 'lucide-react';
import type { UsedPart } from '@/types';
import { formatPrice } from '@/lib/utils';

const PART_TYPES = [
  { value: 'engine', label: 'محرك وفواصل', icon: '' },
  { value: 'transmission', label: 'جير وفتيس', icon: '' },
  { value: 'body', label: 'هيكل وبودي', icon: '' },
  { value: 'electrical', label: 'كهرباء وإلكترونيات', icon: '' },
  { value: 'suspension', label: 'تعليق وهيئة', icon: '' },
  { value: 'brake', label: 'فرامل وبريكات', icon: '' },
  { value: 'cooling', label: 'تبريد وراديتر', icon: '' },
  { value: 'exhaust', label: 'عادم واكزوزت', icon: '' },
  { value: 'interior', label: 'فرش وداخلي', icon: '' },
  { value: 'wheel', label: 'جنوط وإطارات', icon: '' },
  { value: 'turbo', label: 'توربو وسوبر', icon: '' },
  { value: 'ac', label: 'مكيف وكمبروسر', icon: '' },
  { value: 'other', label: 'قطع متنوعة', icon: '' },
];

const CONDITIONS = [
  { value: 'NEW', label: 'جديدة وكالة ' },
  { value: 'USED', label: 'مستعملة أصلية ' },
  { value: 'REFURBISHED', label: 'مُجددة ومفحوصة ' },
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
    fetch('/api/cars/cities').then(r => r.json()).then(d => setCities(d.data || [])).catch(() => {});
    fetch('/api/cars/brands').then(r => r.json()).then(d => setBrands(d.data || [])).catch(() => {});
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
    } catch {} finally { setLoading(false); }
  };

  const getImages = (part: UsedPart): string[] => {
    try { return JSON.parse(part.images || '[]'); } catch { return []; }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-950 border-b border-blue-500/10 py-12 md:py-16">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-custom relative z-10 max-w-6xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>سوق قطع الغيار المتخصص في الأردن </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                سوق <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">قطع الغيار الأصلية والمستعملة</span>
              </h1>

              <p className="text-slate-400 text-sm leading-relaxed">
                تصفح واشترِ محركات، جيرات، هيئات كاملة، وقطع بودي لجميع أنواع السيارات الأردنية مع ضمان التوافق والكفالة والتوصيل.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/parts/add"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-slate-950 font-black text-sm shadow-xl shadow-blue-500/20 transition-all"
              >
                <Plus className="w-4.5 h-4.5" />
                أضف إعلان قطعة غيار
              </Link>
            </div>

          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-4 scrollbar-none">
            <button
              onClick={() => { setPartType(''); setTimeout(fetchParts, 0); }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                partType === ''
                  ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-md shadow-blue-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              الكل 
            </button>
            {PART_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => { setPartType(t.value); setTimeout(fetchParts, 0); }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  partType === t.value
                    ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-md shadow-blue-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{t.label}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      <div className="container-custom max-w-6xl pt-8 space-y-6">
        
        {/* Search & Main Filters Bar */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchParts()}
              placeholder="ابحث عن اسم القطعة، رقم OEM، أو الموديل..."
              className="w-full h-12 rounded-2xl border border-slate-800 bg-slate-900 text-white px-4 pr-11 text-sm outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                showFilters ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>فلترة متقدمة</span>
            </button>

            <button
              onClick={fetchParts}
              className="flex-1 md:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-blue-600/20"
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
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">الحالة</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-blue-500"
                  >
                    <option value="">جميع الحالات</option>
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">ماركة السيارة</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-blue-500"
                  >
                    <option value="">جميع الماركات</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">المحافظة</label>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-blue-500"
                  >
                    <option value="">جميع المحافظات</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={fetchParts}
                  className="px-5 py-2.5 bg-blue-500 text-slate-950 font-black text-xs rounded-xl hover:bg-blue-400 transition-colors"
                >
                  تطبيق الفلترة
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Parts Grid Listing */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
            <p className="text-slate-400 text-xs animate-pulse">جاري جلب قائمة قطع الغيار...</p>
          </div>
        ) : parts.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
            <Cpu className="w-14 h-14 mx-auto text-slate-600" />
            <h3 className="text-xl font-bold text-white">لا توجد قطع غيار متاحة بهذا البحث</h3>
            <p className="text-slate-400 text-xs">جرب تغيير كلمات البحث أو تصفح الأقسام الأخرى.</p>
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
                    className="group block rounded-3xl bg-slate-900/80 border border-slate-800/90 overflow-hidden hover:border-blue-500/40 hover:bg-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/5 flex flex-col h-full"
                  >
                    
                    {/* Image Thumbnail Header */}
                    <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden">
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

                      {/* Top Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black backdrop-blur-md bg-slate-950/80 border border-slate-800 text-slate-200">
                          {PART_TYPES.find(t => t.value === part.partType)?.label || part.partType}
                        </span>

                        {isNew && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500 text-slate-950 shadow-md">
                            جديدة وكالة 
                          </span>
                        )}
                        {isRefurbished && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-500 text-slate-950 shadow-md">
                            مُجددة 
                          </span>
                        )}
                      </div>

                      {/* Warranty & Delivery Icons */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1">
                        {part.hasWarranty && (
                          <span className="p-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30" title="كافلة مجربة">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {part.hasDelivery && (
                          <span className="p-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-cyan-400 border border-cyan-500/30" title="توصيل متاح">
                            <Truck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors line-clamp-1">
                          {part.title}
                        </h3>

                        {part.brand && (
                          <span className="text-[11px] text-slate-400 block font-semibold">
                            ماركة {part.brand.nameAr}
                          </span>
                        )}
                      </div>

                      {/* Price & Location Row */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          <p className="text-xl font-black text-blue-400">{formatPrice(part.price)}</p>
                          {part.isNegotiable && (
                            <span className="text-[10px] font-bold text-emerald-400">قابل للتفاوض</span>
                          )}
                        </div>

                        {part.city && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {part.city.nameAr}
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
