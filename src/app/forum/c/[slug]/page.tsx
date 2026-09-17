'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageCircle, Plus, ChevronLeft, Loader2, Pin, Lock, Clock, User,
  Eye, MessageSquare, CheckCircle2, Search, ArrowRight, Sparkles, Filter
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

interface Topic {
  id: string;
  title: string;
  slug: string;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  images: string;
  likeCount: number;
  createdAt: string;
  lastPostAt: string;
  user: { id: string; name: string; dealerName?: string | null };
  _count: { posts: number };
}

export default function CategoryTopicsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [category, setCategory] = useState<{ id: string; nameAr: string; nameEn: string; slug: string; icon?: string; color?: string; description?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'solved' | 'pinned' | 'popular'>('all');

  useEffect(() => {
    const slug = params.slug as string;
    setLoading(true);
    Promise.all([
      fetch(`/api/forum/topics?categorySlug=${slug}`).then(r => r.json()),
      fetch('/api/forum/categories').then(r => r.json()),
    ])
      .then(([topicsData, catsData]) => {
        const cats = catsData.data || [];
        const cat = cats.find((c: any) => c.slug === slug);
        if (cat) setCategory(cat);
        setTopics(topicsData.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.slug]);

  const filteredTopics = topics.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'solved') return t.isSolved;
    if (filterType === 'pinned') return t.isPinned;
    if (filterType === 'popular') return t.views > 10 || t._count.posts > 3;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-3" />
        <p className="text-slate-400 text-xs animate-pulse">جاري تحميل مواضيع القسم...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">القسم غير موجود</h2>
        <p className="text-slate-400 text-sm mb-6">قد يكون تم تغيير رابط القسم أو حذفه.</p>
        <Link href="/forum" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-colors">
          العودة لدليل المنتدى
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-b border-slate-800 py-10">
        <div className="container-custom max-w-5xl space-y-4">
          
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link href="/forum" className="hover:text-emerald-400 transition-colors">المنتدى</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-white font-bold">{category.nameAr}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 font-bold"
                  style={{ backgroundColor: category.color || '#10b981' }}
                >
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-black text-white">{category.nameAr}</h1>
                  {category.description && <p className="text-slate-400 text-xs mt-0.5">{category.description}</p>}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {isAuthenticated ? (
                <Link
                  href={`/forum/new?categoryId=${category.slug}`}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all"
                >
                  <Plus className="w-4.5 h-4.5" />
                  موضوع جديد في القسم
                </Link>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-all"
                >
                  سجل الدخول للإضافة
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="container-custom max-w-5xl pt-8 space-y-6">
        
        {/* Search & Filter Buttons Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في عناوين النقاشات..."
              className="w-full h-11 px-4 pr-10 rounded-2xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-emerald-500 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {[
              { id: 'all', label: 'كافة المواضيع' },
              { id: 'pinned', label: '📌 مثبتة' },
              { id: 'solved', label: '✅ مجابة ومحلولة' },
              { id: 'popular', label: '🔥 شائعة' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  filterType === f.id
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topics Listing */}
        {filteredTopics.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-4">
            <MessageCircle className="w-14 h-14 mx-auto text-slate-600" />
            <h3 className="text-xl font-bold text-white">لا توجد مواضيع متاحة</h3>
            <p className="text-slate-400 text-xs">كن أول من يبدأ بالاستفسار والنقاش في هذا القسم!</p>
            {isAuthenticated && (
              <Link
                href={`/forum/new?categoryId=${category.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors"
              >
                <Plus className="w-4 h-4" /> إضافة أول موضوع
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTopics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link
                  href={`/forum/t/${topic.slug}`}
                  className="group block p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:bg-slate-900 hover:border-emerald-500/40 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      
                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {topic.isPinned && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold flex items-center gap-1">
                            <Pin className="w-3 h-3" /> مثبت
                          </span>
                        )}

                        {topic.isSolved && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> مُحَلول ✅
                          </span>
                        )}

                        {topic.isLocked && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-extrabold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> مغلق
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-extrabold text-white text-base sm:text-lg group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {topic.title}
                      </h3>

                      {/* Author & Stats Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5 font-medium text-slate-300">
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                          {topic.user?.dealerName || topic.user?.name}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {formatDate(topic.createdAt)}
                        </span>

                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {topic._count?.posts || 0} ردود
                        </span>

                        <span className="flex items-center gap-1 text-slate-500">
                          <Eye className="w-3.5 h-3.5" />
                          {topic.views || 0}
                        </span>
                      </div>

                    </div>

                    <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/40 transition-colors shrink-0">
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
