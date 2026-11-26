'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Send,
  Loader2,
  ChevronRight,
  Clock,
  ShieldCheck,
  ImagePlus,
  CheckCircle2,
  Circle,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TicketMessage {
  id: string;
  content: string;
  isStaff: boolean;
  createdAt: string;
  user: { id: string; name: string; role: string; image: string | null };
}

interface TicketDetail {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  closedAt: string | null;
  assignee: { id: string; name: string } | null;
  messages: TicketMessage[];
}

const statusSteps = [
  { key: 'OPEN', label: 'مفتوحة' },
  { key: 'IN_PROGRESS', label: 'قيد المعالجة' },
  { key: 'RESOLVED', label: 'تم الحل' },
  { key: 'CLOSED', label: 'مغلقة' },
];

const QUICK_REPLIES = [
  'أرسلت التفاصيل المطلوبة',
  'أحتاج متابعة إضافية من فضلك',
  'شكراً لكم، تم حل المشكلة',
];

function renderMessageContent(content: string) {
  // Detect image URL line ([صورة مرفقة]: /uploads/... or https://...)
  const imgMatch = content.match(/(\/uploads\/[^\s]+|https?:\/\/[^\s]+\.(?:jpg|jpeg|png|webp|gif))/i);
  const textWithoutImg = imgMatch ? content.replace(imgMatch[0], '').replace('[صورة مرفقة]:', '').trim() : content;

  return (
    <div className="space-y-2">
      {textWithoutImg && <p className="text-sm leading-relaxed whitespace-pre-wrap">{textWithoutImg}</p>}
      {imgMatch && (
        <a href={imgMatch[0]} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={imgMatch[0]}
            alt="مرفق"
            className="max-h-56 rounded-xl border border-white/10 object-cover"
          />
        </a>
      )}
    </div>
  );
}

export default function TicketDetailPage() {
  const { isAuthenticated, _hydrated, token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [closing, setClosing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchTicket = useCallback(async () => {
    if (!isAuthenticated || !params.id) return;
    try {
      const res = await fetch(`/api/tickets/${params.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (data.success) {
        setTicket(data.data);
      } else if (loading) {
        toast.error('التذكرة غير موجودة');
        router.push('/tickets');
      }
    } catch {
      // ignore polling hiccup
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, params.id, token, loading, router]);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchTicket();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') fetchTicket();
    }, 4000);
    return () => clearInterval(timer);
  }, [_hydrated, isAuthenticated, router, fetchTicket]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !ticket) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: text.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        await fetchTicket();
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      } else {
        toast.error(data.error || 'فشل إرسال الرد');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    }
    setSending(false);
  };

  const handleAttachImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await res.json();
      const url = d.data?.url || d.url;
      if (url) {
        await sendMessage(`[صورة مرفقة]: ${url}`);
      } else {
        toast.error('فشل رفع الصورة');
      }
    } catch {
      toast.error('حدث خطأ أثناء رفع الصورة');
    }
    setUploadingImg(false);
  };

  const handleClose = async () => {
    if (!ticket || !confirm('هل تريد إغلاق التذكرة؟')) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: 'CLOSED' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم إغلاق التذكرة');
        await fetchTicket();
      } else {
        toast.error(data.error || 'فشل الإغلاق');
      }
    } catch {
      toast.error('حدث خطأ');
    }
    setClosing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ffc640]" />
      </div>
    );
  }
  if (!ticket) return null;

  const currentStepIdx = Math.max(
    0,
    statusSteps.findIndex((s) => s.key === ticket.status)
  );

  return (
    <div className="min-h-screen bg-[#07090d] text-white py-6 pb-24 lg:pb-12" dir="rtl">
      <div className="container-custom max-w-3xl">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#9ca3af] hover:text-[#ffc640] transition-colors mb-4"
        >
          <ChevronRight className="w-4 h-4" />
          <span>العودة إلى التذاكر</span>
        </Link>

        {/* Ticket Header & Live Stepper */}
        <div className="rounded-3xl bg-[#11141b]/95 border border-white/[0.08] p-5 sm:p-6 mb-5 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-white">{ticket.subject}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#9ca3af]">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#ffc640]" />
                  {new Date(ticket.createdAt).toLocaleDateString('ar-JO')}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">تحديث فوري مباشر</span>
                {ticket.assignee && (
                  <>
                    <span>•</span>
                    <span>المسؤول: {ticket.assignee.name}</span>
                  </>
                )}
              </div>
            </div>

            {ticket.status !== 'CLOSED' && (
              <button
                type="button"
                onClick={handleClose}
                disabled={closing}
                className="px-3.5 h-9 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {closing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span>إغلاق التذكرة</span>
              </button>
            )}
          </div>

          {/* Status Timeline Stepper */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/[0.07]">
            {statusSteps.map((step, idx) => {
              const reached = idx <= currentStepIdx;
              return (
                <div key={step.key} className="flex flex-col items-center text-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                      reached
                        ? 'bg-[#ffc640]/20 border-[#ffc640] text-[#ffc640]'
                        : 'bg-white/[0.03] border-white/[0.1] text-gray-500'
                    }`}
                  >
                    {reached ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-[11px] font-bold ${reached ? 'text-white' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Messages Thread */}
        <div className="space-y-3 mb-5">
          {ticket.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isStaff ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 border ${
                  msg.isStaff
                    ? 'bg-[#151a26] border-[#ffc640]/30 text-gray-100'
                    : 'bg-[#1f2937]/90 border-white/[0.08] text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-white">{msg.user.name}</span>
                  {msg.isStaff && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffc640]/15 text-[#ffc640] text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      فريق الدعم
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 mr-auto">
                    {new Date(msg.createdAt).toLocaleTimeString('ar-JO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {renderMessageContent(msg.content)}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Reply Composer */}
        {ticket.status !== 'CLOSED' ? (
          <div className="rounded-3xl bg-[#11141b]/95 border border-white/[0.08] p-4 space-y-3 shadow-xl">
            {/* Quick Reply Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReplyText(qr)}
                  className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-[#ffc640]/15 border border-white/[0.08] hover:border-[#ffc640]/40 text-[11px] font-semibold text-gray-300 hover:text-[#ffc640] whitespace-nowrap transition-colors"
                >
                  {qr}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAttachImage}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingImg}
                title="إرفاق صورة"
                className="w-12 h-12 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-gray-300 hover:text-[#ffc640] shrink-0 transition-colors"
              >
                {uploadingImg ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#ffc640]" />
                ) : (
                  <ImagePlus className="w-5 h-5" />
                )}
              </button>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(replyText);
                  }
                }}
                placeholder="اكتب ردك هنا... (Enter للإرسال)"
                rows={2}
                className="flex-1 min-h-[48px] max-h-32 p-3 rounded-xl bg-[#090b10] border border-white/[0.09] text-white text-sm placeholder-gray-500 outline-none focus:border-[#ffc640]/70 resize-none"
              />

              <button
                type="button"
                onClick={() => sendMessage(replyText)}
                disabled={sending || !replyText.trim()}
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] flex items-center justify-center shrink-0 disabled:opacity-50 shadow-lg shadow-[#ffc640]/20"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#11141b] border border-white/[0.06] p-4 text-center text-xs text-gray-400">
            هذه التذكرة مغلقة. يمكنك فتح تذكرة جديدة في أي وقت إذا احتجت للمساعدة.
          </div>
        )}
      </div>
    </div>
  );
}
