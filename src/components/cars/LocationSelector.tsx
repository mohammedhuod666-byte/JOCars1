'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Search, ChevronDown, Check, X, Building2, Compass, AlertCircle } from 'lucide-react';

export interface ProvinceItem {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  _count?: { cities: number };
}

export interface CityItem {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  provinceId?: string | null;
  province?: {
    id: string;
    nameAr: string;
    nameEn: string;
    slug: string;
  } | null;
}

interface Props {
  provinces: ProvinceItem[];
  cities: CityItem[];
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  error?: string;
}

export function LocationSelector({
  provinces,
  cities,
  selectedCityId,
  onCityChange,
  error,
}: Props) {
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const provinceRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Identify currently selected city and its province
  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId),
    [cities, selectedCityId]
  );

  // Sync selectedProvinceId if a city was already selected
  useEffect(() => {
    if (selectedCity?.provinceId && !selectedProvinceId) {
      setSelectedProvinceId(selectedCity.provinceId);
    }
  }, [selectedCity, selectedProvinceId]);

  // Selected Province Object
  const selectedProvince = useMemo(() => {
    if (selectedProvinceId) {
      return provinces.find((p) => p.id === selectedProvinceId);
    }
    if (selectedCity?.provinceId) {
      return provinces.find((p) => p.id === selectedCity.provinceId);
    }
    return null;
  }, [provinces, selectedProvinceId, selectedCity]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (provinceRef.current && !provinceRef.current.contains(e.target as Node)) {
        setProvinceOpen(false);
      }
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) {
        setAreaOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opening area dropdown
  useEffect(() => {
    if (areaOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    } else {
      setSearchQuery('');
    }
  }, [areaOpen]);

  // Cities filtered by selected governorate
  const governorateCities = useMemo(() => {
    if (!selectedProvince) return [];
    return cities.filter(
      (c) => c.provinceId === selectedProvince.id || c.province?.id === selectedProvince.id
    );
  }, [cities, selectedProvince]);

  // Areas filtered by search (if searching inside governorate or globally)
  const filteredAreas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return governorateCities;

    // If searching, search across governorate cities first; if none, search across all Jordan
    const inGov = governorateCities.filter((c) =>
      c.nameAr.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q)
    );

    if (inGov.length > 0) return inGov;

    // Global search across all Jordan if not found in current governorate
    return cities.filter((c) =>
      c.nameAr.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q)
    );
  }, [governorateCities, cities, searchQuery]);

  // Handle province selection
  const handleSelectProvince = (provId: string) => {
    setSelectedProvinceId(provId);
    setProvinceOpen(false);
    // If current selected city does not belong to new province, clear it
    if (selectedCity && selectedCity.provinceId !== provId) {
      onCityChange('');
    }
    // Open area selection automatically
    setTimeout(() => setAreaOpen(true), 120);
  };

  // Handle area selection
  const handleSelectArea = (city: CityItem) => {
    onCityChange(city.id);
    if (city.provinceId) {
      setSelectedProvinceId(city.provinceId);
    }
    setAreaOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Label and Quick Overview */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>المحافظة والمنطقة / القرية</span>
          <span className="text-amber-400">*</span>
        </label>
        {selectedCity && selectedProvince && (
          <span className="text-[11px] font-bold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
            {selectedProvince.nameAr} — {selectedCity.nameAr}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* ── 1. Governorate Selector (المحافظة) ── */}
        <div ref={provinceRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setProvinceOpen(!provinceOpen);
              setAreaOpen(false);
            }}
            className={`w-full h-12 px-4 rounded-2xl bg-[#0f131d] border text-right flex items-center justify-between transition-all outline-none ${
              provinceOpen
                ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                : error && !selectedProvince
                ? 'border-rose-500/80 bg-rose-500/[0.03]'
                : 'border-white/[0.1] hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium leading-none">المحافظة</p>
                <p className="text-sm font-black text-white mt-0.5 truncate">
                  {selectedProvince ? selectedProvince.nameAr : 'اختر المحافظة...'}
                </p>
              </div>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                provinceOpen ? 'rotate-180 text-amber-400' : ''
              }`}
            />
          </button>

          {/* Governorate Dropdown */}
          {provinceOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-[#0e121a]/95 border border-white/[0.12] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-2 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1.5 text-[11px] font-bold text-amber-400 border-b border-white/[0.06] mb-1 flex items-center justify-between">
                <span>المحافظات الـ 12 في الأردن</span>
                <span className="text-[10px] text-slate-400 font-normal">اختر للتصنيف</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1">
                {provinces.map((prov) => {
                  const active = selectedProvinceId === prov.id;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => handleSelectProvince(prov.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-right transition-all border ${
                        active
                          ? 'bg-amber-400 text-slate-950 font-black border-amber-400 shadow-md'
                          : 'bg-white/[0.03] text-slate-200 border-white/[0.06] hover:bg-amber-400/10 hover:border-amber-400/40 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold">{prov.nameAr}</span>
                      {active ? (
                        <Check className="w-3.5 h-3.5 text-slate-950" />
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {prov._count?.cities || ''}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── 2. Area / Village / Neighborhood Selector (المنطقة والقرية مع البحث) ── */}
        <div ref={areaRef} className="relative">
          <button
            type="button"
            disabled={!selectedProvince}
            onClick={() => {
              if (!selectedProvince) return;
              setAreaOpen(!areaOpen);
              setProvinceOpen(false);
            }}
            className={`w-full h-12 px-4 rounded-2xl bg-[#0f131d] border text-right flex items-center justify-between transition-all outline-none ${
              !selectedProvince
                ? 'opacity-50 cursor-not-allowed border-white/[0.05]'
                : areaOpen
                ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                : error && !selectedCityId
                ? 'border-rose-500/80 bg-rose-500/[0.03]'
                : 'border-white/[0.1] hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shrink-0">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium leading-none">
                  {selectedProvince ? `المنطقة أو القرية في ${selectedProvince.nameAr}` : 'المنطقة أو القرية'}
                </p>
                <p className="text-sm font-black text-white mt-0.5 truncate">
                  {selectedCity ? selectedCity.nameAr : selectedProvince ? 'ابحث أو اختر منطقتك...' : 'اختر المحافظة أولاً'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              {selectedCity && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCityChange('');
                  }}
                  className="p-1 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                  title="مسح المنطقة"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  areaOpen ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </div>
          </button>

          {/* Area Search and Scrollable Dropdown */}
          {areaOpen && selectedProvince && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-[#0e121a]/95 border border-white/[0.12] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Search Box Header */}
              <div className="p-3 border-b border-white/[0.08] bg-[#121622]/90">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`ابحث واكتب اسم منطقتك أو قريتك في ${selectedProvince.nameAr}...`}
                    className="w-full h-10 pr-9 pl-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 outline-none focus:border-amber-400 focus:bg-white/[0.06] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute left-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Popular areas in this governorate */}
                {!searchQuery && governorateCities.length > 0 && (
                  <div className="mt-2.5">
                    <p className="text-[10px] font-bold text-amber-400 mb-1.5">
                      مناطق شائعة في {selectedProvince.nameAr}:
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto no-scrollbar">
                      {governorateCities.slice(0, 8).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectArea(c)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all ${
                            selectedCityId === c.id
                              ? 'bg-amber-400 text-slate-950 border-amber-400'
                              : 'bg-white/[0.03] text-slate-300 border-white/[0.08] hover:border-amber-400/40 hover:text-white'
                          }`}
                        >
                          {c.nameAr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Areas Scrollable List */}
              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                {filteredAreas.length > 0 ? (
                  filteredAreas.map((city) => {
                    const active = selectedCityId === city.id;
                    const isOtherGov = city.provinceId && city.provinceId !== selectedProvince.id;
                    return (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleSelectArea(city)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-all ${
                          active
                            ? 'bg-amber-400/15 text-amber-300 font-bold border border-amber-400/30'
                            : 'text-slate-200 hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-xs font-bold">{city.nameAr}</span>
                          {isOtherGov && city.province && (
                            <span className="text-[10px] text-slate-400 font-normal bg-white/[0.04] px-1.5 py-0.5 rounded">
                              ({city.province.nameAr})
                            </span>
                          )}
                        </div>
                        {active && <Check className="w-4 h-4 text-amber-400" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                    <p>لا توجد منطقة مطابقة لـ «{searchQuery}» في {selectedProvince.nameAr}</p>
                    <p className="text-[11px] text-slate-500">جرب كتابة جزء من اسم القرية أو الحي</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-1 text-rose-400 text-xs mt-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
