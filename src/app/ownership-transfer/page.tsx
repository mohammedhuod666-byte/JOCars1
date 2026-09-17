'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FileCheck, ListChecks, MapPin, Calculator, Send, Loader2, CheckCircle2, CircleAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const STEPS = [
  { t: 'فحص فني دوري', d: 'افحص السيارة بأحد مراكز الفحص المعتمدة (ماركا، البيادر، إربد...) وتأكد من خلوّها من المخالفات' },
  { t: 'تسديد المخالفات والترخيص', d: 'ادفع أي مخالفات مترتبة ورسوم الترخيص المتأخرة عبر eFAWATEERcom أو مديرية الترخيص' },
  { t: 'عقد البيع', d: 'نظّم عقد بيع (عدلية أو معرض) باسم المشتري مع صورة الهوية ورخصة الاقتناء' },
  { t: 'مراجعة الترخيص', d: 'يحضر البائع والمشتري (أو وكيل عدلي) لدائرة ترخيص السواقين والمركبات لإتمام النقل' },
  { t: 'استلام الرخصة الجديدة', d: 'تُصدر رخصة الاقتناء باسم المالك الجديد مع لوحات (إن لزم) — احتفظ بإيصال الدفع' },
];

const DOCUMENTS = [
  'هوية الأحوال المدنية للبائع والمشتري (سارية)',
  'رخصة اقتناء المركبة (الرخصة) سارية أو مجددة',
  'شهادة الفحص الفني الدوري (سارية 30 يوماً)',
  'عقد البيع أو الوكالة العدلية',
  'براءة ذمة مخالفات + إيصالات الدفع',
  'تأمين إجباري باسم المالك الجديد',
];

export default function OwnershipTransferPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const [officialFee, setOfficialFee] = useState('');
  const [serviceFee, setServiceFee] = useState(50);
  const [needHelp, setNeedHelp] = useState(false);
  const [helpText, setHelpText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const total = (parseFloat(officialFee) || 0) + serviceFee;

  const requestHelp = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (!helpText.trim()) { toast.error('اكتب تفاصيل طلبك'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          subject: 'طلب مساعدة بنقل الملكية',
          message: helpText,
          category: 'OWNERSHIP_TRANSFER',
          priority: 'NORMAL',
        }),
      });
      const d = await res.json();
      if (d.success) { setSent(true); toast.success('تم إرسال طلبك — ستتواصل معك الإدارة'); }
      else toast.error(d.error || 'فشل الإرسال');
    } catch { toast.error('تعذر الاتصال'); }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="container-custom max-w-5xl mx-auto px-4 py-8 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1.5 mb-3">
            <FileCheck className="w-3.5 h-3.5" /> نقل الملكية 🔄
          </span>
          <h1 className="text-3xl font-extrabold mb-2">انقل ملكية سيارتك خطوة بخطوة</h1>
          <p className="text-sm text-slate-400">الدليل الكامل: الأوراق، الخطوات، تقدير الرسوم — مع إمكانية طلب مساعدة من فريقنا</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
            <h2 className="font-bold flex items-center gap-2 mb-4"><ListChecks className="w-5 h-5 text-emerald-400" /> خطوات نقل الملكية</h2>
            <div className="space-y-4">
              {STEPS.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</div>
                  <div>
                    <p className="text-sm font-bold">{s.t}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <h2 className="font-bold flex items-center gap-2 mt-6 mb-3"><FileCheck className="w-5 h-5 text-blue-400" /> الأوراق المطلوبة</h2>
            <ul className="space-y-1.5">
              {DOCUMENTS.map((d, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> {d}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-slate-500 mt-4 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> مديريات الترخيص: ماركا (عمّان)، الزرقاء، إربد، العقبة + مراكز الفحص المعتمدة — الدوام الرسمي أحد–خميس.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="font-bold flex items-center gap-2 mb-4"><Calculator className="w-5 h-5 text-amber-400" /> مقدّر رسوم النقل</h2>
              <label className="text-xs font-bold text-slate-300">الرسوم الرسمية بالترخيص (د.أ) — حسب سعة المحرك وعمر السيارة</label>
              <input type="number" value={officialFee} onChange={e => setOfficialFee(e.target.value)} placeholder="مثال: 150"
                className="input mt-1 mb-3" />
              <label className="text-xs font-bold text-slate-300">أتعاب المعاملة (اختياري)</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[0, 50, 100].map(v => (
                  <button key={v} type="button" onClick={() => setServiceFee(v)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${serviceFee === v ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    {v === 0 ? 'بدون' : `${v} د.أ`}
                  </button>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 text-center">
                <p className="text-xs text-slate-400">الإجمالي التقديري</p>
                <p className="text-3xl font-black text-amber-400">{total.toLocaleString('ar-JO')} د.أ</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-start gap-1">
                <CircleAlert className="w-3.5 h-3.5 shrink-0" /> الرسوم الرسمية تُحدد بدائرة الترخيص حصراً — استعلم عن القيمة الدقيقة قبل الذهاب.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="font-bold flex items-center gap-2 mb-2"><Send className="w-5 h-5 text-emerald-400" /> بدك مساعدة بالمعاملة؟</h2>
              {sent ? (
                <p className="text-sm text-emerald-400 font-bold">وصل طلبك ✅ — سيتواصل معك فريقنا قريباً</p>
              ) : (
                <>
                  {!needHelp ? (
                    <button onClick={() => setNeedHelp(true)} className="btn btn-emerald px-5 py-2.5 text-xs font-bold w-full">
                      اطلب مساعدة بنقل الملكية
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <textarea value={helpText} onChange={e => setHelpText(e.target.value)} rows={3}
                        placeholder="اشرح وضعك: نوع السيارة، المدينة، هل تحتاج مندوباً للترخيص..."
                        className="input text-sm" />
                      <button onClick={requestHelp} disabled={sending} className="btn btn-emerald px-5 py-2.5 text-xs font-bold w-full">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إرسال الطلب'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
