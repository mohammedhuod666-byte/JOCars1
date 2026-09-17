'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Car, Users, FileText, Flag, Building2, BarChart3, TrendingUp,
  DollarSign, Activity, ShieldCheck, Settings, Star, Bell, MessageCircle,
  ShoppingBag, CreditCard, AlertTriangle, CheckCircle, XCircle, Clock, Award, Cpu, TrendingDown,
  Crown, Tag, ClipboardList, Ticket, Bot, Database, Download, Volume2, Wrench, Store, MapPin,
} from 'lucide-react';

interface DashboardStats {
  totalCars: number; activeCars: number; pendingCars: number; soldCars: number;
  totalUsers: number; totalDealers: number; totalViews: number; totalReports: number;
  revenue: number;
}

interface AdminNotification {
  id: string; type: string; title: string; message: string; read: boolean; link?: string; createdAt: string;
}

export default function AdminPage() {
  const { user, isAuthenticated, _hydrated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCars: 0, activeCars: 0, pendingCars: 0, soldCars: 0,
    totalUsers: 0, totalDealers: 0, totalViews: 0, totalReports: 0, revenue: 0,
  });
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  // News importer state
  const [newsBusy, setNewsBusy] = useState(false);
  const [newsResult, setNewsResult] = useState<{
    message: string; created: { title: string; slug: string; source: string }[];
    checked: number; verified: number; seconds: number;
    sources: Record<string, { fetched: number; kept: number; ok: boolean }>;
  } | null>(null);
  const [newsToday, setNewsToday] = useState<number | null>(null);

  useEffect(() => {
    if (!_hydrated) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    const token = useAuth.getState().token;
    if (!token) return;
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.success) setStats(data.data); })
      .catch(() => {});
  }, [_hydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (!_hydrated) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') return;
    const token = useAuth.getState().token;
    if (!token) return;
    fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.success) { setNotifications(data.data.notifications); setUnreadCount(data.data.unreadCount); } })
      .catch(() => {});
    fetch('/api/admin/news-aggregator', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.success) setNewsToday(data.data.todayCount ?? null); })
      .catch(() => {});
  }, [_hydrated, isAuthenticated, user]);

  const markAllRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${useAuth.getState().token}` },
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  if (_hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) return null;

  const statCards = [
    { icon: Car, label: 'كل السيارات', value: stats.totalCars, color: 'from-blue-500 to-blue-600' },
    { icon: CheckCircle, label: 'نشطة', value: stats.activeCars, color: 'from-green-500 to-emerald-600' },
    { icon: Clock, label: 'قيد المراجعة', value: stats.pendingCars, color: 'from-amber-500 to-orange-600' },
    { icon: XCircle, label: 'مباعة', value: stats.soldCars, color: 'from-red-500 to-rose-600' },
    { icon: Users, label: 'المستخدمين', value: stats.totalUsers, color: 'from-purple-500 to-violet-600' },
    { icon: Store, label: 'التجار', value: stats.totalDealers, color: 'from-indigo-500 to-blue-600' },
    { icon: TrendingUp, label: 'المشاهدات', value: stats.totalViews, color: 'from-cyan-500 to-teal-600' },
    { icon: DollarSign, label: 'الإيرادات', value: `${stats.revenue} د.أ`, color: 'from-gold-500 to-amber-600' },
  ];

  const menuItems = [
    { href: '/admin/users', label: 'المستخدمين', icon: Users, desc: 'إدارة المستخدمين والتجار' },
    { href: '/admin/traders-approval', label: 'اعتماد التجار', icon: ShieldCheck, desc: 'مراجعة وقبول أو رفض طلبات اعتماد التجار' },
    { href: '/admin/cars', label: 'السيارات', icon: Car, desc: 'إدارة جميع السيارات' },
    { href: '/admin/reports', label: 'البلاغات', icon: Flag, desc: 'البلاغات المقدمة' },
    { href: '/admin/brands', label: 'الشركات', icon: Building2, desc: 'إدارة شركات السيارات' },
    { href: '/admin/models', label: 'الموديلات', icon: Settings, desc: 'إدارة الموديلات' },
    { href: '/admin/cities', label: 'المدن', icon: MapPin, desc: 'إدارة المدن والمناطق' },
    { href: '/admin/messages', label: 'الرسائل', icon: MessageCircle, desc: 'مشاهدة محادثات المستخدمين' },
    { href: '/admin/plans', label: 'الباقات', icon: Star, desc: 'باقات الإعلانات المميزة' },
    { href: '/admin/subscriptions', label: 'الاشتراكات', icon: CreditCard, desc: 'إدارة الاشتراكات' },
    { href: '/admin/badges', label: 'الشارات', icon: Award, desc: 'نظام شارات المستخدمين' },
    { href: '/admin/parts', label: 'قطع الغيار', icon: Cpu, desc: 'إدارة قطع الغيار' },
    { href: '/admin/forum-categories', label: 'أقسام المنتدى', icon: MessageCircle, desc: 'إدارة أقسام المنتدى' },
    { href: '/admin/forum-reports', label: 'بلاغات المنتدى', icon: Flag, desc: 'إدارة بلاغات المنتدى' },
    { href: '/admin/provinces', label: 'المحافظات', icon: MapPin, desc: 'إدارة المحافظات والمناطق' },
    { href: '/admin/car-comment-reports', label: 'بلاغات التعليقات', icon: MessageCircle, desc: 'إدارة بلاغات تعليقات السيارات' },
    { href: '/admin/sounds', label: 'بلاغات الصوت', icon: Volume2, desc: 'إدارة بلاغات تسجيلات الصوت وحظر المستخدمين' },
    { href: '/admin/workshops/review', label: 'مراجعة الورش', icon: Wrench, desc: 'مراجعة وقبول أو رفض ورش السيارات' },
    { href: '/admin/workshops/ads', label: 'إعلانات الورش', icon: Store, desc: 'مراجعة إعلانات الورش والقبول أو الرفض' },
    { href: '/admin/workshops', label: 'إدارة الورش', icon: Settings, desc: 'توثيق وحظر وإيقاف الورش' },
    { href: '/admin/advanced-stats', label: 'إحصائيات متقدمة', icon: BarChart3, desc: 'رسوم بيانية وتحليلات السوق' },
    { href: '/admin/audit-logs', label: 'سجل النشاطات', icon: ClipboardList, desc: 'تتبع جميع التغييرات والإجراءات' },
    { href: '/admin/content-tools', label: 'المحتوى الذكي', icon: Bot, desc: 'منشئ أوصاف وكشف الصور المكررة' },
    { href: '/admin/tickets', label: 'التذاكر', icon: Ticket, desc: 'إدارة تذاكر الدعم الفني' },
    { href: '/admin/seller-reports', label: 'تقرير البائعين', icon: TrendingUp, desc: 'أداء البائعين والتقييمات' },
    { href: '/admin/tags', label: 'وسوم السيارات', icon: Tag, desc: 'إدارة الوسوم والتصنيفات' },
    { href: '/admin/premium-requests', label: 'الطلبات المميزة', icon: Crown, desc: 'طلبات تمييز وتثبيت الإعلانات' },
    { href: '/admin/fair-price', label: 'مؤشر السعر', icon: TrendingDown, desc: 'إدارة مؤشر عدالة السعر' },
    { href: '/admin/backups', label: 'النسخ الاحتياطية', icon: Database, desc: 'تصدير واستيراد قاعدة البيانات' },
    { href: '/admin/settings', label: 'الإعدادات', icon: Settings, desc: 'إعدادات الموقع' },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
              <p className="text-gray-500 text-sm">مرحباً {user?.name}، مرحباً بك في لوحة الإدارة</p>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead(); }}
              className="relative p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 top-full mt-2 w-80 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl shadow-black/10 z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">الإشعارات</p>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-blue-500 hover:text-blue-600 font-medium">
                      تحديد الكل مقروء
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">لا توجد إشعارات</div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <Link key={n.id} href={n.link || '/admin'}
                        onClick={() => setNotifOpen(false)}
                        className={`block p-3 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all ${!n.read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}>
                        <div className="flex items-start gap-2.5">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString('ar-JO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => (
            <motion.div key={card.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-400">{card.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>

        {/* News Aggregator */}
        <div className="card p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">استيراد أخبار السيارات 🚗</h3>
                <p className="text-xs text-gray-500">أخبار سيارات فقط (وقود • جمارك • كهرباء • سوق) من 10 مصادر — مع تحقق مزدوج وملخص ذكي</p>
                {newsToday !== null && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">مستورد اليوم: {newsToday} خبر</p>
                )}
              </div>
            </div>
            <button
              disabled={newsBusy}
              onClick={async () => {
                setNewsBusy(true); setNewsResult(null);
                try {
                  const res = await fetch('/api/admin/news-aggregator', { method: 'POST', headers: { Authorization: `Bearer ${useAuth.getState().token}` } });
                  const data = await res.json();
                  if (data.success) {
                    setNewsResult(data.data);
                    try {
                      const g = await fetch('/api/admin/news-aggregator', { headers: { Authorization: `Bearer ${useAuth.getState().token}` } }).then(r => r.json());
                      if (g.success) setNewsToday(g.data.todayCount ?? null);
                    } catch {}
                  } else {
                    setNewsResult({ message: 'خطأ: ' + data.error, created: [], checked: 0, verified: 0, seconds: 0, sources: {} });
                  }
                } catch { setNewsResult({ message: 'فشل الاتصال', created: [], checked: 0, verified: 0, seconds: 0, sources: {} }); }
                setNewsBusy(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-60 transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 whitespace-nowrap">
              <Download className={`w-4 h-4 ${newsBusy ? 'animate-bounce' : ''}`} />
              {newsBusy ? 'جاري الاستيراد... (نفحص المصادر)' : 'استيراد الآن'}
            </button>
          </div>

          {newsBusy && (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-gradient-to-l from-green-500 to-emerald-400 animate-pulse" style={{ animation: 'newsbar 1.2s ease-in-out infinite' }} />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">نجلب من أخبار جوجل + عمون + خبرني + رؤيا + الغد... ثم نتحقق من كل خبر ونلخصه بالذكاء الاصطناعي</p>
            </div>
          )}

          {newsResult && (
            <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{newsResult.message}</p>
              {Object.keys(newsResult.sources || {}).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(newsResult.sources).map(([name, s]) => (
                    <span key={name} title={`جُلب ${s.fetched} • قُبِل ${s.kept}`}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${s.ok ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200'}`}>
                      {s.ok ? '●' : '○'} {name} ({s.kept}/{s.fetched})
                    </span>
                  ))}
                </div>
              )}
              {newsResult.created.length > 0 && (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pl-1">
                  {newsResult.created.map(c => (
                    <a key={c.slug} href={`/news/${c.slug}`} target="_blank"
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 hover:shadow transition-shadow text-xs">
                      <span className="font-bold text-gray-800 dark:text-gray-200 truncate">{c.title}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{c.source}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">إدارة سريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.href}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={item.href}
                  className="card p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                      <Icon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
