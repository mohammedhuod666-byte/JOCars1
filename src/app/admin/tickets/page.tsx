'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Ticket,
  MessageCircle,
  Clock,
  Loader2,
  Send,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
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

interface TicketItem {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  user: { id: string; name: string; email: string; image: string | null };
  assignee: { id: string; name: string } | null;
  _count: { messages: number };
}

const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
const priorityLabels: Record<string, string> = { URGENT: 'عاجل', HIGH: 'مهم', NORMAL: 'عادي', LOW: 'منخفض' };
const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-500/15 text-red-300 border-red-500/30',
  HIGH: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  NORMAL: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  LOW: 'bg-white/[0.05] text-gray-400 border-white/[0.08]',
};

const statusLabels: Record<string, string> = {
  OPEN: 'مفتوحة',
  IN_PROGRESS: 'قيد المعالجة',
  RESOLVED: 'تم الحل',
  CLOSED: 'مغلقة',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  IN_PROGRESS: 'bg-[#ffc640]/15 text-[#ffc640] border-[#ffc640]/35',
  RESOLVED: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  CLOSED: 'bg-white/[0.06] text-gray-400 border-white/[0.1]',
};

const categoryLabels: Record<string, string> = {
  GENERAL: 'عام',
  TECHNICAL: 'تقني',
  ACCOUNT: 'حساب',
  PAYMENT: 'دفع',
  REPORT: 'بلاغ',
};

const ADMIN_CANNED_REPLIES = [
  'أهلاً بك، تم استلام تذكرتك وجارٍ مراجعتها الآن من قبل الفريق المختص.',
  'يرجى تزويدنا برقم الإعلان أو صورة للشاشة لنتمكن من مساعدتك بشكل أسرع.',
  'تمت معالجة طلبك وحل المشكلة بنجاح. نرجو التأكد وإخبارنا إذا احتجت لأي مساعدة أخرى.',
  'تم تحديث حالة حسابك بنجاح، يمكنك الآن استخدام كافة المزايا.',
];

