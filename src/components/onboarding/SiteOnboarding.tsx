'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  Compass, Play, Pause, ChevronLeft, ChevronRight, X, CheckCircle2,
  Circle, Car, Wrench, Calculator, PlusCircle, Sparkles, Heart,
  ChevronDown, ChevronUp, RotateCcw, EyeOff, Lightbulb, Target
} from 'lucide-react';

const STORAGE_KEY = 'jocars_onboarding_v1';
const AUTO_ADVANCE_MS = 5000;

interface TourStep {
  selector: string;
  title: string;
  description: string;
  badge: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="hero"]',
    badge: 'الخطوة 1 من 6',
    title: 'البحث الذكي الموحد',
    description: 'من هنا تبحث مباشرة عن أي سيارة أو ورشة صيانة أو قطعة غيار، أو تختار من الاقتراحات الجاهزة بنقرة واحدة.',
  },
  {
    selector: '[data-tour="stories"]',
    badge: 'الخطوة 2 من 6',
    title: 'قصص المعارض والعروض',
    description: 'تصفح أحدث السيارات والعروض الحصرية اليومية من المعارض والتجار الموثقين في الأردن.',
  },
  {
    selector: '[data-tour="services"]',
    badge: 'الخطوة 3 من 6',
    title: 'مركز خدمات JO Cars',
    description: 'بوابتك السريعة لكل أقسام الموقع: سوق السيارات، الورش، قطع الغيار، المنتدى، المزادات، وحاسبة الجمرك.',
  },
  {
    selector: '[data-tour="emergency"]',
    badge: 'الخطوة 4 من 6',
    title: 'طوارئ الطريق والونش 24/7',
    description: 'تعطلت سيارتك فجأة؟ اضغط هنا للوصول السريع إلى أقرب ونش سحب أو ورشة صيانة متنقلة لموقعك.',
  },
  {
    selector: '[data-tour="featured"]',
    badge: 'الخطوة 5 من 6',
    title: 'السيارات المميزة والتقييم العادل',
    description: 'كل إعلان يعرض السعر ومؤشر عدالة السعر وحالة الفحص لتقارن وتختار بثقة دون مبالغة في الأسعار.',
  },
  {
    selector: '[data-tour="priceranges"]',
    badge: 'الخطوة 6 من 6',
    title: 'اختر حسب ميزانيتك',
    description: 'حدد الفئة السعرية المناسبة لميزانيتك ليعرض لك الموقع السيارات المطابقة فوراً دون عناء البحث.',
  },
];

interface ChecklistTask {
  id: string;
  title: string;
  href: string;
}

const CHECKLIST_TASKS: ChecklistTask[] = [
  { id: 'browse_cars', title: 'تصفح سوق السيارات والبحث الذكي', href: '/cars' },
  { id: 'view_car', title: 'افتح إعلاناً واطلع على التقييم العادل', href: '/cars' },
  { id: 'save_fav', title: 'احفظ سيارة في المفضلة للمقارنة', href: '/cars' },
  { id: 'visit_workshops', title: 'تعرّف على دليل الورش وحاسبة التكاليف', href: '/workshops' },
  { id: 'try_customs', title: 'جرّب حاسبة الجمرك أو المساعد الذكي', href: '/customs-calculator' },
];

const INTENT_PATHS = [
  {
    id: 'buy',
    title: 'أريد شراء سيارة',
    subtitle: 'تصفح السوق وقارن الأسعار العادلة',
    href: '/cars',
    icon: Car,
    accent: 'text-[#ffc640] bg-[#ffc640]/10 border-[#ffc640]/25',
  },
  {
    id: 'sell',
    title: 'أريد بيع سيارتي',
    subtitle: 'انشر إعلانك مجاناً في دقيقتين',
    href: '/cars/add',
    icon: PlusCircle,
    accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  },
  {
    id: 'workshops',
    title: 'ورشة صيانة أو ونش',
    subtitle: 'احجز موعداً أو قدّر تكلفة الإصلاح',
    href: '/workshops',
    icon: Wrench,
    accent: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
  },
  {
    id: 'tools',
    title: 'حاسبة الجمرك والذكاء',
    subtitle: 'احسب الجمرك أو استشر المساعد الذكي',
    href: '/customs-calculator',
    icon: Calculator,
    accent: 'text-violet-400 bg-violet-500/10 border-violet-500/25',
  },
];

