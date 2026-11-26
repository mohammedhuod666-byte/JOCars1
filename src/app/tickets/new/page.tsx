'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Send, Loader2, ChevronRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewTicketPage() {
  const { isAuthenticated, _hydrated, token } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [submitting, setSubmitting] = useState(false);

  if (_hydrated && !isAuthenticated) {
    router.push('/auth/login?redirect=/tickets/new');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('العنوان والرسالة مطلوبان');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subject, message, category, priority }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم فتح التذكرة بنجاح');
        router.push(`/tickets/${data.data.id}`);
      } else {
        toast.error(data.error || 'فشل إرسال التذكرة');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-white py-8 pb-24" dir="rtl">
      <div className="container-custom max-w-2xl">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#9ca3af] hover:text-[#ffc640] transition-colors mb-5"
        >
          <ChevronRight className="w-4 h-4" />
          <span>العودة إلى التذاكر</span>
        </Link>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#e3aa00] flex items-center justify-center shadow-lg shadow-[#ffc640]/20">
            <Ticket className="w-6 h-6 text-[#080a0a]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">فتح تذكرة دعم جديدة</h1>
            <p className="text-xs text-[#9ca3af]">سيتم إشعار فريق الدعم فوراً لمتابعة طلبك</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-[#11141b]/95 border border-white/[0.08] p-5 sm:p-7 space-y-5 shadow-2xl"
        >
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">القسم المختص</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'GENERAL', label: 'استفسار عام' },
                { value: 'TECHNICAL', label: 'مشكلة تقنية' },
                { value: 'ACCOUNT', label: 'الحساب والتوثيق' },
                { value: 'PAYMENT', label: 'المدفوعات' },
                { value: 'REPORT', label: 'بلاغ أو شكوى' },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    category === c.value
                      ? 'border-[#ffc640] bg-[#ffc640] text-[#080a0a]'
                      : 'border-white/[0.08] bg-[#090b10] text-gray-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">درجة الأهمية</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'LOW', label: 'منخفضة' },
                { value: 'NORMAL', label: 'عادية' },
                { value: 'HIGH', label: 'مهمة' },
                { value: 'URGENT', label: 'عاجلة' },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                    priority === p.value
                      ? 'border-[#ffc640] bg-[#ffc640]/15 text-[#ffc640]'
                      : 'border-white/[0.08] bg-[#090b10] text-gray-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">عنوان التذكرة *</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: استفسار حول توثيق حساب التاجر..."
              maxLength={200}
              className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#090b10] text-white text-[15px] placeholder-gray-500 outline-none focus:border-[#ffc640]/70"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">تفاصيل الطلب *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اشرح المشكلة أو الطلب بالتفصيل..."
              maxLength={5000}
              rows={5}
              className="w-full p-4 rounded-xl border border-white/[0.09] bg-[#090b10] text-white text-[15px] placeholder-gray-500 outline-none focus:border-[#ffc640]/70 resize-none"
              required
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>محادثة محمية ومتابعة مباشرة من فريق JO Cars</span>
          </div>

          <button
            type="submit"
            disabled={submitting || !subject.trim() || !message.trim()}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] text-sm font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#ffc640]/20"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{submitting ? 'جاري الإرسال...' : 'إرسال التذكرة الآن'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
