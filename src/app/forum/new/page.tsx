'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Send, ChevronLeft, Camera, X, Sparkles, MessageSquare, Tag, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const EMOJI_LIST = ['', '', '', '', '', '', '', '', '', '', '', ''];

export default function NewTopicPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <NewTopicForm />
    </Suspense>
  );
}

function NewTopicForm() {
  const { user, isAuthenticated, _hydrated, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<{ id: string; nameAr: string; slug: string; icon?: string; color?: string }[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  // Always load categories regardless of auth timing
  useEffect(() => {
    fetch('/api/forum/categories')
      .then((r) => r.json())
      .then((data) => {
        const cats = data.data || [];
        setCategories(cats);
        const preset = searchParams.get('categoryId');
        if (preset) {
          const found = cats.find((c: any) => c.slug === preset || c.id === preset);
          if (found) setCategoryId(found.id);
        } else if (cats.length > 0 && !categoryId) {
          // Default to first category if none chosen
          setCategoryId(cats[0].id);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push('/login?redirect=/forum/new');
    }
  }, [isAuthenticated, _hydrated, router]);

  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const headers: Record<string, string> = {};
      const currentToken = token || useAuth.getState().token;
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
      const res = await fetch('/api/upload', { method: 'POST', headers, body: fd });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data?.data?.url) {
        return data.data.url;
      }
      if (data?.error) {
        toast.error(`تعذر رفع الصورة: ${data.error}`);
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...imageFiles, ...files].slice(0, 4);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    contentInputRef.current?.focus();
  };

  const submit = async () => {
    if (!title.trim() || !content.trim() || !categoryId) {
      toast.error('يرجى كتابة العنوان والمحتوى واختيار القسم');
      return;
    }

    setSending(true);
    setUploadStatus('');

    try {
      const uploadedUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploadStatus('جاري رفع الصور المرفقة...');
        for (const file of imageFiles) {
          const url = await uploadImageFile(file);
          if (url) uploadedUrls.push(url);
        }
      }

      setUploadStatus('جاري نشر الموضوع...');
      const currentToken = token || useAuth.getState().token;
      const res = await fetch('/api/forum/topics', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          categoryId,
          images: uploadedUrls,
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data?.data) {
        toast.success('تم نشر الموضوع في المنتدى بنجاح ');
        router.push(`/forum/t/${data.data.slug}`);
      } else if (res.status === 401) {
        toast.error('يرجى تسجيل الدخول أولاً لتتمكن من إنشاء موضوع');
        router.push('/login?redirect=/forum/new');
      } else {
        toast.error(data?.error || 'تعذر نشر الموضوع، يرجى المحاولة ثانية');
      }
    } catch (err: any) {
      console.error('Topic submit error:', err);
      toast.error('حدث خطأ أثناء الاتصال، يرجى المحاولة مرة أخرى');
    } finally {
      setSending(false);
      setUploadStatus('');
    }
  };

  if (_hydrated && !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 pb-36 pt-4 sm:pt-6">
      <div className="container-custom max-w-3xl space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href="/forum" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>المنتدى</span>
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-amber-400 font-bold">إنشاء موضوع جديد</span>
        </div>

        {/* Main Card */}
        <div className="p-5 sm:p-8 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="border-b border-white/[0.08] pb-5 space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مجتمع خبراء وسائقي الأردن</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              إنشاء موضوع ونقاش جديد
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              اطرح استفسارك، شارك تجارب الصيانة أو الأعطال، وتفاعل مع فنيين وملاك السيارات في الأردن.
            </p>
          </div>

          <div className="space-y-6 relative z-10">
            
            {/* Forum Category Selector */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>قسم المنتدى المناسب *</span>
              </label>

              {/* Modern Category Chips */}
              {categories.length === 0 ? (
                <div className="flex gap-2 animate-pulse">
                  <div className="h-10 w-32 bg-white/[0.05] rounded-xl" />
                  <div className="h-10 w-36 bg-white/[0.05] rounded-xl" />
                  <div className="h-10 w-28 bg-white/[0.05] rounded-xl" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => {
                      const isSelected = c.id === categoryId;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCategoryId(c.id)}
                          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 border border-amber-300 scale-[1.02]'
                              : 'bg-[#181d2a] text-slate-300 hover:text-white hover:bg-[#1e2434] border border-white/[0.06]'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-slate-950" />}
                          <span>{c.nameAr}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile-friendly quick selector */}
                  <div className="sm:hidden pt-1">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-white/[0.08] bg-[#0c0e15] text-white text-xs outline-none focus:border-amber-400"
                    >
                      <option value="" disabled>أو اختر القسم من القائمة...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#121622] text-white">
                          {c.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Topic Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                عنوان الموضوع *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مشاكل نظام الـ ABS في تويوتا كامري 2012-2015"
                className="w-full h-12 px-4 rounded-2xl border border-white/[0.08] bg-[#0c0e15] text-white text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Topic Content */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  محتوى وتفاصيل المشكلة *
                </label>
                
                {/* Emoji Bar */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-xs">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="px-2 py-1 rounded-lg bg-[#181d2a] text-xs border border-white/[0.06] hover:border-amber-400/40 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                ref={contentInputRef}
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اشرح المشكلة بالتفصيل، نوع المحرك وسنة الصنع، الأعراض التي تظهر لك، وأي صيانة سابقة قمت بها..."
                className="w-full p-4 rounded-2xl border border-white/[0.08] bg-[#0c0e15] text-white text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all resize-none leading-relaxed placeholder:text-slate-600"
              />
            </div>

            {/* Images Upload Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                إرفاق صور توضيحية (حتى 4 صور)
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/[0.1] shadow-lg group">
                    <img src={src} alt="معاينة" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 p-1 bg-black/75 hover:bg-rose-600 rounded-full text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {imagePreviews.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/[0.12] bg-[#0c0e15] hover:border-amber-400/60 text-slate-400 hover:text-amber-400 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
                  >
                    <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold">إضافة صورة</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={submit}
                disabled={sending || !title.trim() || !content.trim() || !categoryId}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-amber-500/20 active:scale-[0.99]"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{uploadStatus || 'جاري المعالجة...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>نشر الموضوع في المنتدى</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
