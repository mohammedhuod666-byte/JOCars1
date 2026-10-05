'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import {
  FileSearch, Sparkles, ShieldCheck, AlertTriangle, CheckCircle2, Car,
  Loader2, DollarSign, Brain, Handshake, ListChecks, MessageCircle, Gauge,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface AnalysisResult {
  grade: string;
  gradeEn: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'AVOID';
  safety: number;
  discount: number;
  confidence: number;
  source: 'ai' | 'local';
  summary: string;
  recommendation: string;
  interpreted: string[];
  systems: { id: string; name: string; status: 'good' | 'warning' | 'bad' | 'unknown'; score: number; notes: string[] }[];
  issues: { text: string; severity: string }[];
  positives: string[];
  negotiation: string[];
}

const EXAMPLES = [
  { label: '7 جيد فحص كامل', text: 'الشواصي الأربعة: جيد خالي العلام، المحرك: جيد، الجير: جيد، الهايبرد: جيد، البدي: خالي ملاحظات' },
  { label: 'دقة بنكيت', text: 'امامي يمين: ضربه بنكيت او قصعات، خلفي: جيد، المحرك: تبخيره زيت خفيفه، التكييف: كمبريسر ضعيف' },
  { label: 'شاصي مضروب', text: 'شاصي امامي يمين: مضروب ومشغول، شمال: مقصوص. بطاريه الهايبرد: تحتاج استبدال خلايا. الجير: نتعه' },
];

