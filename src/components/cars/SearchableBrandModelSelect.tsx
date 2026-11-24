'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Sparkles, Car, AlertCircle, Plus } from 'lucide-react';

export interface BrandItem {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
}

export interface ModelItem {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  brandId?: string;
}

// Top Popular Brands in Jordan (priority ordering)
const POPULAR_JORDAN_SLUGS = [
  'toyota', 'hyundai', 'kia', 'mercedes', 'bmw', 'volkswagen',
  'byd', 'changan', 'geely', 'nissan', 'tesla', 'ford',
  'mitsubishi', 'lexus', 'mg', 'honda', 'audi', 'porsche', 'land-rover'
];

interface Props {
  brands: BrandItem[];
  models: ModelItem[];
  selectedBrandId: string;
  selectedModelId: string;
  onBrandChange: (brandId: string) => void;
  onModelChange: (modelId: string) => void;
  brandError?: string;
  modelError?: string;
}

export function SearchableBrandModelSelect({
  brands,
  models,
  selectedBrandId,
  selectedModelId,
  onBrandChange,
  onModelChange,
  brandError,
  modelError,
}: Props) {
  const [brandOpen, setBrandOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  const brandRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) {
        setBrandOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opening
  useEffect(() => {
    if (brandOpen) {
      setTimeout(() => brandInputRef.current?.focus(), 50);
    } else {
      setBrandSearch('');
    }
  }, [brandOpen]);

  useEffect(() => {
    if (modelOpen) {
      setTimeout(() => modelInputRef.current?.focus(), 50);
    } else {
      setModelSearch('');
    }
  }, [modelOpen]);

  // Selected Brand and Model objects
  const selectedBrand = useMemo(
    () => brands.find((b) => b.id === selectedBrandId),
    [brands, selectedBrandId]
  );

  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId),
    [models, selectedModelId]
  );

  // Split brands into Popular in Jordan vs Other, sorted properly
  const { popularBrands, otherBrands, filteredBrands } = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();

    // If searching, filter all brands
    if (q) {
      const filtered = brands.filter(
        (b) =>
          b.nameAr.toLowerCase().includes(q) ||
          b.nameEn.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q)
      );
      return { popularBrands: [], otherBrands: [], filteredBrands: filtered };
    }

    // Default view: popular first, then alphabetically
    const popular: BrandItem[] = [];
    const other: BrandItem[] = [];

    // Order popular according to POPULAR_JORDAN_SLUGS
    for (const slug of POPULAR_JORDAN_SLUGS) {
      const found = brands.find((b) => b.slug === slug);
      if (found) popular.push(found);
    }

    for (const b of brands) {
      if (!POPULAR_JORDAN_SLUGS.includes(b.slug)) {
        other.push(b);
      }
    }

    other.sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));

    return { popularBrands: popular, otherBrands: other, filteredBrands: [] };
  }, [brands, brandSearch]);

  // Filter models based on search
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.nameAr.toLowerCase().includes(q) ||
        m.nameEn.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q)
    );
  }, [models, modelSearch]);

  const handleSelectBrand = (brandId: string) => {
    onBrandChange(brandId);
    setBrandOpen(false);
    // Automatically open model selector for fluid user flow
    setTimeout(() => setModelOpen(true), 150);
  };

  const handleSelectModel = (modelId: string) => {
    onModelChange(modelId);
    setModelOpen(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ── Brand Combobox ── */}
      <div ref={brandRef} className="relative">
        <label className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
          <span className="flex items-center gap-1.5">
            <span>الشركة المصنعة (الماركة)</span>
            <span className="text-amber-400">*</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            {brands.length} ماركة متوفرة
          </span>
        </label>

        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setBrandOpen(!brandOpen);
            setModelOpen(false);
          }}
          className={`w-full h-12 px-4 rounded-2xl bg-[#0f131d] border text-right flex items-center justify-between transition-all duration-200 outline-none ${
            brandOpen
              ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
              : brandError
              ? 'border-rose-500/80 bg-rose-500/[0.03]'
              : 'border-white/[0.1] hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-6 h-6 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-amber-400 shrink-0">
              <Car className="w-3.5 h-3.5" />
            </div>
            {selectedBrand ? (
              <div className="flex items-center gap-2 truncate">
                <span className="font-black text-white text-sm truncate">
                  {selectedBrand.nameAr}
                </span>
                <span className="text-xs text-slate-400 font-sans truncate">
                  ({selectedBrand.nameEn})
                </span>
              </div>
            ) : (
              <span className="text-slate-400 text-sm">ابحث أو اختر الماركة...</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            {selectedBrand && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onBrandChange('');
                  onModelChange('');
                }}
                className="p-1 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                title="مسح الاختيار"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                brandOpen ? 'rotate-180 text-amber-400' : ''
              }`}
            />
          </div>
        </button>

        {brandError && (
          <p className="flex items-center gap-1 text-rose-400 text-xs mt-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{brandError}</span>
          </p>
        )}

        {/* Dropdown Panel */}
        {brandOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-[#0e121a]/95 border border-white/[0.12] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Header */}
            <div className="p-3 border-b border-white/[0.08] bg-[#121622]/90">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                <input
                  ref={brandInputRef}
                  type="text"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder="ابحث بالاسم العربي أو الإنجليزي... (مثال: تويوتا، هيونداي، BYD)"
                  className="w-full h-10 pr-9 pl-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 outline-none focus:border-amber-400 focus:bg-white/[0.06] transition-all"
                />
                {brandSearch && (
                  <button
                    type="button"
                    onClick={() => setBrandSearch('')}
                    className="absolute left-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Popular Chips */}
              {!brandSearch && (
                <div className="mt-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 mb-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>الأكثر شيوعاً في الأردن:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                    {popularBrands.slice(0, 10).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleSelectBrand(b.id)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                          selectedBrandId === b.id
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-white/[0.03] text-slate-300 border-white/[0.08] hover:border-amber-400/40 hover:text-white hover:bg-amber-400/10'
                        }`}
                      >
                        {b.nameAr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Brands Scrollable List */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1 divide-y divide-white/[0.04]">
              {brandSearch ? (
                // Filtered List
                filteredBrands.length > 0 ? (
                  filteredBrands.map((b) => {
                    const active = b.id === selectedBrandId;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleSelectBrand(b.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-all ${
                          active
                            ? 'bg-amber-400/15 text-amber-300 font-bold border border-amber-400/30'
                            : 'text-slate-200 hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{b.nameAr}</span>
                          <span className="text-xs text-slate-400 font-sans font-normal">
                            {b.nameEn}
                          </span>
                        </div>
                        {active && <Check className="w-4 h-4 text-amber-400" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    لا توجد ماركة تطابق «{brandSearch}»
                  </div>
                )
              ) : (
                // Categorized list (Popular + All)
                <>
                  <div className="pt-1 pb-1">
                    <p className="px-2 text-[10px] font-bold text-slate-400 mb-1">
                      الشركات الأكثر مبيعاً في المملكة
                    </p>
                    {popularBrands.map((b) => {
                      const active = b.id === selectedBrandId;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => handleSelectBrand(b.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-right transition-all ${
                            active
                              ? 'bg-amber-400/15 text-amber-300 font-bold border border-amber-400/30'
                              : 'text-slate-200 hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">{b.nameAr}</span>
                            <span className="text-[11px] text-slate-400 font-sans">
                              {b.nameEn}
                            </span>
                          </div>
                          {active && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <p className="px-2 text-[10px] font-bold text-slate-400 mb-1">
                      باقي الماركات والوكالات
                    </p>
                    {otherBrands.map((b) => {
                      const active = b.id === selectedBrandId;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => handleSelectBrand(b.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-right transition-all ${
                            active
                              ? 'bg-amber-400/15 text-amber-300 font-bold border border-amber-400/30'
                              : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{b.nameAr}</span>
                            <span className="text-[11px] text-slate-400 font-sans">
                              {b.nameEn}
                            </span>
                          </div>
                          {active && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Model Combobox ── */}
      <div ref={modelRef} className="relative">
        <label className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
          <span className="flex items-center gap-1.5">
            <span>الموديل (الطراز)</span>
            <span className="text-amber-400">*</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            {selectedBrandId ? `${models.length} طراز متوفر` : 'اختر الماركة أولاً'}
          </span>
        </label>

        {/* Trigger Button */}
        <button
          type="button"
          disabled={!selectedBrandId}
          onClick={() => {
            if (!selectedBrandId) return;
            setModelOpen(!modelOpen);
            setBrandOpen(false);
          }}
          className={`w-full h-12 px-4 rounded-2xl bg-[#0f131d] border text-right flex items-center justify-between transition-all duration-200 outline-none ${
            !selectedBrandId
              ? 'opacity-50 cursor-not-allowed border-white/[0.05]'
              : modelOpen
              ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
              : modelError
              ? 'border-rose-500/80 bg-rose-500/[0.03]'
              : 'border-white/[0.1] hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {selectedModel ? (
              <div className="flex items-center gap-2 truncate">
                <span className="font-black text-white text-sm truncate">
                  {selectedModel.nameAr}
                </span>
                <span className="text-xs text-slate-400 font-sans truncate">
                  ({selectedModel.nameEn})
                </span>
              </div>
            ) : (
              <span className="text-slate-400 text-sm">
                {selectedBrandId ? 'ابحث أو اختر الطراز...' : 'اختر الماركة لتحديد الطراز'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            {selectedModel && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onModelChange('');
                }}
                className="p-1 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                title="مسح الاختيار"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                modelOpen ? 'rotate-180 text-amber-400' : ''
              }`}
            />
          </div>
        </button>

        {modelError && (
          <p className="flex items-center gap-1 text-rose-400 text-xs mt-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{modelError}</span>
          </p>
        )}

        {/* Dropdown Panel */}
        {modelOpen && selectedBrandId && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-[#0e121a]/95 border border-white/[0.12] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Header */}
            <div className="p-3 border-b border-white/[0.08] bg-[#121622]/90">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                <input
                  ref={modelInputRef}
                  type="text"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder={`ابحث في موديلات ${selectedBrand?.nameAr || ''}...`}
                  className="w-full h-10 pr-9 pl-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 outline-none focus:border-amber-400 focus:bg-white/[0.06] transition-all"
                />
                {modelSearch && (
                  <button
                    type="button"
                    onClick={() => setModelSearch('')}
                    className="absolute left-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick model chips */}
              {!modelSearch && models.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto no-scrollbar">
                  {models.slice(0, 6).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectModel(m.id)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all ${
                        selectedModelId === m.id
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : 'bg-white/[0.03] text-slate-300 border-white/[0.08] hover:border-amber-400/40 hover:text-white'
                      }`}
                    >
                      {m.nameAr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Models Scrollable List */}
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
              {filteredModels.length > 0 ? (
                filteredModels.map((m) => {
                  const active = m.id === selectedModelId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectModel(m.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-all ${
                        active
                          ? 'bg-amber-400/15 text-amber-300 font-bold border border-amber-400/30'
                          : 'text-slate-200 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{m.nameAr}</span>
                        <span className="text-xs text-slate-400 font-sans font-normal">
                          {m.nameEn}
                        </span>
                      </div>
                      {active && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                  <p>لا يوجد طراز يطابق «{modelSearch}»</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
