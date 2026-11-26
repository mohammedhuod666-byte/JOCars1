'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Newspaper,
  Fuel,
  Truck,
  FileText,
  Lightbulb,
  Loader2,
  User,
  ChevronRight,
  Share2,
  Calendar,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getExpressiveNewsImage } from '@/lib/news-image';
import type { Article } from '@/types';
import toast from 'react-hot-toast';

const categories: Record<string, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  NEWS: {
    label: 'أخبار السيارات',
    icon: <Newspaper className="w-4 h-4" />,
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  },
  FUEL_PRICES: {
    label: 'أسعار البنزين والديزل',
    icon: <Fuel className="w-4 h-4" />,
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  },
  CUSTOMS: {
    label: 'الجمارك والضرائب',
    icon: <Truck className="w-4 h-4" />,
    badgeClass: 'bg-[#ffc640]/15 text-[#ffc640] border-[#ffc640]/35',
  },
  REVIEWS: {
    label: 'مراجعات السيارات',
    icon: <FileText className="w-4 h-4" />,
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  },
  TIPS: {
    label: 'نصائح وإرشادات',
    icon: <Lightbulb className="w-4 h-4" />,
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
  },
};

// Highlights key automotive terms, Jordan market keywords, numbers, prices, and **bold** spans in yellow
const HIGHLIGHT_PATTERN =
  /(\*\*[^*]+\*\*|\b\d[\d.,]*%?\b(?:\s*(?:د\.أ|دينار|دولار|كم|كيلومتر|حصان|كيلوواط|مليون|ألف))?|الخلاصة الذكية|الأردن|عمّان|عمان|الزرقاء|إربد|العقبة|المنطقة الحرة|الجمارك|الضرائب|الترخيص|كهربائية|السيارات الكهربائية|هايبرد|بنزين|ديزل|محرك|بطارية|شاصي|فحص|أسعار|ارتفاع|انخفاض|تخفيض|إطلاق|تويوتا|هيونداي|كيا|مرسيدس|بي إم دبليو|بي واي دي|تيسلا|BYD|Tesla|EV|SUV)/gi;