function getPageTip(pathname: string): string {
  if (pathname === '/') return 'ابدأ بالبحث في الأعلى أو اختر الخدمة التي تحتاجها من مركز الخدمات.';
  if (pathname === '/cars') return 'استخدم الفلاتر لتحديد الموديل والميزانية، واضغط على أي سيارة لرؤية تقييم السعر العادل.';
  if (pathname.startsWith('/cars/') && pathname !== '/cars/add' && pathname !== '/cars/compare') {
    return 'هنا تجد التقييم العادل للسعر، تقرير الفحص، وحاسبة الجمرك، ويمكنك التفاوض مع البائع مباشرة.';
  }
  if (pathname.startsWith('/workshops')) return 'يمكنك البحث حسب التخصص أو المحافظة، أو فتح حاسبة تكاليف الصيانة لمعرفة الأسعار التقريبية.';
  if (pathname.startsWith('/customs-calculator')) return 'أدخل سنة الصنع وسعة المحرك لتحصل على تقدير فوري للرسوم الجمركية في الأردن.';
  if (pathname.startsWith('/parts')) return 'ابحث باسم القطعة أو رقمها الأصلي وتواصل مباشرة مع المحلات الموثوقة.';
  if (pathname.startsWith('/tickets')) return 'تواجه أي مشكلة؟ افتح تذكرة دعم وتابع الرد الفوري من الإدارة.';
  return 'استخدم القائمة العلوية للوصول السريع إلى السيارات، الورش، قطع الغيار، وحاسبة الجمرك.';
}

interface OnboardingState {
  welcomed: boolean;
  tourDone: boolean;
  checklistDismissed: boolean;
  completedTasks: string[];
}

const DEFAULT_STATE: OnboardingState = {
  welcomed: false,
  tourDone: false,
  checklistDismissed: false,
  completedTasks: [],
};

const HIDDEN_ROUTES = ['/admin', '/auth', '/login', '/messages'];