export default function AdminTicketsPage() {
  const { user, isAuthenticated, _hydrated } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [admins, setAdmins] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, TicketMessage[]>>({});

  const loadTickets = useCallback(() => {
    const token = useAuth.getState().token;
    if (!token) return;
    const params = filter ? `?status=${filter}` : '';
    fetch(`/api/admin/tickets${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const sorted = (data.data.tickets || []).sort(
            (a: TicketItem, b: TicketItem) =>
              (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
          );
          setTickets(sorted);
          setAdmins(data.data.admins || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    if (_hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/');
      return;
    }
    loadTickets();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') loadTickets();
    }, 6000);
    return () => clearInterval(timer);
  }, [_hydrated, isAuthenticated, user, router, loadTickets]);

  const toggleExpand = async (ticket: TicketItem) => {
    if (expanded === ticket.id) {
      setExpanded(null);
      return;
    }
    setExpanded(ticket.id);
    setReplyText('');
    try {
      const token = useAuth.getState().token;
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setExpandedMessages((prev) => ({ ...prev, [ticket.id]: data.data.messages }));
      }
    } catch {}
  };

  const handleReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const token = useAuth.getState().token;
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم إرسال الرد');
        setReplyText('');
        const res2 = await fetch(`/api/tickets/${ticketId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data2 = await res2.json();
        if (data2.success) {
          setExpandedMessages((prev) => ({ ...prev, [ticketId]: data2.data.messages }));
        }
        loadTickets();
      } else {
        toast.error(data.error || 'فشل الإرسال');
      }
    } catch {
      toast.error('حدث خطأ');
    }
    setSending(false);
  };

  const handleAction = async (ticketId: string, action: string, assigneeId?: string) => {
    try {
      const token = useAuth.getState().token;
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ticketId, action, assigneeId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم تحديث التذكرة');
        loadTickets();
      } else {
        toast.error(data.error || 'فشل');
      }
    } catch {
      toast.error('حدث خطأ');
    }
  };

  if (_hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) return null;

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const progressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const urgentCount = tickets.filter((t) => t.priority === 'URGENT' && t.status !== 'CLOSED').length;

  const filteredTickets = tickets.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.subject.toLowerCase().includes(q) ||
      t.user.name.toLowerCase().includes(q) ||
      t.user.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#07090d] text-white py-6 pb-24" dir="rtl">
      <div className="container-custom max-w-6xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#9ca3af] hover:text-[#ffc640] mb-2"
            >
              <ChevronRight className="w-4 h-4" />
              <span>العودة إلى لوحة الإدارة</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#e3aa00] flex items-center justify-center shadow-lg shadow-[#ffc640]/20">
                <Ticket className="w-5 h-5 text-[#080a0a]" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">مركز تذاكر الدعم الفني</h1>
                <p className="text-xs text-[#9ca3af]">متابعة والرد على طلبات المستخدمين بشكل فوري</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-[#11141b] border border-white/[0.08]">
            <span className="text-xs text-[#9ca3af]">إجمالي التذاكر</span>
            <p className="text-2xl font-black text-white mt-1">{tickets.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#11141b] border border-emerald-500/20">
            <span className="text-xs text-emerald-300">مفتوحة</span>
            <p className="text-2xl font-black text-white mt-1">{openCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#11141b] border border-[#ffc640]/25">
            <span className="text-xs text-[#ffc640]">قيد المعالجة</span>
            <p className="text-2xl font-black text-white mt-1">{progressCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#11141b] border border-red-500/25">
            <span className="text-xs text-red-300">عاجلة</span>
            <p className="text-2xl font-black text-white mt-1">{urgentCount}</p>
          </div>
        </div>

        {/* Search & Status Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالعنوان أو اسم المستخدم أو الإيميل..."
              className="w-full h-11 pr-10 pl-4 rounded-xl bg-[#11141b] border border-white/[0.08] text-white text-sm placeholder-gray-500 outline-none focus:border-[#ffc640]/60"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: '', label: 'الكل' },
              { id: 'OPEN', label: 'مفتوحة' },
              { id: 'IN_PROGRESS', label: 'قيد المعالجة' },
              { id: 'RESOLVED', label: 'تم الحل' },
              { id: 'CLOSED', label: 'مغلقة' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilter(s.id)}
                className={`px-3.5 h-11 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  filter === s.id
                    ? 'bg-[#ffc640] text-[#080a0a] border-[#ffc640]'
                    : 'bg-[#11141b] text-gray-400 border-white/[0.08] hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[35vh]">
            <Loader2 className="w-8 h-8 animate-spin text-[#ffc640]" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16 rounded-3xl bg-[#11141b]/70 border border-white/[0.06]">
            <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">لا توجد تذاكر مطابقة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const isExpanded = expanded === ticket.id;
              const msgs = expandedMessages[ticket.id] || [];

              return (
                <div
                  key={ticket.id}
                  className={`rounded-2xl bg-[#11141b] border transition-colors overflow-hidden ${
                    isExpanded ? 'border-[#ffc640]/45' : 'border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  {/* Ticket Row Header */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(ticket)}
                    className="w-full p-4 sm:p-5 flex items-start justify-between gap-3 text-right"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColors[ticket.status] || ''}`}>
                          {statusLabels[ticket.status] || ticket.status}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${priorityColors[ticket.priority] || ''}`}>
                          {priorityLabels[ticket.priority] || ticket.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-[11px] text-gray-400">
                          {categoryLabels[ticket.category] || ticket.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-white truncate">
                        {ticket.subject}
                      </h3>
                      <p className="text-xs text-[#9ca3af] mt-1">
                        {ticket.user.name} <span className="text-gray-500">({ticket.user.email})</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-gray-400 shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04]">
                        <MessageCircle className="w-3.5 h-3.5 text-[#ffc640]" />
                        <span className="font-bold text-white">{ticket._count.messages}</span>
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(ticket.createdAt).toLocaleDateString('ar-JO')}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#ffc640]" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Workspace */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.08] bg-[#0b0e14] p-4 sm:p-5 space-y-4">
                      {/* Controls Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={ticket.assignee?.id || ''}
                            onChange={(e) => handleAction(ticket.id, 'assign', e.target.value)}
                            className="h-9 px-3 rounded-xl bg-[#11141b] border border-white/[0.1] text-xs text-white outline-none focus:border-[#ffc640]"
                          >
                            <option value="">تعيين مسؤول...</option>
                            {admins.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>

                          {ticket.status !== 'IN_PROGRESS' && ticket.status !== 'CLOSED' && (
                            <button
                              type="button"
                              onClick={() => handleAction(ticket.id, 'progress')}
                              className="h-9 px-3 rounded-xl bg-[#ffc640]/15 hover:bg-[#ffc640]/25 border border-[#ffc640]/30 text-[#ffc640] text-xs font-bold flex items-center gap-1"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>قيد المعالجة</span>
                            </button>
                          )}
                          {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                            <button
                              type="button"
                              onClick={() => handleAction(ticket.id, 'resolve')}
                              className="h-9 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تم الحل</span>
                            </button>
                          )}
                          {ticket.status !== 'CLOSED' && (
                            <button
                              type="button"
                              onClick={() => handleAction(ticket.id, 'close')}
                              className="h-9 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>إغلاق</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Messages Thread */}
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {msgs.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3.5 rounded-2xl border ${
                              msg.isStaff
                                ? 'bg-[#151a26] border-[#ffc640]/30'
                                : 'bg-[#11141b] border-white/[0.06]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{msg.user.name}</span>
                                {msg.isStaff && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffc640]/15 text-[#ffc640] text-[10px] font-bold">
                                    <ShieldCheck className="w-3 h-3" />
                                    إدارة
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-500">
                                {new Date(msg.createdAt).toLocaleTimeString('ar-JO', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Admin Canned Quick Replies + Reply Input */}
                      {ticket.status !== 'CLOSED' && (
                        <div className="space-y-2.5 pt-2">
                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {ADMIN_CANNED_REPLIES.map((qr, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setReplyText(qr)}
                                className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-[#ffc640]/15 border border-white/[0.08] text-[11px] text-gray-300 hover:text-[#ffc640] whitespace-nowrap transition-colors"
                              >
                                {qr.slice(0, 38)}...
                              </button>
                            ))}
                          </div>

                          <div className="flex items-end gap-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleReply(ticket.id);
                                }
                              }}
                              placeholder="اكتب رد الإدارة هنا... (Enter للإرسال)"
                              rows={2}
                              className="flex-1 p-3 rounded-xl bg-[#11141b] border border-white/[0.1] text-white text-sm placeholder-gray-500 outline-none focus:border-[#ffc640] resize-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleReply(ticket.id)}
                              disabled={sending || !replyText.trim()}
                              className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] flex items-center justify-center shrink-0 disabled:opacity-50"
                            >
                              {sending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Send className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
