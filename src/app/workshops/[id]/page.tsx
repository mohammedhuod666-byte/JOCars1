'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Phone, MessageCircle, Mail, Globe, MapPin, Clock,
  CheckCircle, XCircle, Loader2, Send, Upload, Calendar,
  Flag, Image as ImageIcon, ThumbsUp, Wrench, X, Eye,
  Users, Award, ShieldCheck, Truck, AlertTriangle, Coffee,
  ChevronLeft, ChevronRight, Share2, Sparkles, AlertCircle,
  Tag, ExternalLink, ArrowRight, DollarSign, Navigation
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface WorkshopPrice {
  id: string;
  serviceName: string;
  minPrice: number;
  maxPrice: number;
}

interface WorkshopReview {
  id: string;
  user: { id: string; name: string; image: string | null };
  carMake: string;
  carModel: string;
  carYear: number | null;
  repairType: string;
  price: number | null;
  duration: string | null;
  description: string;
  beforeImage: string | null;
  afterImage: string | null;
  qualityRating: number;
  priceRating: number;
  speedRating: number;
  serviceRating: number;
  cleanlinessRating: number;
  punctualityRating: number;
  partsRating: number;
  recommend: boolean;
  workshopReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface WorkshopAd {
  id: string;
  title: string;
  description: string;
  images: string;
  status: string;
}

interface Workshop {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  emergencyPhone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number;
  reviewCount: number;
  viewCount: number;
  priceRange: string | null;
  provinceId: string | null;
  cityId: string | null;
  isMobileService: boolean;
  hasTowingService: boolean;
  hasWarranty: boolean;
  warrantyPeriod: string | null;
  hasWaitingArea: boolean;
  offersSpareParts: boolean;
  paymentMethods: string | null;
  specialties: string | null;
  gallery: string | null;
  discountOffer: string | null;
  services: { id: string; name: string; category: string | null }[];
  brands: { id: string; brand: string; workshopId: string }[];
  isVerified: boolean;
  workingHours: string | null;
  workingDays: string | null;
  yearsOfExperience: number | null;
  employeeCount: number | null;
  recommendPercent: number;
  prices: WorkshopPrice[];
  reviews: WorkshopReview[];
  ads: WorkshopAd[];
  user: { id: string; name: string; image: string | null; phone: string | null; whatsapp: string | null } | null;
}

const RATING_LABELS: Record<string, string> = {
  quality: 'جودة الإصلاح',
  price: 'مناسبة السعر',
  speed: 'سرعة الإنجاز',
  service: 'التعامل والخدمة',
  cleanliness: 'نظافة الورشة',
  punctuality: 'الالتزام بالمواعيد',
  parts: 'جودة قطع الغيار',
};

export default function WorkshopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.id as string;
  const { isAuthenticated, user: currentUser } = useAuth();

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'prices' | 'gallery' | 'reviews' | 'ads'>('about');
  
