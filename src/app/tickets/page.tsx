'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Ticket,
  Plus,
  MessageCircle,
  Clock,
  Loader2,
  ChevronLeft,
  Search,
  Bot,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface TicketItem {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; name: string } | null;
  _count: { messages: number };
}

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

const priorityLabels: Record<string, string> = {
  URGENT: 'عاجل',
  HIGH: 'مهم',
  NORMAL: 'عادي',
  LOW: 'منخفض',
};

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-500/15 text-red-300 border-red-500/30',
  HIGH: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  NORMAL: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  LOW: 'bg-white/[0.05] text-gray-400 border-white/[0.08]',
};

const categoryLabels: Record<string, string> = {
  GENERAL: 'عام',
  TECHNICAL: 'تقني',
  ACCOUNT: 'حساب',
  PAYMENT: 'دفع',
  REPORT: 'بلاغ',
};

export default function TicketsPage() {
  const { isAuthenticated, _hydrated, token } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadTickets = useCallback(() => {
    if (!isAuthenticated) return;
    fetch('/api/tickets', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTickets(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push('/auth/login?redirect=/tickets');
      return;
    }
    loadTickets();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') loadTickets();
    }, 8000);
    return () => clearInterval(timer);
  }, [_hydrated, isAuthenticated, router, loadTickets]);

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const progressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const filtered = tickets.filter((t) => {
    if (filter !== 'ALL' && t.status !== filter) return false;
    if (search.trim()) {
      return t.subject.toLowerCase().includes(search.trim().toLowerCase());
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#07090d] text-white pb-24 lg:pb-16" dir="rtl">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-[#111520] to-[#07090d]">
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[460px] h-[240px] bg-[#ffc640]/10 blur-[120px] pointer-events-none" />
        <div className="container-custom max-w-5xl py-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#e3aa00] flex items-center justify-center shrink-0 shadow-lg shadow-[#ffc640]/20">
                <Ticket className="w-6 h-6 sm:w-7 sm:h-7 text-[#080a0a]" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#ffc640] mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>مركز الدعم الفني المباشر</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">تذاكر الدعم والمساعدة</h1>
                <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
                  تواصل مباشر وفوري مع فريق JO Cars لحل أي مشكلة أو استفسار
                </p>
              </div>
            </div>

            <Link
              href="/tickets/new"
              className="h-12 px-5 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] text-sm font-bold hover:brightness-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#ffc640]/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>تذكرة جديدة</span>
            </Link>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="p-3.5 rounded-2xl bg-[#11141b]/85 border border-white/[0.08]">
              <div className="flex items-center justify-between text-xs text-[#9ca3af] mb-1">
                <span>مفتوحة</span>
                <AlertCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{openCount}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#11141b]/85 border border-white/[0.08]">
              <div className="flex items-center justify-between text-xs text-[#9ca3af] mb-1">
                <span>قيد المعالجة</span>
                <Clock className="w-4 h-4 text-[#ffc640]" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{progressCount}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#11141b]/85 border border-white/[0.08]">
              <div className="flex items-center justify-between text-xs text-[#9ca3af] mb-1">
                <span>تم الحل</span>
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{resolvedCount}</p>
            </div>
          </div>

          {/* Quick Help Alternatives */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <Link
              href="/ai"
              className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] flex items-center gap-3 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">المساعد الذكي الفوري</p>
                <p className="text-[11px] text-[#9ca3af] truncate">إجابات فورية حول الأسعار والجمارك والموقع</p>
              </div>
            </Link>
            <Link
              href="/faq"
              className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] flex items-center gap-3 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-[#ffc640]/15 text-[#ffc640] flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">الأسئلة الشائعة</p>
                <p className="text-[11px] text-[#9ca3af] truncate">حلول سريعة لأكثر الاستفسارات شيوعاً</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters & List */}
      <div className="container-custom max-w-5xl pt-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في تذاكرك..."
              className="w-full h-11 pr-10 pl-4 rounded-xl bg-[#11141b] border border-white/[0.08] text-white text-sm placeholder-gray-500 outline-none focus:border-[#ffc640]/60"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'OPEN', label: 'مفتوحة' },
              { id: 'IN_PROGRESS', label: 'قيد المعالجة' },
              { id: 'RESOLVED', label: 'تم الحل' },
              { id: 'CLOSED', label: 'مغلقة' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilter(s.id)}
                className={`px-3 h-9 sm:h-11 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
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

        {loading ? (
          <div className="flex items-center justify-center min-h-[35vh]">
            <Loader2 className="w-8 h-8 animate-spin text-[#ffc640]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-3xl bg-[#11141b]/70 border border-white/[0.06]">
            <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-4">لا توجد تذاكر مطابقة حالياً</p>
            <Link
              href="/tickets/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ffc640] text-[#080a0a] text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء تذكرة جديدة</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="group block p-4 sm:p-5 rounded-2xl bg-[#11141b]/95 border border-white/[0.08] hover:border-[#ffc640]/45 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          statusColors[ticket.status] || ''
                        }`}
                      >
                        {statusLabels[ticket.status] || ticket.status}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          priorityColors[ticket.priority] || ''
                        }`}
                      >
                        {priorityLabels[ticket.priority] || ticket.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-[11px] text-gray-400">
                        {categoryLabels[ticket.category] || ticket.category}
                      </span>
                    </div>
                    <h2 className="font-bold text-sm sm:text-base text-white group-hover:text-[#ffc640] transition-colors truncate">
                      {ticket.subject}
                    </h2>
                    {ticket.assignee && (
                      <p className="text-[11px] text-emerald-400 mt-1">
                        المسؤول: {ticket.assignee.name}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 text-xs text-gray-400 shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04]">
                      <MessageCircle className="w-3.5 h-3.5 text-[#ffc640]" />
                      <span className="font-bold text-white">{ticket._count.messages}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString('ar-JO')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
