'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Car,
  Users,
  Flag,
  Building2,
  BarChart3,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Settings,
  Star,
  Bell,
  MessageCircle,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Cpu,
  TrendingDown,
  Crown,
  Tag,
  ClipboardList,
  Ticket,
  Bot,
  Database,
  Download,
  Volume2,
  Wrench,
  Store,
  MapPin,
  Search,
  Newspaper,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface DashboardStats {
  totalCars: number;
  activeCars: number;
  pendingCars: number;
  soldCars: number;
  totalUsers: number;
  totalDealers: number;
  totalViews: number;
  totalReports: number;
  revenue: number;
}

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export default function AdminPage() {
  const { user, isAuthenticated, _hydrated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCars: 0,
    activeCars: 0,
    pendingCars: 0,
    soldCars: 0,
    totalUsers: 0,
    totalDealers: 0,
    totalViews: 0,
    totalReports: 0,
    revenue: 0,
  });
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');

  // News importer state
  const [newsBusy, setNewsBusy] = useState(false);
  const [newsResult, setNewsResult] = useState<{
    message: string;
    created: { title: string; slug: string; source: string }[];
    checked: number;
    verified: number;
    seconds: number;
    sources: Record<string, { fetched: number; kept: number; ok: boolean }>;
  } | null>(null);
  const [newsToday, setNewsToday] = useState<number | null>(null);

  useEffect(() => {
    if (!_hydrated) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    const token = useAuth.getState().token;
    if (!token) return;
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {});
  }, [_hydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (!_hydrated) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') return;
    const token = useAuth.getState().token;
    if (!token) return;
    fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setNotifications(data.data.notifications);
          setUnreadCount(data.data.unreadCount);
        }
      })
      .catch(() => {});
    fetch('/api/admin/news-aggregator', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setNewsToday(data.data.todayCount ?? null);
      })
      .catch(() => {});
  }, [_hydrated, isAuthenticated, user]);

  const markAllRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${useAuth.getState().token}` },
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  if (_hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) return null;

  const statCards = [
    { icon: Car, label: 'كل السيارات', value: stats.totalCars, accent: 'text-sky-400 bg-sky-500/15 border-sky-500/25' },
    { icon: CheckCircle, label: 'إعلانات نشطة', value: stats.activeCars, accent: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25' },
    { icon: Clock, label: 'قيد المراجعة', value: stats.pendingCars, accent: 'text-[#ffc640] bg-[#ffc640]/15 border-[#ffc640]/30' },
    { icon: XCircle, label: 'تم بيعها', value: stats.soldCars, accent: 'text-rose-400 bg-rose-500/15 border-rose-500/25' },
    { icon: Users, label: 'المستخدمون', value: stats.totalUsers, accent: 'text-violet-400 bg-violet-500/15 border-violet-500/25' },
    { icon: Store, label: 'التجار والمعارض', value: stats.totalDealers, accent: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/25' },
    { icon: TrendingUp, label: 'المشاهدات', value: stats.totalViews, accent: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/25' },
    { icon: DollarSign, label: 'الإيرادات', value: `${stats.revenue} د.أ`, accent: 'text-amber-300 bg-amber-500/15 border-amber-500/30' },
  ];

  const moduleGroups = [
    {
      title: 'الأمان والمستخدمون والدعم',
      items: [
        { href: '/admin/tickets', label: 'تذاكر الدعم الفني', icon: Ticket, desc: 'إدارة والرد الفوري على التذاكر' },
        { href: '/admin/users', label: 'المستخدمون', icon: Users, desc: 'إدارة الحسابات والتجار والحظر' },
        { href: '/admin/sentinel', label: 'الحارس الأمني', icon: ShieldCheck, desc: 'المراقبة التلقائية والحظر الذكي' },
        { href: '/admin/traders-approval', label: 'اعتماد التجار', icon: ShieldCheck, desc: 'مراجعة طلبات اعتماد المعارض' },
        { href: '/admin/reports', label: 'البلاغات العامة', icon: Flag, desc: 'مراجعة البلاغات المقدمة' },
        { href: '/admin/audit-logs', label: 'سجل النشاطات', icon: ClipboardList, desc: 'تتبع جميع الإجراءات الأمنية' },
      ],
    },
    {
      title: 'السوق والمركبات والمناطق',
      items: [
        { href: '/admin/cars', label: 'إدارة السيارات', icon: Car, desc: 'مراجعة وتثبيت وإعلان المقدمة' },
        { href: '/admin/premium-requests', label: 'الطلبات المميزة', icon: Crown, desc: 'طلبات تمييز الإعلانات' },
        { href: '/admin/workshops/review', label: 'مراجعة الورش', icon: Wrench, desc: 'اعتماد ورش الصيانة الجديدة' },
        { href: '/admin/workshops', label: 'إدارة الورش', icon: Settings, desc: 'توثيق وإدارة جميع الورش' },
        { href: '/admin/workshops/ads', label: 'إعلانات الورش', icon: Store, desc: 'مراجعة عروض وإعلانات الورش' },
        { href: '/admin/parts', label: 'قطع الغيار', icon: Cpu, desc: 'إدارة إعلانات قطع الغيار' },
        { href: '/admin/brands', label: 'الشركات', icon: Building2, desc: 'إدارة شركات السيارات' },
        { href: '/admin/models', label: 'الموديلات', icon: Settings, desc: 'إدارة موديلات السيارات' },
        { href: '/admin/provinces', label: 'المحافظات', icon: MapPin, desc: 'إدارة محافظات المملكة' },
        { href: '/admin/cities', label: 'المدن والقرى', icon: MapPin, desc: 'إدارة المناطق والقرى' },
        { href: '/admin/tags', label: 'وسوم السيارات', icon: Tag, desc: 'إدارة الوسوم والتصنيفات' },
      ],
    },
    {
      title: 'الذكاء الاصطناعي والمالية',
      items: [
        { href: '/admin/valuations', label: 'محرك التقييم الذكي', icon: BarChart3, desc: 'تقييمات القيمة السوقية والأداء' },
        { href: '/admin/fair-price', label: 'مؤشر السعر العادل', icon: TrendingDown, desc: 'إدارة مؤشر عدالة السعر' },
        { href: '/admin/content-tools', label: 'المحتوى الذكي', icon: Bot, desc: 'أدوات الفحص وكشف التكرار' },
        { href: '/admin/advanced-stats', label: 'إحصائيات متقدمة', icon: BarChart3, desc: 'رسوم بيانية وتحليلات السوق' },
        { href: '/admin/seller-reports', label: 'تقرير البائعين', icon: TrendingUp, desc: 'أداء البائعين والتقييمات' },
        { href: '/admin/plans', label: 'الباقات', icon: Star, desc: 'باقات الإعلانات المميزة' },
        { href: '/admin/subscriptions', label: 'الاشتراكات', icon: CreditCard, desc: 'إدارة اشتراكات الأعضاء' },
        { href: '/admin/badges', label: 'الشارات', icon: Award, desc: 'نظام شارات المستخدمين' },
      ],
    },
    {
      title: 'المحتوى والنظام',
      items: [
        { href: '/admin/articles', label: 'المقالات والأخبار', icon: Newspaper, desc: 'إدارة الأخبار وحذفها ونشرها' },
        { href: '/admin/forum-categories', label: 'أقسام المنتدى', icon: MessageCircle, desc: 'إدارة أقسام المنتدى' },
        { href: '/admin/forum-reports', label: 'بلاغات المنتدى', icon: Flag, desc: 'إدارة بلاغات المنتدى' },
        { href: '/admin/car-comment-reports', label: 'بلاغات التعليقات', icon: MessageCircle, desc: 'بلاغات تعليقات السيارات' },
        { href: '/admin/sounds', label: 'بلاغات الصوت', icon: Volume2, desc: 'مراجعة تسجيلات الصوت' },
        { href: '/admin/messages', label: 'المحادثات', icon: MessageCircle, desc: 'مراقبة رسائل المنصة' },
        { href: '/admin/backups', label: 'النسخ الاحتياطية', icon: Database, desc: 'تصدير واستيراد قاعدة البيانات' },
        { href: '/admin/settings', label: 'إعدادات الموقع', icon: Settings, desc: 'الإعدادات العامة للمنصة' },
      ],
    },
  ];

  const q = moduleSearch.trim().toLowerCase();

  return (
    <div className="min-h-screen bg-[#07090d] text-white pb-24 lg:pb-16" dir="rtl">
      {/* Top Hero Header */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-[#111520] to-[#07090d]">
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[520px] h-[240px] bg-[#ffc640]/10 blur-[130px] pointer-events-none" />
        <div className="container-custom py-7 sm:py-9 relative z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#e3aa00] flex items-center justify-center shadow-lg shadow-[#ffc640]/20 shrink-0">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#080a0a]" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#ffc640]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>مركز قيادة المنصة</span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-white">لوحة تحكم الإدارة</h1>
                <p className="text-xs text-[#9ca3af] mt-0.5">مرحباً {user?.name} — إدارة شاملة لـ JO Cars</p>
              </div>
            </div>

            {/* Admin Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen) markAllRead();
                }}
                className="relative w-11 h-11 rounded-xl bg-[#11141b] border border-white/[0.1] hover:border-[#ffc640]/50 flex items-center justify-center transition-colors"
                aria-label="إشعارات الإدارة"
              >
                <Bell className="w-5 h-5 text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl bg-[#11141b] border border-white/[0.12] shadow-2xl z-50 overflow-hidden">
                  <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between">
                    <p className="text-sm font-bold text-white">إشعارات الإدارة</p>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[11px] text-[#ffc640] font-semibold">
                        تحديد الكل مقروء
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-xs">لا توجد إشعارات</div>
                    ) : (
                      notifications.slice(0, 20).map((n) => (
                        <Link
                          key={n.id}
                          href={n.link || '/admin'}
                          onClick={() => setNotifOpen(false)}
                          className={`block p-3 hover:bg-white/[0.04] transition-all ${!n.read ? 'bg-[#ffc640]/[0.05]' : ''}`}
                        >
                          <p className="text-xs font-bold text-white">{n.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 8 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-4 rounded-2xl bg-[#11141b]/90 border border-white/[0.08] hover:border-white/[0.16] transition-colors"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.accent}`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#9ca3af]">{card.label}</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-white tabular-nums">
                  {card.value.toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-custom pt-7 space-y-8">
        {/* News Aggregator */}
        <div className="rounded-3xl bg-[#11141b]/95 border border-white/[0.08] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-white">استيراد أخبار السيارات التلقائي</h2>
                <p className="text-xs text-[#9ca3af]">
                  جلب الأخبار من 10 مصادر موثوقة مع صورة معبّرة وتلخيص ذكي
                </p>
                {newsToday !== null && (
                  <p className="text-[11px] text-emerald-400 font-bold mt-1">مستورد اليوم: {newsToday} خبر</p>
                )}
              </div>
            </div>
            <button
              type="button"
              disabled={newsBusy}
              onClick={async () => {
                setNewsBusy(true);
                setNewsResult(null);
                try {
                  const res = await fetch('/api/admin/news-aggregator', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${useAuth.getState().token}` },
                  });
                  const data = await res.json();
                  if (data.success) {
                    setNewsResult(data.data);
                    try {
                      const g = await fetch('/api/admin/news-aggregator', {
                        headers: { Authorization: `Bearer ${useAuth.getState().token}` },
                      }).then((r) => r.json());
                      if (g.success) setNewsToday(g.data.todayCount ?? null);
                    } catch {}
                  } else {
                    setNewsResult({ message: 'خطأ: ' + data.error, created: [], checked: 0, verified: 0, seconds: 0, sources: {} });
                  }
                } catch {
                  setNewsResult({ message: 'فشل الاتصال', created: [], checked: 0, verified: 0, seconds: 0, sources: {} });
                }
                setNewsBusy(false);
              }}
              className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold disabled:opacity-60 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Download className={`w-4 h-4 ${newsBusy ? 'animate-bounce' : ''}`} />
              <span>{newsBusy ? 'جاري الاستيراد...' : 'استيراد الأخبار الآن'}</span>
            </button>
          </div>

          {newsResult && (
            <div className="mt-4 p-4 rounded-2xl bg-[#090b10] border border-white/[0.08] space-y-3">
              <p className="text-xs sm:text-sm font-bold text-white">{newsResult.message}</p>
              {newsResult.created.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {newsResult.created.map((c) => (
                    <a
                      key={c.slug}
                      href={`/news/${c.slug}`}
                      target="_blank"
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#11141b] hover:bg-white/[0.05] text-xs"
                    >
                      <span className="font-bold text-gray-200 truncate">{c.title}</span>
                      <span className="text-[10px] text-[#ffc640] shrink-0">{c.source}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Admin Modules */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-black text-white">أقسام الإدارة</h2>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={moduleSearch}
              onChange={(e) => setModuleSearch(e.target.value)}
              placeholder="ابحث عن قسم في لوحة التحكم..."
              className="w-full h-11 pr-10 pl-4 rounded-xl bg-[#11141b] border border-white/[0.08] text-white text-xs sm:text-sm placeholder-gray-500 outline-none focus:border-[#ffc640]/60"
            />
          </div>
        </div>

        {/* Categorized Module Grids */}
        <div className="space-y-8">
          {moduleGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) =>
                !q ||
                item.label.toLowerCase().includes(q) ||
                item.desc.toLowerCase().includes(q)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-[#ffc640]" />
                  <h3 className="text-sm sm:text-base font-bold text-gray-200">{group.title}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group p-4 rounded-2xl bg-[#11141b]/95 border border-white/[0.07] hover:border-[#ffc640]/45 hover:-translate-y-0.5 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-[#ffc640]/10 border border-[#ffc640]/20 flex items-center justify-center shrink-0 group-hover:bg-[#ffc640]/20 transition-colors">
                            <Icon className="w-5 h-5 text-[#ffc640]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-white group-hover:text-[#ffc640] transition-colors truncate">
                              {item.label}
                            </p>
                            <p className="text-[11px] text-[#9ca3af] truncate mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-gray-500 group-hover:text-[#ffc640] group-hover:-translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
