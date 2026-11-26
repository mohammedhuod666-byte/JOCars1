'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { useUIStore, useNotificationStore, useCompareStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  Search, User, Heart, MessageCircle, Plus, Moon, Sun,
  ChevronDown, LogOut, ShieldCheck, Bot, Wrench, DollarSign, Tag,
  BadgePercent, Newspaper, Car, Store, Bell, GitCompare, Ticket,
  Calculator, Cpu, Zap, Sparkles, Compass, Flame, ArrowUpRight
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setMobileMenuOpen } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const { cars: compareCars } = useCompareStore();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredMegaItem, setHoveredMegaItem] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const userBtnRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedMore = moreBtnRef.current?.contains(target) || moreMenuRef.current?.contains(target);
      const clickedUser = userBtnRef.current?.contains(target) || userMenuRef.current?.contains(target);
      if (!clickedMore) setMoreOpen(false);
      if (!clickedUser) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMoreOpen(false); setUserMenuOpen(false); }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const openUserMenu = useCallback(() => {
    window.dispatchEvent(new CustomEvent('toggleUserMenu'));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cars?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const primaryLinks = [
    { href: '/cars', label: 'السيارات', icon: Car },
    { href: '/parts', label: 'قطع الغيار', icon: Cpu },
    { href: '/workshops', label: 'الورش والصيانة', icon: Wrench },
    { href: '/forum', label: 'المنتدى', icon: MessageCircle },
  ];

  // 4 Categorized Columns for the Modern Mega Menu
  const megaMenuCategories = [
    {
      title: 'سوق وتجارة السيارات',
      badge: 'حراج ومزادات',
      badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      items: [
        { href: '/cars', label: 'سوق الحراج والإعلانات', desc: 'سيارات معروضة للبيع من الوكلاء والأفراد', icon: Car },
        { href: '/wanted', label: 'سيارات مطلوبة للشراء', desc: 'طلبات مباشرة من مشترين جادين', icon: Tag },
        { href: '/wholesale', label: 'سوق الجملة والمصدوم', desc: 'عروض التجار وسيارت بأسعار الجملة', icon: Store },
        { href: '/reels', label: 'فيديوهات ريلز السيارات', desc: 'جولات فحص مصورة بالفيديو للسيارات', icon: Flame },
        { href: '/plates', label: 'لوحات أرقام مميزة', desc: 'لوحات خصوصية مميزة للبيع والمزايدة', icon: BadgePercent },
      ],
    },
    {
      title: 'الفحص والذكاء الاصطناعي',
      badge: 'تقنية AI',
      badgeColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
      items: [
        { href: '/ai/inspection-analyzer', label: 'محلل فحص الشواصي بالـ AI', desc: 'تحليل دقيق لكروت الفحص وكشف القص والغرق', icon: Cpu },
        { href: '/ai', label: 'المساعد الذكي JO Cars AI', desc: 'استشر الذكاء الاصطناعي في الأسعار والأعطال', icon: Bot },
        { href: '/car-finder', label: 'مستشار اختيار السيارات', desc: 'حدد ميزانيتك واحتياجاتك ونرشح لك الأنسب', icon: Compass },
        { href: '/ev-charging-jordan', label: 'محطات الشحن الكهربائي', desc: 'خريطة تفاعلية لمحطات شحن السيارات بالمملكة', icon: Zap },
      ],
    },
    {
      title: 'الورش والخدمات والجمارك',
      badge: 'خدمات فورية',
      badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      items: [
        { href: '/workshops', label: 'دليل الورش ومراكز الصيانة', desc: 'حجز مواعيد لدى أفضل ورش الهايبرد والميكانيك', icon: Wrench },
        { href: '/customs-calculator', label: 'حاسبة الجمارك الأردنية', desc: 'احتساب دقيق لجمارك الهايبرد والكهرباء والبنزين', icon: Calculator },
        { href: '/jordan-traffic-violations', label: 'ترخيص ومخالفات السير', desc: 'رسوم الترخيص والاستعلام عن المخالفات', icon: ShieldCheck },
        { href: '/free-zone-calculator', label: 'تخليص وشحن المنطقة الحرة', desc: 'حاسبة تخليص مركبات حرة الزرقاء وعمان', icon: Calculator },
        { href: '/dealers', label: 'معارض ووكلاء الأردن', desc: 'دليل شامل لوكلاء وتجار السيارات المعتمدين', icon: Store },
      ],
    },
    {
      title: 'المالية وتكلفة التملك',
      badge: 'أدوات مالية',
      badgeColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      items: [
        { href: '/finance-calculator', label: 'حاسبة تمويل البنوك', desc: 'احسب القسط الشهري والتمويل مع البنوك المحلية', icon: DollarSign },
        { href: '/swap-calculator', label: 'حاسبة البدل والمقاصة', desc: 'احسب فرق القيمة العادلة عند تبديل سيارتك', icon: GitCompare },
        { href: '/ownership-cost', label: 'حاسبة التكلفة الكاملة', desc: 'حساب مصاريف الوقود والصيانة واستهلاك القيمة', icon: DollarSign },
        { href: '/resale-value', label: 'مؤشر قيمة إعادة البيع', desc: 'توقعات أسعار السيارات وسرعة إعادة بيعها', icon: Sparkles },
        { href: '/news', label: 'أخبار وسوق السيارات', desc: 'أحدث أخبار جمارك وأسعار السيارات بالأردن', icon: Newspaper },
        ...(isAuthenticated ? [{ href: '/tickets', label: 'الدعم الفني والتذاكر', desc: 'مساعدة فورية ومتابعة طلباتك مع الإدارة', icon: Ticket }] : []),
      ],
    },
  ];

  const desktopUserMenuItems = [
    { href: '/auth/profile', label: 'الملف الشخصي', icon: User },
    { href: '/favorites', label: 'المفضلة', icon: Heart },
    { href: '/messages', label: 'الرسائل', icon: MessageCircle, badge: unreadCount },
    { href: '/my-cars', label: 'إعلاناتي', icon: Car },
    { href: '/my-garage', label: 'مرآبي وسجل الصيانة', icon: Wrench },
    { href: '/my-wants', label: 'طلباتي', icon: Tag },
    { href: '/price-alerts', label: 'تنبيهات الأسعار', icon: Bell },
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[#090b10]/95 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_10px_35px_-10px_rgba(0,0,0,0.7)]'
            : 'bg-[#090b10]/85 backdrop-blur-xl border-b border-white/[0.04]'
        )}
      >
        {/* Top Ticker Bar at the very top of the website */}
        <div className="w-full bg-[#05070a]/95 border-b border-white/[0.06] py-1.5 overflow-hidden text-xs text-slate-400 select-none" dir="ltr">
          <div className="animate-marquee-smooth flex items-center">
            {/* Set 1 */}
            <div className="flex items-center shrink-0">
              {[
                'تويوتا', 'مرسيدس بنز', 'بي إم دبليو', 'هيونداي', 'كيا', 'نيسان', 'لكزس', 'فورد',
                'عمان', 'إربد', 'الزرقاء', 'العقبة', 'فحص 4 جيد معتمد', 'جمرك خالص', 'بطاريات هايبرد مكفولة'
              ].map((t, i) => (
                <span key={`a-${i}`} className="inline-flex items-center mx-3 sm:mx-4 text-[11px] sm:text-xs font-semibold text-slate-300 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 ml-2.5 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  {t}
                </span>
              ))}
            </div>
            {/* Set 2 (Identical duplicate for seamless 50% loop) */}
            <div className="flex items-center shrink-0">
              {[
                'تويوتا', 'مرسيدس بنز', 'بي إم دبليو', 'هيونداي', 'كيا', 'نيسان', 'لكزس', 'فورد',
                'عمان', 'إربد', 'الزرقاء', 'العقبة', 'فحص 4 جيد معتمد', 'جمرك خالص', 'بطاريات هايبرد مكفولة'
              ].map((t, i) => (
                <span key={`b-${i}`} className="inline-flex items-center mx-3 sm:mx-4 text-[11px] sm:text-xs font-semibold text-slate-300 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 ml-2.5 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="container-custom">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-[4.25rem]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group py-1">
              <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-b from-[#1c2234] to-[#0f131d] border border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.18)] group-hover:border-amber-400/70 group-hover:shadow-[0_0_22px_rgba(245,158,11,0.35)] transition-all duration-300">
                <img
                  src="/shield-logo-sm.png"
                  alt="JO Cars"
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-amber-400 opacity-60 blur-[1px]" />
              </div>
              <div className="flex items-center text-base sm:text-lg font-black tracking-tight shrink-0" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
                <span className="text-white">JO</span>
                <span className="text-slate-300">Cars</span>
                <span className="text-amber-400 text-xl leading-none">.</span>
              </div>
            </Link>

            {/* Desktop Navigation Links — Sliding Glassmorphic Hover Box */}
            <nav
              onMouseLeave={() => setHoveredNav(null)}
              className="hidden lg:flex items-center gap-1 bg-[#121622]/70 border border-white/[0.07] rounded-2xl p-1.5 backdrop-blur-xl shadow-inner"
            >
              {primaryLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href || pathname.startsWith(link.href + '/');
                const isHovered = hoveredNav === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onMouseEnter={() => setHoveredNav(link.href)}
                    className={cn(
                      'group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 z-10',
                      active
                        ? 'text-amber-300 font-bold'
                        : isHovered
                        ? 'text-white'
                        : 'text-slate-300 hover:text-white'
                    )}
                  >
                    {isHovered && (
                      <motion.span
                        layoutId="header-nav-hover-box"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.11] to-white/[0.04] border border-amber-400/40 shadow-[0_0_18px_rgba(245,158,11,0.18),inset_0_1px_0_rgba(255,255,255,0.14)] -z-10"
                      />
                    )}
                    {active && (
                      <motion.span
                        layoutId="header-nav-active-box"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="absolute inset-0 rounded-xl bg-[#1e2538] border border-amber-400/35 shadow-[0_0_15px_rgba(245,158,11,0.16)] -z-20"
                      />
                    )}
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-all duration-200',
                        active
                          ? 'text-amber-400'
                          : isHovered
                          ? 'text-amber-400 scale-110'
                          : 'text-slate-400 group-hover:text-amber-400'
                      )}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {/* More Mega Menu Trigger */}
              <button
                ref={moreBtnRef}
                onMouseEnter={() => setHoveredNav('__more__')}
                onClick={() => setMoreOpen(!moreOpen)}
                className={cn(
                  'group relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer z-10',
                  moreOpen
                    ? 'text-amber-300 font-bold'
                    : hoveredNav === '__more__'
                    ? 'text-white'
                    : 'text-slate-300 hover:text-white'
                )}
                aria-expanded={moreOpen}
              >
                {hoveredNav === '__more__' && (
                  <motion.span
                    layoutId="header-nav-hover-box"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.11] to-white/[0.04] border border-amber-400/40 shadow-[0_0_18px_rgba(245,158,11,0.18),inset_0_1px_0_rgba(255,255,255,0.14)] -z-10"
                  />
                )}
                {moreOpen && (
                  <span className="absolute inset-0 rounded-xl bg-[#1e2538] border border-amber-400/35 shadow-[0_0_15px_rgba(245,158,11,0.16)] -z-20" />
                )}
                <span>المزيد</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-all duration-300',
                    moreOpen && 'rotate-180 text-amber-400',
                    hoveredNav === '__more__' && !moreOpen && 'text-amber-400'
                  )}
                />
              </button>
            </nav>

            {/* Quick Search */}
            <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
              <form onSubmit={handleSearch} className="relative w-full group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن سيارة..."
                  className="w-full h-10 pr-10 pl-9 rounded-full bg-[#121622]/90 border border-white/[0.08] text-sm text-slate-100 placeholder:text-slate-400 shadow-inner hover:border-white/[0.15] focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition-all duration-200"
                />
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-400 transition-colors" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Compare Button */}
              {compareCars.length > 0 && (
                <Link
                  href="/cars/compare"
                  className="relative p-2.5 rounded-xl border border-white/[0.06] bg-[#121622]/80 text-slate-300 hover:text-amber-400 hover:border-amber-400/40 transition-all duration-200"
                  title="مقارنة السيارات"
                >
                  <GitCompare className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black flex items-center justify-center px-1 shadow-md shadow-amber-500/30">
                    {compareCars.length}
                  </span>
                </Link>
              )}

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hidden sm:flex p-2.5 rounded-xl border border-white/[0.06] bg-[#121622]/80 text-slate-400 hover:text-slate-100 hover:border-white/[0.15] transition-all duration-200"
                aria-label="تبديل المظهر"
              >
                {mounted ? (theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />) : <div className="w-4 h-4" />}
              </button>

              {/* User Account / Auth */}
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  <button
                    ref={userBtnRef}
                    onClick={() => {
                      if (!userMenuOpen) refreshProfile();
                      setUserMenuOpen(!userMenuOpen);
                    }}
                    className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-white/[0.08] bg-[#121622]/80 hover:bg-[#1a2030] hover:border-amber-400/40 transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 overflow-hidden">
                      {user?.image ? (
                        <img src={user.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        user?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <span className="hidden sm:inline text-xs font-bold text-slate-200 max-w-[90px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform duration-200', userMenuOpen && 'rotate-180')} />
                  </button>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5">
                  <Link
                    href="/auth/login"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-[#161c28] border border-white/[0.08] hover:border-white/[0.2] hover:text-white transition-all duration-200"
                  >
                    إنشاء حساب
                  </Link>
                </div>
              )}

              {/* Sell Car CTA Button — Luxury Amber / Gold */}
              <Link
                href="/cars/add"
                className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_28px_rgba(245,158,11,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:rotate-90" strokeWidth={3} />
                <span className="hidden sm:inline">أضف إعلانك</span><span className="sm:hidden">إعلان</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Luxury Mega Menu Panel ("المزيد") — plain conditional unmount so it can never linger invisibly */}
      {moreOpen && (
        <div
          ref={moreMenuRef}
          className="fixed top-[5.75rem] inset-x-0 mx-auto z-[70] w-[min(94vw,1120px)] max-h-[calc(100vh-6.5rem)] overflow-y-auto rounded-3xl border border-white/[0.12] bg-[#0b0e16]/95 backdrop-blur-3xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(245,158,11,0.08)] p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150"
        >
            {/* Subtle Ambient Glow */}
            <div className="absolute top-0 right-1/4 w-96 h-32 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-96 h-32 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

            {/* Header of the Mega Menu */}
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-white/[0.08] gap-2">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" />
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    دليل خدمات ومنصة JO Cars الشاملة
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  تصفح كافة الأدوات الذكية، الحاسبات الجمركية، خدمات الفحص، ومجتمع السيارات في الأردن
                </p>
              </div>
              <Link
                href="/cars"
                onClick={() => setMoreOpen(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-xs font-bold text-amber-300 hover:text-amber-200 transition-all w-fit shrink-0"
              >
                <span>تصفح كافة السيارات المعروضة</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 4 Categorized Glass Cards */}
            <div
              onMouseLeave={() => setHoveredMegaItem(null)}
              className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {megaMenuCategories.map((cat, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
                    <h4 className="text-xs font-black text-slate-100">{cat.title}</h4>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0', cat.badgeColor)}>
                      {cat.badge}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      const isHovered = hoveredMegaItem === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onMouseEnter={() => setHoveredMegaItem(item.href)}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            'group relative flex items-start gap-2.5 p-2 rounded-xl transition-colors duration-200 z-10',
                            active
                              ? 'text-amber-300'
                              : isHovered
                              ? 'text-white'
                              : 'text-slate-300 hover:text-white'
                          )}
                        >
                          {isHovered && (
                            <span
                              className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.10] to-white/[0.03] border border-amber-400/40 shadow-[0_0_18px_rgba(245,158,11,0.14),inset_0_1px_0_rgba(255,255,255,0.12)] -z-10 pointer-events-none"
                            />
                          )}
                          {active && !isHovered && (
                            <span className="absolute inset-0 rounded-xl bg-amber-400/10 border border-amber-400/25 -z-20" />
                          )}
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 mt-0.5',
                              active || isHovered
                                ? 'bg-amber-400/15 text-amber-400 scale-105'
                                : 'bg-white/[0.04] text-slate-400'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              'text-xs font-bold leading-snug transition-colors',
                              active || isHovered ? 'text-amber-300' : 'text-slate-100'
                            )}>
                              {item.label}
                            </p>
                            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Footer Banner */}
            <div className="mt-4 px-4 py-2.5 rounded-2xl border border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-white/[0.025]">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  فحص موثوق 100%
                </span>
                <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  مدعوم بالذكاء الاصطناعي
                </span>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                إغلاق القائمة (Esc)
              </button>
            </div>
          </div>
      )}

      {/* User Dropdown */}
      {userMenuOpen && isAuthenticated && (
        <div
          ref={userMenuRef}
          className="fixed top-[4.75rem] left-4 sm:left-12 z-[70] w-72 rounded-2xl border border-white/[0.1] bg-[#0c0f17]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-2 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        >
          <div className="p-3 border-b border-white/[0.08] mb-2 bg-gradient-to-r from-amber-500/10 to-transparent rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 overflow-hidden">
                {user?.image ? (
                  <img src={user.image} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-white text-sm truncate">{user?.name}</p>
                  {user?.role === 'ADMIN' && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      مدير
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-0.5">
            {desktopUserMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all duration-150"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400" />
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}

            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-400/10 transition-all duration-150 border-t border-white/[0.06] mt-1 pt-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                لوحة تحكم الإدارة العامة
              </Link>
            )}
          </div>

          <div className="border-t border-white/[0.08] mt-2 pt-1.5">
            <button
              onClick={() => { logout(); setUserMenuOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 w-full transition-all duration-150 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}
    </>
  );
}
