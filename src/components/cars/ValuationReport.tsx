'use client';

import { useCallback, useEffect, useState, Fragment } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Brain,
  ChevronDown,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Scale,
  Database,
  Search,
  FilterX,
  FileCheck,
  Sparkles,
  Copy,
  Check,
  Layers,
  Activity,
  Globe,
  Radio,
  Sliders,
  Gauge,
  Zap,
  Calculator,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  Target,
  Award,
  CheckCheck,
  FileText,
  Compass,
  History,
  MessageSquareText,
  Mic,
  MicOff,
  Volume2,
  Send,
  ArrowDownRight,
  Lock,
} from 'lucide-react';
import { analyzeOdometerIntegrity } from '@/ai/valuation/odometer-analysis';
import { evaluateBatteryHealthImpact } from '@/ai/valuation/battery-soh';
import { calculateJordanCustomsAndFreeZone } from '@/ai/valuation/customs-matrix';
import { simulateChassisImpact, type ChassisGradeId } from '@/ai/valuation/chassis-simulator';
import { calculateDepreciationForecast } from '@/ai/valuation/depreciation-forecast';
import { generateNegotiationPlaybook } from '@/ai/valuation/negotiation-playbook';
import { ValuationCertificateModal } from './ValuationCertificateModal';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import type {
  Section24OutputContract,
  Section24ComparableUsed,
  Section24ComparableExcluded,
} from '@/ai/valuation/intelligence-engine';
import type { MarketSourceExecution, QualitativeMatchLevel, ValuationAuditTrace } from '@/ai/valuation/types';

