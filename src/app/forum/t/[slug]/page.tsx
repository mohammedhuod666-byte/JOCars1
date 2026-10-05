'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SafeAvatar } from '@/components/ui/SafeAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, ChevronLeft, Loader2, Lock, Eye, Clock, User, Send, Trash2,
  ShieldCheck, Flag, Pin, CheckCircle2, ThumbsUp, Quote, CornerDownRight,
  Smile, Camera, Image as ImageIcon, X, AlertTriangle, EyeOff, Sparkles, Share2, Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import toast from 'react-hot-toast';

interface ForumPost {
  id: string;
  userId: string;
  content: string;
  images?: string | null;
  replyToId?: string | null;
  replyToUser?: string | null;
  replyToContent?: string | null;
  likeCount: number;
  likedByMe?: boolean;
  isAnswer: boolean;
  isHidden: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string | null;
    dealerName?: string | null;
    rating: number;
    ratingCount: number;
    role: string;
    badges?: string | string[];
  };
}

interface ForumTopic {
  id: string;
  userId: string;
  title: string;
  content: string;
  slug: string;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  images?: string | null;
  likeCount: number;
  createdAt: string;
  user: { id: string; name: string; image?: string | null; dealerName?: string | null; role?: string };
  category: { id: string; nameAr: string; nameEn: string; slug: string; icon?: string; color?: string };
  posts: ForumPost[];
}

