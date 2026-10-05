'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Send, ChevronLeft, Camera, X, Smile, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const EMOJI_LIST = ['👍', '❤️', '🔥', '👏', '😂', '🚗', '🔧', '⚡', '💡', '🛠️', '✅', '🙏'];

export default function NewTopicPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>}>
      <NewTopicForm />
    </Suspense>
  );
}

function NewTopicForm() {
  const { user, isAuthenticated, _hydrated, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<{ id: string; nameAr: string; slug: string }[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      fetch('/api/forum/categories')
        .then((r) => r.json())
        .then((data) => {
          const cats = data.data || [];
          setCategories(cats);
          const preset = searchParams.get('categoryId');
          if (preset) {
            const found = cats.find((c: any) => c.slug === preset || c.id === preset);
            if (found) setCategoryId(found.id);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, _hydrated, router, searchParams]);

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
    const newFiles = [...imageFiles, ...files].slice(0, 4);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    contentInputRef.current?.focus();
  };

  const submit = async () => {
    if (!title.trim() || !content.trim() || !categoryId) {
      toast.error('العنوان، المحتوى، والقسم مطلوبة');
      return;
    }
    setSending(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadImageFile(file);
        if (url) uploadedUrls.push(url);
      }

      const res = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, content, categoryId, images: uploadedUrls }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        toast.success('تم نشر الموضوع بنجاح');
        router.push(`/forum/t/${data.data.slug}`);
      } else {
        toast.error(data.error || 'فشل نشر الموضوع');
      }
    } catch {
      toast.error('حدث خطأ، حاول مرة أخرى');
    } finally {
      setSending(false);
    }
  };

  if (_hydrated && !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 py-8">
      <div className="container-custom max-w-3xl space-y-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href="/forum" className="hover:text-emerald-400 transition-colors">المنتدى</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-white font-bold">إنشاء موضوع جديد</span>
        </div>

        <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
          <div className="border-b border-slate-800 pb-4 space-y-1">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              إنشاء موضوع ونقاش جديد
            </h1>
            <p className="text-slate-400 text-xs">احصل على إجابات وخبرات من مجتمع الفنيين والسائقين في الأردن</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">قسم المنتدى المناسب *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500"
              >
                <option value="">اختر قسم المنتدى</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameAr}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان الموضوع *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: صوت طقطقة في الهيئة الأمامية لسيارة كامري 2020 عند اللف"
                className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">محتوى وتفاصيل المشكلة *</label>
                
                {/* Emoji Bar */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-xs">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="px-1.5 py-0.5 rounded-lg bg-slate-950 text-xs border border-slate-800 hover:border-emerald-500/40"
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
                placeholder="اشرح المشكلة بالتفصيل، نوع المحرك، والأعراض المتكررة..."
                className="w-full p-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Images Upload Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">إرفاق صور توضيحية (حتى 4 صور)</label>
              
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
                  <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-800">
                    <img src={src} alt="معاينة" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 p-1 bg-slate-950/80 rounded-full text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {imagePreviews.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 hover:border-emerald-500 text-slate-500 hover:text-emerald-400 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px]">إضافة صورة</span>
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={submit}
              disabled={sending || !title.trim() || !content.trim() || !categoryId}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-emerald-500/20"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              نشر الموضوع في المنتدى 
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
