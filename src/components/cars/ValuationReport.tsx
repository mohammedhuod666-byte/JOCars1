'use client';

import { useCallback, useEffect, useState, Fragment } from 'react';
import Link from 'next/link';
import { BarChart3, ChevronDown, ExternalLink, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface Report {
  estimatedPrice: number;
  minPrice: number;
  maxPrice: number;
  grade?: 'approximate' | 'limited' | 'full';
  priceBasis?: { sold: number; asking: number };
  confidence: number;
  confidenceLabel: string;
  confidenceReasons: string[];
  comparablesUsed: number;
  comparablesFound: number;
  sourcesUsed: number;
  sources: { source: string; label: string; count: number }[];
  stats: { weightedMedian: number; weightedAvg: number; median: number; p25: number; p75: number; iqr: number };
  factors: { factor: string; impact: string }[];
  explanation?: string | null;
  pipeline: { stageAr: string; ms: number; detail: string }[];
  calculatedAt: string;
  targetDiffPct?: number | null;
}

interface Comp {
  source: string;
  sourceLabel: string;
  url?: string | null;
  title: string;
  year: number | null;
  kilometers: number | null;
  price: number;
  adjustedPrice: number | null;
  similarity: number;
  simBreakdown?: Record<string, number>;
  tier: number;
  yearDiff?: number;
  weight?: number;
  adjustments: { factorAr: string; delta: number }[];
  ageDays?: number;
}

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
  const [report, setReport] = useState<Report | null>(null);
  const [comps, setComps] = useState<Comp[]>([]);
  const [history, setHistory] = useState<{ at: string; estimated: number }[]>([]);
  const [insufficient, setInsufficient] = useState<string | null>(null);

  const auth = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/valuations?carId=${carId}`);
      const d = await res.json();
      if (d.success && d.data?.latest) {
        setReport(d.data.latest);
        setComps(d.data.latest.comparables || []);
        setHistory(d.data.history || []);
        if (d.data.latest.estimatedPrice && onValuationLoaded) {
          onValuationLoaded(d.data.latest.estimatedPrice);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [carId, onValuationLoaded]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async () => {
    if (!isAuthenticated) { toast.error('سجل الدخول لتشغيل التحليل'); return; }
    setRunning(true);
    setExplaining(false);
    setStages([]);
    setInsufficient(null);
    try {
      // Real-time engine stages over SSE (no fake progress).
      const res = await fetch('/api/valuations/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ carId }),
      });
      if (res.status === 429) { toast.error('تجاوزت الحد اليومي — عاود غداً'); setRunning(false); return; }
      if (!res.ok || !res.body) { toast.error('فشل بدء التحليل'); setRunning(false); return; }
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
          try { d = JSON.parse(dm); } catch { continue; }
          if (ev === 'stage') {
            setStages((prev) => [...prev.filter((s) => s.stageAr !== d.stageAr), d]);
          } else if (ev === 'explaining') {
            setExplaining(true);
          } else if (ev === 'done') {
            finished = true;
            if (d.status === 'RELIABLE' || d.status === 'LIMITED' || d.status === 'APPROXIMATE') {
              setReport(d.report);
              setComps(d.comparables || []);
              if (d.report?.estimatedPrice && onValuationLoaded) {
                onValuationLoaded(d.report.estimatedPrice);
              }
              toast.success(
                d.status === 'RELIABLE' ? 'اكتمل التحليل — تقييم موثوق'
                : d.status === 'LIMITED' ? 'اكتمل التحليل — تقييم محدود' : 'اكتمل التحليل — تقدير تقريبي');
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
      toast.error('تعذر الاتصال');
    } finally {
      setRunning(false);
      setExplaining(false);
    }
  };

  const diff = report?.targetDiffPct;
  const confColor = !report ? '' : report.confidence >= 75 ? 'text-emerald-400' : report.confidence >= 50 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
      <button onClick={() => setOpen(!open)} className="w-full p-5 flex items-center justify-between text-right hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm sm:text-base">القيمة السوقية العادلة (تحليل AI)</h3>
            <p className="text-slate-400 text-xs">
              {loading ? 'جارٍ التحميل...' : report
                ? `${report.estimatedPrice.toLocaleString()} د.أ • ${
                    (report as any).grade === 'approximate' ? 'تقدير تقريبي' :
                    (report as any).grade === 'limited' ? 'تقييم محدود' : 'تقييم موثوق'
                  } • ثقة ${report.confidenceLabel} (${report.confidence}%)`
                : 'حلّل السوق من عدة مصادر قبل الشراء'}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 space-y-5">
          {!report && !running && !insufficient && (
            <div className="text-center py-4 space-y-3">
              <p className="text-slate-400 text-sm">لم يُحلل سعر هذه السيارة بعد. يجمع النظام إعلانات مشابهة من عدة مصادر وينظّفها ويقيّمها.</p>
              <button onClick={run} className="px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black text-sm transition-all">
                تحليل السعر الآن
              </button>
            </div>
          )}

          {running && (
            <div className="space-y-2 py-2">
              {stages.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> بدء التحليل...
                </div>
              )}
              {stages.map((s) => (
                <div key={s.stageAr} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <div>
                    <span className="text-slate-200 font-bold">{s.stageAr}</span>
                    <span className="text-slate-500"> — {s.detail} ({(s.ms / 1000).toFixed(1)}s)</span>
                  </div>
                </div>
              ))}
              {explaining && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> كتابة التفسير...
                </div>
              )}
            </div>
          )}

          {insufficient && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
              البيانات المتاحة غير كافية لإعطاء تقييم موثوق. {insufficient}
            </div>
          )}

          {report && !running && (
            <>
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span>
                  {(report as any).priceBasis?.sold > 0
                    ? `تضمن التقييم ${(report as any).priceBasis.sold} أسعار بيع منفذة و ${(report as any).priceBasis.asking} أسعار عروض في السوق.`
                    : 'ملاحظة سوقية: اعتمد التقييم على أسعار الإعلانات والعروض المتاحة في السوق، وليس بالضرورة أسعار البيع النهائية المنفذة.'}
                </span>
              </div>
              {(report.grade === 'approximate' || report.grade === 'limited') && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
                  {report.grade === 'approximate'
                    ? 'تقدير تقريبي جداً (2-3 مقارنات فقط) — استرشد به بحذر شديد.'
                    : 'تقييم محدود (4-6 مقارنات) — دقّق بالجدول أدناه قبل القرار.'}
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <p className="text-[11px] text-slate-400 mb-1">القيمة التقديرية</p>
                  <p className="text-xl font-black text-white">{report.estimatedPrice.toLocaleString()} <span className="text-xs">د.أ</span></p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <p className="text-[11px] text-slate-400 mb-1">النطاق المتوقع</p>
                  <p className="text-sm font-black text-white">{report.minPrice.toLocaleString()} – {report.maxPrice.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <p className="text-[11px] text-slate-400 mb-1">الثقة: {report.confidenceLabel}</p>
                  <p className={`text-xl font-black ${confColor}`}>{report.confidence}%</p>
                </div>
              </div>

              {diff !== null && diff !== undefined && (
                <div className={`p-3 rounded-2xl text-sm border ${Math.abs(diff) <= 5 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
                  السعر المطلوب ({askingPrice.toLocaleString()} د.أ) {diff > 0 ? 'أعلى' : 'أقل'} من القيمة التقديرية بـ {Math.abs(diff)}%.
                  {Math.abs(diff) > 5 ? ' السعر المطلوب خارج النطاق التقديري المبني على السيارات المقارنة.' : ' السعر ضمن النطاق العادل.'}
                </div>
              )}

              {report.explanation && (
                <p className="text-slate-300 text-sm leading-relaxed">{report.explanation}</p>
              )}

              <div className="text-xs text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">لماذا هذه الثقة؟</p>
                {report.confidenceReasons.map((r, i) => <p key={i}>• {r}</p>)}
              </div>

              {(report as any).funnel?.length > 0 && (
                <div className="overflow-x-auto">
                  <p className="font-bold text-slate-300 text-xs mb-2">أين ذهبت الإعلانات؟ (تدقيق المراحل)</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 text-right">
                        <th className="p-2">المرحلة</th>
                        <th className="p-2">دخل</th>
                        <th className="p-2">خرج</th>
                        <th className="p-2">مستبعد</th>
                        <th className="p-2">التفاصيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {(report as any).funnel.map((f: any, i: number) => (
                        <tr key={i} className="text-slate-300">
                          <td className="p-2 font-bold">{f.stageAr}</td>
                          <td className="p-2">{f.before}</td>
                          <td className="p-2 text-emerald-400 font-bold">{f.after}</td>
                          <td className="p-2 text-rose-400">{f.rejected}</td>
                          <td className="p-2 text-slate-400">{(f.notes || []).join(' • ').slice(0, 220)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {comps.length > 0 && (
                <div className="overflow-x-auto">
                  <p className="font-bold text-slate-300 text-xs mb-2">أعلى السيارات تأثيراً ({report.comparablesUsed} مستخدمة)</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 text-right">
                        <th className="p-2">السيارة</th>
                        <th className="p-2">السنة</th>
                        <th className="p-2">كم</th>
                        <th className="p-2">السعر</th>
                        <th className="p-2">بعد التعديل</th>
                        <th className="p-2">التشابه</th>
                        <th className="p-2">المصدر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {comps.slice(0, 10).map((c, i) => (
                        <Fragment key={i}>
                          <tr className="text-slate-300 cursor-pointer hover:bg-slate-800/50" onClick={() => setExpandedComp(expandedComp === i ? null : i)} title="اضغط للتفاصيل">
                            <td className="p-2">{expandedComp === i ? '▾' : '▸'} {c.title}</td>
                            <td className="p-2">{c.year || '—'}</td>
                            <td className="p-2">{c.kilometers?.toLocaleString() || '—'}</td>
                            <td className="p-2">{c.price.toLocaleString()}</td>
                            <td className="p-2 font-bold text-white">{c.adjustedPrice?.toLocaleString() || '—'}</td>
                            <td className="p-2 text-emerald-400 font-bold">{c.similarity}%</td>
                            <td className="p-2">
                              {c.url?.startsWith('http') ? (
                                <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:underline inline-flex items-center gap-1">
                                  {c.sourceLabel} <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : <Link href={c.url || '#'} className="text-blue-400 hover:underline">{c.sourceLabel}</Link>}
                            </td>
                          </tr>
                          {expandedComp === i && (
                            <tr className="bg-slate-900/80 text-xs text-slate-400">
                              <td colSpan={7} className="p-3 space-y-1">
                                <p>المصدر: {c.sourceLabel} ({c.source}) {c.url?.startsWith('http') ? <span className="dir-ltr">{c.url}</span> : null}</p>
                                <p>السنة: {c.year || 'مجهولة'} • الممشى: {c.kilometers?.toLocaleString() || 'مجهول'} • السعر الأصلي: {c.price.toLocaleString()} د.أ</p>
                                <p>التشابه: {c.similarity}% • المستوى: {c.tier === 1 ? 'T1 مطابقة تامة' : c.tier === 2 ? 'T2 قوية' : c.tier === 3 ? 'T3 سنة قريبة' : 'T4 مركبة قريبة — تأثير محدود، ليست نفس الموديل/السنة'}{c.tier === 3 && c.yearDiff !== undefined ? ` (فرق سنة ${c.yearDiff})` : ''} • الوزن النهائي: {c.weight ?? '—'}</p>
                                {c.simBreakdown && <p>تفكيك التشابه: {Object.entries(c.simBreakdown).map(([k, v]) => `${k} ${v}%`).join(' • ').slice(0, 220)}</p>}
                                {(c.adjustments || []).length > 0
                                  ? <p>التعديلات: {c.adjustments.map((a) => `${a.factorAr} ${a.delta > 0 ? '+' : ''}${a.delta}`).join(' • ')}</p>
                                  : <p>بلا تعديلات سعرية</p>}
                                {(c as any).matrix?.length > 0 && (
                                  <div className="pt-1">
                                    <p className="font-bold text-slate-300 mb-1">لماذا اختيرت؟ (مقارنة عامل بعامل)</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                      {(c as any).matrix.map((m: any, mi: number) => (
                                        <div key={mi} className={`px-2 py-1 rounded-lg border text-[11px] ${
                                          m.verdict === 'EXACT' ? 'border-emerald-500/40 text-emerald-300'
                                          : m.verdict === 'CLOSE' ? 'border-amber-500/40 text-amber-300'
                                          : m.verdict === 'DIFFERENT' ? 'border-rose-500/40 text-rose-300'
                                          : 'border-slate-700 text-slate-500'}`}>
                                          <span className="font-bold">{m.factorAr}</span>: {m.target} ← {m.comp}
                                          {' '}({m.verdict === 'EXACT' ? 'مطابق' : m.verdict === 'CLOSE' ? 'قريب' : m.verdict === 'DIFFERENT' ? 'مختلف' : 'مجهول'})
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {c.ageDays !== undefined && <p>عمر الإعلان: {c.ageDays} يوم</p>}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> حُسب بتاريخ {new Date(report.calculatedAt).toLocaleDateString('ar-JO')}</span>
                <button onClick={run} className="inline-flex items-center gap-1 text-blue-400 hover:underline">
                  <RefreshCw className="w-3.5 h-3.5" /> إعادة التقييم
                </button>
              </div>

              {history.length > 1 && (
                <div>
                  <p className="font-bold text-slate-300 text-xs mb-2">تغير القيمة عبر الزمن</p>
                  <div className="flex items-end gap-1.5 h-20" dir="ltr">
                    {history.map((h, i) => {
                      const max = Math.max(...history.map((x) => x.estimated));
                      const min = Math.min(...history.map((x) => x.estimated));
                      const pct = max === min ? 50 : 15 + ((h.estimated - min) / (max - min)) * 85;
                      return (
                        <div key={i} title={`${new Date(h.at).toLocaleDateString('ar-JO')}: ${h.estimated.toLocaleString()}`} className="flex-1 rounded-t bg-blue-500/70" style={{ height: `${pct}%` }} />
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
