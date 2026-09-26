'use client';

import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CarGrid } from '@/components/cars/CarGrid';
import {
  Phone, MessageCircle, Share2, Flag, Heart, MapPin, Fuel, Gauge,
  Calendar, Settings, Star, ChevronLeft, ChevronRight, Maximize2,
  Shield, CheckCircle, AlertTriangle, BarChart3, Bot, Sparkles, Eye,
  Clock, Building2, Palette, DoorOpen, Cpu, Bike, Loader2, GitCompare, ChevronDown,
  RotateCcw, Trash2, Crown, Send, Car as CarIcon, X, RefreshCw, CalendarCheck, ShieldCheck, Zap,
  MessageSquare, Compass, Handshake, Pencil
} from 'lucide-react';
import { formatPrice, formatDistance, getFuelTypeLabel, getTransmissionLabel, getDrivetrainLabel, getConditionLabel, formatDate } from '@/lib/utils';
import { CarDriveLoader } from '@/components/cars/CarDriveLoader';
import { getCachedCarDetail, setCachedCarDetail } from '@/lib/car-detail-cache';
import { CustomsCalculator } from '@/components/cars/CustomsCalculator';
import { ConditionDetails } from '@/components/cars/ConditionDetails';
import { useAuth } from '@/hooks/useAuth';
import { useCompareStore } from '@/store';
import { ReportModal } from '@/components/cars/ReportModal';
import { BookingModal } from '@/components/cars/BookingModal';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { PriceFairnessIndicator } from '@/components/cars/PriceFairnessIndicator';
import { SocialProof } from '@/components/cars/SocialProof';
import { StarRating } from '@/components/ratings/StarRating';
import { RatingModal } from '@/components/ratings/RatingModal';
import type { Car } from '@/types';
import { fetchWithRetry } from '@/lib/fetch-retry';
import toast from 'react-hot-toast';
import { sanitizePlainText } from '@/lib/sanitize';
import WhatsAppShareButton from '@/components/ui/WhatsAppShareButton';
import JordanianInspectionReport from '@/components/cars/JordanianInspectionReport';
import { ValuationReport } from '@/components/cars/ValuationReport';
import { CAR_FEATURES_AR, sanitizeFeatures } from '@/lib/car-features';

const AuctionSection = lazy(() => import('@/components/auctions/AuctionSection').then(m => ({ default: m.AuctionSection })));
const CarHistorySection = lazy(() => import('@/components/cars/CarHistorySection').then(m => ({ default: m.CarHistorySection })));
const EngineSoundSection = lazy(() => import('@/components/cars/EngineSoundSection').then(m => ({ default: m.EngineSoundSection })));
const CarComments = lazy(() => import('@/components/cars/CarComments').then(m => ({ default: m.CarComments })));
const CarReviews = lazy(() => import('@/components/cars/CarReviews').then(m => ({ default: m.CarReviews })));

function SectionSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
    </div>
  );
}

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, token } = useAuth();
  const { addCar, removeCar, isInCompare } = useCompareStore();
  
  const [car, setCar] = useState<Car | null>(null);
  const [similarCars, setSimilarCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const sawLoader = useRef(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [carTags, setCarTags] = useState<{ id: string; nameAr: string; slug: string; icon: string; color: string }[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [hasMoreImages, setHasMoreImages] = useState(false);
  const [loadingMoreImages, setLoadingMoreImages] = useState(false);
  const [liveFairPrice, setLiveFairPrice] = useState<number | null>(null);

  const applyCarData = (data: any) => {
    setCar(data);
    // Ignore legacy stale DB estimate; ValuationReport will provide fresh Section 24 FMV
    setIsSaved(data.isFavorited || false);
    setHasMoreImages(data.hasMoreImages || false);
    document.title = `${data.brand?.nameAr || ''} ${data.model?.nameAr || ''} ${data.year} | كارس جو JO Cars`;
  };

  const loadCar = (carId: string, trackView: boolean) => {
    // Instant path: serve a fresh cached copy, refresh silently in background.
    const cached = getCachedCarDetail(carId) as any;
    if (cached) {
      setLoadError(false);
      applyCarData(cached);
      setLoading(false);
      fetchWithRetry<{ success: boolean; data?: any }>(`/api/cars/${carId}`)
        .then((data) => {
          if (data?.success && data.data) setCachedCarDetail(carId, data.data);
        })
        .catch(() => {});
      return;
    }
    setLoading(true);
    setLeaving(false);
    setLoadError(false);
    fetchWithRetry<{ success: boolean; data?: any; error?: string }>(
      `/api/cars/${carId}${trackView ? '?trackView=true' : ''}`
    )
      .then((data) => {
        if (data?.success && data.data) {
          applyCarData(data.data);
          setCachedCarDetail(carId, data.data);
        } else {
          toast.error(data?.error || 'السيارة غير موجودة');
          router.push('/cars');
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setLoadError(true);
      });
  };

  useEffect(() => {
    const carId = params.id as string;
    const viewed = JSON.parse(localStorage.getItem('viewedCars') || '[]');
    const alreadyViewed = viewed.includes(carId);
    if (!alreadyViewed) {
      viewed.push(carId);
      localStorage.setItem('viewedCars', JSON.stringify(viewed));
    }
    loadCar(carId, !alreadyViewed);
  }, [params.id]);

  // Mark when the loader was actually shown, so cached (instant) opens
  // skip the drive-away animation entirely.
  useEffect(() => {
    if (loading) sawLoader.current = true;
  }, [loading]);

  // Drive-away exit: when the ad finishes loading, jump to the top of the
  // page and let the loader car speed off-screen before revealing the ad.
  useEffect(() => {
    if (!loading && car) {
      window.scrollTo(0, 0);
      if (!sawLoader.current) return;
      sawLoader.current = false;
      setLeaving(true);
      const t = setTimeout(() => setLeaving(false), 750);
      return () => clearTimeout(t);
    }
  }, [loading, car]);

  useEffect(() => {
    if (car) {
      const t = setTimeout(() => {
        fetch(`/api/cars?brandId=${car.brandId}&limit=4&exclude=${car.id}`)
          .then(r => r.json())
          .then(data => setSimilarCars(data.data || []))
          .catch(() => {});
        fetch(`/api/car-tags?carId=${car.id}`)
          .then(r => r.json())
          .then(data => { if (data.success) setCarTags(data.data || []); })
          .catch(() => {});
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [car]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${car?.brand?.nameAr} ${car?.model?.nameAr}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ رابط الإعلان');
    }
  };

  const isOwner = !!currentUser && !!car && (currentUser.id === (car as any).userId);

  const handleDeleteCar = async () => {
    if (!car) return;
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان نهائياً؟')) return;
    try {
      const res = await fetch(`/api/cars/${car.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        toast.success('تم حذف الإعلان');
        router.push('/my-cars');
      } else {
        toast.error(data?.error || 'فشل حذف الإعلان');
      }
    } catch {
      toast.error('تعذر حذف الإعلان');
    }
  };

  const toggleFavorite = async () => {
    const prev = isSaved;
    setIsSaved(!isSaved);
    try {
      const res = await fetch('/api/cars/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId: car?.id }),
      });
      const data = await res.json();
      if (!data.success) setIsSaved(prev);
    } catch { setIsSaved(prev); }
  };

  const handleSendMessage = async () => {
    if (!currentUser) {
      toast.error('يرجى تسجيل الدخول أولاً لإرسال رسالة للمالك');
      router.push('/auth/login');
      return;
    }
    if (!car) return;
    if (currentUser.id === car.user.id) {
      toast.error('أنت صاحب هذا الإعلان، لا يمكنك مراسلة نفسك');
      return;
    }
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          carId: car.id,
          sellerId: car.user.id,
          content: `مرحباً، أنا مهتم بسيارتك المعروضة (${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} موديل ${car.year}). يرجى التواصل لمناقشة التفاصيل.`,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.conversation?.id) {
        toast.success('جاري توجيهك للمحادثة مع البائع...');
        router.push(`/messages?conversationId=${data.data.conversation.id}`);
      } else {
        toast.error(data.error || 'تعذر فتح صفحة المحادثات');
      }
    } catch {
      toast.error('حدث خطأ أثناء فتح المحادثة');
    }
  };

  // Quick negotiation: opens a conversation with a price-aware opener
  const handleNegotiate = async () => {
    if (!currentUser) {
      toast.error('يرجى تسجيل الدخول أولاً للتفاوض مع البائع');
      router.push('/auth/login');
      return;
    }
    if (!car) return;
    if (currentUser.id === car.user.id) {
      toast.error('أنت صاحب هذا الإعلان');
      return;
    }
    try {
      const priceTxt = car.price.toLocaleString('ar-JO');
      const res = await fetch('/api/conversations', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          carId: car.id,
          sellerId: car.user.id,
          content: `مرحباً، أعجبتني سيارتك (${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}) المعروضة بسعر ${priceTxt} د.أ. هل السعر نهائي أم يوجد مجال للتفاوض؟ `,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.conversation?.id) {
        toast.success('فتحنا لك محادثة التفاوض مع البائع');
        router.push(`/messages?conversationId=${data.data.conversation.id}`);
      } else {
        toast.error(data.error || 'تعذر فتح المحادثة');
      }
    } catch {
      toast.error('حدث خطأ أثناء فتح المحادثة');
    }
  };

  const handleTestDriveRequest = async () => {    if (!currentUser) {
      toast.error('يرجى تسجيل الدخول أولاً لطلب اختبار القيادة');
      router.push('/auth/login');
      return;
    }
    if (!car) return;
    if (currentUser.id === car.user.id) {
      toast.error('أنت صاحب هذا الإعلان، لا يمكنك تجربة سيارتك الخاصة');
      return;
    }
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          carId: car.id,
          sellerId: car.user.id,
          content: ` **طلب حجز موعد اختبار قيادة ومعاينة:**\nمرحباً، أرغب في حجز موعد لتجربة واختبار قيادة السيارة (${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} موديل ${car.year}). يرجى تحديد الوقت والمكان المناسبين للمعاينة. شكراً!`,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.conversation?.id) {
        toast.success('تم إرسال طلب اختبار القيادة للبائع بنجاح! جاري التوجيه للمحادثة...');
        router.push(`/messages?conversationId=${data.data.conversation.id}`);
      } else {
        toast.error(data.error || 'تعذر إرسال الطلب');
      }
    } catch {
      toast.error('حدث خطأ أثناء إرسال الطلب');
    }
  };

  if (loading || (leaving && car)) {
    return <CarDriveLoader leaving={!loading} />;
  }

  if (loadError || !car) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto text-3xl">
            
          </div>
          <h2 className="text-xl font-bold text-white">تعذر تحميل الإعلان</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            قد يكون الإعلان محذوفاً أو تم نقله. تحقق من الاتصال بالشبكة وأعد المحاولة.
          </p>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => loadCar(params.id as string, false)} className="flex-1">
              <RefreshCw className="w-4 h-4 ml-1" />
              إعادة المحاولة
            </Button>
            <Button variant="ghost" onClick={() => router.push('/cars')} className="flex-1">
              تصفح السيارات
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const allImages = car.images?.length > 0 ? car.images : (car.coverImage ? [{ url: car.coverImage }] : []);
  const inCompare = isInCompare(car.id);

  const specItems = [
    { icon: Calendar, label: 'سنة الصنع', value: car.year },
    { icon: Gauge, label: 'عداد المسافة', value: formatDistance(car.kilometers) },
    { icon: Fuel, label: 'نوع الوقود', value: getFuelTypeLabel(car.fuelType) },
    { icon: Settings, label: 'ناقل الحركة', value: getTransmissionLabel(car.transmission) },
    { icon: Palette, label: 'اللون', value: car.color },
    { icon: DoorOpen, label: 'عدد الأبواب', value: car.doors },
    { icon: Cpu, label: 'سعة المحرك', value: car.engineCapacity ? `${car.engineCapacity} CC` : 'غير محدد' },
    { icon: Zap, label: 'القدرة', value: (car as any).horsepower ? `${(car as any).horsepower} HP` : 'غير محدد' },
    { icon: Gauge, label: 'التسارع 0-100', value: (car as any).acceleration ? `${(car as any).acceleration} ثانية` : 'غير محدد' },
    { icon: Bike, label: 'نوع الدفع', value: getDrivetrainLabel(car.drivetrain) },
    { icon: MapPin, label: 'المحافظة', value: car.city?.nameAr || 'غير محدد' },
    { icon: Building2, label: 'الشركة', value: car.brand?.nameAr },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      
      {/* Photo Gallery Container */}
      <div className="relative bg-slate-900 border-b border-slate-800">
        <div className="container-custom max-w-6xl py-4 sm:py-6">
          <div
            className="relative h-[55vh] sm:h-[65vh] rounded-3xl overflow-hidden cursor-pointer bg-slate-950 border border-slate-800 group shadow-2xl"
            onClick={() => { setLightboxIndex(currentImage); setLightboxOpen(true); }}
          >
            {allImages.length > 0 ? (
              <>
                <Image
                  src={allImages[currentImage]?.url || '/images/placeholder-car.svg'}
                  alt={`${car.brand?.nameAr} ${car.model?.nameAr}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                  sizes="100vw"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

                {/* Top Badges Bar */}
                <div className="absolute top-4 right-4 left-4 flex items-center justify-between pointer-events-none z-10">
                  <div className="flex items-center gap-2">
                    {car.featured && (
                      <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black shadow-lg">
                         إعلان مميز
                      </span>
                    )}
                    {car.hasWarranty && (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/90 text-slate-950 text-xs font-black backdrop-blur-md">
                         تحت الكفالة
                      </span>
                    )}
                    {(car as any).inspectionVerified && (
                      <span className="px-3 py-1.5 rounded-xl bg-blue-500/90 text-white text-xs font-black backdrop-blur-md" title={(car as any).inspectionCenter || ''}>
                         فحص معتمد{(car as any).inspectionCenter ? `: ${(car as any).inspectionCenter}` : ''}
                      </span>
                    )}
                  </div>

                  {car.refCode && (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 text-white text-xs font-mono font-bold border border-slate-800 backdrop-blur-md">
                      #{car.refCode}
                    </span>
                  )}
                </div>

                {/* SEO: structured data for search engines */}
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      '@context': 'https://schema.org',
                      '@type': 'Car',
                      name: `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`,
                      model: car.model?.nameAr,
                      brand: { '@type': 'Brand', name: car.brand?.nameAr },
                      vehicleModelDate: String(car.year),
                      mileageFromOdometer: { '@type': 'QuantitativeValue', value: car.kilometers, unitCode: 'KMT' },
                      fuelType: car.fuelType,
                      vehicleTransmission: car.transmission,
                      color: car.color,
                      offers: {
                        '@type': 'Offer',
                        price: car.price,
                        priceCurrency: 'JOD',
                        availability: 'https://schema.org/InStock',
                      },
                      image: allImages.map((img: any) => img?.url).filter(Boolean).slice(0, 5),
                    }),
                  }}
                />

                {/* Expand Click Badge */}
                <div className="absolute top-16 right-1/2 translate-x-1/2 z-10">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 text-xs backdrop-blur-md font-bold">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>انقر لتكبير الصور ملء الشاشة </span>
                  </div>
                </div>

                {/* Slider Nav Buttons */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImage(prev => (prev - 1 + allImages.length) % allImages.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-slate-950/80 border border-slate-800 text-white flex items-center justify-center hover:bg-emerald-500 hover:text-slate-950 transition-all z-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImage(prev => (prev + 1) % allImages.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-slate-950/80 border border-slate-800 text-white flex items-center justify-center hover:bg-emerald-500 hover:text-slate-950 transition-all z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Bottom Image Counter & Thumbnails Slider */}
                <div className="absolute bottom-4 right-4 left-4 flex items-center justify-between z-10">
                  <span className="px-3 py-1 rounded-xl bg-slate-950/80 text-xs font-bold text-slate-300 border border-slate-800 backdrop-blur-md">
                    الصورة {currentImage + 1} من {allImages.length}
                  </span>

                  {/* Thumbnail Row */}
                  <div className="hidden sm:flex items-center gap-2 overflow-x-auto">
                    {allImages.slice(0, 6).map((img, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setCurrentImage(i); }}
                        className={`w-14 h-10 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                          i === currentImage ? 'border-emerald-400 scale-105 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Image src={img.url || '/images/placeholder-car.svg'} alt="" width={56} height={40} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm font-bold">
                لا توجد صور لهذه السيارة
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Body Details Grid */}
      <div className="container-custom max-w-6xl pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Left Column (Content) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Title & Price Header Card */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">
                    {car.brand?.nameAr} {car.model?.nameAr} {car.year}
                  </h1>
                  <p className="text-slate-400 text-xs font-semibold mt-1">
                    {car.trim || `${car.brand?.nameEn} ${car.model?.nameEn}`}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-emerald-400" /> {car.views || 0} مشاهدة</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-teal-400" /> {formatDate(car.createdAt)}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-cyan-400" /> {car.city?.nameAr}</span>
                  </div>
                </div>

                <div className="sm:text-left">
                  <div className="text-3xl font-black text-emerald-400">
                    {formatPrice(car.price)}
                  </div>
                  <div className="flex items-center justify-start sm:justify-end gap-2 mt-1">
                    <PriceFairnessIndicator price={car.price} fairPriceEstimate={liveFairPrice} size="md" />
                    {car.isNegotiable && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-bold">
                        قابل للتفاوض 
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Desktop Quick Actions Bar */}
              <div className="hidden sm:flex flex-wrap items-center gap-2 pt-2">
                <Button icon={<Phone className="w-4 h-4" />} onClick={() => window.location.href = `tel:${car.phone}`}>
                  اتصال: {car.phone}
                </Button>
                
                {car.whatsapp && (
                  <Button variant="secondary" icon={<MessageCircle className="w-4 h-4" />}
                    onClick={() => window.open(`https://wa.me/${(car.whatsapp || '').replace(/^0/, '962')}`, '_blank')}>
                    واتساب
                  </Button>
                )}

                <Button variant="ghost" icon={<MessageSquare className="w-4 h-4 text-emerald-400" />} onClick={handleSendMessage}>
                  إرسال رسالة عبر الموقع 
                </Button>

                <Button variant="ghost" icon={<CarIcon className="w-4 h-4 text-amber-400" />} onClick={handleTestDriveRequest}>
                  طلب اختبار قيادة 
                </Button>

                <Button variant="ghost" icon={<Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />} onClick={toggleFavorite}>
                  {isSaved ? 'محفوظة ' : 'حفظ'}
                </Button>

                <Button variant="ghost" icon={<Share2 className="w-4 h-4" />} onClick={handleShare}>
                  مشاركة
                </Button>

                {isOwner && (
                  <>
                    <Link href={`/cars/${car?.id}/edit`}>
                      <Button variant="ghost" icon={<Pencil className="w-4 h-4 text-blue-400" />}>
                        تعديل الإعلان
                      </Button>
                    </Link>
                    <Button variant="ghost" icon={<Trash2 className="w-4 h-4 text-rose-400" />} onClick={handleDeleteCar}>
                      حذف الإعلان
                    </Button>
                  </>
                )}
              </div>

            </div>

            {/* Unified Fair Market Valuation & AI Analysis Engine */}
            <ValuationReport carId={car.id} askingPrice={car.price} onValuationLoaded={setLiveFairPrice} />

            {/* Specifications Matrix Grid */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <h3 className="font-black text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
                <Cpu className="w-5 h-5 text-emerald-400" />
                المواصفات الفنية الكاملة
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specItems.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                      <item.icon className="w-4 h-4 text-emerald-400" />
                      <span>{item.label}</span>
                    </div>
                    <p className="font-bold text-white text-xs sm:text-sm truncate">
                      {item.value || 'غير محدد'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Jordanian Inspection Report Component */}
            <JordanianInspectionReport score={(car as any).aiConditionReport || '7 جيد'} />

            {/* Features */}
            {(() => {
              const feats = sanitizeFeatures((car as any).features);
              if (!feats.length) return null;
              return (
                <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                  <h3 className="font-black text-white text-base border-b border-slate-800 pb-3">المواصفات والمزايا ({feats.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {feats.map((f: string) => (
                      <span key={f} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                        {CAR_FEATURES_AR[f] || f}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Customs Calculator */}
            <CustomsCalculator year={car.year} engineCapacity={car.engineCapacity ?? null} price={car.price} fuelType={car.fuelType} />

            {/* Vehicle Description */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
              <h3 className="font-black text-white text-base border-b border-slate-800 pb-3">الوصف التفصيلي للإعلان</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium">
                {sanitizePlainText(car.aiDescription || car.description)}
              </p>
            </div>

            {/* Comments & Discussion */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <h3 className="font-black text-white text-base border-b border-slate-800 pb-3">تعليقات واستفسارات المشترين</h3>
              <Suspense fallback={<SectionSpinner />}>
                <CarComments carId={car.id} currentUser={currentUser} />
              </Suspense>
            </div>

          </div>

          {/* Right Sidebar Column (Seller & Location) */}
          <div className="space-y-6">
            
            {/* Seller Contact Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl sticky top-24">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Link href={`/profile/${car.user.id}`} className="shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                    {car.user?.image ? (
                      <img src={car.user.image} alt="" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      car.user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${car.user.id}`}>
                    <h4 className="font-black text-white text-base hover:text-emerald-400 transition-colors truncate">
                      {car.user?.dealerName || car.user?.name}
                    </h4>
                  </Link>
                  <p className="text-slate-400 text-xs font-semibold">بائع في كارس جو</p>
                </div>
              </div>

              {/* Action Buttons inside Seller Card */}
              <div className="space-y-2.5">
                <Button className="w-full h-12 text-sm font-black" icon={<Phone className="w-4.5 h-4.5" />} onClick={() => window.location.href = `tel:${car.phone}`}>
                  اتصال: {car.phone}
                </Button>

                {car.whatsapp && (
                  <Button variant="secondary" className="w-full h-12 text-sm font-black" icon={<MessageCircle className="w-4.5 h-4.5 text-emerald-400" />}
                    onClick={() => window.open(`https://wa.me/${(car.whatsapp || '').replace(/^0/, '962')}`, '_blank')}>
                    مراسلة عبر الواتساب
                  </Button>
                )}

                {/* Quick Negotiation */}
                <button
                  type="button"
                  onClick={handleNegotiate}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  <Handshake className="w-4.5 h-4.5" />
                  <span>تفاوض على السعر </span>
                </button>

                {/* Send Message on Website */}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="w-full h-12 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                  <span>إرسال رسالة عبر الموقع </span>
                </button>

                {/* Request Test Drive */}
                <button
                  type="button"
                  onClick={handleTestDriveRequest}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <CarIcon className="w-4.5 h-4.5" />
                  <span>طلب اختبار قيادة </span>
                </button>
              </div>

              {/* Inspection / Booking Request */}
              {car.status === 'APPROVED' && (!currentUser || currentUser.id !== car.user.id) && (
                <button
                  onClick={() => setBookingOpen(true)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs hover:from-emerald-400 hover:to-teal-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>طلب معاينة / حجز فحص </span>
                </button>
              )}

              {/* Location Map */}
              {car.locationLat && car.locationLng && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-300">موقع معاينة السيارة</label>
                  <div className="h-44 rounded-2xl overflow-hidden border border-slate-800 relative">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${car.locationLng - 0.015}%2C${car.locationLat - 0.01}%2C${car.locationLng + 0.015}%2C${car.locationLat + 0.01}&layer=mapnik&marker=${car.locationLat}%2C${car.locationLng}`}
                      className="w-full h-full border-0"
                      title="موقع المعاينة"
                    />
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Similar Cars Section */}
        {similarCars.length > 0 && (
          <section className="mt-16 space-y-6">
            <h2 className="text-2xl font-black text-white">سيارات مشابهة قد تهمك </h2>
            <CarGrid cars={similarCars} columns={4} />
          </section>
        )}
      </div>

      {/*  Sticky Mobile Bottom Floating Contact Bar (فقط للهواتف) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-2.5 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800 md:hidden shadow-2xl">
        <div className="grid grid-cols-4 gap-1.5">
          
          <a
            href={`tel:${car.phone}`}
            className="h-11 rounded-xl bg-emerald-500 text-slate-950 font-black text-[11px] flex flex-col items-center justify-center gap-0.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>اتصال</span>
          </a>

          {car.whatsapp && (
            <a
              href={`https://wa.me/${(car.whatsapp || '').replace(/^0/, '962')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 rounded-xl bg-teal-600 text-white font-black text-[11px] flex flex-col items-center justify-center gap-0.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </a>
          )}

          <button
            onClick={handleSendMessage}
            className="h-11 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-extrabold text-[11px] flex flex-col items-center justify-center gap-0.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>رسالة</span>
          </button>

          <button
            onClick={handleTestDriveRequest}
            className="h-11 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] flex flex-col items-center justify-center gap-0.5"
          >
            <CarIcon className="w-3.5 h-3.5" />
            <span>تجربة</span>
          </button>

        </div>
      </div>

      {/* Modals */}
      <ReportModal carId={car.id} carTitle={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`} isOpen={reportOpen} onClose={() => setReportOpen(false)} />
      <BookingModal carId={car.id} carTitle={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`} askingPrice={car.price} dealerName={car.user?.dealerName || car.user?.name} isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />

      {/* Lightbox Viewer */}
      {lightboxOpen && allImages.length > 0 && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 flex flex-col" onClick={() => setLightboxOpen(false)}>
          <div className="flex items-center justify-between p-4 text-white">
            <button onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }} className="p-2 rounded-xl bg-slate-900 text-slate-300">
              <X className="w-6 h-6" />
            </button>
            <span className="text-sm font-bold">{lightboxIndex + 1} / {allImages.length}</span>
            <div className="w-10" />
          </div>

          <div className="flex-1 flex items-center justify-center p-4 relative" onClick={(e) => e.stopPropagation()}>
            <Image
              src={allImages[lightboxIndex]?.url || '/images/placeholder-car.svg'}
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

    </div>
  );
}
