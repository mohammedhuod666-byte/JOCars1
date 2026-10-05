'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, MessageCircle, MapPin, Eye, Calendar, ChevronLeft, ChevronRight, Loader2,
  ShieldCheck, Truck, Cpu, Share2, AlertCircle, Trash2, CheckCircle2, User, Sparkles, X, Send
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { UsedPart } from '@/types';
import toast from 'react-hot-toast';

const PART_TYPES: Record<string, string> = {
  engine: 'محرك وفواصل', transmission: 'جير وفتيس', body: 'هيكل وبودي', electrical: 'كهرباء وإلكترونيات',
  suspension: 'تعليق وهيئة', brake: 'فرامل وبريكات', cooling: 'تبريد وراديتر', exhaust: 'عادم واكزوزت',
  interior: 'فرش وداخلي', wheel: 'جنوط وإطارات', turbo: 'توربو وسوبر', ac: 'مكيف وكمبروسر', other: 'قطع متنوعة',
};

const CONDITIONS: Record<string, string> = {
  NEW: 'جديدة وكالة', USED: 'مستعملة أصلية', REFURBISHED: 'مُجددة ومفحوصة',
};

export default function PartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();

  const [part, setPart] = useState<UsedPart | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Inquiry / Offer Modal
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [inquiryNote, setInquiryNote] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);

  useEffect(() => {
    const id = params.id;
    fetch(`/api/parts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setPart(data.data);
          document.title = `${data.data.title} | قطع غيار كارس جو`;
        } else {
          toast.error('إعلان القطعة غير موجود');
          router.push('/parts');
        }
      })
      .catch(() => {
        toast.error('فشل تحميل الإعلان');
        router.push('/parts');
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const getImages = (): string[] => {
    if (!part) return [];
    try {
      return JSON.parse(part.images || '[]');
    } catch {
      return [];
    }
  };

  const getCompatibleModelsList = (): string[] => {
    if (!part) return [];
    try {
      const parsed = JSON.parse((part as any).compatibleModels || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return (part as any).compatibleModels ? [(part as any).compatibleModels] : [];
    }
  };

  const submitInquiry = async () => {
    if (!offerPrice && !inquiryNote) {
      toast.error('يرجى إدخال عرض السعر أو استفسارك');
      return;
    }
    setSendingInquiry(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipientId: part!.userId,
          message: `استفسار حول قطعة الغيار: ${part!.title}\nعرض السعر المقترح: ${offerPrice ? offerPrice + ' د.أ' : 'غير محدد'}\nملاحظة: ${inquiryNote}`,
        }),
      });
      if (res.ok) {
        toast.success('تم إرسال الاستفسار للبائع بنجاح');
        setShowInquiryModal(false);
        setOfferPrice('');
        setInquiryNote('');
      } else {
        toast.error('فشل الإرسال، حاول لاحقاً');
      }
    } catch {
      toast.error('حدث خطأ أثناء الإرسال');
    } finally {
      setSendingInquiry(false);
    }
  };

  const deletePart = async () => {
    if (!confirm('هل انت متأكد من حذف هذا الإعلان نهائياً؟')) return;
    try {
      const res = await fetch(`/api/parts/${part!.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم حذف إعلان القطعة');
        router.push('/parts');
      } else {
        toast.error(data.error || 'فشل الحذف');
      }
    } catch {
      toast.error('حدث خطأ');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
        <p className="text-slate-400 text-xs animate-pulse">جاري تحميل تفاصيل قطعة الغيار...</p>
      </div>
    );
  }

  if (!part) return null;

  const images = getImages();
  const compatibleModels = getCompatibleModelsList();
  const isOwner = user?.id === part.userId;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      
      {/* Top Navigation */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="container-custom max-w-6xl py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium truncate max-w-md">
            <button onClick={() => router.push('/parts')} className="hover:text-blue-400 transition-colors">سوق القطع</button>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-white font-bold truncate">{part.title}</span>
          </div>

          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                toast.success('تم نسخ رابط الإعلان');
              }
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">مشاركة</span>
          </button>
        </div>
      </div>

      <div className="container-custom max-w-6xl pt-8 space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Main Photo Gallery */}
          <div className="lg:col-span-3 space-y-4">
            
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 relative group">
              {images.length > 0 ? (
                <img
                  src={images[currentImage]}
                  alt={part.title}
                  onClick={() => setLightboxImage(images[currentImage])}
                  className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 space-y-2">
                  <Cpu className="w-20 h-20" />
                  <span className="text-xs">لا توجد صور مرفقة</span>
                </div>
              )}

              {/* Slider Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((i) => (i === 0 ? images.length - 1 : i - 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 flex items-center justify-center text-white hover:bg-slate-900 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setCurrentImage((i) => (i === images.length - 1 ? 0 : i + 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 flex items-center justify-center text-white hover:bg-slate-900 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation Bar */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                      i === currentImage ? 'border-blue-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="مصغرة" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Part Description Section */}
            {part.description && (
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="font-extrabold text-white text-base">وصف وتفاصيل قطعة الغيار</h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{part.description}</p>
              </div>
            )}

          </div>

          {/* Side Info & Purchase Options */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
              
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 font-bold text-xs">
                  {PART_TYPES[part.partType] || part.partType}
                </span>

                <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs">
                  {CONDITIONS[part.condition] || part.condition}
                </span>

                {(part as any).hasWarranty && (
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> كفالة وتجربة
                  </span>
                )}

                {(part as any).hasDelivery && (
                  <span className="px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-bold text-xs flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> توصيل متاح
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <h1 className="text-2xl font-black text-white leading-snug">{part.title}</h1>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-black text-blue-400">{formatPrice(part.price)}</p>
                  {part.isNegotiable && (
                    <span className="text-xs font-bold text-emerald-400">السعر قابل للتفاوض </span>
                  )}
                </div>
              </div>

              {/* Specifications Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400">المواصفات الفنية والتوافق:</h4>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {part.brand && (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block">ماركة السيارة</span>
                      <span className="font-extrabold text-white mt-0.5 block">{part.brand.nameAr}</span>
                    </div>
                  )}

                  {(part as any).oemNumber || part.partNumber ? (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block">رقم القطعة OEM</span>
                      <span className="font-mono font-bold text-blue-400 mt-0.5 block" dir="ltr">
                        {(part as any).oemNumber || part.partNumber}
                      </span>
                    </div>
                  ) : null}

                  {(part as any).originCountry && (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block">بلد المنشأ</span>
                      <span className="font-extrabold text-white mt-0.5 block">{(part as any).originCountry}</span>
                    </div>
                  )}

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block">الكمية المتاحة</span>
                    <span className="font-extrabold text-white mt-0.5 block">{part.quantity} قطعة</span>
                  </div>
                </div>

                {/* Compatible Models List */}
                {compatibleModels.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 text-xs font-bold block">السيارات المتوافقة مع القطعة:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {compatibleModels.map((m, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-bold">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Seller Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-base border border-blue-500/30 shrink-0">
                    {part.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-sm">{part.user?.dealerName || part.user?.name}</p>
                    <span className="text-slate-500 text-[11px]">تاجر / بائع معتمد في الأردن</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <a
                    href={`tel:${part.phone}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                  >
                    <Phone className="w-4.5 h-4.5" />
                    <span>اتصال هاتف ({part.phone})</span>
                  </a>

                  {part.whatsapp && (
                    <a
                      href={`https://wa.me/${part.whatsapp.replace(/^0/, '962')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20"
                    >
                      <MessageCircle className="w-4.5 h-4.5" />
                      <span>محادثة واتساب مباشرة</span>
                    </a>
                  )}

                  <button
                    onClick={() => setShowInquiryModal(true)}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>تقديم عرض سعر / استفسار </span>
                  </button>
                </div>
              </div>

              {/* Location & Post Date Meta */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {formatDate(part.createdAt)}
                </span>

                {part.city && (
                  <span className="flex items-center gap-1 font-semibold text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {part.city.nameAr}
                  </span>
                )}
              </div>

              {/* Owner / Admin Delete Button */}
              {(isOwner || isAdmin) && (
                <button
                  onClick={deletePart}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white font-bold text-xs transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف إعلان القطعة</span>
                </button>
              )}

            </div>

          </div>

        </div>

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

      {/* INQUIRY / OFFER MODAL */}
      <AnimatePresence>
        {showInquiryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-base">تقديم عرض سعر / استفسار للبائع</h3>
                <button onClick={() => setShowInquiryModal(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">عرض السعر المقترح (بالدينار)</label>
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="مثال: 120"
                  className="w-full h-11 px-4 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">تفاصيل الاستفسار أو الملاحظة</label>
                <textarea
                  rows={3}
                  value={inquiryNote}
                  onChange={(e) => setInquiryNote(e.target.value)}
                  placeholder="هل القطعة مكفولة؟ هل توجد خدمة توصيل إلى إربد؟"
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                onClick={submitInquiry}
                disabled={sendingInquiry}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
              >
                {sendingInquiry ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                إرسال الاستفسار للبائع
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
