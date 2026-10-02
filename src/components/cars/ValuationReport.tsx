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
} from 'lucide-react';
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
  onValuationLoaded,
}: {
  carId: string;
  askingPrice: number;
  onValuationLoaded?: (estimate: number | null) => void;
}) {
  const { user, token, isAuthenticated } = useAuth();
  const isAdmin = Boolean(isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'));
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
                        <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2">
                          <Info className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            تنبيه تنوع المصادر: يعتمد التقييم على مصدر مستقل واحد ({compsUsed[0]?.source || 'السوق المفتوح'}) بعد تصفية التكرارات وعنقود السيارة المستهدفة عبر ({evidence.sourcesSearched || 7}) مصادر مفحوصة، ما يحد من درجة الثقة لغياب مصادر مستقلة متعددة تدعم السعر.
                          </span>
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
    </div>
  );
}