const EMOJI_LIST = ['👍', '❤️', '🔥', '👏', '😂', '🚗', '🔧', '⚡', '💡', '🛠️', '✅', '🙏'];

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuth();

  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Reply Form State
  const [replyText, setReplyText] = useState('');
  const [quoteTarget, setQuoteTarget] = useState<{ id: string; name: string; content: string } | null>(null);
  const [replyImageFiles, setReplyImageFiles] = useState<File[]>([]);
  const [replyImagePreviews, setReplyImagePreviews] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPostId, setReportPostId] = useState('');
  const [reportReason, setReportReason] = useState('محتوى غير لائق');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadTopic = () => {
    const slug = params.slug as string;
    const viewed = JSON.parse(localStorage.getItem('viewedTopics') || '[]');
    const alreadyViewed = viewed.includes(slug);
    if (!alreadyViewed) {
      viewed.push(slug);
      localStorage.setItem('viewedTopics', JSON.stringify(viewed));
    }
    fetch(`/api/forum/topics/${slug}${alreadyViewed ? '' : '?trackView=true'}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setTopic(data.data);
          document.title = `${data.data.title} | منتديات كارس جو`;
        } else {
          toast.error('الموضوع غير موجود');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadTopic();
  }, [params.slug]);

  // Image Upload Handler
  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/upload', { method: 'POST', headers, body: fd });
      const data = await res.json();
      if (data.success && data.data?.url) return data.data.url;
      return null;
    } catch {
      return null;
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...replyImageFiles, ...files].slice(0, 3);
    setReplyImageFiles(newFiles);
    setReplyImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const removeSelectedImage = (index: number) => {
    const newFiles = replyImageFiles.filter((_, i) => i !== index);
    setReplyImageFiles(newFiles);
    setReplyImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const insertEmoji = (emoji: string) => {
    setReplyText(prev => prev + emoji);
    setShowEmojiPicker(false);
    replyInputRef.current?.focus();
  };

  // Submit Reply with Quotes & Images
  const submitReply = async () => {
    if (!replyText.trim() && replyImageFiles.length === 0) return;
    setSending(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of replyImageFiles) {
        const url = await uploadImageFile(file);
        if (url) uploadedUrls.push(url);
      }

      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: replyText,
          topicId: topic!.id,
          images: uploadedUrls,
          replyToId: quoteTarget?.id || null,
          replyToUser: quoteTarget?.name || null,
          replyToContent: quoteTarget?.content || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReplyText('');
        setQuoteTarget(null);
        setReplyImageFiles([]);
        setReplyImagePreviews([]);
        toast.success('تمت إضافة ردك بنجاح');
        loadTopic();
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
      } else {
        toast.error(data.error || 'فشل إرسال الرد');
      }
    } catch {
      toast.error('حدث خطأ أثناء إرسال الرد');
    } finally {
      setSending(false);
    }
  };

  // Topic Admin / Owner Actions
  const toggleTopicSolved = async () => {
    try {
      const res = await fetch(`/api/forum/topics/${topic!.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'toggleSolved' }),
      });
      if (res.ok) {
        toast.success('تم تحديث حالة الموضوع');
        loadTopic();
      }
    } catch {}
  };

  const toggleTopicPinned = async () => {
    try {
      const res = await fetch(`/api/forum/topics/${topic!.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'togglePinned' }),
      });
      if (res.ok) {
        toast.success('تم تحديث تثبيت الموضوع');
        loadTopic();
      }
    } catch {}
  };

  const toggleTopicLocked = async () => {
    try {
      const res = await fetch(`/api/forum/topics/${topic!.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'toggleLocked' }),
      });
      if (res.ok) {
        toast.success('تم تغيير حالة قفل الموضوع');
        loadTopic();
      }
    } catch {}
  };

  const deleteTopic = async () => {
    if (!confirm('هل انت متأكد من حذف الموضوع وجميع ردوده نهائياً؟')) return;
    try {
      const res = await fetch(`/api/forum/topics/${topic!.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        toast.success('تم حذف الموضوع بنجاح');
        router.push(`/forum/c/${topic!.category.slug}`);
      }
    } catch {}
  };

  // Post Actions (Likes, Solution mark, Hide, Delete)
  const likePost = async (postId: string) => {
    if (!user) { toast.error('سجل الدخول أولاً'); return; }
    // Optimistic toggle: exactly one like per user, second tap removes it
    setTopic(prev => prev ? {
      ...prev,
      posts: prev.posts.map(p => p.id === postId
        ? { ...p, likedByMe: !p.likedByMe, likeCount: (p.likeCount || 0) + (p.likedByMe ? -1 : 1) }
        : p),
    } : prev);
    try {
      const res = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'like' }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) {
        // Reconcile with server truth (heals counts inflated by the old bug)
        setTopic(prev => prev ? {
          ...prev,
          posts: prev.posts.map(p => p.id === postId
            ? { ...p, likedByMe: !!d.data?.likedByMe, likeCount: d.data?.likeCount ?? p.likeCount }
            : p),
        } : prev);
      } else {
        loadTopic(); // revert on failure
      }
    } catch { loadTopic(); }
  };

  const toggleHidePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'toggleHide' }),
      });
      if (res.ok) {
        toast.success('تم تحديث رؤية الرد');
        loadTopic();
      }
    } catch {}
  };

  const deletePost = async (postId: string) => {
    if (!confirm('حذف هذا الرد نهائياً؟')) return;
    try {
      const res = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        toast.success('تم حذف الرد');
        loadTopic();
      }
    } catch {}
  };

  const submitReport = async () => {
    if (!reportReason) return;
    setSubmittingReport(true);
    try {
      const res = await fetch(`/api/forum/posts/${reportPostId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: reportReason, description: reportDescription }),
      });
      if (res.ok) {
        toast.success('تم الإبلاغ بنجاح، سيراجعه المشرفون');
        setShowReportModal(false);
      }
    } catch {}
    setSubmittingReport(false);
  };

  const parseImagesArray = (imgStr: string | null | undefined): string[] => {
    if (!imgStr) return [];
    try {
      const parsed = JSON.parse(imgStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-3" />
        <p className="text-slate-400 text-xs animate-pulse">جاري تحميل موضوع النقاش والردود...</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">الموضوع غير موجود</h2>
        <Link href="/forum" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-colors mt-4 inline-block">
          العودة للمنتدى
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === topic.userId;
  const isAdmin = user?.role === 'ADMIN';
  const topicImages = parseImagesArray(topic.images);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      
      {/* Top Breadcrumb */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="container-custom max-w-5xl py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium truncate max-w-md">
            <Link href="/forum" className="hover:text-emerald-400 transition-colors">المنتدى</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <Link href={`/forum/c/${topic.category.slug}`} className="hover:text-emerald-400 transition-colors">{topic.category.nameAr}</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-white font-bold truncate">{topic.title}</span>
          </div>

          {/* Share Button */}
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                toast.success('تم نسخ رابط الموضوع');
              }
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">مشاركة</span>
          </button>
        </div>
      </div>

      <div className="container-custom max-w-5xl pt-8 space-y-6">
        
        {/* Main Topic Header Box */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl relative overflow-hidden">
          
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-extrabold text-xs">
                {topic.category.nameAr}
              </span>

              {topic.isPinned && (
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5" /> مثبت
                </span>
              )}

              {topic.isSolved && (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> تمت إجابته بنجاح 
                </span>
              )}

              {topic.isLocked && (
                <span className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> مغلق
                </span>
              )}
            </div>

            {/* Moderation Actions Toolbar */}
            {(isOwner || isAdmin) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTopicSolved}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    topic.isSolved ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-emerald-500/40'
                  }`}
                >
                  {topic.isSolved ? 'مُحَلول ' : 'تعليم كمُحَلول'}
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={toggleTopicPinned}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        topic.isPinned ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                      title="تثبيت"
                    >
                      <Pin className="w-4 h-4" />
                    </button>

                    <button
                      onClick={toggleTopicLocked}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        topic.isLocked ? 'bg-rose-500 text-slate-950 border-rose-400' : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                      title="قفل"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button
                  onClick={deleteTopic}
                  className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                  title="حذف الموضوع"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

          {/* Topic Title */}
          <h1 className="text-2xl md:text-3xl font-black text-white leading-snug">{topic.title}</h1>

          {/* Author Info */}
          <div className="flex items-center gap-3 py-2 border-y border-slate-800/80">
            <Link href={`/profile/${topic.user?.id}`} title="فحص الحساب"
              className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base shrink-0 border border-emerald-500/30 overflow-hidden hover:ring-2 hover:ring-emerald-400 transition-all">
              <SafeAvatar src={topic.user?.image} name={topic.user?.name} className="w-full h-full object-cover" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <Link href={`/profile/${topic.user?.id}`} title="فحص الحساب"
                  className="font-extrabold text-white text-sm hover:text-emerald-400 hover:underline transition-colors">{topic.user?.dealerName || topic.user?.name}</Link>
                {topic.user?.role === 'ADMIN' && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-bold">مشرف</span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {formatDate(topic.createdAt)}
                </span>

                <span className="flex items-center gap-1 text-slate-400">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  {topic.views || 0} مشاهدة
                </span>
              </div>
            </div>
          </div>

          {/* Topic Body Content */}
          <div className="text-slate-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap pt-2">
            {topic.content}
          </div>

          {/* Topic Images attached */}
          {topicImages.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <span className="text-slate-400 text-xs font-bold block mb-2">الصور المرفقة مع الموضوع:</span>
              <div className="flex flex-wrap gap-3">
                {topicImages.map((imgUrl, idx) => (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt="مرفق"
                    onClick={() => setLightboxImage(imgUrl)}
                    className="w-28 h-28 rounded-2xl object-cover border border-slate-800 cursor-pointer hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Replies List Header */}
        <div className="flex items-center justify-between pt-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            الردود والنقاشات ({topic.posts.length})
          </h2>
        </div>

        {/* Comments & Replies Listing */}
        <div className="space-y-4">
          {topic.posts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-2">
              <MessageCircle className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-bold text-sm">لا توجد مشاركات أو ردود بعد</p>
              <p className="text-slate-500 text-xs">شارِك بردك أو خبرتك لمساعدة صاحب الموضوع!</p>
            </div>
          ) : (
            topic.posts.map((post, idx) => {
              const postImages = parseImagesArray(post.images);

              if (post.isHidden && !isAdmin) {
                return (
                  <div key={post.id} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs flex items-center gap-2 italic">
                    <EyeOff className="w-4 h-4" />
                    تم إخفاء هذا الرد من قبل الإدارة لمخالفته شروط المنتدى.
                  </div>
                );
              }

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`p-6 rounded-3xl border transition-all space-y-4 shadow-md ${
                    post.isAnswer
                      ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/50 shadow-emerald-500/10'
                      : post.isHidden
                        ? 'bg-slate-950/80 border-rose-500/40 opacity-70'
                        : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  
                  {/* Answer / Solved Badge */}
                  {post.isAnswer && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      إجابة معتمدة وحل معتمد للمشكلة 
                    </div>
                  )}

                  {/* Comment Author Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${post.user?.id || post.userId}`} title="فحص الحساب"
                        className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/30 overflow-hidden hover:ring-2 hover:ring-emerald-400 transition-all">
                        <SafeAvatar src={post.user?.image} name={post.user?.name} className="w-full h-full object-cover" />
                      </Link>

                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${post.user?.id || post.userId}`} title="فحص الحساب"
                            className="font-extrabold text-white text-sm hover:text-emerald-400 hover:underline transition-colors">{post.user?.dealerName || post.user?.name}</Link>
                          {(post.user as any)?.phoneVerified && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold" title="رقم هاتف موثّق">مشترٍ جاد </span>
                          )}
                          {post.user?.role === 'ADMIN' && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-bold">مشرف</span>
                          )}
                          {post.user?.badges && (
                            <BadgeDisplay badges={typeof post.user.badges === 'string' ? JSON.parse(post.user.badges || '[]') : post.user.badges} />
                          )}
                        </div>

                        <span className="text-[11px] text-slate-500 block">{formatDate(post.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions: Quote Reply, Like, Report, Delete */}
                    <div className="flex items-center gap-1.5">
                      
                      {/* Quote Reply Button */}
                      <button
                        onClick={() => {
                          setQuoteTarget({
                            id: post.id,
                            name: post.user?.dealerName || post.user?.name,
                            content: post.content.slice(0, 100),
                          });
                          replyInputRef.current?.focus();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 text-xs font-semibold transition-all"
                        title="منشن واقتباس للرد"
                      >
                        <Quote className="w-3.5 h-3.5 text-emerald-400" />
                        <span>رد اقتباسي</span>
                      </button>

                      {/* Like Button — one like per user, tap again to remove */}
                      <button
                        onClick={() => likePost(post.id)}
                        title={post.likedByMe ? 'إزالة الإعجاب' : 'أعجبني'}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          post.likedByMe
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${post.likedByMe ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
                        <span>{post.likeCount || 0}</span>
                      </button>

                      {/* Report */}
                      {user && user.id !== post.userId && (
                        <button
                          onClick={() => { setReportPostId(post.id); setShowReportModal(true); }}
                          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                          title="إبلاغ"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Admin Toggle Hide */}
                      {isAdmin && (
                        <button
                          onClick={() => toggleHidePost(post.id)}
                          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                          title={post.isHidden ? 'إلغاء الإخفاء' : 'إخفاء الرد'}
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      {(user?.id === post.userId || isAdmin) && (
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                          title="حذف الرد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                    </div>
                  </div>

                  {/* Quoted Message Card if replying to someone */}
                  {post.replyToUser && post.replyToContent && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border-r-4 border-r-emerald-500 border border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>رد رداً على @{post.replyToUser}:</span>
                      </div>
                      <p className="text-slate-400 italic line-clamp-2">"{post.replyToContent}"</p>
                    </div>
                  )}

                  {/* Post Text */}
                  <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </div>

                  {/* Post Images if attached */}
                  {postImages.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {postImages.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt="مرفق رد"
                          onClick={() => setLightboxImage(img)}
                          className="w-24 h-24 rounded-2xl object-cover border border-slate-800 cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      ))}
                    </div>
                  )}

                </motion.div>
              );
            })
          )}
        </div>

        {/* Reply Form Box */}
        {!topic.isLocked ? (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl mt-8" ref={bottomRef}>
            
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                أضف مشاركتك أو ردك على الاستفسار
              </h3>
            </div>

            {/* Quoted Target Banner if active */}
            {quoteTarget && (
              <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-emerald-400 font-bold">اقتباس الرد من @{quoteTarget.name}:</span>
                  <p className="text-slate-300 italic line-clamp-1">"{quoteTarget.content}"</p>
                </div>
                <button onClick={() => setQuoteTarget(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Emoji Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-slate-500 text-xs ml-1 font-semibold">إيموجي سريع:</span>
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="px-2 py-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-sm transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Reply Textarea */}
            <textarea
              ref={replyInputRef}
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="اكتب ردك أو نصيحتك الفنية هنا..."
              className="w-full p-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500 transition-all resize-none"
            />

            {/* Image Previews */}
            {replyImagePreviews.length > 0 && (
              <div className="flex items-center gap-3">
                {replyImagePreviews.map((src, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-800">
                    <img src={src} alt="معاينة" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(i)}
                      className="absolute top-1 right-1 p-0.5 bg-slate-950/80 rounded-full text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>إرفاق صورة</span>
                </button>
              </div>

              <button
                onClick={submitReply}
                disabled={sending || (!replyText.trim() && replyImageFiles.length === 0)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>إرسال الرد </span>
              </button>
            </div>

          </div>
        ) : (
          <div className="p-8 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 text-sm flex items-center justify-center gap-2">
            <Lock className="w-5 h-5 text-rose-400" />
            هذا الموضوع مغلق من قبل المشرفين، ولا يمكن إضافة ردود جديدة.
          </div>
        )}

      </div>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
            <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 p-3 bg-slate-900 rounded-full text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
              <img src={lightboxImage} alt="مكبر" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* REPORT MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-white">الإبلاغ عن مشاركة مخالفة</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">سبب الإبلاغ</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                >
                  <option value="محتوى غير لائق">محتوى غير لائق أو سب/شتم</option>
                  <option value="معلومات خلوية مضللة">معلومات خلوية مضللة أو خطرة</option>
                  <option value="سبام وإعلانات مزعجة">سبام أو روابط خارجية مشبوهة</option>
                </select>
              </div>
              <textarea
                rows={3}
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="تفاصيل إضافية..."
                className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitReport}
                  disabled={submittingReport}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
                >
                  تأكيد الإبلاغ
                </button>
                <button onClick={() => setShowReportModal(false)} className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