  // Modals & Lightbox
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Forms
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    carMake: '',
    carModel: '',
    carYear: '',
    repairType: '',
    price: '',
    duration: '',
    description: '',
    qualityRating: 5,
    priceRating: 5,
    speedRating: 5,
    serviceRating: 5,
    cleanlinessRating: 5,
    punctualityRating: 5,
    partsRating: 5,
    recommend: true,
    beforeImage: null as File | null,
    afterImage: null as File | null,
  });

  const [bookForm, setBookForm] = useState({
    date: '',
    time: '10:00',
    serviceType: '',
    carMake: '',
    carModel: '',
    carYear: '',
    plateNumber: '',
    budget: '',
    isUrgent: false,
    description: '',
  });
  const [bookStatus, setBookStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const [reportForm, setReportForm] = useState({
    reason: 'إعلان مضلل',
    description: '',
  });
  const [reportStatus, setReportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const fetchWorkshop = useCallback(async () => {
    try {
      const res = await fetch(`/api/workshops/${workshopId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setWorkshop(data.data);
      } else {
        setWorkshop(null);
      }
    } catch {
      setWorkshop(null);
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    fetchWorkshop();
  }, [fetchWorkshop]);

  // Auth token helper
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('jo-cars-auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.token) return parsed.state.token;
      }
    } catch {}
    return localStorage.getItem('token');
  };

  const submitReview = async () => {
    const formData = new FormData();
    formData.append('rating', reviewForm.rating.toString());
    formData.append('carMake', reviewForm.carMake);
    formData.append('carModel', reviewForm.carModel);
    if (reviewForm.carYear) formData.append('carYear', reviewForm.carYear);
    formData.append('repairType', reviewForm.repairType);
    if (reviewForm.price) formData.append('price', reviewForm.price);
    formData.append('duration', reviewForm.duration);
    formData.append('description', reviewForm.description);
    formData.append('qualityRating', reviewForm.qualityRating.toString());
    formData.append('priceRating', reviewForm.priceRating.toString());
    formData.append('speedRating', reviewForm.speedRating.toString());
    formData.append('serviceRating', reviewForm.serviceRating.toString());
    formData.append('cleanlinessRating', reviewForm.cleanlinessRating.toString());
    formData.append('punctualityRating', reviewForm.punctualityRating.toString());
    formData.append('partsRating', reviewForm.partsRating.toString());
    formData.append('recommend', reviewForm.recommend.toString());
    if (reviewForm.beforeImage) formData.append('beforeImage', reviewForm.beforeImage);
    if (reviewForm.afterImage) formData.append('afterImage', reviewForm.afterImage);

    const token = getAuthToken();

    try {
      const res = await fetch(`/api/workshops/${workshopId}/reviews`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) {
        setShowReviewForm(false);
        fetchWorkshop();
      }
    } catch {}
  };

  const submitBooking = async () => {
    setBookStatus('loading');
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/workshops/${workshopId}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(bookForm),
      });

      if (res.ok) {
        setBookStatus('success');
        setBookForm({ date: '', time: '10:00', serviceType: '', carMake: '', carModel: '', carYear: '', plateNumber: '', budget: '', isUrgent: false, description: '' });
        setTimeout(() => { setBookStatus('idle'); setShowBookForm(false); }, 2500);
      } else {
        setBookStatus('error');
        setTimeout(() => setBookStatus('idle'), 3000);
      }
    } catch {
      setBookStatus('error');
      setTimeout(() => setBookStatus('idle'), 3000);
    }
  };

  const submitReport = async () => {
    setReportStatus('loading');
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/workshops/${workshopId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...reportForm, type: 'workshop' }),
      });
      if (res.ok) {
        setReportStatus('success');
        setTimeout(() => { setReportStatus('idle'); setShowReport(false); }, 2000);
      } else {
        setReportStatus('error');
        setTimeout(() => setReportStatus('idle'), 3000);
      }
    } catch {
      setReportStatus('error');
      setTimeout(() => setReportStatus('idle'), 3000);
    }
  };

  const submitReply = async (reviewId: string) => {
    const token = getAuthToken();
    try {
      await fetch(`/api/workshops/${workshopId}/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reply: replyText }),
      });
      setReplyingTo(null);
      setReplyText('');
      fetchWorkshop();
    } catch {}
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const parseGalleryImages = (galleryStr: string | null): string[] => {
    if (!galleryStr) return [];
    try {
      const parsed = JSON.parse(galleryStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseAdImages = (imagesStr: string): string[] => {
    try {
      const parsed = JSON.parse(imagesStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getRatingBreakdown = (reviews: WorkshopReview[]) => {
    if (!reviews || reviews.length === 0) return null;
    const sum = reviews.reduce(
      (acc, r) => ({
        quality: acc.quality + r.qualityRating,
        price: acc.price + r.priceRating,
        speed: acc.speed + r.speedRating,
        service: acc.service + r.serviceRating,
        cleanliness: acc.cleanliness + r.cleanlinessRating,
        punctuality: acc.punctuality + r.punctualityRating,
        parts: acc.parts + r.partsRating,
      }),
      { quality: 0, price: 0, speed: 0, service: 0, cleanliness: 0, punctuality: 0, parts: 0 }
    );
    const count = reviews.length;
    return {
      quality: sum.quality / count,
      price: sum.price / count,
      speed: sum.speed / count,
      service: sum.service / count,
      cleanliness: sum.cleanliness / count,
      punctuality: sum.punctuality / count,
      parts: sum.parts / count,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mb-4" />
        <p className="text-slate-400 text-sm animate-pulse">جاري تحميل بيانات الورشة...</p>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4">
          <XCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">الورشة غير موجودة</h2>
        <p className="text-slate-400 text-sm mb-6">قد تكون الورشة أزيلت أو الرابط غير صحيح.</p>
        <Link href="/workshops" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-colors">
          العودة لدليل الورش
        </Link>
      </div>
    );
  }

  const ratingBreakdown = getRatingBreakdown(workshop.reviews);
  const galleryImages = parseGalleryImages(workshop.gallery);
  const phoneFormatted = (workshop.phone || workshop.user?.phone || '').replace(/[^0-9]/g, '');
  const whatsappFormatted = (workshop.whatsapp || workshop.user?.whatsapp || phoneFormatted).replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Navigation Top Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="container-custom py-3 flex items-center justify-between">
          <Link href="/workshops" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-semibold">
            <ArrowRight className="w-4 h-4" />
            <span>العودة لقائمة الورش</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة'}</span>
            </button>

            <button
              onClick={() => setShowReport(true)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
              title="إبلاغ عن محتوى"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Cover & Workshop Banner */}
      <div className="relative w-full bg-slate-900 overflow-hidden border-b border-slate-800">
        <div className="relative h-64 md:h-96 w-full bg-slate-950">
          {workshop.coverImage ? (
            <Image
              src={workshop.coverImage}
              alt={workshop.name}
              fill
              priority
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 flex items-center justify-center">
              <Wrench className="w-24 h-24 text-slate-800/80" />
            </div>
          )}

          {/* Dark Glassmorphic Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/60" />

          {/* Emergency Badge Overlay */}
          {workshop.hasTowingService && (
            <div className="absolute top-4 right-4">
              <span className="px-3.5 py-1.5 rounded-2xl bg-rose-600/90 backdrop-blur-md text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xl animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                ونش وسحب طوارئ 24/7
              </span>
            </div>
          )}
        </div>

        {/* Profile Info Row Overlapping Cover */}
        <div className="container-custom relative -mt-20 md:-mt-24 z-10 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            {/* Logo & Main Titles */}
            <div className="flex items-end gap-4 md:gap-6">
              <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-3xl border-4 border-slate-950 bg-slate-900 shadow-2xl overflow-hidden shrink-0 flex items-center justify-center">
                {workshop.logo ? (
                  <Image src={workshop.logo} alt={workshop.name} fill className="object-cover" />
                ) : (
                  <Wrench className="w-12 h-12 text-emerald-400" />
                )}
                {workshop.isVerified && (
                  <div className="absolute bottom-1 right-1 bg-amber-500 text-slate-950 rounded-full p-1 shadow-lg" title="ورشة موثقة">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5 mb-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">{workshop.name}</h1>
                  {workshop.isVerified && (
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      معتمدة كارس جو
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{workshop.address || 'المملكة الأردنية الهاشمية'}</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="text-white text-sm">{workshop.rating > 0 ? workshop.rating.toFixed(1) : '5.0'}</span>
                    <span className="text-slate-400 font-normal">({workshop.reviewCount} تقييم)</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>{workshop.viewCount} مشاهدة</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Primary Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowBookForm(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                حجز موعد فوري
              </button>

              {phoneFormatted && (
                <a
                  href={`tel:${phoneFormatted}`}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-sm transition-all"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>اتصال</span>
                </a>
              )}

              {whatsappFormatted && (
                <a
                  href={`https://wa.me/${whatsappFormatted}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-emerald-400 font-bold text-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>واتساب</span>
                </a>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Feature Badges Showcase Bar */}
      <div className="container-custom py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-white font-bold text-xs">{workshop.yearsOfExperience || 5}+ سنوات</p>
              <p className="text-slate-400 text-[10px]">خبرة في صيانة السيارات</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-white font-bold text-xs">{workshop.hasWarranty ? `كفالة ${workshop.warrantyPeriod || ''}` : 'كفالة صيانة'}</p>
              <p className="text-slate-400 text-[10px]">ضمان وجودة قطعة الإصلاح</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-white font-bold text-xs">{workshop.isMobileService ? 'صيانة متنقلة' : 'ورشة متخصصة'}</p>
              <p className="text-slate-400 text-[10px]">فريق مجهز للموقع</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <p className="text-white font-bold text-xs">{workshop.hasWaitingArea ? 'استراحة زبائن' : 'استقبال مميز'}</p>
              <p className="text-slate-400 text-[10px]">غرفة مكيفة وخدمات</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <p className="text-white font-bold text-xs">{workshop.offersSpareParts ? 'توفير قطع غيار' : 'استبدال قطع'}</p>
              <p className="text-slate-400 text-[10px]">أصلي ومضمون</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-white font-bold text-xs">{workshop.hasTowingService ? 'ونش 24 ساعة' : 'استجابة سريعة'}</p>
              <p className="text-slate-400 text-[10px]">خدمة سحب وسرويس</p>
            </div>
          </div>
        </div>
      </div>

      {/* Special Offer Alert Banner if exists */}
      {workshop.discountOffer && (
        <div className="container-custom mb-6">
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/40 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-emerald-400 text-xs font-bold block">عرض حصري لأعضاء موقع Cars JO 🏷️</span>
                <p className="text-white text-sm font-extrabold mt-0.5">{workshop.discountOffer}</p>
              </div>
            </div>
            <button
              onClick={() => setShowBookForm(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shrink-0 transition-colors"
            >
              احصل على العرض عند الحجز
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="container-custom mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
          {[
            { id: 'about', label: 'عن الورشة والمعلومات', icon: Wrench },
            { id: 'services', label: `الخدمات والماركات (${workshop.services.length})`, icon: Sparkles },
            { id: 'prices', label: `جدول الأسعار (${workshop.prices.length})`, icon: DollarSign },
            { id: 'gallery', label: `معرض الصور (${galleryImages.length})`, icon: ImageIcon },
            { id: 'reviews', label: `التقييمات (${workshop.reviewCount})`, icon: Star },
            { id: 'ads', label: `العروض والبوسترات (${workshop.ads.length})`, icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content & Sidebar Grid */}
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Main Content Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* TAB 1: ABOUT & OVERVIEW */}
            {activeTab === 'about' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Description Box */}
                {workshop.description && (
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-emerald-400" />
                      الوصف والتخصصات
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                      {workshop.description}
                    </p>
                  </div>
                )}

                {/* Services Overview Grid */}
                {workshop.services.length > 0 && (
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      أبرز الخدمات التي تتقنها الورشة
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {workshop.services.map((service) => (
                        <div key={service.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                          <span className="text-white text-sm font-semibold">{service.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Brands Supported Overview */}
                {workshop.brands.length > 0 && (
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      الماركات المصرحة والمتخصصة بها
                    </h3>

                    <div className="flex flex-wrap gap-2.5">
                      {workshop.brands.map((b) => (
                        <span key={b.id} className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          {b.brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Working Hours Box */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    أوقات وأيام الدوام الرسمية
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-xs">ساعات استقبال السيارات:</span>
                      <p className="text-white font-extrabold text-base">{workshop.workingHours || '08:00 صباحاً - 06:00 مساءً'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-xs">أيام العمل خلال الأسبوع:</span>
                      <p className="text-white font-extrabold text-base">{workshop.workingDays || 'طيلة أيام الأسبوع ما عدا الجمعة'}</p>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB 2: SERVICES & BRANDS */}
            {activeTab === 'services' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-white mb-2">قائمة الخدمات المتاحة لدى الورشة</h3>
                    <p className="text-slate-400 text-xs">يمكنك حجز موعد محدد لأي من هذه الخدمات مباشرة</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {workshop.services.map((s) => (
                      <div key={s.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-sm">{s.name}</h4>
                            <span className="text-slate-500 text-[10px]">خدمة متخصصة ومكفولة</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setBookForm(b => ({ ...b, serviceType: s.name }));
                            setShowBookForm(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 text-xs font-bold transition-colors"
                        >
                          حجز
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {workshop.brands.length > 0 && (
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold text-white">الماركات والسيارات المدعومة</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {workshop.brands.map((b) => (
                        <div key={b.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                          <span className="text-emerald-400 font-black text-sm block">{b.brand}</span>
                          <span className="text-slate-500 text-[10px]">فحص وصيانة كشف أعطال</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: PRICE GUIDE */}
            {activeTab === 'prices' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-extrabold text-white mb-1">جدول أسعار الخدمات التقريبية</h3>
                      <p className="text-slate-400 text-xs">الأسعار تشمل تقدير أجور اليد والقطع بالدينار الأردني</p>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                      أسعار شفافة ومضمونة
                    </span>
                  </div>

                  {workshop.prices.length === 0 ? (
                    <p className="text-slate-500 text-sm py-8 text-center">لم تقم الورشة بإضافة قائمة أسعار محددة بعد.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-xs">
                            <th className="py-3 px-4">اسم الخدمة</th>
                            <th className="py-3 px-4">السعر الأدنى</th>
                            <th className="py-3 px-4">السعر الأعلى</th>
                            <th className="py-3 px-4 text-center">حجز</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-white">
                          {workshop.prices.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-950/60 transition-colors">
                              <td className="py-3.5 px-4 font-bold">{p.serviceName}</td>
                              <td className="py-3.5 px-4 text-emerald-400 font-bold">{p.minPrice} د.أ</td>
                              <td className="py-3.5 px-4 text-emerald-400 font-bold">{p.maxPrice} د.أ</td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => {
                                    setBookForm(b => ({ ...b, serviceType: p.serviceName }));
                                    setShowBookForm(true);
                                  }}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                                >
                                  حجز الخدمة
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 4: GALLERY */}
            {activeTab === 'gallery' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h3 className="text-xl font-extrabold text-white">معرض صور الورشة والمعدات والأعمال</h3>

                  {galleryImages.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      لا توجد صور معرض مضافة لهذه الورشة بعد.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {galleryImages.map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => setLightboxImage(imgUrl)}
                          className="relative h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group cursor-pointer"
                        >
                          <Image src={imgUrl} alt={`ورشة ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 5: REVIEWS */}
            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-white">آراء وتقييمات العملاء والزبائن</h3>
                      <p className="text-slate-400 text-xs">تقييمات حقيقية من سائقين قصروا ورشاتهم هنا</p>
                    </div>

                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shrink-0"
                    >
                      أضف تقييمك للورشة ⭐
                    </button>
                  </div>

                  {/* Rating Breakdown Bar */}
                  {ratingBreakdown && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-800">
                      {Object.entries(ratingBreakdown).map(([k, val]) => (
                        <div key={k} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">{RATING_LABELS[k]}</span>
                            <span className="text-emerald-400 font-bold">{val.toFixed(1)} / 5</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(val / 5) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reviews List */}
                  {workshop.reviews.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">لا توجد تقييمات حتى الآن. كن أول من يقيم الورشة!</p>
                  ) : (
                    <div className="space-y-6 divide-y divide-slate-800/80">
                      {workshop.reviews.map((r) => (
                        <div key={r.id} className="pt-6 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                                {r.user?.image ? (
                                  <Image src={r.user.image} alt={r.user.name} width={40} height={40} className="rounded-full object-cover" />
                                ) : (
                                  r.user?.name?.charAt(0) || 'U'
                                )}
                              </div>
                              <div>
                                <h4 className="text-white font-bold text-sm">{r.user?.name || 'مستخدم'}</h4>
                                <p className="text-slate-500 text-[10px]">
                                  سيارة {r.carMake} {r.carModel} {r.carYear ? `(${r.carYear})` : ''} • {r.repairType}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 text-amber-400">
                              <Star className="w-4 h-4 fill-amber-400" />
                              <span className="text-white font-bold text-xs">{(r.qualityRating || 5).toFixed(1)}</span>
                            </div>
                          </div>

                          <p className="text-slate-300 text-sm leading-relaxed">{r.description}</p>

                          {/* Before / After Images */}
                          {(r.beforeImage || r.afterImage) && (
                            <div className="flex items-center gap-4 pt-2">
                              {r.beforeImage && (
                                <div className="space-y-1">
                                  <span className="text-rose-400 text-[10px] font-bold block">قبل الاصلاح:</span>
                                  <img
                                    src={r.beforeImage}
                                    alt="قبل"
                                    onClick={() => setLightboxImage(r.beforeImage)}
                                    className="w-20 h-20 rounded-xl object-cover border border-slate-800 cursor-pointer"
                                  />
                                </div>
                              )}
                              {r.afterImage && (
                                <div className="space-y-1">
                                  <span className="text-emerald-400 text-[10px] font-bold block">بعد الاصلاح:</span>
                                  <img
                                    src={r.afterImage}
                                    alt="بعد"
                                    onClick={() => setLightboxImage(r.afterImage)}
                                    className="w-20 h-20 rounded-xl object-cover border border-slate-800 cursor-pointer"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Workshop Reply if exists */}
                          {r.workshopReply && (
                            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 space-y-1 text-xs">
                              <span className="text-emerald-400 font-bold block">رد صاحب الورشة:</span>
                              <p className="text-slate-300">{r.workshopReply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 6: ADS */}
            {activeTab === 'ads' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h3 className="text-xl font-extrabold text-white">العروض والتخفيضات النشطة للورشة</h3>

                  {workshop.ads.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">لا تتوفر إعلانات أو عروض ترويجية حالية.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {workshop.ads.map((ad) => {
                        const adImgs = parseAdImages(ad.images);
                        return (
                          <div key={ad.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                            {adImgs.length > 0 && (
                              <div className="relative h-40 rounded-xl overflow-hidden bg-slate-900">
                                <Image src={adImgs[0]} alt={ad.title} fill className="object-cover" />
                              </div>
                            )}
                            <h4 className="text-white font-bold text-sm">{ad.title}</h4>
                            <p className="text-slate-400 text-xs">{ad.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            
            {/* Quick Contact Box */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-400" />
                معلومات التواصل المباشر
              </h3>

              <div className="space-y-2.5">
                {phoneFormatted && (
                  <a
                    href={`tel:${phoneFormatted}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold dir-ltr">{workshop.phone || workshop.user?.phone}</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold">اتصل الآن</span>
                  </a>
                )}

                {whatsappFormatted && (
                  <a
                    href={`https://wa.me/${whatsappFormatted}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold">محادثة واتساب</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold">ارسل رسالة</span>
                  </a>
                )}

                {workshop.emergencyPhone && (
                  <a
                    href={`tel:${workshop.emergencyPhone.replace(/[^0-9]/g, '')}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold">طوارئ 24/7</span>
                    </div>
                    <span className="text-xs font-black dir-ltr">{workshop.emergencyPhone}</span>
                  </a>
                )}

                {workshop.lat != null && workshop.lng != null && (
                  <a
                    href={`https://www.google.com/maps?q=${workshop.lat},${workshop.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 text-white transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Navigation className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold">خرائط جوجل Google Maps</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Appointment Call-to-Action Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-4 shadow-xl">
              <div className="space-y-1">
                <span className="text-emerald-400 text-xs font-bold block">حجز موعد مسبق 🗓️</span>
                <h4 className="text-white font-extrabold text-base">تجنب الانتظار واضمن دورك في الورشة</h4>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                حدد التاريخ والوقت المناسب لك واطلب خدمة الفحص أو الإصلاح مباشرة.
              </p>
              <button
                onClick={() => setShowBookForm(true)}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-colors shadow-lg shadow-emerald-500/20"
              >
                احجز موعدك الآن 🚀
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* MODAL 1: BOOK APPOINTMENT */}
      <AnimatePresence>
        {showBookForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowBookForm(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 md:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  حجز موعد لدى {workshop.name}
                </h3>
                <button onClick={() => setShowBookForm(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bookStatus === 'success' ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-white font-extrabold text-xl">تم إرسال طلب الحجز بنجاح!</h4>
                  <p className="text-slate-400 text-xs">سيتواصل معك فريق الورشة لتأكيد موعدك.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">تاريخ الموعد *</label>
                      <input
                        type="date"
                        value={bookForm.date}
                        onChange={(e) => setBookForm(b => ({ ...b, date: e.target.value }))}
                        className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">الوقت المفضل *</label>
                      <input
                        type="time"
                        value={bookForm.time}
                        onChange={(e) => setBookForm(b => ({ ...b, time: e.target.value }))}
                        className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">نوع الخدمة *</label>
                    <select
                      value={bookForm.serviceType}
                      onChange={(e) => setBookForm(b => ({ ...b, serviceType: e.target.value }))}
                      className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                    >
                      <option value="">اختر الخدمة المطلوبة</option>
                      {workshop.services.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                      <option value="صيانة عامة وفحص">صيانة عامة وفحص</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">ماركة السيارة</label>
                      <input
                        type="text"
                        value={bookForm.carMake}
                        onChange={(e) => setBookForm(b => ({ ...b, carMake: e.target.value }))}
                        placeholder="تويوتا، هيونداي..."
                        className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">موديل وقوة المحرك</label>
                      <input
                        type="text"
                        value={bookForm.carModel}
                        onChange={(e) => setBookForm(b => ({ ...b, carModel: e.target.value }))}
                        placeholder="كامري، سوناتا..."
                        className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">سنة الصنع</label>
                      <input
                        type="number"
                        placeholder="2020"
                        value={bookForm.carYear}
                        onChange={(e) => setBookForm(b => ({ ...b, carYear: e.target.value }))}
                        className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">الميزانية المتوقعة (د.أ)</label>
                      <input
                        type="number"
                        placeholder="مثال: 50"
                        value={bookForm.budget}
                        onChange={(e) => setBookForm(b => ({ ...b, budget: e.target.value }))}
                        className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bookForm.isUrgent}
                      onChange={(e) => setBookForm(b => ({ ...b, isUrgent: e.target.checked }))}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <span className="text-rose-400 font-bold text-xs">⚡ حالة طارئة تعطل على الطريق (أولوية فحص)</span>
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">ملاحظات وشكوى السيارة</label>
                    <textarea
                      rows={2}
                      value={bookForm.description}
                      onChange={(e) => setBookForm(b => ({ ...b, description: e.target.value }))}
                      placeholder="صف أعراض المشكلة أو نوع الفحص..."
                      className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {bookStatus === 'error' && (
                    <p className="text-rose-400 text-xs text-center font-bold">حدث خطأ، يرجى اختيار التاريخ والوقت والخدمة.</p>
                  )}

                  <button
                    onClick={submitBooking}
                    disabled={bookStatus === 'loading' || !bookForm.date || !bookForm.time || !bookForm.serviceType}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {bookStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد الحجز والإرسال 🚀'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: LIGHTBOX PHOTO VIEWER */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
            <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 p-3 bg-slate-900 rounded-full text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
              <img src={lightboxImage} alt="عرض مكبر" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