export function SiteOnboarding() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const storageKey = user?.id ? `${STORAGE_KEY}_${user.id}` : `${STORAGE_KEY}_guest`;

  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [checklistExpanded, setChecklistExpanded] = useState(false);
  const [justCompletedAll, setJustCompletedAll] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const saveState = useCallback((updater: (prev: OnboardingState) => OnboardingState) => {
    setState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [storageKey]);

  // Load persisted onboarding state & trigger on '/' for new accounts or first-time visitors
  useEffect(() => {
    setMounted(true);
    let currentState = DEFAULT_STATE;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        currentState = { ...DEFAULT_STATE, ...JSON.parse(raw) };
      }
      setState(currentState);
    } catch {
      setState(DEFAULT_STATE);
    }

    if (pathname === '/') {
      let justRegistered = false;
      try {
        justRegistered = sessionStorage.getItem('jocars_just_registered') === '1';
        if (justRegistered) {
          sessionStorage.removeItem('jocars_just_registered');
        }
      } catch {}

      if (justRegistered || !currentState.welcomed) {
        const t = setTimeout(() => setWelcomeOpen(true), 700);
        return () => clearTimeout(t);
      }
    }
  }, [pathname, storageKey]);

  // Mark task helper
  const completeTask = useCallback((taskId: string) => {
    saveState((prev) => {
      if (prev.completedTasks.includes(taskId)) return prev;
      const nextTasks = [...prev.completedTasks, taskId];
      if (nextTasks.length === CHECKLIST_TASKS.length) {
        setJustCompletedAll(true);
        setTimeout(() => {
          saveState((s) => ({ ...s, checklistDismissed: true }));
          setJustCompletedAll(false);
        }, 4500);
      }
      return { ...prev, completedTasks: nextTasks };
    });
  }, [saveState]);

  // Auto-track user progress across routes
  useEffect(() => {
    if (!mounted) return;
    if (pathname === '/cars' || pathname.startsWith('/cars?')) {
      completeTask('browse_cars');
    } else if (pathname.startsWith('/cars/') && !['/cars/add', '/cars/compare'].includes(pathname)) {
      completeTask('view_car');
    } else if (pathname === '/favorites') {
      completeTask('save_fav');
    } else if (pathname.startsWith('/workshops')) {
      completeTask('visit_workshops');
    } else if (pathname.startsWith('/customs-calculator') || pathname.startsWith('/ai')) {
      completeTask('try_customs');
    }
  }, [pathname, mounted, completeTask]);

  // Listen for favorite button clicks globally to auto-check "save_fav"
  useEffect(() => {
    if (!mounted) return;
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('button');
      if (!btn) return;
      const title = (btn.getAttribute('title') || '') + ' ' + (btn.textContent || '');
      if (title.includes('المفضلة') || title.includes('حفظ')) {
        completeTask('save_fav');
      }
    };
    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, [mounted, completeTask]);

  // Update spotlight rectangle for current tour step
  const updateTargetRect = useCallback(() => {
    if (!tourActive) return;
    const step = TOUR_STEPS[tourIndex];
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTargetRect({
      top: Math.max(8, r.top - 6),
      left: Math.max(8, r.left - 6),
      width: Math.min(window.innerWidth - 16, r.width + 12),
      height: Math.min(window.innerHeight - 16, r.height + 12),
    });
  }, [tourActive, tourIndex]);

  // Scroll smoothly to current tour target
  useEffect(() => {
    if (!tourActive) return;
    const step = TOUR_STEPS[tourIndex];
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const t = setTimeout(updateTargetRect, 450);
      window.addEventListener('scroll', updateTargetRect, { passive: true });
      window.addEventListener('resize', updateTargetRect);
      return () => {
        clearTimeout(t);
        window.removeEventListener('scroll', updateTargetRect);
        window.removeEventListener('resize', updateTargetRect);
      };
    } else {
      setTargetRect(null);
    }
  }, [tourActive, tourIndex, updateTargetRect]);

  const finishTour = useCallback(() => {
    setTourActive(false);
    setProgress(0);
    saveState((prev) => ({ ...prev, welcomed: true, tourDone: true }));
  }, [saveState]);

  // Auto-Pilot Timer
  useEffect(() => {
    if (!tourActive || !autoPlay) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / AUTO_ADVANCE_MS) * 100);
      setProgress(pct);
      if (elapsed >= AUTO_ADVANCE_MS) {
        if (tourIndex < TOUR_STEPS.length - 1) {
          setTourIndex((i) => i + 1);
        } else {
          finishTour();
        }
      }
    }, 80);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tourActive, autoPlay, tourIndex, finishTour]);

  const startAutoTour = () => {
    setWelcomeOpen(false);
    saveState((prev) => ({ ...prev, welcomed: true }));
    if (pathname !== '/') {
      router.push('/');
      setTimeout(() => {
        setTourIndex(0);
        setAutoPlay(true);
        setTourActive(true);
      }, 650);
    } else {
      setTourIndex(0);
      setAutoPlay(true);
      setTourActive(true);
    }
  };

  const skipWelcome = () => {
    setWelcomeOpen(false);
    saveState((prev) => ({ ...prev, welcomed: true }));
  };

  const chooseIntent = (href: string) => {
    setWelcomeOpen(false);
    saveState((prev) => ({ ...prev, welcomed: true }));
    router.push(href);
  };

  if (!mounted) return null;
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null;

  const completedCount = state.completedTasks.length;
  const totalTasks = CHECKLIST_TASKS.length;
  const currentStep = TOUR_STEPS[tourIndex];

  // Position tooltip smartly inside viewport
  const tooltipOnTop = targetRect ? targetRect.top > window.innerHeight * 0.52 : false;

  return (
    <>
      {/* 1. First-Visit Welcome & Smart Intent Modal */}
      <AnimatePresence>
        {welcomeOpen && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={skipWelcome}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.98 }}
              className="relative z-10 w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-[#14181f] border border-[#ffc640]/30 p-5 sm:p-7 space-y-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#ffc640]/15 border border-[#ffc640]/30 flex items-center justify-center text-[#ffc640] shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">أهلاً بك في JO Cars</h2>
                    <p className="text-xs sm:text-sm text-slate-400">
                      دعنا نعرّفك على الموقع في 30 ثانية أو اختر وجهتك مباشرة
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={skipWelcome}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Auto-Pilot Tour CTA */}
              <button
                type="button"
                onClick={startAutoTour}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#ffc640] to-amber-500 hover:from-[#ffd266] hover:to-amber-400 text-[#0e1013] flex items-center justify-between gap-3 shadow-lg shadow-[#ffc640]/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 text-right">
                  <div className="w-10 h-10 rounded-xl bg-[#0e1013]/15 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-sm sm:text-base">ابدأ الجولة التفاعلية التلقائية (30 ثانية)</div>
                    <div className="text-[11px] sm:text-xs font-bold opacity-80">
                      يتحرك الموقع تلقائياً ويشرح لك أهم الأقسام والأدوات خطوة بخطوة
                    </div>
                  </div>
                </div>
                <Play className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
              </button>

              {/* Smart Intent Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Target className="w-3.5 h-3.5 text-[#ffc640]" />
                  <span>أو اختر ما تريد فعله الآن مباشرة:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INTENT_PATHS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => chooseIntent(item.href)}
                        className="p-3 rounded-2xl bg-[#0e1013] border border-white/[0.08] hover:border-[#ffc640]/40 flex items-center gap-3 text-right transition-all cursor-pointer group"
                      >
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.accent}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-white group-hover:text-[#ffc640] transition-colors truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">يمكنك إعادة الجولة في أي وقت من زر الدليل</span>
                <button
                  type="button"
                  onClick={skipWelcome}
                  className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  تخطي والبدء بالتصفح
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Auto-Pilot Guided Tour Spotlight Overlay */}
      <AnimatePresence>
        {tourActive && currentStep && (
          <div className="fixed inset-0 z-[130] pointer-events-auto">
            {/* Dimmed backdrop if targetRect not found */}
            {!targetRect && <div className="absolute inset-0 bg-[#080a0f]/80 backdrop-blur-xs" />}

            {/* Spotlight Cutout Ring */}
            {targetRect && (
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                style={{
                  top: targetRect.top,
                  left: targetRect.left,
                  width: targetRect.width,
                  height: targetRect.height,
                  boxShadow: '0 0 0 9999px rgba(8, 10, 15, 0.80)',
                }}
                className="fixed rounded-2xl sm:rounded-3xl border-2 border-[#ffc640] pointer-events-none z-10"
              />
            )}

            {/* Floating Tour Control Card */}
            <motion.div
              key={tourIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`fixed z-20 left-3 right-3 sm:left-auto sm:right-6 sm:w-[400px] rounded-2xl sm:rounded-3xl bg-[#14181f] border border-[#ffc640]/40 p-4 sm:p-5 shadow-2xl space-y-3.5 ${
                tooltipOnTop ? 'top-20 sm:top-24' : 'bottom-28 sm:bottom-8'
              }`}
            >
              {/* Auto-pilot Progress Bar */}
              <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#ffc640] transition-all duration-100"
                  style={{ width: autoPlay ? `${progress}%` : '100%' }}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#ffc640]/15 border border-[#ffc640]/30 text-[#ffc640] text-[11px] font-black">
                  {currentStep.badge}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAutoPlay((p) => !p)}
                    title={autoPlay ? 'إيقاف التشغيل التلقائي' : 'متابعة التشغيل التلقائي'}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {autoPlay ? <Pause className="w-3 h-3 text-[#ffc640]" /> : <Play className="w-3 h-3 text-emerald-400" />}
                    <span>{autoPlay ? 'إيقاف مؤقت' : 'تلقائي'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={finishTour}
                    className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-white">{currentStep.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{currentStep.description}</p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  disabled={tourIndex === 0}
                  onClick={() => { setAutoPlay(false); setTourIndex((i) => Math.max(0, i - 1)); }}
                  className="h-9 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white disabled:opacity-35 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                {tourIndex < TOUR_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setTourIndex((i) => i + 1)}
                    className="h-9 px-4 rounded-xl bg-[#ffc640] hover:bg-[#ffd266] text-[#0e1013] text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finishTour}
                    className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>إنهاء الجولة</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Interactive Onboarding Checklist & Page Guide Widget */}
      {!tourActive && !state.checklistDismissed && (
        <div className="fixed bottom-24 left-3 sm:bottom-5 sm:left-5 z-40 max-w-[calc(100vw-1.5rem)]">
          <AnimatePresence mode="wait">
            {checklistExpanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                className="w-80 sm:w-88 rounded-2xl sm:rounded-3xl bg-[#14181f] border border-white/15 p-4 space-y-3.5 shadow-2xl"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#ffc640]/15 border border-[#ffc640]/30 flex items-center justify-center text-[#ffc640]">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">دليل التعوّد السريع</h4>
                      <p className="text-[11px] text-slate-400">
                        أنجزت {completedCount} من {totalTasks} خطوات
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => saveState((s) => ({ ...s, checklistDismissed: true }))}
                      title="إخفاء القائمة نهائياً"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/[0.05] cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecklistExpanded(false)}
                      title="تصغير"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ffc640] to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.round((completedCount / totalTasks) * 100)}%` }}
                  />
                </div>

                {justCompletedAll ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-1">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                    <p className="text-xs font-black text-white">ممتاز! أصبحت الآن خبيراً في JO Cars</p>
                    <p className="text-[11px] text-emerald-300">ستختفي هذه القائمة تلقائياً الآن.</p>
                  </div>
                ) : (
                  <>
                    {/* Contextual Current Page Tip */}
                    <div className="p-2.5 rounded-xl bg-[#0e1013] border border-white/[0.06] flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-[#ffc640] shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-300 leading-relaxed">{getPageTip(pathname)}</p>
                    </div>

                    {/* Checklist Tasks */}
                    <div className="space-y-1.5">
                      {CHECKLIST_TASKS.map((task) => {
                        const done = state.completedTasks.includes(task.id);
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => {
                              setChecklistExpanded(false);
                              router.push(task.href);
                            }}
                            className={`w-full p-2.5 rounded-xl border text-right flex items-center gap-2.5 transition-all cursor-pointer ${
                              done
                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                                : 'bg-[#0e1013] border-white/[0.06] hover:border-[#ffc640]/35 text-slate-200'
                            }`}
                          >
                            {done ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <span className={`text-xs font-bold flex-1 ${done ? 'line-through opacity-75' : ''}`}>
                              {task.title}
                            </span>
                            {!done && <ChevronLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Replay Auto-Pilot Tour & Intent Picker */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setChecklistExpanded(false);
                          startAutoTour();
                        }}
                        className="h-9 rounded-xl bg-[#ffc640]/15 hover:bg-[#ffc640]/25 border border-[#ffc640]/30 text-[#ffc640] text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>الجولة التلقائية</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChecklistExpanded(false);
                          setWelcomeOpen(true);
                        }}
                        className="h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        <span>اختر هدفك</span>
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.button
                key="collapsed"
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setChecklistExpanded(true)}
                className="h-11 px-3.5 rounded-2xl bg-[#14181f]/95 backdrop-blur-xl border border-[#ffc640]/35 hover:border-[#ffc640] text-white shadow-xl flex items-center gap-2 cursor-pointer group"
              >
                <Compass className="w-4 h-4 text-[#ffc640] group-hover:rotate-45 transition-transform" />
                <span className="text-xs font-black">دليل الموقع</span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#ffc640] text-[#0e1013] text-[10px] font-black">
                  {completedCount}/{totalTasks}
                </span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