function renderHighlightedText(text: string): React.ReactNode {
  // Handle markdown links like [Source](url) cleanly
  const cleaned = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '$1 ($2)');
  const parts = cleaned.split(HIGHLIGHT_PATTERN);

  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <mark
          key={idx}
          className="bg-[#ffc640]/15 text-[#ffc640] font-bold px-1.5 py-0.5 rounded-md border border-[#ffc640]/25"
        >
          {part.slice(2, -2)}
        </mark>
      );
    }
    if (HIGHLIGHT_PATTERN.test(part)) {
      HIGHLIGHT_PATTERN.lastIndex = 0;
      return (
        <span
          key={idx}
          className="text-[#ffc640] font-bold bg-[#ffc640]/[0.08] px-1 rounded"
        >
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  useEffect(() => {
    fetch(`/api/articles/${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setArticle(data.data);
        else router.push('/news');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.slug, router]);

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: article?.title || '', url: window.location.href });
    else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ الرابط');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ffc640]" />
      </div>
    );
  }
  if (!article) return null;

  const cat = categories[article.category] || categories.NEWS;
  const fallbackCover = getExpressiveNewsImage(article.title, article.category);
  const imgSrc = getExpressiveNewsImage(article.title, article.category, article.image);
  const wordCount = article.content.split(/\s+/).filter(Boolean).length;
  const readingMins = Math.max(1, Math.ceil(wordCount / 180));

  const lines = article.content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '---');

  return (
    <div className="min-h-screen bg-[#07090d] text-white pb-24 lg:pb-16" dir="rtl">
      <div className="container-custom py-6 sm:py-10 max-w-4xl">
        {/* Top Back Link */}
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#9ca3af] hover:text-[#ffc640] transition-colors mb-6"
        >
          <ChevronRight className="w-4 h-4" />
          <span>العودة إلى أخبار السيارات</span>
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-[#11141b]/95 border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/50"
        >
          {/* Cover Image */}
          <div className="relative h-60 sm:h-96 w-full bg-[#090b10] overflow-hidden">
            <img
              src={imgSrc}
              alt={article.title}
              onError={(e) => {
                const el = e.currentTarget;
                if (el.src !== window.location.origin + fallbackCover) {
                  el.src = fallbackCover;
                }
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#11141b] via-[#11141b]/20 to-transparent" />
          </div>

          <div className="p-5 sm:p-9 -mt-12 relative z-10">
            {/* Meta Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md ${cat.badgeClass}`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs text-gray-300">
                <Calendar className="w-3.5 h-3.5 text-[#ffc640]" />
                <span>
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString('ar-JO')
                    : new Date(article.createdAt).toLocaleDateString('ar-JO')}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs text-gray-300">
                <Clock className="w-3.5 h-3.5 text-[#ffc640]" />
                <span>وقت القراءة: {readingMins} دقيقة</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-snug mb-6">
              {renderHighlightedText(article.title)}
            </h1>

            {/* Author & Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-7 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#d97706] flex items-center justify-center text-[#080a0a] text-sm font-black shadow-md">
                  {article.author?.name?.charAt(0) || <User className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{article.author?.name || 'فريق JO Cars'}</p>
                  <p className="text-xs text-[#9ca3af]">محرر أخبار السيارات</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('حذف هذا الخبر؟')) return;
                      try {
                        const res = await fetch(`/api/articles/${article.slug}`, {
                          method: 'DELETE',
                          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                        });
                        const d = await res.json();
                        if (d.success) {
                          toast.success('تم الحذف');
                          router.push('/news');
                        } else {
                          toast.error(d.error || 'فشل');
                        }
                      } catch {
                        toast.error('حدث خطأ');
                      }
                    }}
                    className="px-3.5 h-10 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-4 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-[#ffc640]" />
                  <span>مشاركة الخبر</span>
                </button>
              </div>
            </div>

            {/* Excerpt Summary Callout (if present) */}
            {article.excerpt && (
              <div className="mb-7 p-4 sm:p-5 rounded-2xl bg-[#ffc640]/[0.07] border border-[#ffc640]/25">
                <div className="flex items-center gap-2 text-xs font-bold text-[#ffc640] mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>ملخص الخبر</span>
                </div>
                <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                  {renderHighlightedText(article.excerpt)}
                </p>
              </div>
            )}

            {/* Structured Readable Body with Yellow Highlights */}
            <div className="space-y-4">
              {lines.map((line, i) => {
                if (!line) return null;

                if (line.startsWith('## ')) {
                  return (
                    <h2
                      key={i}
                      className="text-xl sm:text-2xl font-black text-white pt-4 pb-1 border-b border-white/[0.06]"
                    >
                      {renderHighlightedText(line.replace(/^##\s+/, ''))}
                    </h2>
                  );
                }

                if (line.startsWith('# ')) {
                  return (
                    <h2 key={i} className="text-2xl sm:text-3xl font-black text-[#ffc640] pt-4">
                      {line.replace(/^#\s+/, '')}
                    </h2>
                  );
                }

                if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#ffc640] mt-2.5 shrink-0" />
                      <p className="text-sm sm:text-base text-gray-200 leading-[1.9]">
                        {renderHighlightedText(line.replace(/^[-*•]\s+/, ''))}
                      </p>
                    </div>
                  );
                }

                if (line.startsWith('*المصدر:') || line.startsWith('المصدر:')) {
                  return (
                    <div
                      key={i}
                      className="mt-6 pt-4 border-t border-white/[0.08] text-xs text-[#9ca3af]"
                    >
                      {line.replace(/\*/g, '')}
                    </div>
                  );
                }

                return (
                  <p
                    key={i}
                    className="text-[15px] sm:text-[17px] text-[#e5e7eb] leading-[2] tracking-normal"
                  >
                    {renderHighlightedText(line)}
                  </p>
                );
              })}
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
