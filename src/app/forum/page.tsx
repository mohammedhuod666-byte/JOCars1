'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, MessageSquare, ChevronLeft, Loader2, Clock,
  Sparkles, Plus, X, Search, ShieldCheck, CheckCircle2, TrendingUp,
  User, Eye, HelpCircle, Layers, ArrowLeft, AlertCircle, Wrench
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface ForumCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  topicsCount: number;
  postsCount: number;
  lastTopic: {
    title: string;
    slug: string;
    createdAt: string;
    user: { id: string; name: string };
  } | null;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageCircle: <MessageCircle className="w-6 h-6" />,
  MessageSquare: <MessageSquare className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  Wrench: <Wrench className="w-6 h-6" />,
  HelpCircle: <HelpCircle className="w-6 h-6" />,
};

export default function ForumPage() {
  const { user, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdminCategoryForm, setShowAdminCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    nameAr: '',
    nameEn: '',
    slug: '',
    description: '',
    icon: 'MessageCircle',
    color: '#10b981',
    sortOrder: '0',
  });
  const [savingCategory, setSavingCategory] = useState(false);

  const loadCategories = () => {
    fetch('/api/forum/categories')
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const saveCategory = async () => {
    if (!categoryForm.nameAr || !categoryForm.slug) {
      toast.error('اسم القسم والرمز المختصر مطلوبان');
      return;
    }
    setSavingCategory(true);
    try {
      const res = await fetch('/api/admin/forum-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...categoryForm, sortOrder: parseInt(categoryForm.sortOrder) || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم إنشاء القسم الجديد بنجاح');
        setShowAdminCategoryForm(false);
        setCategoryForm({ nameAr: '', nameEn: '', slug: '', description: '', icon: 'MessageCircle', color: '#10b981', sortOrder: '0' });
        loadCategories();
      } else {
        toast.error(data.error || 'فشل إنشاء القسم');
      }
    } catch {
      toast.error('حدث خطأ أثناء حفظ القسم');
    } finally {
      setSavingCategory(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.nameAr.includes(search) || (cat.description && cat.description.includes(search))
  );

  const totalTopics = categories.reduce((sum, c) => sum + (c.topicsCount || 0), 0);
  const totalPosts = categories.reduce((sum, c) => sum + (c.postsCount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-3" />
        <p className="text-slate-400 text-xs animate-pulse">جاري تحميل أقسام منتدى كارس جو...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-b border-emerald-500/10 py-12 md:py-16">
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-custom relative z-10 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>مجتمع وسوق السيارات الأردني المفتوح 🚗💬</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                منتدى <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">النقاشات والميكانيك</span>
              </h1>

              <p className="text-slate-400 text-sm leading-relaxed">
                تبادل الخبرات، استفسر عن مشاكل الهايبرد والكهرباء، واصلح أعطال سيارتك مع نخبة من المهندسين والخبراء والسائقين في الأردن.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              {isAuthenticated ? (
                <Link
                  href="/forum/new"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all"
                >
                  <Plus className="w-4.5 h-4.5" />
                  إنشاء موضوع جديد
                </Link>
              ) : (
                <Link
                  href="/login?redirect=/forum/new"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-sm transition-all"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  سجل الدخول للمشاركة
                </Link>
              )}

              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => setShowAdminCategoryForm(!showAdminCategoryForm)}
                  className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-xs hover:bg-amber-500/30 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  إدارة الأقسام
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white font-extrabold text-base">{totalTopics}</p>
                <p className="text-slate-400 text-xs">موضوع ونقاش</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white font-extrabold text-base">{totalPosts}</p>
                <p className="text-slate-400 text-xs">مشاركة وردود</p>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white font-extrabold text-base">استجابات متخصصة</p>
                <p className="text-slate-400 text-xs">حلول مجربة لمشاكل السيارات</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom max-w-5xl pt-8 space-y-8">
        
        {/* Admin Category Form Modal */}
        {showAdminCategoryForm && user?.role === 'ADMIN' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl bg-slate-900 border border-amber-500/40 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                إضافة قسم جديد في المنتدى (لوحة الأدمن)
              </h3>
              <button onClick={() => setShowAdminCategoryForm(false)} className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">الاسم بالعربية *</label>
                <input
                  type="text"
                  value={categoryForm.nameAr}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                  placeholder="مشاكل الميكانيك والأنظمة"
                  className="w-full h-11 px-4 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">الاسم بالإنجليزية *</label>
                <input
                  type="text"
                  value={categoryForm.nameEn}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                  placeholder="Mechanical Issues"
                  className="w-full h-11 px-4 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">الرابط المختصر Slug *</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="mechanic-discussions"
                  className="w-full h-11 px-4 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">الوصف</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="وصف مختصر للقسم..."
                  className="w-full h-11 px-4 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={saveCategory}
              disabled={savingCategory}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {savingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              حفظ القسم ونشره فوراً
            </button>
          </motion.div>
        )}

        {/* Search Input Bar */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في أقسام المنتدى أو استفسارات المحركات والهايبرد..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 text-white px-4 py-4 pr-12 text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        </div>

        {/* Categories List Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              أقسام المنتدى المتاحة
            </h2>
            <span className="text-slate-500 text-xs">{filteredCategories.length} قسم</span>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
              <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-white font-bold text-base">لم نجد أقسام تطابق بحثك</p>
              <button onClick={() => setSearch('')} className="text-emerald-400 text-xs font-semibold hover:underline">
                عرض جميع الأقسام
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredCategories.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/forum/c/${cat.slug}`}
                    className="group block p-5 rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:bg-slate-900 hover:border-emerald-500/40 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-emerald-500/5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/10"
                          style={{ backgroundColor: cat.color || '#10b981' }}
                        >
                          {ICON_MAP[cat.icon] || <MessageCircle className="w-6 h-6" />}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-white text-lg group-hover:text-emerald-400 transition-colors">
                              {cat.nameAr}
                            </h3>
                            <span className="text-slate-500 text-xs font-mono">({cat.nameEn})</span>
                          </div>

                          {cat.description && (
                            <p className="text-slate-400 text-xs line-clamp-1">{cat.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                            <span className="flex items-center gap-1 font-semibold text-slate-400">
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                              {cat.topicsCount || 0} موضوع
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-slate-400">
                              <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                              {cat.postsCount || 0} رد
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        {cat.lastTopic ? (
                          <div className="text-right text-xs text-slate-400 max-w-[200px]">
                            <span className="text-slate-500 text-[10px] block">آخر مشاركة:</span>
                            <span className="text-white font-semibold truncate block group-hover:text-emerald-400 transition-colors">
                              {cat.lastTopic.title}
                            </span>
                            <span className="text-slate-500 text-[10px]">بواسطة {cat.lastTopic.user?.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">لا توجد مشاركات بعد</span>
                        )}

                        <div className="w-9 h-9 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/40 transition-all shrink-0">
                          <ChevronLeft className="w-5 h-5" />
                        </div>
                      </div>

                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