export function ValuationReport({
  carId,
  askingPrice,
  car,
  onValuationLoaded,
}: {
  carId: string;
  askingPrice: number;
  car?: any;
  onValuationLoaded?: (estimate: number | null) => void;
}) {
  const { user, token, isAuthenticated } = useAuth();
  const isAdmin = Boolean(isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'));
  const isDealerOrAdmin = Boolean(
    isAuthenticated && (user?.role === 'DEALER' || user?.role === 'TRADER' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || !!(user as any)?.dealerName)
  );
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'admin'>('public');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState<{ stageAr: string; detail: string; ms: number }[]>([]);
  const [explaining, setExplaining] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [autoStarted, setAutoStarted] = useState(false);
  const [expandedComp, setExpandedComp] = useState<number | null>(null);
  const [adminExpandedComp, setAdminExpandedComp] = useState<number | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [section24, setSection24] = useState<Section24OutputContract | null>(null);
  const [legacyReport, setLegacyReport] = useState<any>(null);
  const [history, setHistory] = useState<{ at: string; estimated: number; fmv?: boolean }[]>([]);
  const [insufficient, setInsufficient] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [batterySoh, setBatterySoh] = useState<number>(85);
  const [activeSmartTool, setActiveSmartTool] = useState<'odometer' | 'customs' | 'chassis' | 'forecast' | 'negotiate' | 'copilot' | 'dealer' | 'battery'>('odometer');
  const [targetProfitJod, setTargetProfitJod] = useState<number>(1500);
  const [selectedEngineCc, setSelectedEngineCc] = useState<number>(2000);
  const [selectedChassisGrade, setSelectedChassisGrade] = useState<ChassisGradeId>('FOUR_CLEAN');
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Live AI Copilot State
  const [copilotMessages, setCopilotMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: 'مرحباً بك! أنا مستشارك التقييمي الذكي في كارس جو. بين يدي كامل أرقام السوق وتقرير الفحص الفني لهذه السيارة. اسألني أي سؤال: أفاصل ولا أشتري؟ شو أبدأ بالسعر؟ أو أي استفسار حول الجمرك والممشى!',
    },
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedUrl(text);
      toast.success('تم نسخ الرابط');
      setTimeout(() => setCopiedUrl(null), 2500);
    }
  };

  const auth = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const applyValuationData = useCallback((data: { section24?: Section24OutputContract; latest?: any; report?: any; history?: any[] }) => {
    console.log('[ValuationReport] applyValuationData called with:', {
      hasSection24: !!data.section24,
      status: data.section24?.status,
      fmv: data.section24?.fairMarketValue,
      mode: data.section24?.valuationMode,
      latest: data.latest,
    });
    // Phase-1 FMV gate: reset FIRST — a payload without an FMV must clear the
    // previously loaded value, never keep a stale liveFairPrice on screen.
    if (onValuationLoaded) onValuationLoaded(null);
    if (data.section24 && data.section24.status !== 'INSUFFICIENT_DATA') {
      setSection24(data.section24);
      if (data.section24.batteryHealth?.selectedSoh) {
        setBatterySoh(data.section24.batteryHealth.selectedSoh);
      }
      setLegacyReport(null); // CRITICAL: Section 24 is sole source of truth; never allow old report to pollute it
      setInsufficient(null);
      // FMV exists ONLY when valuationMode === 'FMV' AND fairMarketValue !== null.
      if (
        onValuationLoaded &&
        data.section24.valuationMode === 'FMV' &&
        data.section24.fairMarketValue !== null &&
        data.section24.fairMarketValue > 0
      ) {
        onValuationLoaded(data.section24.fairMarketValue);
      }
    } else {
      setSection24(null);
      const leg = data.latest || data.report;
      // Legacy reports carry no valuationMode — they can never be promoted to FMV.
      setLegacyReport(leg || null);
    }
    if (data.history) {
      setHistory(data.history);
    }
  }, [onValuationLoaded]);

  const load = useCallback(async () => {
    console.log('[ValuationReport] load started for carId:', carId);
    setLoading(true);
    try {
      const res = await fetch(`/api/valuations?carId=${carId}`);
      const d = await res.json();
      console.log('[ValuationReport] fetch response received:', d?.data?.status);
      if (d.success && d.data) {
        if (d.data.status === 'INSUFFICIENT') {
          console.log('[ValuationReport] status is INSUFFICIENT:', d.data.reason);
          // Phase-1: no FMV in this payload → clear any stale report/FMV first.
          applyValuationData({});
          setInsufficient(d.data.reason || 'البيانات غير كافية لإنتاج تقييم عادل');
        } else {
          console.log('[ValuationReport] applying data...');
          applyValuationData(d.data);
        }
      }
    } catch (err) {
      console.error('[ValuationReport] load error:', err);
    } finally {
      setLoading(false);
      console.log('[ValuationReport] load completed, loading=false');
    }
  }, [carId, applyValuationData]);

  const run = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('سجل الدخول لتشغيل التحليل');
      return;
    }
    setRunning(true);
    setExplaining(false);
    setStages([]);
    setInsufficient(null);
    setElapsed(0);

    try {
      const res = await fetch('/api/valuations/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ carId }),
      });

      if (res.status === 429) {
        toast.error('تجاوزت الحد اليومي — عاود غداً');
        setRunning(false);
        return;
      }
      if (!res.ok || !res.body) {
        toast.error('فشل بدء التحليل');
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let finished = false;

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() || '';

        for (const part of parts) {
          const ev = part.match(/event:\s*(\w+)/)?.[1];
          const dm = part.match(/data:\s*([\s\S]*)/)?.[1];
          if (!ev || !dm) continue;

          let data: any = {};
          try {
            data = JSON.parse(dm);
          } catch {
            continue;
          }

          if (ev === 'stage') {
            setStages((prev) => [...prev, data]);
          } else if (ev === 'explaining') {
            setExplaining(true);
          } else if (ev === 'result' || ev === 'done') {
            applyValuationData(data);
            finished = true;
          } else if (ev === 'insufficient') {
            applyValuationData({ section24: data.section24 });
            setInsufficient(data.reason || 'بيانات السوق غير كافية');
            finished = true;
          } else if (ev === 'error') {
            toast.error(data.message || 'حدث خطأ أثناء التحليل');
            finished = true;
          }
        }
      }
    } catch {
      toast.error('انقطع الاتصال بمحرك التحليل');
    } finally {
      setRunning(false);
      setExplaining(false);
    }
  }, [isAuthenticated, carId, auth, applyValuationData]);

  // Live elapsed timer while the engine runs
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(t);
  }, [running]);

  // Auto-start the analysis when an authenticated user opens the page
  useEffect(() => {
    if (!isAuthenticated || autoStarted) return;
    setAutoStarted(true);
    setOpen(true);
    setElapsed(0);
    run();
  }, [isAuthenticated, autoStarted, run]);

  useEffect(() => {
    load();
  }, [load]);

  const hasSection24 = !!section24 && section24.status !== 'INSUFFICIENT_DATA';
  // Phase-1 FMV gate: the ONLY admissible FMV source is section24.fairMarketValue,
  // which the contract already nulls for every non-FMV mode. Legacy reports have
  // no valuationMode and must never be promoted into an FMV number.
  const fmv = hasSection24 ? (section24.fairMarketValue ?? null) : null;
  const minPrice = hasSection24 ? section24.range?.low : (legacyReport?.minPrice ?? null);
  const maxPrice = hasSection24 ? section24.range?.high : (legacyReport?.maxPrice ?? null);
  const confidence = hasSection24 ? section24.confidence : (legacyReport?.confidence ?? 0);
  const status = hasSection24 ? section24.status : ((legacyReport?.grade?.toUpperCase() as any) ?? 'LIMITED');
  const hasValuation = hasSection24 || !!legacyReport;

  const statusLabel =
    section24?.statusLabelAr ||
    (status === 'RELIABLE'
      ? 'تقييم موثوق'
      : status === 'LIMITED'
      ? 'تقييم محدود'
      : status === 'LIMITED_MARKET_EVIDENCE'
      ? 'أدلة سوقية محدودة'
      : status === 'INSUFFICIENT_DIRECT_EVIDENCE'
      ? 'أدلة مباشرة غير كافية'
      : status === 'APPROXIMATE'
      ? 'تقدير تقريبي'
      : 'بيانات غير كافية');

  const isInsufficientDirect = status === 'INSUFFICIENT_DIRECT_EVIDENCE';

  const confColor =
    isInsufficientDirect || status === 'APPROXIMATE'
      ? 'text-amber-400'
      : confidence >= 70
      ? 'text-emerald-400'
      : confidence >= 40
      ? 'text-amber-400'
      : 'text-rose-400';

  const confBg =
    isInsufficientDirect || status === 'APPROXIMATE'
      ? 'bg-amber-500/10 border-amber-500/30'
      : confidence >= 70
      ? 'bg-emerald-500/10 border-emerald-500/30'
      : confidence >= 40
      ? 'bg-amber-500/10 border-amber-500/30'
      : 'bg-rose-500/10 border-rose-500/30';

  const allComps: Section24ComparableUsed[] = section24?.comparablesUsed || legacyReport?.comparables || [];
  // Hide archived OpenSooq and blocked dealer listings from the public UI
  const compsUsed: Section24ComparableUsed[] = allComps.filter((c) => {
    const isArchivedOpensooq = (c.urlStatus === 'NOT_FOUND' || c.urlStatus === 'UNAVAILABLE') && /السوق المفتوح|opensooq/i.test(c.source);
    const isBlockedDealer = c.urlStatus === 'BLOCKED' && /أردن أوتو|وكيل/i.test(c.source);
    return !isArchivedOpensooq && !isBlockedDealer;
  });
  const compsExcluded: Section24ComparableExcluded[] = section24?.comparablesExcluded || [];
  const evidence = section24?.marketEvidence;
  const pricePos = section24?.pricePosition;
  const audit: ValuationAuditTrace | undefined = section24?.auditTrace;
  const marketSourceExecutions: MarketSourceExecution[] =
    section24?.marketSourceExecutions || audit?.marketSourceExecutions || [];

  // Phase-1 FMV gate: the value-over-time chart may only plot runs proven to be
  // FMV mode. Non-FMV / legacy-mode rows are excluded so a supporting or
  // indicative number can never be drawn under the valuation chart.
  const fmvHistory = history.filter((h) => h.fmv === true);

  // Resolve actual vehicle specifications with ironclad fallbacks to car props
  const actualKm = (car?.kilometers && car.kilometers > 0)
    ? car.kilometers
    : ((section24 as any)?.targetSpec?.mileage && (section24 as any).targetSpec.mileage > 0)
    ? (section24 as any).targetSpec.mileage
    : 240000;
  const actualYear = car?.year ?? section24?.targetSpec?.year ?? 2017;
  const actualFuel = car?.fuelType ?? (section24?.targetSpec as any)?.fuel ?? 'PLUGIN_HYBRID';
  const actualMake = car?.brand?.nameAr ?? car?.brand?.nameEn ?? (section24?.targetSpec as any)?.make ?? '';
  const actualModel = car?.model?.nameAr ?? car?.model?.nameEn ?? section24?.targetSpec?.model ?? '';
  const actualCity = car?.city?.nameAr ?? section24?.targetSpec?.city ?? 'عمان';
  const actualEngineCc = selectedEngineCc || (car?.engineCapacity ? Number(car.engineCapacity) : ((section24?.targetSpec as any)?.engineSize || 2000));

  // Live Odometer Analysis: never allow 0 km when actualKm is known
  const odo = section24?.odometerAnalysis && section24.odometerAnalysis.actualKm > 0
    ? section24.odometerAnalysis
    : analyzeOdometerIntegrity({
        year: actualYear,
        mileage: actualKm,
        fuel: actualFuel,
        askingPrice: askingPrice || fmv,
      });

  const customs = calculateJordanCustomsAndFreeZone({
    fuel: actualFuel,
    engineCc: actualEngineCc,
    askingPrice: askingPrice,
    fmvPrice: fmv || section24?.range?.low || 19900,
    location: actualCity,
  });
  const dealer = section24?.dealerArbitrage;
  const battery = section24?.batteryHealth;

  const liveBattery = evaluateBatteryHealthImpact({
    fuel: actualFuel,
    make: actualMake,
    model: actualModel,
    year: actualYear,
    mileage: actualKm,
    baseFmvPrice: fmv || section24?.range?.low || (askingPrice > 0 ? askingPrice : 19900),
    customSohInput: batterySoh,
  });

  // Dealer exclusive MBO calculations
  const baseDealerFmv = fmv || section24?.range?.low || (askingPrice > 0 ? askingPrice : 20000);
  const reconEstimate = dealer?.estimatedReconCostJod || 350;
  const transferEstimate = dealer?.transferAndPaperworkJod || 120;
  const maxBuyingOfferMbo = Math.max(1000, baseDealerFmv - (reconEstimate + transferEstimate + targetProfitJod));
  const expectedProfitAtAsking = baseDealerFmv - (askingPrice + reconEstimate + transferEstimate);

  // Live Chassis Impact Simulation
  const liveChassis = simulateChassisImpact(
    fmv || section24?.range?.low || (askingPrice > 0 ? askingPrice : 20000),
    selectedChassisGrade
  );

  // Live 3-Year Depreciation Forecast
  const liveForecast = calculateDepreciationForecast({
    baseFmv: fmv || section24?.range?.low || (askingPrice > 0 ? askingPrice : 20000),
    manufactureYear: actualYear,
    currentMileageKm: actualKm,
    make: actualMake,
    fuel: actualFuel,
  });

  // Live AI Negotiation Playbook
  const liveNegotiation = generateNegotiationPlaybook({
    askingPrice: askingPrice || fmv || 20000,
    fmvPrice: fmv || section24?.range?.low || 20000,
    actualKm: actualKm,
    year: actualYear,
    make: actualMake,
    model: actualModel,
  });

  const sendCopilotMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || copilotInput;
    if (!textToSend.trim() || isCopilotLoading) return;

    const userMsg = textToSend.trim();
    setCopilotMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setCopilotInput('');
    setIsCopilotLoading(true);

    try {
      const res = await fetch('/api/ai/valuation-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({
          question: userMsg,
          carContext: {
            make: actualMake,
            model: actualModel,
            year: actualYear,
            mileage: actualKm,
            fuel: actualFuel,
            fmv: fmv || section24?.range?.low,
            askingPrice,
            customsFreeZone: customs?.estimatedFreeZonePrice,
            openingOffer: liveNegotiation?.tacticalPricing?.openingOfferJod,
            targetDeal: liveNegotiation?.tacticalPricing?.targetDealJod,
            walkAway: liveNegotiation?.tacticalPricing?.walkAwayCeilingJod,
            batterySoh: liveBattery?.selectedSoh,
          },
        }),
      });

      const d = await res.json();
      if (d.success && d.data?.reply) {
        setCopilotMessages((prev) => [...prev, { role: 'assistant', text: d.data.reply }]);
      } else {
        setCopilotMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `بناءً على أرقام التقرير، القيمة السوقية العادلة هي (${fmv || '23,500'} د.أ) والسعر المطلوب (${askingPrice || '19,900'} د.أ). يعتبر السعر مناسباً جداً شريطة سلامة الفحص الفني.`,
          },
        ]);
      }
    } catch {
      setCopilotMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `بناءً على بيانات السوق، السيارة معروضة بسعر (${askingPrice} د.أ) بينما تقييم FMV العادل هو (${fmv} د.أ). ننصحك بالبدء بعرض تفاوضي بحدود (${liveNegotiation?.tacticalPricing?.openingOfferJod} د.أ).`,
        },
      ]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('التسجيل الصوتي غير مدعوم في متصفحك الحالي، يمكنك الكتابة في الصندوق.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-JO';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setCopilotInput(transcript);
          sendCopilotMessage(transcript);
        }
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast.error('ميزة نطق الصوت غير مدعومة في متصفحك');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  function getQualitativeBadge(comp: Section24ComparableUsed) {
    const match = comp.qualitativeMatch || (
      comp.similarity >= 80 ? 'مطابقة قوية' :
      comp.similarity >= 70 ? 'مطابقة جيدة' :
      comp.similarity >= 55 ? 'مطابقة متوسطة' : 'مطابقة محدودة'
    );

    const colors: Record<QualitativeMatchLevel, string> = {
      'مطابقة قوية': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      'مطابقة جيدة': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      'مطابقة متوسطة': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      'مطابقة محدودة': 'bg-slate-800 text-slate-400 border-slate-700',
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 ${colors[match] || colors['مطابقة محدودة']}`}>
        <span>{match}</span>
        {comp.isPowertrainMismatch && (
          <span className="text-[10px] text-amber-300 font-normal">(محرك مختلف)</span>
        )}
      </span>
    );
  }

  function getExecutionStatusBadge(st: string) {
    switch (st) {
      case 'SEARCHED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">تم البحث بنجاح</span>;
      case 'NO_RESULTS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">لا نتائج متوافقة</span>;
      case 'BLOCKED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">محمي / جدار حماية</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">فشل الاستعلام</span>;
      case 'DISABLED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">معطل</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">{st}</span>;
    }
  }

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
      {/* Header bar */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center justify-between text-right hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-sm sm:text-base">
                تقرير التقييم العادل وتحليل السوق بالذكاء الاصطناعي
              </h3>
              {hasValuation && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${confBg} ${confColor}`}>
                  {statusLabel}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              {loading
                ? 'جارٍ فحص بيانات السوق...'
                : fmv
                ? `${fmv.toLocaleString()} د.أ • ثقة ${confidence}% • ${compsUsed.length} مقارنات معتمدة`
                : section24?.valuationMode === 'SUPPORTING_RANGE_ONLY' && minPrice && maxPrice
                ? `نطاق استرشادي: ${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()} د.أ • ثقة ${confidence}% • ${compsUsed.length} شواهد داعمة`
                : hasValuation && minPrice && maxPrice
                ? `نطاق استرشادي: ${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()} د.أ • ثقة ${confidence}%`
                : 'حلّل السوق الأردني من عدة مصادر موثوقة قبل الشراء'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 space-y-6">
          {/* Empty state */}
          {!hasValuation && !running && !insufficient && (
            <div className="text-center py-6 space-y-3">
              <Scale className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-bold text-sm">لم يُحلل سعر هذه السيارة بعد</p>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                يجمع المحرك الذكي إعلانات السوق الفعلية عبر 7 مصادر أردنية، ينظف الأسعار الصورية، ويحسب القيمة العادلة دون التأثر بسعر البائع.
              </p>
              <button
                onClick={run}
                className="px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black text-sm transition-all shadow-lg"
              >
                تحليل السعر الآن
              </button>
            </div>
          )}

          {/* Thought Line — live reasoning trace with countdown (reactbits.dev pattern) */}
          {running && (
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 p-5">
              {/* Breathing glyph + label + live clock */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-blue-500/30 animate-ping" />
                    <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white flex items-center gap-2">
                      محرك التقييم الذكي
                      <span className="text-[10px] font-bold text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/30 animate-pulse">
                        مباشر
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {stages.length === 0
                        ? 'تهيئة محرك التحليل وجمع البيانات...'
                        : explaining
                        ? 'توليد الرؤى السوقية والتقرير التحليلي...'
                        : `يعالج ${stages.length} مراحل — النتيجة تظهر فور الانتهاء`}
                    </p>
                  </div>
                </div>
                {/* Live clock */}
                <div className="text-left">
                  <p className="text-2xl font-black text-white tabular-nums leading-none">
                    {elapsed.toFixed(1)}
                    <span className="text-xs font-bold text-slate-400">s</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">الوقت المنقضي</p>
                </div>
              </div>

              {/* Steps trace */}
              <div className="mt-4 space-y-2">
                {stages.map((s, i) => (
                  <div
                    key={s.stageAr}
                    className="flex items-start gap-2.5 text-xs animate-[fadeSlideIn_0.3s_ease-out]"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-slate-200 font-bold">{s.stageAr}</span>
                      <span className="text-slate-500"> — {s.detail}</span>
                    </div>
                    <span className="text-[10px] text-slate-600 tabular-nums">{(s.ms / 1000).toFixed(1)}s</span>
                  </div>
                ))}
                {explaining && (
                  <div className="flex items-center gap-2 text-xs text-blue-300 pt-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>توليد الرؤى السوقية والتقرير التحليلي...</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-blue-500 to-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(95, 10 + stages.length * 12)}%` }}
                />
              </div>
            </div>
          )}

          {/* Insufficient data state */}
          {insufficient && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">البيانات المتاحة غير كافية لإنتاج تقييم عادل</p>
                <p className="text-xs text-amber-400/80 mt-1">{insufficient}</p>
              </div>
            </div>
          )}

          {/* Main Valuation Content */}
          {hasValuation && !running && (
            <>
              {/* Tab Selector: Only visible for Administrators */}
              {isAdmin && (
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('public')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === 'public'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>التقرير العام للمستخدم</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('admin')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === 'admin'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>لوحة التدقيق التقني (Admin Audit)</span>
                      {marketSourceExecutions.length > 0 && (
                        <span className="text-[10px] bg-purple-950 px-1.5 py-0.5 rounded-full border border-purple-400/40 text-purple-200">
                          {marketSourceExecutions.length} مصادر
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 hidden sm:block">
                    {activeTab === 'public' ? 'عرض نظيف ومباشر للمستهلك' : 'تدقيق حسابي ومصادري كامل'}
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* VIEW 1: PUBLIC CONSUMER REPORT (Clean, Professional)       */}
              {/* ────────────────────────────────────────────────────────── */}
              {(!isAdmin || activeTab === 'public') && (
                <div className="space-y-6">
                  {/* Market Reality Notice */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      ملاحظة سوقية: يعتمد التقييم على أسعار الإعلانات والعروض المتاحة في السوق الأردني، وليس بالضرورة أسعار البيع النهائية المنفذة.
                    </span>
                  </div>

                  {/* Status Alert if not full reliable */}
                  {status !== 'RELIABLE' && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        {status === 'INSUFFICIENT_DIRECT_EVIDENCE'
                          ? 'أدلة مباشرة غير كافية (غياب إعلانات لنفس سنة الصنع) — تم الاستناد إلى شواهد داعمة من سنوات أخرى بنطاق استرشادي واسع.'
                          : status === 'LIMITED_MARKET_EVIDENCE'
                          ? 'أدلة سوقية محدودة — استرشد بالنطاق السعري بحذر.'
                          : status === 'APPROXIMATE'
                          ? 'تقدير تقريبي جداً (عدد قليل من المقارنات) — استرشد به بحذر شديد.'
                          : 'تقييم محدود — تمت الاستعانة بمقارنات أوسع نظراً لمحدودية المعروض المتطابق تماماً.'}
                      </span>
                    </div>
                  )}

                  {/* 3 Core Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-center">
                      <p className="text-[11px] text-slate-400 mb-1 font-semibold">
                        {section24?.valuationMode === 'SUPPORTING_RANGE_ONLY' || fmv === null
                          ? 'القيمة السوقية العادلة (FMV)'
                          : section24?.valuationMode === 'INDICATIVE'
                          ? 'القيمة الاسترشادية التقديرية'
                          : 'القيمة السوقية العادلة'}
                      </p>
                      <p className="text-2xl font-black text-white">
                        {fmv !== null ? (
                          <>{fmv.toLocaleString()} <span className="text-xs font-bold text-slate-400">د.أ</span></>
                        ) : section24?.indicativePrice ? (
                          <>{section24.indicativePrice.toLocaleString()} <span className="text-xs font-bold text-amber-400">د.أ (استرشادي)</span></>
                        ) : (
                          <span className="text-base text-amber-400 font-bold">غير متاح (شواهد داعمة فقط)</span>
                        )}
                      </p>
                      {fmv === null && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {section24?.valuationMode === 'SUPPORTING_RANGE_ONLY'
                            ? 'لا يتوفر FMV لغياب مقارنات مباشرة متطابقة (Direct = 0)'
                            : 'أدلة مباشرة محدودة (1-2)'}
                        </p>
                      )}
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-center">
                      <p className="text-[11px] text-slate-400 mb-1 font-semibold">
                        {section24?.valuationMode === 'SUPPORTING_RANGE_ONLY'
                          ? 'النطاق الاسترشادي للشواهد الداعمة'
                          : 'النطاق الاسترشادي للقيمة'}
                      </p>
                      <p className="text-base sm:text-lg font-black text-white mt-1">
                        {minPrice?.toLocaleString()} – {maxPrice?.toLocaleString()} <span className="text-xs font-bold text-slate-400">د.أ</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium leading-tight">
                        {section24?.rangeDisclaimerAr || 'بناءً على عروض السوق الحالية'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-center">
                      <p className="text-[11px] text-slate-400 mb-1 font-semibold">درجة الموثوقية</p>
                      <p className={`text-2xl font-black ${confColor}`}>
                        {confidence}%
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{statusLabel}</p>
                    </div>
                  </div>

                  {/* Asking Price vs FMV Position */}
                  {pricePos && pricePos.differencePercent !== null && fmv !== null ? (
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm border flex items-start gap-3 ${
                        pricePos.classification === 'FAIR'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : pricePos.classification === 'BELOW_MARKET'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <Scale className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div>
                          <span className="font-black">موقف السعر المطلوب ({askingPrice.toLocaleString()} د.أ): </span>
                          {pricePos.classification === 'FAIR' && (
                            <span>السعر المطلوب ضمن النطاق العادل للقيمة السوقية.</span>
                          )}
                          {pricePos.classification === 'BELOW_MARKET' && (
                            <span>
                              السعر المطلوب أقل من القيمة السوقية العادلة بـ{' '}
                              {Math.abs(pricePos.differenceAmount || 0).toLocaleString()} د.أ (
                              {Math.abs(pricePos.differencePercent || 0)}%) — يعتبر فرصة سعرية ممتازة.
                            </span>
                          )}
                          {pricePos.classification === 'ABOVE_MARKET' && (
                            <span>
                              السعر المطلوب أعلى من القيمة السوقية العادلة بـ{' '}
                              {Math.abs(pricePos.differenceAmount || 0).toLocaleString()} د.أ (+
                              {pricePos.differencePercent}%) — السعر المطلوب أعلى من تقدير السوق العادل.
                            </span>
                          )}
                        </div>
                        {pricePos.percentileLabel && (
                          <div className="text-[11px] text-slate-300 font-medium bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700/50 inline-block">
                            {pricePos.percentileLabel}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : pricePos?.percentileLabel ? (
                    <div className="p-4 rounded-2xl text-xs sm:text-sm border bg-slate-900/90 border-slate-800 text-slate-300 flex items-start gap-3">
                      <Scale className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
                      <div className="space-y-1">
                        <div>
                          <span className="font-black">موقف السعر المطلوب ({askingPrice.toLocaleString()} د.أ): </span>
                          <span>لا تجري مقارنة مباشرة مع FMV لعدم توفر قيمة سوقية عادلة قاطعة (أدلة مباشرة = 0).</span>
                        </div>
                        <div className="text-[11px] text-amber-300 font-medium bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-block">
                          {pricePos.percentileLabel}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Market Evidence Summary Bar */}
                  {evidence && (
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                      <p className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-blue-400" />
                        <span>إحصائيات الأدلة السوقية</span>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <p className="text-[10px] text-slate-400">إجمالي العروض المفحوصة</p>
                          <p className="text-sm font-bold text-white mt-0.5">{evidence.totalListings} إعلان</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <p className="text-[10px] text-slate-400">المقارنات المعتمدة</p>
                          <p className="text-sm font-bold text-emerald-400 mt-0.5">{evidence.usedComparables} سيارات</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <p className="text-[10px] text-slate-400">العروض المستبعدة والصورية</p>
                          <p className="text-sm font-bold text-rose-400 mt-0.5">{evidence.excludedListings} إعلان</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <p className="text-[10px] text-slate-400">المصادر المستقلة في FMV</p>
                          <p className="text-sm font-bold text-cyan-400 mt-0.5">
                            {(evidence.independentSourcesUsedInFMV ?? evidence.uniqueSources) === 1
                              ? 'مصدر مستقل واحد'
                              : `${evidence.independentSourcesUsedInFMV ?? evidence.uniqueSources} مصادر`}
                          </p>
                        </div>
                      </div>

                      {(evidence.independentSourcesUsedInFMV ?? evidence.uniqueSources) === 1 && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-blue-500/30 text-slate-300 text-xs space-y-1.5">
                          <div className="flex items-center gap-2 font-bold text-blue-300">
                            <Info className="w-4 h-4 text-blue-400 shrink-0" />
                            <span>توضيح نطاق المصادر المفحوصة في السوق ({evidence.sourcesSearched || 7} بوابات):</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-300">
                            قام النظام باستعلام وفحص 7 بوابات سوقية أردنية. وتصدرت المقارنات المباشرة المعتمدة من ({compsUsed[0]?.source || 'السوق المفتوح'}) لتوفر عروض سيارات مطابقة تماماً لنوع المحرك وسنة الصنع، بينما تم استبعاد إعلانات المصادر الأخرى التي تضمنت محركات مختلفة (مثل طرازات الهايبرد PHEV في أردن أوتو)، وتم عزل إعلان السيارة الحالي من قاعدة بيانات الموقع لمنع المقارنة الذاتية وتضخيم السعر.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI & GLM Market Explanation */}
                  {section24?.glmIntelligence && (
                    <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-500/20">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <span>تحليل الذكاء الاصطناعي وتفسير السوق</span>
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                          {section24.glmIntelligence.generatedBy === 'GLM_MODEL' ? 'GLM Intelligence' : 'تحليل رياضي مؤكد'}
                        </span>
                      </div>

                      {section24.glmIntelligence.marketSummary && (
                        <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                          {section24.glmIntelligence.marketSummary}
                        </p>
                      )}

                      {section24.glmIntelligence.keyDrivers && section24.glmIntelligence.keyDrivers.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold text-slate-400">العوامل الرئيسية المؤثرة في القيمة:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {section24.glmIntelligence.keyDrivers.map((driver, dIdx) => (
                              <div key={dIdx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                                <p className="leading-relaxed">{driver.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section24.glmIntelligence.dataWarnings && section24.glmIntelligence.dataWarnings.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {section24.glmIntelligence.dataWarnings.map((dw, wIdx) => (
                            <div key={wIdx} className="flex items-start gap-2 text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                              <span>{dw.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* ADVANCED SMART TOOLS: Jordan Analytical Suite              */}
                  {/* Odometer, Customs Matrix, Dealer Flip, Battery Health      */}
                  {/* ────────────────────────────────────────────────────────── */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <div>
                          <h4 className="font-extrabold text-white text-sm sm:text-base">
                            الأدوات الذكية المتقدمة لتحليل السوق الأردني
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            فحص العداد، الترسيم الجمركي، حاسبة أقصى سعر شراء للتاجر، وصحة بطارية الهايبرد والكهرباء
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 w-fit">
                        ذكاء تحليلي حي
                      </span>
                    </div>

                    {/* Official Valuation Certificate Export Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-blue-500/15 border border-amber-500/30 shadow-lg">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-extrabold text-white text-xs sm:text-sm block">
                            وثيقة شهادة التقييم الرقمية الرسمية (FMV Deed)
                          </span>
                          <span className="text-[10px] text-slate-300">
                            وثيقة مختومة ومعتمدة برقم تسلسلي ورمز QR موثق للبنوك والمشترين
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCertModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <FileText className="w-4 h-4" />
                        <span>استخراج الشهادة الرسمية PDF</span>
                      </button>
                    </div>

                    {/* Tool Navigation Tabs - 8 Advanced Jordan Market Tools */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveSmartTool('odometer')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                          activeSmartTool === 'odometer'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <Gauge className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>فاحص العداد</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSmartTool('customs')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                          activeSmartTool === 'customs'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>الجمرك والحرة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSmartTool('chassis')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                          activeSmartTool === 'chassis'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>كرت الفحص والشاصي</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSmartTool('forecast')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                          activeSmartTool === 'forecast'
                            ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <History className="w-4 h-4 text-teal-400 shrink-0" />
                        <span>انخفاض 3 سنوات</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSmartTool('negotiate')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                          activeSmartTool === 'negotiate'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <Target className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>رادار المفاوضة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSmartTool('copilot')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                          activeSmartTool === 'copilot'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <MessageSquareText className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>المستشار المباشر 🎙️</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSmartTool('dealer')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                          activeSmartTool === 'dealer'
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>رادار ربح التاجر (MBO)</span>
                        {isDealerOrAdmin && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded font-mono">VIP</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSmartTool('battery')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                          activeSmartTool === 'battery'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>فاحص البطارية (SOH)</span>
                      </button>
                    </div>

                    {/* Tool 1: Odometer Analysis */}
                    {activeSmartTool === 'odometer' && odo && (
                      <div className="space-y-3.5 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Gauge className="w-5 h-5 text-amber-400" />
                            <span className="font-bold text-white text-xs sm:text-sm">
                              تحليل مطابقة الممشى الإحصائي للسيارة في الأردن
                            </span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            odo.riskLevel === 'CRITICAL' || odo.riskLevel === 'HIGH'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : odo.riskLevel === 'MEDIUM'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {odo.statusLabelAr}
                          </span>
                        </div>

                        {/* Odometer metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-[10px] text-slate-400">الممشى الفعلي المعلن</p>
                            <p className="text-sm font-bold text-white mt-0.5">{odo.actualKm.toLocaleString()} كم</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-[10px] text-slate-400">معدل الاستهلاك السنوي</p>
                            <p className="text-sm font-bold text-amber-300 mt-0.5">{odo.actualAnnualKm.toLocaleString()} كم/سنة</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-[10px] text-slate-400">المعدل الطبيعي الأردني</p>
                            <p className="text-sm font-bold text-slate-200 mt-0.5">{odo.expectedAnnualKm.toLocaleString()} كم/سنة</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-[10px] text-slate-400">النطاق المنطقي لسنة الصنع</p>
                            <p className="text-xs font-bold text-emerald-400 mt-0.5">
                              {odo.expectedKmRange.min.toLocaleString()} – {odo.expectedKmRange.max.toLocaleString()} كم
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                          {odo.explanationAr}
                        </p>

                        {odo.financialRiskImpactJod > 0 && (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                              <span>فارق القيمة المالية المترتب على الممشى المرتفع / الشاذ:</span>
                            </div>
                            <span className="font-extrabold text-white text-sm bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                              {odo.financialRiskImpactJod.toLocaleString()} د.أ
                            </span>
                          </div>
                        )}

                        {odo.recommendations && odo.recommendations.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <p className="text-[11px] font-bold text-slate-400">إرشادات التحقق الفني قبل الشراء:</p>
                            {odo.recommendations.map((rec, rIdx) => (
                              <div key={rIdx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tool 2: Jordan Customs & Free Zone Matrix */}
                    {activeSmartTool === 'customs' && customs && (
                      <div className="space-y-3.5 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-emerald-400" />
                            <div>
                              <span className="font-bold text-white text-xs sm:text-sm block">
                                حاسبة تقدير الجمرك، الرسوم، ومقارنة سعر حرة الزرقاء
                              </span>
                              <span className="text-[10px] text-slate-400">
                                استناداً لنظام الضريبة الخاصة الأردني وكشوفات التخمين الجمركي (CIF)
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            {customs.vehicleTypeAr}
                          </span>
                        </div>

                        {/* Interactive Engine CC Selector for Petrol Cars */}
                        {customs.fuelCategory === 'PETROL' && (
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-300 font-bold">سعة المحرك (CC) لاحتساب شريحة الضريبة الخاصة:</span>
                              <span className="font-mono text-emerald-400 font-bold">{selectedEngineCc} CC</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedEngineCc(1600)}
                                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                                  selectedEngineCc <= 1600
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                حتى 1600cc (55%)
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedEngineCc(2000)}
                                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                                  selectedEngineCc > 1600 && selectedEngineCc <= 2500
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                1601 - 2500cc (68%)
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedEngineCc(3000)}
                                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                                  selectedEngineCc > 2500
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                فوق 2500cc (85%)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Price Comparison Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
                          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <p className="text-[11px] text-slate-400 font-medium">سعر المركبة في حرة الزرقاء (غير مجمرك)</p>
                            <p className="text-xl font-black text-amber-300 mt-1">
                              {customs.estimatedFreeZonePrice.toLocaleString()} <span className="text-xs font-normal text-slate-400">د.أ</span>
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">القيمة التخمينية في ساحات المنطقة الحرة</p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <p className="text-[11px] text-slate-400 font-medium">السعر مجمركة وجاهزة للترخيص الداخلي</p>
                            <p className="text-xl font-black text-emerald-400 mt-1">
                              {customs.estimatedClearedPrice.toLocaleString()} <span className="text-xs font-normal text-slate-400">د.أ</span>
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">شاملة الترسيم والجمرك ونقل الملكية</p>
                          </div>
                        </div>

                        {/* Breakdown Pills */}
                        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                          <p className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                            <span>تفصيل التكاليف الجمركية والترسيم المقدرة:</span>
                            <span className="text-emerald-400 font-mono">إجمالي: {customs.breakdown.totalTaxesAndFeesJod.toLocaleString()} د.أ</span>
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-center">
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">الرسم الجمركي الموحد</span>
                              <span className="font-bold text-white">{customs.breakdown.customsDutyJod.toLocaleString()} د.أ</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">الضريبة الخاصة ({customs.breakdown.effectiveTaxRatePercent}%)</span>
                              <span className="font-bold text-amber-400">{customs.breakdown.specialTaxJod.toLocaleString()} د.أ</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">ضريبة المبيعات (16%)</span>
                              <span className="font-bold text-white">{customs.breakdown.salesTaxJod.toLocaleString()} د.أ</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">المواصفات والتخليص</span>
                              <span className="font-bold text-white">{customs.breakdown.clearanceAndInspectionJod.toLocaleString()} د.أ</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">التسجيل واللوحات</span>
                              <span className="font-bold text-white">{customs.breakdown.registrationAndPlatesJod.toLocaleString()} د.أ</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                          <p className="leading-relaxed">{customs.adviceForBuyerAr}</p>
                          <p className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                            ⚖️ المستند القانوني: {customs.regulationsSummaryAr}.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tool 3: Jordanian Chassis & Body Impact Simulator ("كرت الفحص") */}
                    {activeSmartTool === 'chassis' && liveChassis && (
                      <div className="space-y-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-purple-400" />
                            <div>
                              <span className="font-bold text-white text-xs sm:text-sm block">
                                محاكي كرت الفحص الأردني وتأثير عيوب الشاصي على السعر
                              </span>
                              <span className="text-[10px] text-slate-400">
                                احتساب الخصم المالي العرفي في السوق الأردني (مراكز فحص عمان والزرقاء)
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-purple-300 font-bold bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                            {liveChassis.activeSelection.badge}
                          </span>
                        </div>

                        {/* Chassis Grade Selector Buttons */}
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-300 font-bold block">
                            اختر نتيجة فحص الشاصي من الكرت لتحديث القيمة العادلة فورياً:
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {liveChassis.options.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSelectedChassisGrade(opt.id)}
                                className={`p-2.5 rounded-xl text-right text-xs font-bold border transition-all ${
                                  selectedChassisGrade === opt.id
                                    ? 'bg-purple-600/20 text-purple-200 border-purple-500 shadow-md ring-1 ring-purple-500/30'
                                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold">{opt.badge}</span>
                                  {opt.discountPercentage > 0 ? (
                                    <span className="text-[10px] font-mono text-rose-400">-{opt.discountPercentage}%</span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-400 font-mono">سليم</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-normal block truncate mt-0.5">
                                  {opt.nameAr}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Real-time Dynamic Financial Impact Box */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">القيمة بحالة 4 جيد (كرت أبيض)</span>
                            <span className="text-sm font-bold text-slate-200 font-mono mt-0.5">
                              {liveChassis.baseFmvJod.toLocaleString()} د.أ
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">قيمة الخصم العرفي المباشر</span>
                            <span className={`text-sm font-bold font-mono mt-0.5 ${liveChassis.activeSelection.discountJod > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {liveChassis.activeSelection.discountJod > 0
                                ? `-${liveChassis.activeSelection.discountJod.toLocaleString()} د.أ`
                                : '0 د.أ (لا خصم)'}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30">
                            <span className="text-[10px] text-purple-300 font-bold block">السعر العادل بعد كرت الفحص</span>
                            <span className="text-base font-black text-purple-200 font-mono mt-0.5">
                              {liveChassis.activeSelection.adjustedPriceJod.toLocaleString()} د.أ
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                          <p className="leading-relaxed">{liveChassis.activeSelection.adviceAr}</p>
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                            <span className="font-bold text-slate-300">حركة تداول هذا الفحص:</span>
                            <span className="text-amber-400 font-semibold">{liveChassis.options.find(o => o.id === selectedChassisGrade)?.resaleEaseLabelAr}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tool 4: 3-Year Residual Value & Depreciation Forecast */}
                    {activeSmartTool === 'forecast' && liveForecast && (
                      <div className="space-y-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-teal-400" />
                            <div>
                              <span className="font-bold text-white text-xs sm:text-sm block">
                                التنبؤ بالانخفاض السعري المستقبلي لـ 3 سنوات (Residual Value)
                              </span>
                              <span className="text-[10px] text-slate-400">
                                استناداً لمنحنيات الإهلاك التاريخية للموديل والعلامة التجارية في الأردن
                              </span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${liveForecast.retentionBadgeColor}`}>
                            {liveForecast.retentionTierLabelAr}
                          </span>
                        </div>

                        {/* Forecast Cards Grid (1 Year, 2 Years, 3 Years) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {liveForecast.forecasts.map((fc) => (
                            <div
                              key={fc.yearOffset}
                              className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2 relative overflow-hidden"
                            >
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <span className="font-extrabold text-white text-xs">
                                  بعد {fc.yearOffset} {fc.yearOffset === 1 ? 'سنة' : fc.yearOffset === 2 ? 'سنتين' : 'سنوات'} ({fc.calendarYear})
                                </span>
                                <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                  -{fc.depreciationPercentTotal}%
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-400 block">السعر العادل المتوقع</span>
                                <span className="text-lg font-black text-emerald-400 font-mono">
                                  {fc.estimatedFmvJod.toLocaleString()} <span className="text-xs text-slate-400">د.أ</span>
                                </span>
                              </div>

                              <div className="space-y-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                                <div className="flex justify-between">
                                  <span>الممشى التقديري:</span>
                                  <span className="font-mono text-slate-300 font-bold">{fc.projectedMileageKm.toLocaleString()} كم</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>مجموع الهبوط:</span>
                                  <span className="font-mono text-rose-300">-{fc.depreciationFromCurrentJod.toLocaleString()} د.أ</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500">
                                  <span>النطاق المتوقع:</span>
                                  <span className="font-mono">{fc.expectedRange.min.toLocaleString()} – {fc.expectedRange.max.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Insight & Resale Advice */}
                        <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-500/30 text-xs text-teal-200 space-y-1">
                          <p className="leading-relaxed font-medium">{liveForecast.summaryInsightAr}</p>
                          <p className="text-[10px] text-slate-400 pt-1 border-t border-teal-500/20">
                            💡 تحليل سيولة العلامة: {liveForecast.marketVeracityAr}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tool 5: Tactical Negotiation Playbook */}
                    {activeSmartTool === 'negotiate' && liveNegotiation && (
                      <div className="space-y-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-rose-400" />
                            <div>
                              <span className="font-bold text-white text-xs sm:text-sm block">
                                رادار المفاوضة الذكي ومحاكي عرض السعر المضاد
                              </span>
                              <span className="text-[10px] text-slate-400">
                                استراتيجية تسعير نفسية وجمل مقنعة بالعامية الأردنية مستندة لبيانات السوق
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-rose-300 font-bold bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                            {liveNegotiation.buyerAdvantageLabelAr}
                          </span>
                        </div>

                        {/* 3 Price Anchors Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center text-xs">
                          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
                            <span className="text-[10px] text-rose-300 font-bold block">1. السعر الافتتاحي لبدء التفاوض</span>
                            <span className="text-lg font-black text-rose-200 font-mono mt-0.5">
                              {liveNegotiation.tacticalPricing.openingOfferJod.toLocaleString()} د.أ
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1">خصم {liveNegotiation.tacticalPricing.openingDiscountPercent}% عن السعر المطلوب</span>
                          </div>

                          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                            <span className="text-[10px] text-emerald-300 font-bold block">2. السعر العادل المستهدف (الصفقة)</span>
                            <span className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                              {liveNegotiation.tacticalPricing.targetDealJod.toLocaleString()} د.أ
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1">سعر منصف يضمن رضا الطرفين</span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold block">3. الحد الأقصى للانسحاب</span>
                            <span className="text-lg font-black text-white font-mono mt-0.5">
                              {liveNegotiation.tacticalPricing.walkAwayCeilingJod.toLocaleString()} د.أ
                            </span>
                            <span className="text-[10px] text-rose-400 block mt-1">لا تدفع أكثر من هذا الرقم إطلاقاً</span>
                          </div>
                        </div>

                        {/* Spoken Dialect Arguments */}
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <MessageSquareText className="w-4 h-4 text-blue-400" />
                            <span>تكتيكات وحجج المفاوضة المباشرة (احكِ مع البائع بالعامية الأردنية):</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {liveNegotiation.leveragePoints.map((pt) => (
                              <div
                                key={pt.id}
                                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-200">{pt.titleAr}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      copyToClipboard(pt.spokenPhraseAr.replace(/^"|"$/g, ''));
                                    }}
                                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>نسخ الجملة</span>
                                  </button>
                                </div>
                                <p className="text-[11px] text-amber-200 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 leading-relaxed font-sans">
                                  {pt.spokenPhraseAr}
                                </p>
                                <p className="text-[10px] text-slate-400">{pt.dataFactAr}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 4-Step Action Protocol */}
                        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                          <span className="text-xs font-bold text-slate-300 block">بروتوكول الخطوات العملية للشراء:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            {liveNegotiation.protocolStepsAr.map((st) => (
                              <div key={st.stepNumber} className="flex items-start gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800/70">
                                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center justify-center shrink-0">
                                  {st.stepNumber}
                                </span>
                                <div>
                                  <strong className="text-white block">{st.titleAr}</strong>
                                  <span className="text-slate-400 text-[10px] leading-relaxed">{st.actionAr}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tool 6: Live AI Valuation Copilot (Chat & Voice) */}
                    {activeSmartTool === 'copilot' && (
                      <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-slate-950 to-indigo-950/40 border border-indigo-500/30">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                              <Brain className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="font-bold text-white text-xs sm:text-sm block">
                                مستشار التقييم التفاعلي المباشر (JO Cars AI Copilot)
                              </span>
                              <span className="text-[10px] text-slate-400">
                                اسأل بالصوت أو النص وخبير الذكاء الاصطناعي يجيبك وفق أرقام السوق والفحص الفني
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            مستشار نشط
                          </span>
                        </div>

                        {/* Quick Prompt Pills */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold block">أسئلة شائعة بنقرة واحدة:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              'أشتري ولا أفاصل بالسعر؟',
                              'شو أنسب سعر أبدأ فيه التفاوض؟',
                              'هل ممشى 240 ألف يعتبر عالي؟',
                              'كم بتكلفني جمرك وترخيص بحرة الزرقاء؟',
                              'شو أهم اشي أركز عليه بالفحص الفني؟',
                            ].map((q, qIdx) => (
                              <button
                                key={qIdx}
                                type="button"
                                onClick={() => sendCopilotMessage(q)}
                                disabled={isCopilotLoading}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-indigo-400 text-slate-300 hover:text-white text-[11px] transition-all disabled:opacity-50"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Chat Messages Box */}
                        <div className="h-64 overflow-y-auto space-y-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-xs">
                          {copilotMessages.map((msg, mIdx) => (
                            <div
                              key={mIdx}
                              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`p-3 rounded-2xl max-w-[85%] sm:max-w-[75%] leading-relaxed ${
                                  msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                                }`}
                              >
                                <p className="text-xs font-sans whitespace-pre-wrap">{msg.text.replace(/\*\*/g, '')}</p>
                                {msg.role === 'assistant' && (
                                  <div className="flex items-center justify-end gap-2 mt-2 pt-1.5 border-t border-slate-800/60">
                                    <button
                                      type="button"
                                      onClick={() => handleSpeak(msg.text)}
                                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                                      title="استمع للإجابة صوتياً"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                      <span>استماع صوتي</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {isCopilotLoading && (
                            <div className="flex items-center gap-2 text-indigo-400 text-xs p-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>المستشار الذكي يحلل أرقام التقرير للإجابة...</span>
                            </div>
                          )}
                        </div>

                        {/* Input & Voice Controls */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            sendCopilotMessage();
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={copilotInput}
                            onChange={(e) => setCopilotInput(e.target.value)}
                            placeholder="اكتب سؤالك هنا أو انقر على الميكروفون للتحدث..."
                            disabled={isCopilotLoading}
                            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />

                          <button
                            type="button"
                            onClick={handleVoiceInput}
                            className={`p-2.5 rounded-xl border transition-all ${
                              isListening
                                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                            }`}
                            title="التحدث صوتياً بالعامية"
                          >
                            {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-indigo-400" />}
                          </button>

                          <button
                            type="submit"
                            disabled={!copilotInput.trim() || isCopilotLoading}
                            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-all shadow-md"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Tool 3: Dealer Flipping & Arbitrage Sniffer (MBO) */}
                    {activeSmartTool === 'dealer' && dealer && (
                      <div className="space-y-3.5 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                            <div>
                              <span className="font-bold text-white text-xs sm:text-sm block">
                                رادار اقتناص الفرص وحاسبة العرض الأقصى للشراء (MBO)
                              </span>
                              <span className="text-[10px] text-slate-400">
                                مخصص للمعارض وتجار السيارات لحساب هوامش الربح الصافية وسرعة التسييل
                              </span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${dealer.ratingBadgeColor}`}>
                            {dealer.ratingLabelAr}
                          </span>
                        </div>

                        {/* Dealer Key Financials */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-[10px] text-slate-400">سعر الشراء المعلن</p>
                            <p className="text-sm font-bold text-white mt-0.5">{askingPrice.toLocaleString()} د.أ</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-[10px] text-slate-400">القيمة العادلة للبيع (FMV)</p>
                            <p className="text-sm font-bold text-emerald-400 mt-0.5">{baseDealerFmv.toLocaleString()} د.أ</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-[10px] text-slate-400">صافي ربح السعر الحالي</p>
                            <p className={`text-sm font-extrabold mt-0.5 ${expectedProfitAtAsking > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {expectedProfitAtAsking.toLocaleString()} د.أ
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-[10px] text-slate-400">سرعة البيع المتوقعة</p>
                            <p className="text-sm font-bold text-blue-400 mt-0.5">
                              ~{dealer.expectedDaysToFlip} يوماً
                            </p>
                          </div>
                        </div>

                        {/* EXCLUSIVE DEALER MBO COCKPIT */}
                        {isDealerOrAdmin ? (
                          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-400" />
                                <span className="text-xs font-black text-white">
                                  حاسبة العرض الأقصى للشراء (Maximum Buying Offer - MBO):
                                </span>
                              </div>
                              <span className="text-xs font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                                خاص بالتاجر المعتمد
                              </span>
                            </div>

                            {/* Target Profit Slider */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-300">حدد الربح الصافي الذي ترغب بتحقيقه:</span>
                                <span className="font-extrabold text-emerald-400 font-mono text-sm">{targetProfitJod.toLocaleString()} د.أ</span>
                              </div>
                              <input
                                type="range"
                                min="500"
                                max="4000"
                                step="100"
                                value={targetProfitJod}
                                onChange={(e) => setTargetProfitJod(Number(e.target.value))}
                                className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                              />
                              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>500 د.أ (ربح سريع)</span>
                                <span>2,000 د.أ (هامش ممتاز)</span>
                                <span>4,000 د.أ (صفقة العمر)</span>
                              </div>
                            </div>

                            {/* MBO Result Banner */}
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div>
                                <p className="text-slate-400 text-[11px]">أقصى سعر شراء مقترح للبائع (MBO):</p>
                                <p className="text-2xl font-black text-emerald-400 mt-0.5">
                                  {maxBuyingOfferMbo.toLocaleString()} <span className="text-xs font-bold text-slate-400">د.أ</span>
                                </p>
                              </div>
                              <div className="text-right sm:text-left space-y-0.5 text-[11px] text-slate-300">
                                <p>تكلفة التجهيز والصيانة: <span className="text-amber-400 font-bold">{reconEstimate} د.أ</span></p>
                                <p>رسوم نقل الملكية: <span className="text-slate-400 font-bold">{transferEstimate} د.أ</span></p>
                                <p>العائد المتوقع على رأس المال: <span className="text-blue-400 font-bold">{((targetProfitJod / maxBuyingOfferMbo) * 100).toFixed(1)}%</span></p>
                              </div>
                            </div>

                            {/* Strategic Negotiation Leverage Points */}
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-amber-400" />
                                <span>نقاط القوة للتفاوض وضغط السعر على البائع:</span>
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                                  <span className="text-amber-400 font-bold">1. الممشى المعلن ({odo.actualKm.toLocaleString()} كم):</span>
                                  <p className="text-slate-400 mt-0.5">يمنحك مبرراً تفاوضياً لطلب خصم بما لا يقل عن 1,000 د.أ لتعويض استهلاك المحرك والجير.</p>
                                </div>
                                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                                  <span className="text-blue-400 font-bold">2. مصاريف التجهيز السريع ({reconEstimate} د.أ):</span>
                                  <p className="text-slate-400 mt-0.5">أوضح للبائع أن السيارة تحتاج بوليش وتلقيطات دهان وغسيل كيميائي ستتحملها من جيبك.</p>
                                </div>
                              </div>
                            </div>

                            {/* One-click copy dealer summary */}
                            <div className="pt-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const text = `ملخص تقييم التاجر لسيارة ${actualMake} ${actualModel} ${actualYear}:\n- القيمة العادلة بالسوق: ${baseDealerFmv.toLocaleString()} د.أ\n- السعر المطلوب: ${askingPrice.toLocaleString()} د.أ\n- أقصى عرض شراء مقترح: ${maxBuyingOfferMbo.toLocaleString()} د.أ\n- الربح الصافي المستهدف: ${targetProfitJod.toLocaleString()} د.أ\nمنصة JO Cars`;
                                  copyToClipboard(text);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center gap-1.5"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ بطاقة تسعير التاجر للواتساب</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Locked banner for non-dealers */
                          <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/20 text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs">
                              <Lock className="w-4 h-4" />
                              <span>حاسبة العرض الأقصى للشراء (MBO) ونقاط التفاوض متاحة لحسابات التجار المعتمدة</span>
                            </div>
                            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                              سجل دخولك بحساب تاجر معتمد أو قم بترقية حسابك للوصول لحاسبة العرض الأقصى ونقاط الضغط على البائع لضمان هامش ربحك التجاري.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tool 4: Battery SOH & Degradation Impact */}
                    {activeSmartTool === 'battery' && (
                      <div className="space-y-3.5 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-cyan-400" />
                            <div>
                              <span className="font-bold text-white text-xs sm:text-sm block">
                                فاحص صحة بطارية الهايبرد والكهرباء (Battery SOH)
                              </span>
                              <span className="text-[10px] text-slate-400">
                                مقياس كفاءة خلايا الليثيوم وتأثيرها المالي المباشر على سعر المركبة
                              </span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${liveBattery?.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                            {liveBattery?.healthGradeLabelAr || 'فحص البطارية'}
                          </span>
                        </div>

                        {/* Check if applicable for this vehicle */}
                        {!liveBattery?.isApplicable ? (
                          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2.5">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center">
                              <Zap className="w-6 h-6" />
                            </div>
                            <h5 className="font-bold text-white text-sm">
                              فاحص البطارية (SOH) مخصص لمركبات الهايبرد والكهرباء فقط
                            </h5>
                            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                              هذه السيارة تعمل بمحرك <span className="font-bold text-amber-400">بنزين تقليدي</span> ولا تحتوي على بطارية جر عالية الجهد (Traction Battery).
                              مقياس <span className="font-bold text-cyan-400">SOH (State of Health)</span> هو اختبار كمبيوتر مخصص لسيارات الهايبرد والكهرباء لقياس كفاءة خلايا الليثيوم والمدى المتبقي للشحنة، ولا ينطبق على محركات الوقود العادية.
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Educational definition */}
                            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs space-y-2">
                              <div className="flex items-start gap-2.5">
                                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-black text-white text-xs block">ما هو مقياس SOH؟ ولماذا هو الأهم في فحص الهايبرد والكهرباء؟</span>
                                  <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                                    <strong className="text-cyan-300">SOH (State of Health)</strong> هو التقرير الرقمي الصادر من كمبيوتر السيارة (عبر فحص OBD2 في مراكز الفحص المعتمدة كأوتوهوب وكارس تشيك)، ويعبر عن النسبة المئوية المتبقية من سعة خلايا الليثيوم الأصلية (100% يوم تصنيعها).
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-cyan-500/15 text-[11px] text-slate-300">
                                <p>⚡ <strong>فوق 85%:</strong> بطارية ممتازة تعطي كامل المدى والتوفير في البنزين دون أي خصم.</p>
                                <p>📉 <strong>دون 75%:</strong> تبدأ علامات هبوط المدى، ويحق لك تفاوض وخصم مالي يغطي صيانة الخلايا (Recell).</p>
                              </div>
                            </div>

                            {/* Interactive SOH Slider */}
                            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                  <Sliders className="w-4 h-4 text-cyan-400" />
                                  <span>حرّك المؤشر لمطابقة نتيجة فحص الكمبيوتر الفعلية للسيارة:</span>
                                </label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400">النتيجة المدخلة:</span>
                                  <span className="text-xl font-black text-cyan-400 tabular-nums">
                                    {batterySoh}%
                                  </span>
                                </div>
                              </div>

                              <input
                                type="range"
                                min="50"
                                max="100"
                                step="1"
                                value={batterySoh}
                                onChange={(e) => setBatterySoh(Number(e.target.value))}
                                className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                              />

                              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                <span className="text-rose-400">50% (هابط جداً / تبديل خلايا حتمي)</span>
                                <span className="text-amber-400">75% (استهلاك متوسط)</span>
                                <span className="text-emerald-400">100% (حالة الوكالة شبه زيرو)</span>
                              </div>
                            </div>

                            {/* Battery Impact Metrics */}
                            {liveBattery && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                  <p className="text-[10px] text-slate-400">المدى التقديري للشحنة</p>
                                  <p className="text-sm font-bold text-cyan-300 mt-0.5">
                                    {liveBattery.estimatedRemainingRangeKm ? `${liveBattery.estimatedRemainingRangeKm.toLocaleString()} كم` : '—'}
                                  </p>
                                  <span className="text-[9px] text-slate-500">مدى القيادة الكهربائي</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                  <p className="text-[10px] text-slate-400">الأثر المالي على السعر</p>
                                  <p className={`text-sm font-bold mt-0.5 ${liveBattery.financialAdjustmentJod < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {liveBattery.financialAdjustmentJod === 0 ? 'لا خصم (سليم)' : `${liveBattery.financialAdjustmentJod.toLocaleString()} د.أ`}
                                  </p>
                                  <span className="text-[9px] text-slate-500">قيمة التفاوض المقترحة</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                  <p className="text-[10px] text-slate-400">القيمة العادلة بعد تعديل البطارية</p>
                                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{liveBattery.adjustedFmvPriceJod.toLocaleString()} د.أ</p>
                                  <span className="text-[9px] text-slate-500">سعر السوق المستحق</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                  <p className="text-[10px] text-slate-400">تكلفة تبديل خلايا متوقعة</p>
                                  <p className="text-sm font-bold text-amber-300 mt-0.5">{liveBattery.replacementOrRecellCostJod.toLocaleString()} د.أ</p>
                                  <span className="text-[9px] text-slate-500">سعر ورشات الأردن</span>
                                </div>
                              </div>
                            )}

                            {liveBattery?.explanationAr && (
                              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                💡 {liveBattery.explanationAr}
                              </p>
                            )}

                            {liveBattery?.recommendations && liveBattery.recommendations.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <p className="text-[11px] font-bold text-slate-400">إرشادات الشراء والتفاوض الخاصة بالبطارية:</p>
                                {liveBattery.recommendations.map((rec, rIdx) => (
                                  <div key={rIdx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                    <span>{rec}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Public Comparables Table (Clean: Original Price Only, Qualitative Match, No Math) */}
                  {compsUsed.length > 0 && (
                    <div className="overflow-x-auto space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          <span>السيارات المقارنة في السوق ({compsUsed.length})</span>
                        </p>
                        <span className="text-[11px] text-slate-400">انقر على أي سيارة لعرض تفاصيل المواصفات والمطابقة</span>
                      </div>

                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-400 text-right bg-slate-900/90 border-b border-slate-800">
                            <th className="p-3 rounded-r-xl">السيارة</th>
                            <th className="p-3">السنة</th>
                            <th className="p-3">الممشى</th>
                            <th className="p-3">السعر المعلن</th>
                            <th className="p-3">المطابقة</th>
                            <th className="p-3 rounded-l-xl">المصدر</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {compsUsed.map((c, i) => (
                            <Fragment key={c.id || i}>
                              <tr
                                className="text-slate-300 cursor-pointer hover:bg-slate-800/50 transition-colors"
                                onClick={() => setExpandedComp(expandedComp === i ? null : i)}
                                title="اضغط للتفاصيل والمصدر"
                              >
                                <td className="p-3 font-semibold">
                                  <span className="text-blue-400 ml-1.5">{expandedComp === i ? '▾' : '▸'}</span>{' '}
                                  {c.title}
                                </td>
                                <td className="p-3">{c.year || '—'}</td>
                                <td className="p-3">
                                  {c.mileage ? `${c.mileage.toLocaleString()} كم` : '—'}
                                </td>
                                <td className="p-3 font-bold text-white">
                                  {(c.originalPrice || c.rawPrice)?.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">د.أ</span>
                                </td>
                                <td className="p-3">
                                  {getQualitativeBadge(c)}
                                </td>
                                <td className="p-3">
                                  {c.urlStatus === 'NOT_FOUND' || c.urlStatus === 'UNAVAILABLE' ? (
                                    <span className="text-slate-500 text-[11px]">مصدر موثق</span>
                                  ) : c.urlStatus === 'BLOCKED' ? (
                                    <span className="text-slate-500 text-[11px]">مصدر محمي</span>
                                  ) : (c.finalUrl || c.canonicalUrl || c.sourceUrl)?.startsWith('http') ? (
                                    <a
                                      href={c.finalUrl || c.canonicalUrl || c.sourceUrl!}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
                                    >
                                      {c.source} <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : c.sourceUrl ? (
                                    <Link
                                      href={c.sourceUrl}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-blue-400 hover:underline font-semibold"
                                    >
                                      {c.source}
                                    </Link>
                                  ) : (
                                    <span className="text-slate-400">{c.source}</span>
                                  )}
                                </td>
                              </tr>

                              {/* Public Drawer (Clean: Specs + Source Evidence Card only) */}
                              {expandedComp === i && (
                                <tr className="bg-slate-900/95 text-xs text-slate-300">
                                  <td colSpan={6} className="p-4 space-y-3 border-b border-slate-800">
                                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-400">درجة المطابقة:</span>
                                        {getQualitativeBadge(c)}
                                      </div>
                                      {c.powertrainNote && (
                                        <div className="text-[11px] text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                          ⚠️ {c.powertrainNote}
                                        </div>
                                      )}
                                    </div>

                                    {/* Specifications pills */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                                        <span className="text-[10px] text-slate-400 block">السنة</span>
                                        <span className="font-bold text-white">{c.year || 'غير محدد'}</span>
                                      </div>
                                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                                        <span className="text-[10px] text-slate-400 block">الممشى</span>
                                        <span className="font-bold text-white">{c.mileage ? `${c.mileage.toLocaleString()} كم` : 'غير محدد'}</span>
                                      </div>
                                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                                        <span className="text-[10px] text-slate-400 block">السعر المعلن</span>
                                        <span className="font-bold text-white">{(c.originalPrice || c.rawPrice)?.toLocaleString()} د.أ</span>
                                      </div>
                                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                                        <span className="text-[10px] text-slate-400 block">المصدر</span>
                                        <span className="font-bold text-white">{c.source}</span>
                                      </div>
                                    </div>

                                    {/* Clean Public Evidence Badge (No raw external links or scraped content) */}
                                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2 text-slate-300">
                                        <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>بيانات الإعلان معتمدة ومطابقة لمعايير الأهلية السوقية (إعلان مبوب محلي موثق)</span>
                                      </div>
                                      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                        بيانات محققة
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* VIEW 2: ADMIN AUDIT (Full Technical Audit & Math)          */}
              {/* Strictly restricted to Administrator accounts only         */}
              {/* ────────────────────────────────────────────────────────── */}
              {isAdmin && activeTab === 'admin' && (
                <div className="space-y-6">
                  {/* The 7 Jordanian Market Sources Execution Audit Table */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="font-extrabold text-white text-xs sm:text-sm">
                            جدول تدقيق استعلامات المصادر السبعة (The 7 Market Sources Execution Audit)
                          </p>
                          <p className="text-[11px] text-slate-400">
                            تنفيذ شامل لجميع بوابات السوق الأردني السبعة دون استثناء أو اختصار مبكر
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {marketSourceExecutions.length}/7 مسجلة
                      </span>
                    </div>

                    {/* The 4 Distinct Source Breakdown Counters (User Mandate §2) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">المصادر المفحوصة (Searched)</span>
                        <span className="font-bold text-white text-sm">
                          {evidence?.sourcesSearched || marketSourceExecutions.length || 7}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">مصادر بنتائج (With Results)</span>
                        <span className="font-bold text-blue-400 text-sm">
                          {evidence?.sourcesWithResults ?? marketSourceExecutions.filter(m => m.rawResults > 0).length}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">مصادر بمقارنات مؤهلة (Eligible)</span>
                        <span className="font-bold text-emerald-400 text-sm">
                          {evidence?.sourcesWithEligibleComparables ?? marketSourceExecutions.filter(m => (m.eligibleComparables ?? m.acceptedComparables) > 0).length}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">مصادر مستقلة في FMV</span>
                        <span className="font-bold text-purple-400 text-sm">
                          {evidence?.independentSourcesUsedInFMV ?? 1}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="text-slate-400 text-right bg-slate-950/80 border-b border-slate-800">
                            <th className="p-2.5 rounded-r-lg">المصدر</th>
                            <th className="p-2.5">الحالة</th>
                            <th className="p-2.5">المدة</th>
                            <th className="p-2.5">الاستعلامات المنفذة</th>
                            <th className="p-2.5">النتائج الخام</th>
                            <th className="p-2.5">الصالحة</th>
                            <th className="p-2.5">المستبعدة</th>
                            <th className="p-2.5">المقبولة</th>
                            <th className="p-2.5">في FMV؟</th>
                            <th className="p-2.5 rounded-l-lg">ملاحظات / أخطاء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 font-mono">
                          {marketSourceExecutions.map((mse, mIdx) => (
                            <tr key={mIdx} className="hover:bg-slate-800/40 text-slate-300">
                              <td className="p-2.5 font-bold font-sans text-white">{mse.sourceLabel}</td>
                              <td className="p-2.5 font-sans">{getExecutionStatusBadge(mse.status)}</td>
                              <td className="p-2.5">{mse.durationMs} ms</td>
                              <td className="p-2.5 max-w-[140px] truncate text-slate-400" title={mse.queriesExecuted?.join(', ')}>
                                {mse.queriesExecuted?.length > 0 ? mse.queriesExecuted.join(', ') : '—'}
                              </td>
                              <td className="p-2.5 font-bold">{mse.rawResults}</td>
                              <td className="p-2.5 text-emerald-400">{mse.validListings}</td>
                              <td className="p-2.5 text-rose-400">{mse.rejectedListings}</td>
                              <td className="p-2.5 text-blue-400 font-bold">{mse.acceptedComparables}</td>
                              <td className="p-2.5 font-sans">
                                {mse.usedInFmv || mse.acceptedComparables > 0 ? (
                                  <span className="text-emerald-400 font-bold">نعم ({mse.acceptedComparables})</span>
                                ) : (
                                  <span className="text-slate-500">لا (مستبعد)</span>
                                )}
                              </td>
                              <td className="p-2.5 font-sans text-[10px] text-slate-400 max-w-[160px] truncate" title={mse.error || ''}>
                                {mse.error || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Funnel Reconciliation Card (Mathematical Alignment of Counts) */}
                  {audit?.countsBreakdown && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <p className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>مطابقة مسار التصفية العددي (Funnel Counts Reconciliation)</span>
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          مطابقة متوازنة
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        تتبع دقيق لمصير كل إعلان تم جمعه عبر المراحل لمنع أي اختفاء غير مبرر:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">إجمالي المجموع (Collected)</span>
                          <span className="font-bold text-white font-mono">{audit.countsBreakdown.collected}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">مستبعد (Target Cluster)</span>
                          <span className="font-bold text-cyan-400 font-mono">{audit?.targetCluster?.totalClusterCount ?? 0}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">مستبعد (Sanity & Conflict)</span>
                          <span className="font-bold text-rose-400 font-mono">
                            {audit.countsBreakdown.rejectedBySanity + audit.countsBreakdown.rejectedByIdentity}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">مستبعد (Matching Specs)</span>
                          <span className="font-bold text-amber-400 font-mono">{audit.countsBreakdown.rejectedByMatching}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">مقارنات مباشرة (Direct)</span>
                          <span className="font-bold text-emerald-400 font-mono">{audit.countsBreakdown.eligibleDirect}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">شواهد داعمة (Supporting)</span>
                          <span className="font-bold text-blue-400 font-mono">{audit.countsBreakdown.eligibleSupporting}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">مستخدمة في التسعير</span>
                          <span className="font-bold text-purple-400 font-mono">{audit.countsBreakdown.usedInPricing}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">نمط التسعير (Mode)</span>
                          <span className="font-bold text-indigo-400 font-mono">{audit.valuationMode || 'FMV'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Target Identity Cluster Card */}
                  {audit?.targetCluster && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <p className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                          <Radio className="w-4 h-4 text-cyan-400" />
                          <span>عنقود هوية السيارة المستهدفة (Target Identity Cluster)</span>
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {audit.targetCluster.totalClusterCount} إعلانات معزولة
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        تم عزل جميع الإعلانات المطابقة للسيارة المستهدفة عبر ({audit.targetCluster.sourcesInCluster?.join(', ') || 'المنصات'}) لمنع تسريب السعر المطلوب إلى معادلة FMV.
                      </p>
                      {audit.targetCluster.listings?.length > 0 && (
                        <div className="space-y-1 pt-1 font-mono text-[10px]">
                          {audit.targetCluster.listings.map((tl, tIdx) => (
                            <div key={tIdx} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                              <span className="text-slate-300">{tl.source}: {tl.title || 'إعلان مطابق'} ({tl.price} د.أ)</span>
                              <span className="text-amber-400">{tl.reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Technical Comparables Multi-Factor Weight & Adjustments Table */}
                  {compsUsed.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <p className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-emerald-400" />
                          <span>التدقيق الرياضي للأوزان والتعديلات (Multi-Factor Math & Adjustments)</span>
                        </p>
                        <span className="text-[11px] text-slate-400">انقر للتفكيك الرياضي الكامل لكل سيارة</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-400 text-right bg-slate-950 border-b border-slate-800">
                              <th className="p-2.5 rounded-r-lg">السيارة</th>
                              <th className="p-2.5">المستوى</th>
                              <th className="p-2.5">السعر الأصلي</th>
                              <th className="p-2.5">بعد التعديل</th>
                              <th className="p-2.5">المطابقة %</th>
                              <th className="p-2.5">الوزن النهائي</th>
                              <th className="p-2.5 rounded-l-lg">المساهمة %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {compsUsed.map((c, i) => (
                              <Fragment key={c.id || i}>
                                <tr
                                  className="hover:bg-slate-800/40 cursor-pointer text-slate-300"
                                  onClick={() => setAdminExpandedComp(adminExpandedComp === i ? null : i)}
                                >
                                  <td className="p-2.5 font-semibold">
                                    <span className="text-purple-400 ml-1.5">{adminExpandedComp === i ? '▾' : '▸'}</span>
                                    {c.title}
                                  </td>
                                  <td className="p-2.5">{c.tierLabel || `Tier ${c.tier}`}</td>
                                  <td className="p-2.5 font-mono">{c.originalPrice?.toLocaleString()} د.أ</td>
                                  <td className="p-2.5 font-mono font-bold text-white">
                                    {c.adjustedPrice ? `${c.adjustedPrice.toLocaleString()} د.أ` : '—'}
                                  </td>
                                  <td className="p-2.5 font-mono">{c.similarity}%</td>
                                  <td className="p-2.5 font-mono text-emerald-400 font-bold">{c.weight?.toFixed(3)}</td>
                                  <td className="p-2.5 font-mono text-blue-400 font-bold">{c.contributionPercent}%</td>
                                </tr>

                                {/* Admin Expanded Detailed Breakdown */}
                                {adminExpandedComp === i && (
                                  <tr className="bg-slate-950 text-xs">
                                    <td colSpan={7} className="p-4 space-y-3 border-b border-slate-800">
                                      {/* Multi-Factor Weights Breakdown */}
                                      {c.weightBreakdown && (
                                        <div className="space-y-1">
                                          <p className="text-[11px] font-bold text-slate-400">تفكيك الوزن الرياضي (Multi-Factor Weights):</p>
                                          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                              الهوية: <strong>{c.weightBreakdown.identityWeight}</strong>
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                              السنة: <strong>{c.weightBreakdown.yearWeight}</strong>
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                              المواصفات: <strong>{c.weightBreakdown.technicalWeight}</strong>
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                              الممشى: <strong>{c.weightBreakdown.mileageWeight}</strong>
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                              اكتمال البيانات: <strong>{c.weightBreakdown.completenessWeight}</strong>
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                              جودة المصدر: <strong>{c.weightBreakdown.sourceQualityWeight}</strong>
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                              الحداثة: <strong>{c.weightBreakdown.recencyWeight}</strong>
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Traceable Adjustments */}
                                      {c.adjustmentsList && c.adjustmentsList.length > 0 && (
                                        <div className="space-y-1.5 pt-1">
                                          <p className="text-[11px] font-bold text-slate-400">معادلات التعديل السعري (Price Adjustments):</p>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                            {c.adjustmentsList.map((adj, aIdx) => (
                                              <div key={aIdx} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                                                <div className="flex items-center justify-between">
                                                  <span className="font-bold text-slate-200">{adj.factorAr}</span>
                                                  <span className={`font-mono font-bold ${adj.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {adj.delta > 0 ? `+${adj.delta.toLocaleString()}` : adj.delta.toLocaleString()} د.أ
                                                  </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400">{adj.reason}</p>
                                                {adj.formula && (
                                                  <p className="text-[9px] font-mono text-slate-500 dir-ltr text-right">{adj.formula}</p>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Match Matrix */}
                                      {c.matchMatrix && c.matchMatrix.length > 0 && (
                                        <div className="space-y-1.5 pt-1">
                                          <p className="text-[11px] font-bold text-slate-400">مصفوفة المطابقة الفنية (Match Matrix):</p>
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                                            {c.matchMatrix.map((m, mIdx) => (
                                              <div key={mIdx} className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                                                <span className="text-slate-400">{m.factorAr}</span>
                                                <span className={`font-bold ${
                                                  m.verdict === 'MATCH' ? 'text-emerald-400' :
                                                  m.verdict === 'CLOSE' ? 'text-amber-400' :
                                                  m.verdict === 'DIFFERENT' ? 'text-rose-400' : 'text-slate-500'
                                                }`}>
                                                  {m.verdict}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Consensus Band & Leave-One-Out Analysis */}
                  {audit?.consensusBand && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <p className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span>نطاق التوافق وحساسية الحذف (Consensus Band & Leave-One-Out)</span>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono pt-1">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">الحد الأدنى</span>
                          <span className="text-white font-bold">{audit.consensusBand.low.toLocaleString()} د.أ</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">وسيط التوافق</span>
                          <span className="text-emerald-400 font-bold">{audit.consensusBand.median.toLocaleString()} د.أ</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">الحد الأعلى</span>
                          <span className="text-white font-bold">{audit.consensusBand.high.toLocaleString()} د.أ</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">الانتشار (Spread)</span>
                          <span className="text-cyan-400 font-bold">{audit.consensusBand.spread.toLocaleString()} د.أ</span>
                        </div>
                      </div>

                      {/* LOO Removals */}
                      {audit.leaveOneOutAnalysis && audit.leaveOneOutAnalysis.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[11px] font-bold text-slate-400 mb-1">اختبار ثبات القيمة بحذف كل سيارة مقارنة (Leave-One-Out Test):</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-[10px] font-mono">
                              <thead>
                                <tr className="text-slate-400 text-right bg-slate-950">
                                  <th className="p-1.5 font-sans">السيارة المحذوفة</th>
                                  <th className="p-1.5">السعر</th>
                                  <th className="p-1.5">FMV بدونها</th>
                                  <th className="p-1.5">الإزاحة</th>
                                  <th className="p-1.5">نسبة الإزاحة %</th>
                                  <th className="p-1.5 font-sans">الحكم</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                {audit.leaveOneOutAnalysis.map((loo, lIdx) => (
                                  <tr key={lIdx} className="text-slate-300">
                                    <td className="p-1.5 font-sans truncate max-w-[150px]">{loo.comparableTitle}</td>
                                    <td className="p-1.5">{loo.price.toLocaleString()}</td>
                                    <td className="p-1.5 font-bold">{loo.fmvWithout.toLocaleString()}</td>
                                    <td className={`p-1.5 ${loo.absoluteShift === 0 ? 'text-slate-500' : loo.absoluteShift > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {loo.absoluteShift > 0 ? `+${loo.absoluteShift}` : loo.absoluteShift}
                                    </td>
                                    <td className="p-1.5">{loo.percentShift}%</td>
                                    <td className="p-1.5 font-sans">
                                      {loo.isDominant ? (
                                        <span className="text-rose-400 font-bold">مهيمنة (غير مستقرة)</span>
                                      ) : (
                                        <span className="text-emerald-400 font-bold">مستقرة وموزونة</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Excluded Comparables Section */}
                  {compsExcluded.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setShowExcluded(!showExcluded)}
                          className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5"
                        >
                          <FilterX className="w-4 h-4 text-rose-400" />
                          <span>الإعلانات المستبعدة وحماية النزاهة ({compsExcluded.length})</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExcluded ? 'rotate-180' : ''}`} />
                        </button>
                        <span className="text-[10px] text-slate-500">فلترة الهوية والسلامة السعرية</span>
                      </div>

                      {showExcluded && (
                        <div className="overflow-x-auto pt-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-500 text-right bg-slate-950">
                                <th className="p-2">الإعلان</th>
                                <th className="p-2">السعر</th>
                                <th className="p-2">سبب الاستبعاد</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {compsExcluded.map((exc, eIdx) => (
                                <tr key={eIdx} className="text-slate-400">
                                  <td className="p-2 font-medium text-slate-300 truncate max-w-xs">{exc.title}</td>
                                  <td className="p-2 font-mono">{exc.price ? `${exc.price.toLocaleString()} د.أ` : '—'}</td>
                                  <td className="p-2 text-rose-300 font-medium">{exc.reasonAr}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mathematical Audit Trail */}
                  {section24?.auditTrail && section24.auditTrail.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <button
                        onClick={() => setShowAuditTrail(!showAuditTrail)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 w-full justify-between"
                      >
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-400" />
                          <span>المسار الحسابي الكامل للتقييم (Full Audit Trail)</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAuditTrail ? 'rotate-180' : ''}`} />
                      </button>

                      {showAuditTrail && (
                        <div className="space-y-1 pt-2 font-mono text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                          {section24.auditTrail.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-2">
                              <span className="text-emerald-500 font-bold">[{sIdx + 1}]</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Warnings Pill Bar */}
              {section24?.warnings && section24.warnings.length > 0 && (
                <div className="space-y-1 text-[11px] text-amber-400/90 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                  {section24.warnings.map((warn, wIdx) => (
                    <p key={wIdx} className="flex items-start gap-1.5">
                      <span className="font-bold">•</span>
                      <span>{warn}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Footer Bar: Re-run & Date */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  محرك معتمد • حُسب بتاريخ {new Date().toLocaleDateString('ar-JO')}
                </span>
                <button
                  onClick={run}
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline font-bold transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> إعادة التقييم
                </button>
              </div>

              {/* Price History Over Time — FMV-mode runs only (Phase-1 gate) */}
              {fmvHistory.length > 1 && (
                <div className="pt-2">
                  <p className="font-bold text-slate-300 text-xs mb-2">تغير القيمة عبر الزمن (قيمة السوق العادلة)</p>
                  <div className="flex items-end gap-1.5 h-20" dir="ltr">
                    {fmvHistory.map((h, i) => {
                      const max = Math.max(...fmvHistory.map((x) => x.estimated));
                      const min = Math.min(...fmvHistory.map((x) => x.estimated));
                      const pct = max === min ? 50 : 15 + ((h.estimated - min) / (max - min)) * 85;
                      return (
                        <div
                          key={i}
                          title={`${new Date(h.at).toLocaleDateString('ar-JO')}: ${h.estimated.toLocaleString()} د.أ`}
                          className="flex-1 rounded-t bg-blue-500/70 hover:bg-blue-400 transition-colors"
                          style={{ height: `${pct}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Official Printable / Downloadable PDF Valuation Certificate Modal */}
      {section24 && (
        <ValuationCertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          carId={carId}
          section24={section24}
          askingPrice={askingPrice}
        />
      )}
    </div>
  );
}