const GRADE_STYLE: Record<string, { badge: string; text: string }> = {
  EXCELLENT: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400' },
  GOOD: { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', text: 'text-blue-600 dark:text-blue-400' },
  FAIR: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', text: 'text-amber-600 dark:text-amber-400' },
  POOR: { badge: 'bg-red-500/20 text-red-300 border-red-500/30', text: 'text-red-600 dark:text-red-400' },
  AVOID: { badge: 'bg-red-600/30 text-red-200 border-red-500/50', text: 'text-red-600 dark:text-red-400' },
};

const STATUS_DOT: Record<string, string> = {
  good: 'bg-emerald-500',
  warning: 'bg-amber-500',
  bad: 'bg-red-500',
  unknown: 'bg-gray-400 dark:bg-gray-600',
};

const STATUS_LABEL: Record<string, string> = {
  good: 'سليم', warning: 'ملاحظات', bad: 'خلل', unknown: 'غير مذكور',
};

export default function InspectionAnalyzerPage() {
  const [inspectionText, setInspectionText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!inspectionText.trim() || inspectionText.trim().length < 5) {
      toast.error('الصق نص كشف الفحص أولاً');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inspectionText }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
        if (data.data.source === 'local') {
          toast.success('تم التحليل بالمحرك الخبير المحلي (الذكاء السحابي مشغول حالياً)', { duration: 4000 });
        }
      } else {
        toast.error(data.error || 'فشل التحليل');
      }
    } catch {
      toast.error('تعذر الاتصال — تحقق من الإنترنت');
    }
    setAnalyzing(false);
  };

  const g = result ? GRADE_STYLE[result.gradeEn] || GRADE_STYLE.GOOD : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between text-gray-900 dark:text-gray-100">
      <Header />
      <main className="container-custom max-w-4xl mx-auto px-4 py-8 flex-1">
        <div className="card p-6 sm:p-8 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white mb-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden text-center sm:text-right">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 inline-flex items-center gap-1.5 mb-3">
            <Brain className="w-4 h-4" /> محلل الشاصي بالذكاء الاصطناعي الحقيقي 
          </span>
          <h1 className="text-2xl sm:text-4xl font-black mb-2">محلل كشف فحص السيارات والشواصي (AI)</h1>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            الصق نص الكشف من أي مركز فحص أردني (أوتوسكور، الشريف، غيره) — حتى مع الأخطاء الإملائية.
            الذكاء الاصطناعي يفهم لهجتك، يحلل 14 منظومة (شاصي، بدي، محرك، جير، هايبرد...) ويعطيك الأمان والخصم العادل ونصائح التفاوض.
          </p>
        </div>

        <div className="space-y-6">
          <div className="card p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <label className="text-sm font-black text-gray-900 dark:text-white block">نص أو ملاحظات كشف الفحص:</label>
            <textarea
              rows={5}
              value={inspectionText}
              onChange={(e) => setInspectionText(e.target.value)}
              placeholder="مثال: الشاصي الأمامي يمين: قصعات أثر ضربة بنكيت، شمال: جيد. المحرك: تبخيرة خفيفة. الجير: نتعة خفيفة..."
              className="w-full p-4 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm focus:border-emerald-500 outline-none transition-all"
            />

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs text-gray-500 py-1 font-bold">جرّب مثالاً:</span>
              {EXAMPLES.map((ex) => (
                <button key={ex.label} onClick={() => setInspectionText(ex.text)}
                  className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/10 transition-all">
                  {ex.label}
                </button>
              ))}
            </div>

            <button onClick={handleAnalyze} disabled={analyzing || !inspectionText.trim()} className="btn btn-emerald w-full py-3 text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
              {analyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> الذكاء الاصطناعي يحلل الآن...</> : <><FileSearch className="w-5 h-5" /> حلل بالذكاء الاصطناعي</>}
            </button>
          </div>

          {result && g && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Verdict header */}
              <div className="card p-6 border border-emerald-500/30">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${g.badge}`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    {result.source === 'ai' ? 'تحليل الذكاء الاصطناعي ' : 'المحرك الخبير المحلي'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    الثقة {result.confidence}%
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-xs text-gray-500 font-bold">النتيجة السوقية في الأردن</span>
                    <h3 className={`text-xl font-black ${g.text}`}>{result.grade}</h3>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-left">
                      <span className="text-xs text-gray-500 font-bold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> الأمان</span>
                      <p className={`text-2xl font-black ${result.safety > 90 ? 'text-emerald-600' : result.safety > 70 ? 'text-amber-600' : 'text-red-600'}`}>{result.safety}%</p>
                    </div>
                    <div className="text-left">
                      <span className="text-xs text-gray-500 font-bold flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> الخصم العادل</span>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">~{result.discount}%</p>
                    </div>
                  </div>
                </div>

                <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mt-4">
                  <div
                    className={`h-full rounded-full transition-all ${result.safety > 90 ? 'bg-emerald-500' : result.safety > 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${result.safety}%` }}
                  />
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-4">{result.summary}</p>

                {result.interpreted.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] text-gray-500 font-bold mb-1.5">فهمنا من نصك (حتى مع الأخطاء الإملائية):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.interpreted.map((t, i) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-200 dark:border-teal-500/20">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Systems grid */}
              <div className="card p-6">
                <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Gauge className="w-4 h-4 text-emerald-500" /> فحص الأنظمة الأربعة عشر
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {result.systems.map((s) => (
                    <div key={s.id} title={s.notes.join(' •') || 'غير مذكور بالنص'}
                      className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[s.status]}`} />
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate">{s.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {s.status === 'unknown' ? 'غير مذكور' : <><span className="font-black text-gray-800 dark:text-gray-200">{s.score}</span>/100 • {STATUS_LABEL[s.status]}</>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues / positives */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-500/10 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> الإيجابيات</h4>
                  <ul className="space-y-1">
                    {result.positives.length > 0 ? result.positives.map((p, i) => <li key={i} className="text-xs text-gray-700 dark:text-gray-300">• {p}</li>) : <li className="text-xs text-gray-500">لا نقاط قوة واضحة.</li>}
                  </ul>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-500/10 space-y-2">
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> الملاحظات</h4>
                  <ul className="space-y-1">
                    {result.issues.map((iss, i) => (
                      <li key={i} className="text-xs text-gray-700 dark:text-gray-300">
                        {iss.severity === 'critical' ? '' : iss.severity === 'major' ? '' : iss.severity === 'minor' ? '' : 'ℹ'} {iss.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendation + negotiation */}
              <div className="card p-6 border border-blue-500/20 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="w-4 h-4" /> توصية الخبير
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.recommendation}</p>
                </div>
                {result.negotiation.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 mb-1.5">
                      <Handshake className="w-4 h-4" /> نصائح التفاوض
                    </h4>
                    <ul className="space-y-1">
                      {result.negotiation.map((n, i) => (
                        <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                          <ListChecks className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" /> {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Link href="/ai" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                  <MessageCircle className="w-3.5 h-3.5" /> ناقش النتيجة مع المساعد الذكي
                  <Car className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
