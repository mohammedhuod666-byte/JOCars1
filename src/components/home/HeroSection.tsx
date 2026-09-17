'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, SlidersHorizontal, TrendingUp, ShieldCheck, Zap, ChevronDown, Sparkles,
  Car, Wrench, Cpu, MessageCircle, Calculator, Phone, Plus, MapPin, ArrowLeft
} from 'lucide-react';

const TYPED_WORDS = ['قارن واسأل', 'اختر أفضل سيارة', 'اعرض للبيع مجاناً', 'ابحث عن قطع الغيار'];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'cars' | 'workshops' | 'parts' | 'forum'>('cars');
  const [word, setWord] = useState(TYPED_WORDS[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const current = TYPED_WORDS[wordIndex];
    const speed = isDeleting ? 50 : 90;
    const timer = setTimeout(() => {
      if (!isDeleting && word.length < current.length) {
        setWord(current.slice(0, word.length + 1));
        return;
      }
      if (!isDeleting && word.length === current.length) {
        setTimeout(() => setIsDeleting(true), 1500);
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

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (activeTab === 'workshops') {
      router.push(`/workshops?search=${encodeURIComponent(query)}`);
    } else if (activeTab === 'parts') {
      router.push(`/parts?search=${encodeURIComponent(query)}`);
    } else if (activeTab === 'forum') {
      router.push(`/forum?search=${encodeURIComponent(query)}`);
    } else {
      router.push(`/cars?search=${encodeURIComponent(query)}`);
    }
  }, [searchQuery, activeTab, router]);

  return (
    <section className="relative min-h-[92vh] sm:min-h-[95vh] flex items-center justify-center overflow-hidden bg-slate-950 text-slate-100">
      
      {/* Background Image Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-porsche.jpg"
          alt="Cars JO Hero Background"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          style={{ filter: 'brightness(0.45) contrast(1.15)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/70" />
        <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-slate-950 to-transparent" />
      </div>

      {/* Ambient Lighting Gradients */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[450px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Content Container */}
      <div className="container-custom relative z-10 pt-24 pb-16 lg:pt-28">
        <div className="mx-auto max-w-5xl text-center space-y-6">
          
          {/* Main Badge Header */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 backdrop-blur-xl shadow-lg">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-black tracking-wide">
              منصة مجتمع وسوق السيارات الأولى في الأردن 🇯🇴🚗
            </span>
          </div>

          {/* Animated Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.2rem] font-black tracking-tight leading-[1.15] text-white">
            <span>في كارس جو، </span>
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              {word}
            </span>
            <br />
            <span className="text-slate-200">سيارتك وخدماتها بمكان واحد</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed font-medium">
            تصفح آلاف إعلانات السيارات، صيانة الورش المعتمدة، قطع الغيار، واستفسر واحصل على إجابات فنية من مجتمع الخبرة الأردني.
          </p>

          {/* Search Box Tabs & Input */}
          <div className="mx-auto max-w-3xl pt-2">
            
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-center gap-1 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl mb-3 overflow-x-auto scrollbar-none">
              {[
                { id: 'cars', label: 'السيارات 🚗', icon: <Car className="w-3.5 h-3.5" /> },
                { id: 'workshops', label: 'الورش والصيانة 🛠️', icon: <Wrench className="w-3.5 h-3.5" /> },
                { id: 'parts', label: 'قطع الغيار ⚙️', icon: <Cpu className="w-3.5 h-3.5" /> },
                { id: 'forum', label: 'المنتدى والاستفسارات 💬', icon: <MessageCircle className="w-3.5 h-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Glassmorphic Search Form */}
            <form onSubmit={handleSearch}>
              <div
                className={`relative rounded-3xl transition-all duration-300 ${
                  focused
                    ? 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
                    : 'border-slate-800 shadow-2xl'
                }`}
              >
                <div className="relative flex items-center gap-2 p-2 rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-slate-800">
                  
                  <div className="hidden sm:flex items-center pr-4 text-emerald-400">
                    <Search className="w-5 h-5" />
                  </div>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={
                      activeTab === 'workshops'
                        ? 'ابحث عن ورشة صيانة أو خدمة... مثال: صيانة هايبرد عمان'
                        : activeTab === 'parts'
                          ? 'ابحث عن قطعة غيار أو رقم OEM... مثال: محرك كامري'
                          : activeTab === 'forum'
                            ? 'ابحث في استفسارات وأعطال السيارات...'
                            : 'ابحث عن سيارة... مثال: تويوتا كامري 2022'
                    }
                    className="h-14 flex-1 bg-transparent text-sm sm:text-base text-white outline-none placeholder:text-slate-500 px-3"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="h-12 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <Search className="w-4.5 h-4.5" />
                      <span>بحث</span>
                    </button>
                  </div>

                </div>
              </div>
            </form>

            {/* Quick Search Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <span className="text-xs text-slate-500 font-semibold ml-1">الأكثر بحثاً:</span>
              {[
                { label: 'تويوتا هايبرد 🔋', query: 'تويوتا هايبرد' },
                { label: 'هيونداي ايلانترا', query: 'هيونداي' },
                { label: 'سيارات كهرباء EV ⚡', query: 'كهرباء' },
                { label: 'مركز فحص شامل 🛠️', query: 'فحص' },
                { label: 'أحدث إعلانات السيارات 🚗', query: '' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => router.push(chip.query ? `/cars?search=${encodeURIComponent(chip.query)}` : '/cars')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-bold hover:border-emerald-500/40 hover:text-emerald-400 transition-all cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>

          </div>

          {/* Key Value Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto">
            {[
              { icon: <Car className="w-5 h-5 text-emerald-400" />, label: 'سوق السيارات', desc: 'مستعمل وجديد', link: '/cars' },
              { icon: <Wrench className="w-5 h-5 text-teal-400" />, label: 'دليل الورش', desc: 'صيانة وحجز مواعيد', link: '/workshops' },
              { icon: <Cpu className="w-5 h-5 text-cyan-400" />, label: 'قطع الغيار', desc: 'أصلية ومستعملة', link: '/parts' },
              { icon: <MessageCircle className="w-5 h-5 text-amber-400" />, label: 'منتدى النقاشات', desc: 'استفسارات وميكانيك', link: '/forum' },
            ].map((card, i) => (
              <Link
                key={i}
                href={card.link}
                className="group p-4 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900 transition-all duration-300 text-center flex flex-col items-center justify-center space-y-1.5 shadow-md"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <h4 className="font-extrabold text-white text-xs sm:text-sm group-hover:text-emerald-400 transition-colors">
                  {card.label}
                </h4>
                <p className="text-slate-500 text-[11px] font-medium">{card.desc}</p>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
