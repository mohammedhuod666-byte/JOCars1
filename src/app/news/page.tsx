'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Newspaper,
  Fuel,
  Truck,
  FileText,
  Lightbulb,
  Loader2,
  Clock,
  User,
  Trash2,
  Plus,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getExpressiveNewsImage } from '@/lib/news-image';
import type { Article } from '@/types';
import toast from 'react-hot-toast';

const categories: Record<string, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  NEWS: {
    label: 'أخبار السيارات',
    icon: <Newspaper className="w-3.5 h-3.5" />,
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  },
  FUEL_PRICES: {
    label: 'أسعار البنزين والديزل',
    icon: <Fuel className="w-3.5 h-3.5" />,
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  },
  CUSTOMS: {
    label: 'الجمارك والضرائب',
    icon: <Truck className="w-3.5 h-3.5" />,
    badgeClass: 'bg-[#ffc640]/15 text-[#ffc640] border-[#ffc640]/35',
  },
  REVIEWS: {
    label: 'مراجعات السيارات',
    icon: <FileText className="w-3.5 h-3.5" />,
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  },
  TIPS: {
    label: 'نصائح وإرشادات',
    icon: <Lightbulb className="w-3.5 h-3.5" />,
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
  },
};

export default function NewsPage() {
  const { user, isAuthenticated, token } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [deleting, setDeleting] = useState(false);
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  useEffect(() => {
    setLoading(true);
    const params = category ? `?category=${category}` : '';
    fetch(`/api/articles${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setArticles(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  const handleDeleteAll = async () => {
    if (!confirm(`حذف جميع المقالات (${articles.length})؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/articles?all=true', {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const d = await res.json();
      if (d.success) {
        toast.success(d.data?.message || 'تم حذف جميع المقالات');
        setArticles([]);
      } else {
        toast.error(d.error || 'فشل الحذف');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    }
    setDeleting(false);
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-white pb-24 lg:pb-16" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-[#111520] to-[#07090d]">
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[500px] h-[240px] bg-[#ffc640]/10 blur-[120px] pointer-events-none" />
        <div className="container-custom py-8 sm:py-10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#e3aa00] flex items-center justify-center shrink-0 shadow-lg shadow-[#ffc640]/20">
                <Newspaper className="w-6 h-6 sm:w-7 sm:h-7 text-[#080a0a]" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#ffc640] mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تغطية حصرية لسوق السيارات</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  أخبار ومستجدات السيارات
                </h1>
                <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
                  آخر أخبار السيارات، أسعار المحروقات، قرارات الجمارك، ومراجعات الخبراء في الأردن والعالم
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/admin/articles/add"
                  className="px-4 h-11 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] text-xs sm:text-sm font-bold hover:brightness-105 transition-all flex items-center gap-2 shadow-lg shadow-[#ffc640]/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة خبر</span>
                </Link>
                {articles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    disabled={deleting}
                    className="px-4 h-11 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-300 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>حذف الكل ({articles.length})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 mt-7 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                !category
                  ? 'border-[#ffc640] bg-[#ffc640] text-[#080a0a] shadow-md shadow-[#ffc640]/20'
                  : 'border-white/[0.08] bg-[#11141b] text-[#9ca3af] hover:text-white hover:border-white/20'
              }`}
            >
              الجميع
            </button>
            {Object.entries(categories).map(([key, cat]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  category === key
                    ? 'border-[#ffc640] bg-[#ffc640] text-[#080a0a] shadow-md shadow-[#ffc640]/20'
                    : 'border-white/[0.08] bg-[#11141b] text-[#9ca3af] hover:text-white hover:border-white/20'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="container-custom pt-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-8 h-8 animate-spin text-[#ffc640]" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-[#11141b]/60 border border-white/[0.06]">
            <Newspaper className="w-14 h-14 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">لا توجد أخبار أو مقالات في هذا القسم حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, i) => {
              const cat = categories[article.category] || categories.NEWS;
              const tags = (() => {
                try {
                  return JSON.parse(article.tags);
                } catch {
                  return [];
                }
              })();
              const fallbackCover = getExpressiveNewsImage(article.title, article.category);
              const imgSrc = getExpressiveNewsImage(article.title, article.category, article.image);

              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                >
                  <Link
                    href={`/news/${article.slug}`}
                    className="group flex flex-col h-full rounded-3xl bg-[#11141b]/95 border border-white/[0.08] hover:border-[#ffc640]/45 overflow-hidden transition-all duration-300 shadow-xl shadow-black/30 hover:-translate-y-1"
                  >
                    {/* Expressive Cover Image (always rendered) */}
                    <div className="relative h-52 w-full bg-[#090b10] overflow-hidden">
                      <img
                        src={imgSrc}
                        alt={article.title}
                        loading={i < 3 ? 'eager' : 'lazy'}
                        onError={(e) => {
                          const el = e.currentTarget;
                          if (el.src !== window.location.origin + fallbackCover) {
                            el.src = fallbackCover;
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#11141b] via-transparent to-black/20" />
                      <div
                        className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md ${cat.badgeClass}`}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h2 className="text-base sm:text-lg font-bold text-white mb-2.5 line-clamp-2 leading-snug group-hover:text-[#ffc640] transition-colors">
                        {article.title}
                      </h2>

                      {article.excerpt && (
                        <p className="text-xs sm:text-sm text-[#9ca3af] line-clamp-3 leading-relaxed mb-4">
                          {article.excerpt}
                        </p>
                      )}

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {tags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.06] text-[10px] font-medium text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-auto pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#9ca3af]">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#ffc640]" />
                            <span>{article.author?.name || 'فريق JO Cars'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {article.publishedAt
                                ? new Date(article.publishedAt).toLocaleDateString('ar-JO')
                                : new Date(article.createdAt).toLocaleDateString('ar-JO')}
                            </span>
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[#ffc640] font-bold text-[11px]">
                          <span>اقرأ المزيد</span>
                          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
