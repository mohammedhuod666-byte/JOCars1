'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  getPageGuideConfig,
  HOME_GUIDE,
  TOTAL_DISCOVERABLE_PAGES,
  type PageGuideConfig,
} from './onboardingConfig';
import {
  Compass, Play, Pause, ChevronLeft, ChevronRight, X, CheckCircle2,
  Circle, Car, Wrench, Calculator, PlusCircle, Sparkles,
  ChevronDown, ChevronUp, RotateCcw, EyeOff, Lightbulb, Target, Award
} from 'lucide-react';

const STORAGE_KEY = 'jocars_onboarding_v2';
const AUTO_ADVANCE_MS = 5000;

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

interface OnboardingState {
  welcomed: boolean;
  seenPages: string[];
  completedTasks: string[];
  widgetHidden: boolean;
}

const DEFAULT_STATE: OnboardingState = {
  welcomed: false,
  seenPages: [],
  completedTasks: [],
  widgetHidden: false,
};

const HIDDEN_ROUTES = ['/admin', '/auth', '/login', '/messages'];

export function SiteOnboarding() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const storageKey = user?.id ? `${STORAGE_KEY}_${user.id}` : `${STORAGE_KEY}_guest`;
  const pageGuide: PageGuideConfig | null = getPageGuideConfig(pathname);

  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [pageDiscoveryOpen, setPageDiscoveryOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [checklistExpanded, setChecklistExpanded] = useState(false);

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

  const completeTask = useCallback((taskId: string) => {
    saveState((prev) => {
      if (prev.completedTasks.includes(taskId)) return prev;
      return { ...prev, completedTasks: [...prev.completedTasks, taskId] };
    });
  }, [saveState]);

  // Load state and trigger Home Welcome OR Per-Page Discovery prompt on first visit
  useEffect(() => {
    setMounted(true);
    setTourActive(false);
    setPageDiscoveryOpen(false);
    setChecklistExpanded(false);

    if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return;

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

    // Mark 'visit' tasks for this page automatically
    if (pageGuide) {
      const visitTasks = pageGuide.tasks.filter((t) => t.matchEvent === 'visit');
      if (visitTasks.length > 0) {
        setState((prev) => {
          const toAdd = visitTasks.map((t) => t.id).filter((id) => !prev.completedTasks.includes(id));
          if (toAdd.length === 0) return prev;
          const next = { ...prev, completedTasks: [...prev.completedTasks, ...toAdd] };
          try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
          return next;
        });
      }
    }

    if (pathname === '/') {
      let justRegistered = false;
      try {
        justRegistered = sessionStorage.getItem('jocars_just_registered') === '1';
        if (justRegistered) sessionStorage.removeItem('jocars_just_registered');
      } catch {}

      if (justRegistered || !currentState.welcomed) {
        const t = setTimeout(() => setWelcomeOpen(true), 700);
        return () => clearTimeout(t);
      }
    } else if (pageGuide && !currentState.seenPages.includes(pageGuide.id)) {
      const t = setTimeout(() => setPageDiscoveryOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [pathname, storageKey]);

  // Auto-detect scroll_mid, input, and click tasks for the current page
  useEffect(() => {
    if (!mounted || !pageGuide) return;

    const scrollTasks = pageGuide.tasks.filter((t) => t.matchEvent === 'scroll_mid');
    const inputTasks = pageGuide.tasks.filter((t) => t.matchEvent === 'input');
    const clickTasks = pageGuide.tasks.filter((t) => t.matchText && t.matchText.length > 0);

    const onScroll = () => {
      if (scrollTasks.length === 0) return;
      if (window.scrollY > 260) {
        scrollTasks.forEach((t) => completeTask(t.id));
      }
    };

    const onInput = (e: Event) => {
      if (inputTasks.length === 0) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        inputTasks.forEach((t) => completeTask(t.id));
      }
    };

    const onClick = (e: MouseEvent) => {
      if (clickTasks.length === 0) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest('button, a');
      if (!el) return;
      const txt = (el.textContent || '') + ' ' + (el.getAttribute('title') || '');
      clickTasks.forEach((t) => {
        if (t.matchText?.some((kw) => txt.includes(kw))) {
          completeTask(t.id);
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onInput, true);
    document.addEventListener('click', onClick, true);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('change', onInput, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [mounted, pageGuide, completeTask]);

  const activeSteps = (pageGuide || HOME_GUIDE).tourSteps;

  // Update spotlight rectangle for current tour step
  const updateTargetRect = useCallback(() => {
    if (!tourActive) return;
    const step = activeSteps[tourIndex];
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      setTargetRect(null);
      return;
    }
    setTargetRect({
      top: Math.max(8, r.top - 6),
      left: Math.max(8, r.left - 6),
      width: Math.min(window.innerWidth - 16, r.width + 12),
      height: Math.min(window.innerHeight - 16, r.height + 12),
    });
  }, [tourActive, tourIndex, activeSteps]);

  useEffect(() => {
    if (!tourActive) return;
    const step = activeSteps[tourIndex];
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
  }, [tourActive, tourIndex, activeSteps, updateTargetRect]);

  const markPageSeen = useCallback((pageId: string) => {
    saveState((prev) => ({
      ...prev,
      welcomed: true,
      seenPages: prev.seenPages.includes(pageId) ? prev.seenPages : [...prev.seenPages, pageId],
    }));
  }, [saveState]);

  const finishTour = useCallback(() => {
    setTourActive(false);
    setProgress(0);
    if (pageGuide) markPageSeen(pageGuide.id);
    else saveState((prev) => ({ ...prev, welcomed: true }));
  }, [pageGuide, markPageSeen, saveState]);

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
        if (tourIndex < activeSteps.length - 1) {
          setTourIndex((i) => i + 1);
        } else {
          finishTour();
        }
      }
    }, 80);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tourActive, autoPlay, tourIndex, activeSteps.length, finishTour]);

  const startCurrentPageTour = () => {
    setWelcomeOpen(false);
    setPageDiscoveryOpen(false);
    setChecklistExpanded(false);
    if (pageGuide) markPageSeen(pageGuide.id);
    setTourIndex(0);
    setAutoPlay(true);
    setTourActive(true);
  };

  const skipWelcome = () => {
    setWelcomeOpen(false);
    markPageSeen('home');
  };

  const dismissPageDiscovery = () => {
    setPageDiscoveryOpen(false);
    if (pageGuide) markPageSeen(pageGuide.id);
  };

  const chooseIntent = (href: string) => {
    setWelcomeOpen(false);
    markPageSeen('home');
    router.push(href);
  };

  if (!mounted) return null;
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null;

  const activePageGuide = pageGuide || HOME_GUIDE;
  const pageTasks = activePageGuide.tasks;
  const pageDoneCount = pageTasks.filter((t) => state.completedTasks.includes(t.id)).length;
  const currentStep = activeSteps[tourIndex];
  const tooltipOnTop = targetRect ? targetRect.top > window.innerHeight * 0.52 : false;
  const pagesMastered = state.seenPages.length;

  return (
    <>
      {/* 1. Home Welcome & Smart Intent Modal */}
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
                      تعرّف على الموقع في 30 ثانية أو اختر وجهتك مباشرة
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

              <button
                type="button"
                onClick={startCurrentPageTour}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#ffc640] to-amber-500 hover:from-[#ffd266] hover:to-amber-400 text-[#0e1013] flex items-center justify-between gap-3 shadow-lg shadow-[#ffc640]/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 text-right">
                  <div className="w-10 h-10 rounded-xl bg-[#0e1013]/15 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-sm sm:text-base">ابدأ الجولة التفاعلية التلقائية (30 ثانية)</div>
                    <div className="text-[11px] sm:text-xs font-bold opacity-80">
                      يتحرك الموقع تلقائياً ويشرح لك كل قسم، وعند دخولك أي صفحة أخرى سيشرحها لك أيضاً
                    </div>
                  </div>
                </div>
                <Play className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
              </button>

              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Target className="w-3.5 h-3.5 text-[#ffc640]" />
                  <span>أو اختر هدفك للانتقال المباشر:</span>
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
                <span className="text-[11px] text-slate-500">يتم شرح كل صفحة تلقائياً عند زيارتها لأول مرة</span>
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

      {/* 2. Per-Page First-Time Discovery Prompt */}
      <AnimatePresence>
        {pageDiscoveryOpen && pageGuide && !tourActive && !welcomeOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            className="fixed bottom-24 left-3 right-3 sm:left-5 sm:right-auto sm:w-[390px] z-[110] rounded-2xl sm:rounded-3xl bg-[#14181f] border border-[#ffc640]/40 p-4 sm:p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ffc640]/15 border border-[#ffc640]/30 flex items-center justify-center text-[#ffc640] shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#ffc640] uppercase">دليل استكشاف الصفحة</span>
                  <h3 className="text-sm sm:text-base font-black text-white">{pageGuide.welcomeTitle}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissPageDiscovery}
                className="p-1.5 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{pageGuide.welcomeDesc}</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={startCurrentPageTour}
                className="h-10 rounded-xl bg-[#ffc640] hover:bg-[#ffd266] text-[#0e1013] font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>جولة هذه الصفحة</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  dismissPageDiscovery();
                  setChecklistExpanded(true);
                }}
                className="h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>مهام الصفحة ({pageTasks.length})</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Auto-Pilot Guided Tour Spotlight Overlay */}
      <AnimatePresence>
        {tourActive && currentStep && (
          <div className="fixed inset-0 z-[130] pointer-events-auto">
            {!targetRect && <div className="absolute inset-0 bg-[#080a0f]/80 backdrop-blur-xs" />}

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

            <motion.div
              key={`${activePageGuide.id}-${tourIndex}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`fixed z-20 left-3 right-3 sm:left-auto sm:right-6 sm:w-[400px] rounded-2xl sm:rounded-3xl bg-[#14181f] border border-[#ffc640]/40 p-4 sm:p-5 shadow-2xl space-y-3.5 ${
                tooltipOnTop ? 'top-20 sm:top-24' : 'bottom-28 sm:bottom-8'
              }`}
            >
              <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#ffc640] transition-all duration-100"
                  style={{ width: autoPlay ? `${progress}%` : '100%' }}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#ffc640]/15 border border-[#ffc640]/30 text-[#ffc640] text-[11px] font-black">
                    {activePageGuide.title} · {currentStep.badge}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAutoPlay((p) => !p)}
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

                {tourIndex < activeSteps.length - 1 ? (
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

      {/* 4. Floating Per-Page Guide & Checklist Widget */}
      {!tourActive && !pageDiscoveryOpen && !state.widgetHidden && (
        <div className="fixed bottom-24 left-3 sm:bottom-5 sm:left-5 z-40 max-w-[calc(100vw-1.5rem)]">
          <AnimatePresence mode="wait">
            {checklistExpanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                className="w-80 sm:w-96 rounded-2xl sm:rounded-3xl bg-[#14181f] border border-white/15 p-4 space-y-3.5 shadow-2xl"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#ffc640]/15 border border-[#ffc640]/30 flex items-center justify-center text-[#ffc640]">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">دليل: {activePageGuide.title}</h4>
                      <p className="text-[11px] text-slate-400">
                        مهام الصفحة: {pageDoneCount}/{pageTasks.length} · استكشفت {pagesMastered}/{TOTAL_DISCOVERABLE_PAGES} صفحة
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => saveState((s) => ({ ...s, widgetHidden: true }))}
                      title="إخفاء الدليل نهائياً"
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

                {/* Page Tasks Progress */}
                <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ffc640] to-emerald-400 transition-all duration-500"
                    style={{ width: `${pageTasks.length ? Math.round((pageDoneCount / pageTasks.length) * 100) : 100}%` }}
                  />
                </div>

                {/* Current Page Tip */}
                <div className="p-2.5 rounded-xl bg-[#0e1013] border border-white/[0.06] flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-[#ffc640] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-300 leading-relaxed">{activePageGuide.pageTip}</p>
                </div>

                {/* Page-Specific Interactive Checklist */}
                <div className="space-y-1.5">
                  {pageTasks.map((task) => {
                    const done = state.completedTasks.includes(task.id);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => completeTask(task.id)}
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
                      </button>
                    );
                  })}
                </div>

                {/* Replay Page Tour & Goal Picker */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={startCurrentPageTour}
                    className="h-9 rounded-xl bg-[#ffc640]/15 hover:bg-[#ffc640]/25 border border-[#ffc640]/30 text-[#ffc640] text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>جولة هذه الصفحة</span>
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

                {/* Site Mastery Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#ffc640]" />
                    <span>إتقان الموقع: {Math.round((pagesMastered / TOTAL_DISCOVERABLE_PAGES) * 100)}%</span>
                  </span>
                  <span>{pageDoneCount === pageTasks.length ? 'اكتملت مهام هذه الصفحة' : 'نفّذ المهام لتعلّم الصفحة'}</span>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="collapsed"
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setChecklistExpanded(true)}
                className="h-11 px-3.5 rounded-2xl bg-[#14181f] border border-[#ffc640]/40 hover:border-[#ffc640] text-white shadow-xl flex items-center gap-2 cursor-pointer group"
              >
                <Compass className="w-4 h-4 text-[#ffc640] group-hover:rotate-45 transition-transform" />
                <span className="text-xs font-black">دليل {activePageGuide.title}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#ffc640] text-[#0e1013] text-[10px] font-black">
                  {pageDoneCount}/{pageTasks.length}
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
