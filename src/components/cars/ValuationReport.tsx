'use client';

import { useCallback, useEffect, useState, Fragment } from 'react';
import Link from 'next/link';
import {
  BarChart3,
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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import type {
  Section24OutputContract,
  Section24ComparableUsed,
  Section24ComparableExcluded,
} from '@/ai/valuation/intelligence-engine';

export function ValuationReport({
  carId,
  askingPrice,
  onValuationLoaded,
}: {
  carId: string;
  askingPrice: number;
  onValuationLoaded?: (estimate: number) => void;
}) {
  const { token, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState<{ stageAr: string; detail: string; ms: number }[]>([]);
  const [explaining, setExplaining] = useState(false);
  const [expandedComp, setExpandedComp] = useState<number | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [section24, setSection24] = useState<Section24OutputContract | null>(null);
  const [legacyReport, setLegacyReport] = useState<any>(null);
  const [history, setHistory] = useState<{ at: string; estimated: number }[]>([]);
  const [insufficient, setInsufficient] = useState<string | null>(null);

  const auth = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const applyValuationData = useCallback((data: { section24?: Section24OutputContract; latest?: any; history?: any[] }) => {
    if (data.section24 && data.section24.status !== 'INSUFFICIENT_DATA') {
      setSection24(data.section24);
      if (data.section24.fairMarketValue && onValuationLoaded) {
        onValuationLoaded(data.section24.fairMarketValue);
      }
    }
    if (data.latest) {
      setLegacyReport(data.latest);
      if (!data.section24?.fairMarketValue && data.latest.estimatedPrice && onValuationLoaded) {
        onValuationLoaded(data.latest.estimatedPrice);
      }
    }
    if (data.history) {
      setHistory(data.history);
    }
  }, [onValuationLoaded]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/valuations?carId=${carId}`);
      const d = await res.json();
      if (d.success && d.data) {
        if (d.data.status === 'INSUFFICIENT') {
          setInsufficient(d.data.reason || 'البيانات غير كافية لإنتاج تقييم عادل');
        } else {
          applyValuationData(d.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [carId, applyValuationData]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async () => {
    if (!isAuthenticated) {
      toast.error('سجل الدخول لتشغيل التحليل');
      return;
    }
    setRunning(true);
    setExplaining(false);
    setStages([]);
    setInsufficient(null);

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
          if (!ev || dm === undefined) continue;

          let d: any = null;
          try {
            d = JSON.parse(dm);
          } catch {
            continue;
          }

          if (ev === 'stage') {
            setStages((prev) => [...prev.filter((s) => s.stageAr !== d.stageAr), d]);
          } else if (ev === 'explaining') {
            setExplaining(true);
          } else if (ev === 'done') {
            finished = true;
            if (d.status === 'RELIABLE' || d.status === 'LIMITED' || d.status === 'APPROXIMATE') {
              applyValuationData(d);
              toast.success(
                d.status === 'RELIABLE'
                  ? 'اكتمل التحليل — تقييم موثوق'
                  : d.status === 'LIMITED'
                  ? 'اكتمل التحليل — تقييم محدود'
                  : 'اكتمل التحليل — تقدير تقريبي'
              );
              load();
            } else if (d.status === 'INSUFFICIENT') {
              setInsufficient(d.reason || 'البيانات غير كافية');
            }
          } else if (ev === 'error') {
            finished = true;
            toast.error(d.message || 'فشل التحليل');
          }
        }
      }
    } catch {
      toast.error('تعذر الاتصال بمحرك التقييم');
    } finally {
      setRunning(false);
      setExplaining(false);
    }
  };

  const fmv = section24?.fairMarketValue ?? legacyReport?.estimatedPrice ?? null;
  const minPrice = section24?.range?.low ?? legacyReport?.minPrice ?? null;
  const maxPrice = section24?.range?.high ?? legacyReport?.maxPrice ?? null;
  const confidence = section24?.confidence ?? legacyReport?.confidence ?? 0;
  const status = section24?.status ?? (legacyReport?.grade?.toUpperCase() as any) ?? 'LIMITED';

  const statusLabel =
    status === 'RELIABLE'
      ? 'تقييم موثوق'
      : status === 'LIMITED'
      ? 'تقييم محدود'
      : status === 'APPROXIMATE'
      ? 'تقدير تقريبي'
      : 'بيانات غير كافية';

  const confColor =
    confidence >= 70 ? 'text-emerald-400' : confidence >= 40 ? 'text-amber-400' : 'text-rose-400';

  const confBg =
    confidence >= 70 ? 'bg-emerald-500/10 border-emerald-500/30' : confidence >= 40 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30';

  const compsUsed: Section24ComparableUsed[] = section24?.comparablesUsed || legacyReport?.comparables || [];
  const compsExcluded: Section24ComparableExcluded[] = section24?.comparablesExcluded || [];
  const evidence = section24?.marketEvidence;
  const pricePos = section24?.pricePosition;

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
                القيمة السوقية العادلة (تحليل AI)
              </h3>
              {fmv && (
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
          {!fmv && !running && !insufficient && (
            <div className="text-center py-6 space-y-3">
              <Scale className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-bold text-sm">لم يُحلل سعر هذه السيارة بعد</p>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                يجمع المحرك الذكي إعلانات السوق الفعلية، ينظف الأسعار الصورية، ويحسب القيمة العادلة دون التأثر بسعر البائع.
              </p>
              <button
                onClick={run}
                className="px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black text-sm transition-all shadow-lg"
              >
                تحليل السعر الآن
              </button>
            </div>
          )}

          {/* Running progress stages */}
          {running && (
            <div className="space-y-3 py-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-sm font-bold text-blue-400 pb-2 border-b border-slate-800">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>محرك التقييم الذكي ينفذ المراحل الحسابية...</span>
              </div>
              {stages.length === 0 && (
                <div className="text-xs text-slate-400">جمع الإعلانات وتطبيق عزل السعر المطلوب...</div>
              )}
              {stages.map((s) => (
                <div key={s.stageAr} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-200 font-bold">{s.stageAr}</span>
                    <span className="text-slate-500"> — {s.detail} ({(s.ms / 1000).toFixed(1)}s)</span>
                  </div>
                </div>
              ))}
              {explaining && (
                <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>توليد الرؤى السوقية والتقرير التحليلي...</span>
                </div>
              )}
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
          {fmv && !running && (
            <>
              {/* Market Reality Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs flex items-center gap-2.5">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  ملاحظة سوقية: اعتمد التقييم على أسعار الإعلانات والعروض المتاحة في السوق الأردني، وليس بالضرورة أسعار البيع النهائية المنفذة.
                </span>
              </div>

              {/* Status Alert if not full reliable */}
              {status !== 'RELIABLE' && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    {status === 'APPROXIMATE'
                      ? 'تقدير تقريبي جداً (عدد قليل من المقارنات) — استرشد به بحذر شديد.'
                      : 'تقييم محدود — تمت الاستعانة بمقارنات أوسع نظراً لمحدودية المعروض المتطابق تماماً.'}
                  </span>
                </div>
              )}

              {/* 3 Core Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <p className="text-[11px] text-slate-400 mb-1 font-semibold">القيمة السوقية العادلة</p>
                  <p className="text-2xl font-black text-white">
                    {fmv.toLocaleString()} <span className="text-xs font-bold text-slate-400">د.أ</span>
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <p className="text-[11px] text-slate-400 mb-1 font-semibold">النطاق السعري المتوقع</p>
                  <p className="text-base sm:text-lg font-black text-white mt-1">
                    {minPrice?.toLocaleString()} – {maxPrice?.toLocaleString()} <span className="text-xs font-bold text-slate-400">د.أ</span>
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <p className="text-[11px] text-slate-400 mb-1 font-semibold">درجة الموثوقية</p>
                  <p className={`text-2xl font-black ${confColor}`}>
                    {confidence}%
                  </p>
                </div>
              </div>

              {/* Asking Price vs FMV Position */}
              {pricePos && pricePos.differencePercent !== null && (
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
              )}

              {/* Market Evidence Summary Bar */}
              {evidence && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <p className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span>إحصائيات الأدلة السوقية (Market Evidence)</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="text-[10px] text-slate-400">إجمالي المفحوص</p>
                      <p className="text-sm font-bold text-white mt-0.5">{evidence.totalListings} إعلان</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="text-[10px] text-slate-400">المقارنات المعتمدة</p>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5">{evidence.usedComparables} سيارات</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="text-[10px] text-slate-400">المستبعدة والحظر الصوري</p>
                      <p className="text-sm font-bold text-rose-400 mt-0.5">{evidence.excludedListings} إعلان</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="text-[10px] text-slate-400">المصادر المستقلة</p>
                      <p className="text-sm font-bold text-cyan-400 mt-0.5">{evidence.uniqueSources} مصادر</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Market Insights & Reasoning */}
              {((section24?.marketInsights && section24.marketInsights.length > 0) || (section24?.reasoning && section24.reasoning.length > 0)) && (
                <div className="space-y-2 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                  <p className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>الرؤى والتحليل السوقي</span>
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {(section24?.marketInsights || []).map((insight, idx) => (
                      <p key={`ins-${idx}`} className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">•</span>
                        <span>{insight}</span>
                      </p>
                    ))}
                    {(section24?.reasoning || []).map((reason, idx) => (
                      <p key={`rea-${idx}`} className="flex items-start gap-2 text-slate-400">
                        <span className="text-slate-500 font-bold">•</span>
                        <span>{reason}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparables Used Table with Match Matrix */}
              {compsUsed.length > 0 && (
                <div className="overflow-x-auto space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span>السيارات المقارنة المعتمدة في الحساب ({compsUsed.length})</span>
                    </p>
                    <span className="text-[11px] text-slate-400">انقر على أي سيارة لعرض مصفوفة المطابقة الفنية</span>
                  </div>

                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 text-right bg-slate-900/80">
                        <th className="p-2.5 rounded-r-xl">السيارة</th>
                        <th className="p-2.5">السنة</th>
                        <th className="p-2.5">الممشى</th>
                        <th className="p-2.5">السعر الأصلي</th>
                        <th className="p-2.5">بعد التعديل</th>
                        <th className="p-2.5">المطابقة</th>
                        <th className="p-2.5 rounded-l-xl">المصدر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {compsUsed.slice(0, 10).map((c, i) => (
                        <Fragment key={c.id || i}>
                          <tr
                            className="text-slate-300 cursor-pointer hover:bg-slate-800/50 transition-colors"
                            onClick={() => setExpandedComp(expandedComp === i ? null : i)}
                            title="اضغط لتفاصيل المطابقة الفنية"
                          >
                            <td className="p-2.5 font-semibold">
                              <span className="text-blue-400 ml-1">{expandedComp === i ? '▾' : '▸'}</span>{' '}
                              {c.title}
                            </td>
                            <td className="p-2.5">{c.year || '—'}</td>
                            <td className="p-2.5">
                              {c.mileage ? `${c.mileage.toLocaleString()} كم` : '—'}
                            </td>
                            <td className="p-2.5">{c.originalPrice?.toLocaleString()} د.أ</td>
                            <td className="p-2.5 font-bold text-white">
                              {c.adjustedPrice ? `${c.adjustedPrice.toLocaleString()} د.أ` : `${c.originalPrice?.toLocaleString()} د.أ`}
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                                {c.similarity}%
                              </span>
                            </td>
                            <td className="p-2.5">
                              {c.sourceUrl?.startsWith('http') ? (
                                <a
                                  href={c.sourceUrl}
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

                          {/* Expanded Comparable Details & Match Matrix */}
                          {expandedComp === i && (
                            <tr className="bg-slate-900/90 text-xs text-slate-300">
                              <td colSpan={7} className="p-4 space-y-3 border-b border-slate-800">
                                <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px] pb-2 border-b border-slate-800">
                                  <span>
                                    المستوى الهرمي:{' '}
                                    <strong className="text-white">
                                      {c.tier === 1
                                        ? 'Tier 1 (نفس الموديل والسنة والفئة)'
                                        : c.tier === 2
                                        ? 'Tier 2 (نفس الموديل والسنة)'
                                        : c.tier === 3
                                        ? 'Tier 3 (نفس الموديل مع فرق سنة ±1)'
                                        : 'Tier 4 (شواهد داعمة من نفس الموديل بسنوات أبعد)'}
                                    </strong>
                                  </span>
                                  <span>•</span>
                                  <span>
                                    الوزن الرياضي: <strong className="text-white">{c.weight}</strong>
                                  </span>
                                  {c.sourceUrl?.startsWith('http') && (
                                    <>
                                      <span>•</span>
                                      <a
                                        href={c.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 underline dir-ltr truncate max-w-xs inline-block"
                                      >
                                        {c.sourceUrl}
                                      </a>
                                    </>
                                  )}
                                </div>

                                {/* Detailed Match Matrix Grid */}
                                {c.matchMatrix && c.matchMatrix.length > 0 && (
                                  <div className="space-y-1.5">
                                    <p className="font-bold text-slate-300 text-xs">
                                      مصفوفة المطابقة الفنية (Match Matrix):
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                                      {c.matchMatrix.map((m, mIdx) => {
                                        const isMatch = m.verdict === 'MATCH';
                                        const isClose = m.verdict === 'CLOSE';
                                        const isDiff = m.verdict === 'DIFFERENT';
                                        return (
                                          <div
                                            key={mIdx}
                                            className={`p-2 rounded-xl border text-[11px] space-y-0.5 ${
                                              isMatch
                                                ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300'
                                                : isClose
                                                ? 'bg-amber-500/5 border-amber-500/30 text-amber-300'
                                                : isDiff
                                                ? 'bg-rose-500/5 border-rose-500/30 text-rose-300'
                                                : 'bg-slate-950 border-slate-800 text-slate-400'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between font-bold">
                                              <span>{m.factorAr}</span>
                                              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold">
                                                {isMatch ? 'مطابق' : isClose ? 'متقارب' : isDiff ? 'مختلف' : 'غير محدد'}
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 truncate">
                                              {m.target} ← {m.comp}
                                            </p>
                                          </div>
                                        );
                                      })}
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
              )}

              {/* Excluded Comparables Toggle Section */}
              {compsExcluded.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowExcluded(!showExcluded)}
                      className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5"
                    >
                      <FilterX className="w-4 h-4 text-rose-400" />
                      <span>الإعلانات المستبعدة وفحص الأسعار الصورية ({compsExcluded.length})</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExcluded ? 'rotate-180' : ''}`} />
                    </button>
                    <span className="text-[10px] text-slate-500">حماية من التلاعب وتسريب الأسعار</span>
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
                              <td className="p-2">{exc.price ? `${exc.price.toLocaleString()} د.أ` : '—'}</td>
                              <td className="p-2 text-rose-300 font-medium">{exc.reasonAr}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Mathematical Audit Trail (Section 24) */}
              {section24?.auditTrail && section24.auditTrail.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <button
                    onClick={() => setShowAudit(!showAudit)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 w-full justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span>مسار التدقيق الحسابي للتقييم (Valuation Audit Trail)</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAudit ? 'rotate-180' : ''}`} />
                  </button>

                  {showAudit && (
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

              {/* Price History Over Time */}
              {history.length > 1 && (
                <div className="pt-2">
                  <p className="font-bold text-slate-300 text-xs mb-2">تغير القيمة عبر الزمن</p>
                  <div className="flex items-end gap-1.5 h-20" dir="ltr">
                    {history.map((h, i) => {
                      const max = Math.max(...history.map((x) => x.estimated));
                      const min = Math.min(...history.map((x) => x.estimated));
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
