'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Zap, MapPin, Search, Phone, ShieldCheck, BatteryCharging, Clock, DollarSign, ExternalLink, Sparkles, Filter, Calculator, CheckCircle2, TrendingUp, Navigation, Fuel } from 'lucide-react';
import { STATIONS_DATA, Station } from './stations-data';

export default function EvChargingJordanPage() {
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'EV' | 'PETROL'>('ALL');
  
  // Geolocation for distances
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);  
    const dLon = (lon2 - lon1) * (Math.PI / 180); 
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const d = R * c; 
    return d.toFixed(1); 
  };

  const calculateUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => alert('الرجاء السماح بالوصول للموقع لحساب المسافة بدقة.')
      );
    }
  };

  const filteredStations = STATIONS_DATA.filter(st => {
    const matchesCity = selectedCity === 'ALL' || st.city === selectedCity;
    const matchesSearch = !searchQuery || st.name.includes(searchQuery) || st.address.includes(searchQuery) || (st.plugTypes && st.plugTypes.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())));
    let matchesType = true;
    if (selectedType === 'EV') matchesType = st.type === 'EV_ONLY' || st.type === 'HYBRID';
    if (selectedType === 'PETROL') matchesType = st.type === 'PETROL_ONLY' || st.type === 'HYBRID';
    
    return matchesCity && matchesSearch && matchesType;
  });

  const displayedStations = searchQuery ? filteredStations : filteredStations.slice(0, 30);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Header />
      <main className="container-custom max-w-6xl mx-auto px-4 py-8 flex-1 space-y-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden space-y-3">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/30 flex w-fit items-center gap-1.5">
            <Zap className="w-4 h-4" /> دليل محطات الأردن الشامل 🇯🇴
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white">دليل محطات الوقود وشحن السيارات الكهربائية بالأردن</h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">دليل تفاعلي لأبرز محطات الوقود (بنزين وديزل) ومحطات الشحن السريع (Fast DC & AC) المنتشرة في كافة محافظات المملكة. ابحث عن أقرب محطة إليك وتعرف على الخدمات المجاورة لها.</p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="relative w-full sm:w-80 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث باسم المحطة أو الموقع..." className="w-full h-11 pr-10 pl-4 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500" />
            </div>
            
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedType('ALL')} className={`px-4 py-2 rounded-xl text-xs font-black flex-1 transition-all ${selectedType === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>الكل</button>
              <button onClick={() => setSelectedType('PETROL')} className={`px-4 py-2 rounded-xl text-xs font-black flex-1 transition-all flex items-center justify-center gap-1 ${selectedType === 'PETROL' ? 'bg-amber-500 text-slate-900' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}><Fuel className="w-3.5 h-3.5"/> وقود</button>
              <button onClick={() => setSelectedType('EV')} className={`px-4 py-2 rounded-xl text-xs font-black flex-1 transition-all flex items-center justify-center gap-1 ${selectedType === 'EV' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}><Zap className="w-3.5 h-3.5"/> شحن</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
            {['ALL', 'عمان', 'إربد', 'الزرقاء', 'العقبة', 'السلط', 'البحر الميت', 'جرش', 'مأدبا', 'الكرك', 'معان'].map(city => (
              <button key={city} type="button" onClick={() => setSelectedCity(city)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${selectedCity === city ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'}`}>
                {city === 'ALL' ? 'كل المحافظات 🇯🇴' : city}
              </button>
            ))}
            <button onClick={calculateUserLocation} className="px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0">
              <Navigation className="w-4 h-4" /> الأقرب إلي
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center px-2">
          <p className="text-xs font-bold text-slate-400">
            تم العثور على <span className="text-emerald-400">{filteredStations.length}</span> محطة في قاعدة البيانات (من أصل {STATIONS_DATA.length}).
            {!searchQuery && " يتم عرض أقرب 30 محطة، استخدم البحث للعثور على محطة معينة."}
          </p>
        </div>

        <div className="space-y-4">
          {displayedStations.map(st => (
            <div key={st.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 font-bold shadow-inner ${st.type === 'PETROL_ONLY' ? 'bg-amber-950/50 border-amber-800/50 text-amber-500' : 'bg-slate-950 border-slate-800 text-emerald-400'}`}>
                  {st.type === 'PETROL_ONLY' ? <Fuel className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-white text-sm sm:text-base">{st.name}</h3>
                    {st.status === 'ONLINE' ? <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">متاحة الآن 🟢</span> : <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">مشغولة 🔴</span>}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> {st.address}</p>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-lg">✨ معالم قريبة: {st.nearby} {st.pricePerKwh ? `| 💰 السعر: ${st.pricePerKwh} دينار/كيلوواط` : ''}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {/* Render Petrol Types */}
                    {st.petrolTypes && st.petrolTypes.map((fuel, idx) => (
                      <span key={`p-${idx}`} className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">⛽ {fuel}</span>
                    ))}
                    
                    {/* Render EV Plug Types */}
                    {st.plugTypes && st.plugTypes.map((plug, idx) => (
                      <span key={`e-${idx}`} className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-slate-950 text-slate-300 border border-slate-800">⚡ {plug}</span>
                    ))}
                    
                    {st.fastCharging && <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">قوة {st.powerKw} kW</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {userLocation && (
                  <div className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2">
                    تبعد: <span className="text-emerald-400">{getDistance(userLocation.lat, userLocation.lng, st.lat, st.lng)} كم</span>
                  </div>
                )}
                <a href={`https://www.google.com/maps/search/?api=1&query=${st.lat},${st.lng}`} target="_blank" rel="noreferrer" className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"><ExternalLink className="w-4 h-4" /> الملاحة 📍</a>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
