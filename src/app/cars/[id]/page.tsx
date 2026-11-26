'use client';

import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CarGrid } from '@/components/cars/CarGrid';
import {
  Phone, MessageCircle, Share2, Flag, Heart, MapPin, Fuel, Gauge,
  Calendar, Settings, ChevronLeft, ChevronRight, Maximize2,
  AlertTriangle, Eye, Clock, Building2, Palette, DoorOpen, Cpu, Bike,
  Loader2, GitCompare, Trash2, Car as CarIcon, X, RefreshCw, CalendarCheck,
  Zap, MessageSquare, Handshake, Pencil, Play, ArrowRight, CheckCircle2,
  Sparkles, Calculator, FileCheck2
} from 'lucide-react';
import { formatPrice, formatDistance, getFuelTypeLabel, getTransmissionLabel, getDrivetrainLabel, formatDate } from '@/lib/utils';
import { CarDriveLoader } from '@/components/cars/CarDriveLoader';
import { getCachedCarDetail, setCachedCarDetail } from '@/lib/car-detail-cache';
import { CustomsCalculator } from '@/components/cars/CustomsCalculator';
import { useAuth } from '@/hooks/useAuth';
import { useCompareStore } from '@/store';
import { ReportModal } from '@/components/cars/ReportModal';
import { BookingModal } from '@/components/cars/BookingModal';
import { PriceFairnessIndicator } from '@/components/cars/PriceFairnessIndicator';
import type { Car } from '@/types';
import { fetchWithRetry } from '@/lib/fetch-retry';
import toast from 'react-hot-toast';
import { sanitizePlainText } from '@/lib/sanitize';
import JordanianInspectionReport from '@/components/cars/JordanianInspectionReport';
import CarDocumentsSection from '@/components/cars/CarDocumentsSection';
import { ValuationReport } from '@/components/cars/ValuationReport';
import { HoldButton } from '@/components/ui/HoldButton';
import { CAR_FEATURES_AR, sanitizeFeatures } from '@/lib/car-features';

const CarComments = lazy(() => import('@/components/cars/CarComments').then(m => ({ default: m.CarComments })));

function SectionSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-[#ffc640]" />
    </div>
  );
}

// The inspection card must show the value the seller actually picked. Prefer
// the persisted chip (aiConditionReport); older listings only carry it inside
// the description line ("- تقرير الفحص: …"). When neither exists we show no
// score instead of inventing a "7 جيد" the seller never claimed.
function resolveInspectionScore(car: { aiConditionReport?: string | null; description?: string | null } | null | undefined): string | undefined {
  const persisted = (car?.aiConditionReport || '').trim();
  if (persisted) return persisted;
  const m = /- تقرير الفحص:\s*([^\r\n]+)/.exec(car?.description || '');
  return m ? m[1].trim() : undefined;
}

const QUICK_NAV_SECTIONS = [
  { id: 'section-valuation', label: 'التقييم والسعر', icon: Sparkles },
  { id: 'section-specs', label: 'المواصفات', icon: Cpu },
  { id: 'section-inspection', label: 'الفحص والوثائق', icon: FileCheck2 },
  { id: 'section-customs', label: 'حاسبة الجمرك', icon: Calculator },
  { id: 'section-description', label: 'الوصف', icon: CarIcon },
  { id: 'section-comments', label: 'التعليقات', icon: MessageSquare },
];

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
  const [bookingOpen, setBookingOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [liveFairPrice, setLiveFairPrice] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<string>('section-valuation');
  const chatSubmittingRef = useRef(false);
  const touchStartX = useRef<number | null>(null);

  const applyCarData = (data: any) => {
    setCar(data);
    setIsSaved(data.isFavorited || false);
    document.title = `${data.brand?.nameAr || ''} ${data.model?.nameAr || ''} ${data.year} | كارس جو JO Cars`;
  };

  const loadCar = (carId: string, trackView: boolean) => {
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

  useEffect(() => {
    if (loading) sawLoader.current = true;
  }, [loading]);

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
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [car]);

  const allImages = car?.images?.length ? car.images : (car?.coverImage ? [{ url: car.coverImage }] : []);

  useEffect(() => {
    if (!lightboxOpen || allImages.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setLightboxIndex(prev => (prev + 1) % allImages.length);
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => (prev - 1 + allImages.length) % allImages.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, allImages.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleGalleryTouchEnd = (e: React.TouchEvent, isLightbox = false) => {
    if (touchStartX.current === null || allImages.length <= 1) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(diff) < 40) return;
    const setter = isLightbox ? setLightboxIndex : setCurrentImage;
    if (diff > 0) {
      setter(prev => (prev + 1) % allImages.length);
    } else {
      setter(prev => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${car?.brand?.nameAr} ${car?.model?.nameAr}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ رابط الإعلان');
    }
  };

  const isOwner = !!currentUser && !!car && (currentUser.id === (car as any).userId || currentUser.id === (car as any).user?.id);

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
      else toast.success(!prev ? 'تمت إضافة السيارة إلى المفضلة' : 'تمت إزالة السيارة من المفضلة');
    } catch {
      setIsSaved(prev);
    }
  };

  const startSellerChat = async (mode: 'message' | 'negotiate' | 'testdrive') => {
    if (!currentUser) {
      const msgs = {
        message: 'يرجى تسجيل الدخول أولاً لإرسال رسالة للمالك',
        negotiate: 'يرجى تسجيل الدخول أولاً للتفاوض مع البائع',
        testdrive: 'يرجى تسجيل الدخول أولاً لطلب اختبار القيادة',
      };
      toast.error(msgs[mode]);
      router.push('/auth/login');
      return;
    }
    if (!car) return;
    const sellerId = car.user?.id || (car as any).userId;
    if (!sellerId) {
      toast.error('معلومات البائع غير متوفرة');
      return;
    }
    if (currentUser.id === sellerId) {
      toast.error('أنت صاحب هذا الإعلان');
      return;
    }
    if (actionLoading || chatSubmittingRef.current) return;
    chatSubmittingRef.current = true;
    setActionLoading(mode);

    const priceTxt = car.price.toLocaleString('ar-JO');
    const contentMap = {
      message: `مرحباً، أنا مهتم بسيارتك المعروضة (${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} موديل ${car.year}). يرجى التواصل لمناقشة التفاصيل.`,
      negotiate: `مرحباً، أعجبتني سيارتك (${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}) المعروضة بسعر ${priceTxt} د.أ. هل السعر نهائي أم يوجد مجال للتفاوض؟`,
      testdrive: `طلب حجز موعد اختبار قيادة ومعاينة:\nمرحباً، أرغب في حجز موعد لتجربة واختبار قيادة السيارة (${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} موديل ${car.year}). يرجى تحديد الوقت والمكان المناسبين للمعاينة. شكراً!`,
    };
    const successMap = {
      message: 'جاري توجيهك للمحادثة مع البائع...',
      negotiate: 'فتحنا لك محادثة التفاوض مع البائع',
      testdrive: 'تم إرسال طلب اختبار القيادة للبائع بنجاح!',
    };

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ carId: car.id, sellerId, content: contentMap[mode] }),
      });
      const data = await res.json();
      if (data.success && data.data?.conversation?.id) {
        toast.success(successMap[mode]);
        router.push(`/messages?conversationId=${data.data.conversation.id}`);
      } else {
        toast.error(data.error || 'تعذر فتح المحادثة');
      }
    } catch {
      toast.error('حدث خطأ أثناء فتح المحادثة');
    } finally {
      chatSubmittingRef.current = false;
      setActionLoading(null);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveNav(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading || (leaving && car)) {
    return <CarDriveLoader leaving={!loading} />;
  }

  if (loadError || !car) {
    return (
      <div className="min-h-screen bg-[#0e1013] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#14181f] border border-white/[0.08] text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">تعذر تحميل الإعلان</h2>
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

  const inCompare = isInCompare(car.id);
  const whatsappUrl = car.whatsapp
    ? `https://wa.me/${(car.whatsapp || '').replace(/^0/, '962')}?text=${encodeURIComponent(`مرحباً، بخصوص إعلان ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year} على كارس جو`)}`
    : null;

  const toggleCompare = () => {
    if (inCompare) {
      removeCar(car.id);
      toast.success('تمت إزالة السيارة من المقارنة');
    } else {
      addCar(car);
      toast.success('تمت إضافة السيارة للمقارنة');
    }
  };

  const quickHighlights = [
    { icon: Calendar, label: 'السنة', value: car.year },
    { icon: Gauge, label: 'المسافة', value: formatDistance(car.kilometers) },
    { icon: Fuel, label: 'الوقود', value: getFuelTypeLabel(car.fuelType) },
    { icon: Settings, label: 'الجير', value: getTransmissionLabel(car.transmission) },
    { icon: MapPin, label: 'الموقع', value: car.city?.nameAr || 'الأردن' },
  ];

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

  const feats = sanitizeFeatures((car as any).features);

  const SellerActionsBlock = ({ compact = false }: { compact?: boolean }) => (
    <div className="space-y-2.5">
      <div className={compact ? 'grid grid-cols-2 gap-2' : 'space-y-2.5'}>
        <Button
          className="w-full h-11 sm:h-12 text-xs sm:text-sm font-black bg-[#ffc640] hover:bg-[#ffd266] text-[#0e1013] border-0 shadow-lg shadow-[#ffc640]/15"
          icon={<Phone className="w-4 h-4" />}
          onClick={() => (window.location.href = `tel:${car.phone}`)}
        >
          {compact ? 'اتصال مباشر' : `اتصال: ${car.phone}`}
        </Button>

        {whatsappUrl && (
          <Button
            variant="secondary"
            className="w-full h-11 sm:h-12 text-xs sm:text-sm font-black bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300"
            icon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
            onClick={() => window.open(whatsappUrl, '_blank')}
          >
            {compact ? 'واتساب' : 'مراسلة عبر الواتساب'}
          </Button>
        )}
      </div>

      {!isOwner ? (
        <div className={compact ? 'grid grid-cols-2 gap-2' : 'space-y-2.5'}>
          <button
            type="button"
            onClick={() => startSellerChat('negotiate')}
            disabled={!!actionLoading}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-500/20 cursor-pointer disabled:opacity-60"
          >
            <Handshake className="w-4 h-4" />
            <span>{actionLoading === 'negotiate' ? 'جاري الفتح...' : 'تفاوض على السعر'}</span>
          </button>

          <button
            type="button"
            onClick={() => startSellerChat('message')}
            disabled={!!actionLoading}
            className="w-full h-11 rounded-2xl bg-[#0e1013] border border-white/10 hover:border-[#ffc640]/40 text-slate-200 hover:text-[#ffc640] font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            <MessageSquare className="w-4 h-4 text-[#ffc640]" />
            <span>{actionLoading === 'message' ? 'جاري التجهيز...' : 'رسالة عبر الموقع'}</span>
          </button>

          <button
            type="button"
            onClick={() => startSellerChat('testdrive')}
            disabled={!!actionLoading}
            className={`w-full h-11 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 ${compact ? 'col-span-2' : ''}`}
          >
            <CarIcon className="w-4 h-4" />
            <span>{actionLoading === 'testdrive' ? 'جاري الإرسال...' : 'طلب اختبار قيادة'}</span>
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-[#ffc640]/10 border border-[#ffc640]/25 text-center space-y-2">
          <p className="text-xs text-[#ffc640] font-bold">هذا إعلانك المعروض في كارس جو</p>
          <Link
            href={`/cars/${car.id}/edit`}
            className="w-full h-10 rounded-xl bg-[#ffc640] hover:bg-[#ffd266] text-[#0e1013] font-black text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Pencil className="w-4 h-4" />
            <span>تعديل بيانات الإعلان</span>
          </Link>
        </div>
      )}

      {car.status === 'APPROVED' && (!currentUser || !isOwner) && (
        <button
          type="button"
          onClick={() => setBookingOpen(true)}
          className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs hover:from-emerald-400 hover:to-teal-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <CalendarCheck className="w-4 h-4" />
          <span>طلب معاينة / حجز فحص</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0e1013] text-slate-100 pb-36 md:pb-20">
      {/* SEO: structured data */}
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
          }).replace(/</g, '\\u003c'),
        }}
      />

      {/* Top Breadcrumb & Quick Actions */}
      <div className="border-b border-white/[0.06] bg-[#111419]/80 backdrop-blur-md">
        <div className="container-custom max-w-6xl py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
            <Link
              href="/cars"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-bold transition-colors shrink-0"
            >
              <ArrowRight className="w-3.5 h-3.5 text-[#ffc640]" />
              <span>السيارات</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="truncate font-semibold text-slate-300">
              {car.brand?.nameAr} {car.model?.nameAr} {car.year}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleFavorite}
              title={isSaved ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
              className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSaved
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? 'محفوظة' : 'حفظ'}</span>
            </button>

            <button
              type="button"
              onClick={toggleCompare}
              title="مقارنة"
              className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                inCompare
                  ? 'bg-[#ffc640]/15 border-[#ffc640]/40 text-[#ffc640]'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{inCompare ? 'في المقارنة' : 'مقارنة'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              title="مشاركة"
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مشاركة</span>
            </button>

            {!isOwner && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                title="إبلاغ عن الإعلان"
                className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="bg-gradient-to-b from-[#111419] to-[#0e1013] border-b border-white/[0.06]">
        <div className="container-custom max-w-6xl py-3 sm:py-5 space-y-3">
          <div
            className="relative aspect-[16/10] sm:aspect-[16/9] lg:h-[540px] w-full rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer bg-[#0a0c0f] border border-white/[0.08] group shadow-2xl"
            onClick={() => { setLightboxIndex(currentImage); setLightboxOpen(true); }}
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleGalleryTouchEnd(e, false)}
          >
            {allImages.length > 0 ? (
              <>
                <Image
                  src={allImages[currentImage]?.url || '/images/placeholder-car.svg'}
                  alt={`${car.brand?.nameAr} ${car.model?.nameAr}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  priority
                  sizes="(max-width: 768px) 100vw, 1152px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e1013]/85 via-transparent to-[#0e1013]/35 pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-3 right-3 left-3 flex items-start justify-between gap-2 pointer-events-none z-10">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {car.featured && (
                      <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ffc640] to-amber-500 text-[#0e1013] text-[11px] font-black shadow-lg">
                        إعلان مميز
                      </span>
                    )}
                    {car.hasWarranty && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/90 text-slate-950 text-[11px] font-black backdrop-blur-md">
                        تحت الكفالة
                      </span>
                    )}
                    {(car as any).inspectionVerified && (
                      <span
                        className="px-2.5 py-1 rounded-lg bg-sky-500/90 text-white text-[11px] font-black backdrop-blur-md flex items-center gap-1"
                        title={(car as any).inspectionCenter || ''}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>فحص معتمد{(car as any).inspectionCenter ? `: ${(car as any).inspectionCenter}` : ''}</span>
                      </span>
                    )}
                  </div>

                  {car.refCode && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#0e1013]/80 text-slate-200 text-[11px] font-mono font-bold border border-white/10 backdrop-blur-md shrink-0">
                      #{car.refCode}
                    </span>
                  )}
                </div>

                {/* Nav Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="الصورة السابقة"
                      onClick={(e) => { e.stopPropagation(); setCurrentImage(prev => (prev - 1 + allImages.length) % allImages.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#0e1013]/75 border border-white/15 text-white flex items-center justify-center hover:bg-[#ffc640] hover:text-[#0e1013] transition-all z-10 backdrop-blur-md"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="الصورة التالية"
                      onClick={(e) => { e.stopPropagation(); setCurrentImage(prev => (prev + 1) % allImages.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#0e1013]/75 border border-white/15 text-white flex items-center justify-center hover:bg-[#ffc640] hover:text-[#0e1013] transition-all z-10 backdrop-blur-md"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Bottom Overlay Bar */}
                <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between z-10">
                  <span className="px-2.5 py-1 rounded-lg bg-[#0e1013]/80 text-[11px] font-bold text-slate-200 border border-white/10 backdrop-blur-md">
                    {currentImage + 1} / {allImages.length}
                  </span>

                  {/* Mobile Dots */}
                  {allImages.length > 1 && allImages.length <= 10 && (
                    <div className="flex sm:hidden items-center gap-1.5">
                      {allImages.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 rounded-full transition-all ${
                            i === currentImage ? 'w-4 bg-[#ffc640]' : 'w-1.5 bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e1013]/80 border border-white/10 text-slate-200 text-[11px] font-bold backdrop-blur-md">
                    <Maximize2 className="w-3.5 h-3.5 text-[#ffc640]" />
                    <span className="hidden sm:inline">ملء الشاشة</span>
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-sm font-bold gap-2">
                <CarIcon className="w-10 h-10 opacity-40" />
                <span>لا توجد صور لهذه السيارة</span>
              </div>
            )}
          </div>

          {/* Scrollable Thumbnail Strip (Mobile + Desktop) */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentImage(i)}
                  className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    i === currentImage
                      ? 'border-[#ffc640] ring-2 ring-[#ffc640]/25 opacity-100'
                      : 'border-white/10 opacity-55 hover:opacity-90'
                  }`}
                >
                  <Image src={img.url || '/images/placeholder-car.svg'} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Walkaround video attached at publish (car.videoUrl) */}
      {(car as any).videoUrl && (
        <div className="container-custom max-w-6xl pt-4">
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-[#14181f] border border-white/[0.08] shadow-xl">
            <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-white/[0.06]">
              <Play className="w-4 h-4 text-[#ffc640]" />
              <h3 className="font-black text-white text-sm sm:text-base">فيديو السيارة</h3>
            </div>
            <video
              src={(car as any).videoUrl}
              controls
              preload="metadata"
              playsInline
              poster={allImages[0]?.url}
              className="w-full max-h-[65vh] bg-black"
            >
              متصفحك لا يدعم تشغيل الفيديو
            </video>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container-custom max-w-6xl pt-5 sm:pt-7">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Main Column */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">

            {/* Hero Header Card: Title, Price & Key Highlights */}
            <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#14181f] border border-white/[0.08] space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/[0.06] pb-5">
                <div className="space-y-1.5">
                  <h1 className="text-xl sm:text-3xl font-black text-white leading-snug">
                    {car.brand?.nameAr} {car.model?.nameAr} {car.year}
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm font-semibold">
                    {car.trim || `${car.brand?.nameEn} ${car.model?.nameEn}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-[#ffc640]" /> {car.views || 0} مشاهدة</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400" /> {formatDate(car.createdAt)}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-sky-400" /> {car.city?.nameAr}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 bg-[#0e1013] sm:bg-transparent p-3.5 sm:p-0 rounded-2xl border border-white/[0.06] sm:border-0">
                  <div className="text-2xl sm:text-3xl font-black text-[#ffc640] tracking-tight">
                    {formatPrice(car.price)}
                  </div>
                  <div className="flex items-center gap-2">
                    <PriceFairnessIndicator price={car.price} fairPriceEstimate={liveFairPrice} size="md" />
                    {car.isNegotiable && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold">
                        قابل للتفاوض
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Key 5 Highlights Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {quickHighlights.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl bg-[#0e1013] border border-white/[0.06] flex items-center sm:flex-col sm:items-start gap-2.5 sm:gap-1 ${
                      idx === 4 ? 'col-span-2 sm:col-span-1' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#ffc640]/10 border border-[#ffc640]/20 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-[#ffc640]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 font-bold">{item.label}</p>
                      <p className="text-xs font-black text-white truncate">{item.value || 'غير محدد'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Owner Controls on Mobile + Desktop */}
              {isOwner && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.06]">
                  <Link href={`/cars/${car.id}/edit`} className="flex-1 sm:flex-none">
                    <Button className="w-full" variant="ghost" icon={<Pencil className="w-4 h-4 text-sky-400" />}>
                      تعديل الإعلان
                    </Button>
                  </Link>
                  <HoldButton
                    onComplete={handleDeleteCar}
                    holdDuration={2000}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>اضغط مطولاً للحذف</span>
                  </HoldButton>
                </div>
              )}
            </div>

            {/* Mobile-First Seller Contact Card (Visible immediately on Mobile, hidden on Desktop where sticky sidebar lives) */}
            <div className="lg:hidden p-5 rounded-2xl bg-[#14181f] border border-white/[0.08] space-y-4 shadow-xl">
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
                <Link href={`/profile/${car.user.id}`} className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffc640] to-amber-500 flex items-center justify-center text-[#0e1013] font-black text-lg shadow-md shrink-0 overflow-hidden">
                    {car.user?.image ? (
                      <img src={car.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      car.user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-white text-sm truncate">
                      {car.user?.dealerName || car.user?.name}
                    </h4>
                    <p className="text-slate-400 text-[11px] font-semibold">بائع موثق في كارس جو</p>
                  </div>
                </Link>
                <Link
                  href={`/profile/${car.user.id}`}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] font-bold text-slate-300 shrink-0"
                >
                  الملف الشخصي
                </Link>
              </div>
              <SellerActionsBlock compact />
            </div>

            {/* Sticky Section Jump Bar */}
            <div className="sticky top-[68px] z-30 -mx-1 px-1 py-2 bg-[#0e1013]/90 backdrop-blur-xl">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {QUICK_NAV_SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  const active = activeNav === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToSection(sec.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 border transition-all cursor-pointer ${
                        active
                          ? 'bg-[#ffc640] text-[#0e1013] border-[#ffc640] shadow-md shadow-[#ffc640]/15'
                          : 'bg-[#14181f] text-slate-300 border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Valuation & AI Analysis */}
            <div id="section-valuation" className="scroll-mt-32">
              <ValuationReport carId={car.id} askingPrice={car.price} car={car} onValuationLoaded={setLiveFairPrice} />
            </div>

            {/* Specifications Matrix */}
            <div id="section-specs" className="scroll-mt-32 p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#14181f] border border-white/[0.08] space-y-4 shadow-xl">
              <h3 className="font-black text-white text-base flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <Cpu className="w-5 h-5 text-[#ffc640]" />
                <span>المواصفات الفنية الكاملة</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {specItems.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-[#0e1013] border border-white/[0.06] space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                      <item.icon className="w-3.5 h-3.5 text-[#ffc640]" />
                      <span>{item.label}</span>
                    </div>
                    <p className="font-bold text-white text-xs sm:text-sm truncate">
                      {item.value || 'غير محدد'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspection & Documents */}
            <div id="section-inspection" className="scroll-mt-32 space-y-5 sm:space-y-6">
              <JordanianInspectionReport score={resolveInspectionScore(car)} />
              <CarDocumentsSection
                carId={car.id}
                hasLicenseDoc={!!(car as any).hasLicenseDoc}
                hasInspectionDoc={!!(car as any).hasInspectionDoc}
                hasServiceRecordDoc={!!(car as any).hasServiceRecordDoc}
                extraInspectionCount={Number((car as any).extraInspectionCount) || 0}
                canViewDocuments={isOwner || currentUser?.role === 'ADMIN'}
                verificationStatus={
                  (car as any).hasLicenseDoc && (car as any).hasInspectionDoc
                    ? (car.status === 'APPROVED' ? 'VERIFIED' : 'PENDING')
                    : (car.status === 'REJECTED' ? 'REJECTED' : 'NONE')
                }
              />
            </div>

            {/* Features */}
            {feats.length > 0 && (
              <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#14181f] border border-white/[0.08] space-y-3.5 shadow-xl">
                <h3 className="font-black text-white text-base border-b border-white/[0.06] pb-3">
                  المواصفات والمزايا ({feats.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {feats.map((f: string) => (
                    <span
                      key={f}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{CAR_FEATURES_AR[f] || f}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Customs Calculator */}
            <div id="section-customs" className="scroll-mt-32">
              <CustomsCalculator year={car.year} engineCapacity={car.engineCapacity ?? null} price={car.price} fuelType={car.fuelType} />
            </div>

            {/* Vehicle Description */}
            <div id="section-description" className="scroll-mt-32 p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#14181f] border border-white/[0.08] space-y-3 shadow-xl">
              <h3 className="font-black text-white text-base border-b border-white/[0.06] pb-3">الوصف التفصيلي للإعلان</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium">
                {sanitizePlainText(car.aiDescription || car.description)}
              </p>
            </div>

            {/* Mobile Location Map (if available) */}
            {car.locationLat && car.locationLng && (
              <div className="lg:hidden p-5 rounded-2xl bg-[#14181f] border border-white/[0.08] space-y-3 shadow-xl">
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#ffc640]" />
                  <span>موقع معاينة السيارة</span>
                </h3>
                <div className="h-48 rounded-2xl overflow-hidden border border-white/[0.08]">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${car.locationLng - 0.015}%2C${car.locationLat - 0.01}%2C${car.locationLng + 0.015}%2C${car.locationLat + 0.01}&layer=mapnik&marker=${car.locationLat}%2C${car.locationLng}`}
                    className="w-full h-full border-0"
                    title="موقع المعاينة"
                  />
                </div>
              </div>
            )}

            {/* Comments & Discussion */}
            <div id="section-comments" className="scroll-mt-32 p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#14181f] border border-white/[0.08] space-y-4 shadow-xl">
              <h3 className="font-black text-white text-base border-b border-white/[0.06] pb-3">تعليقات واستفسارات المشترين</h3>
              <Suspense fallback={<SectionSpinner />}>
                <CarComments carId={car.id} currentUser={currentUser} />
              </Suspense>
            </div>
          </div>

          {/* Desktop Right Sticky Sidebar */}
          <div className="hidden lg:block space-y-6">
            <div className="p-6 rounded-3xl bg-[#14181f] border border-white/[0.08] space-y-5 shadow-2xl sticky top-24">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
                <Link href={`/profile/${car.user.id}`} className="shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ffc640] to-amber-500 flex items-center justify-center text-[#0e1013] font-black text-xl shadow-lg overflow-hidden">
                    {car.user?.image ? (
                      <img src={car.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      car.user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${car.user.id}`}>
                    <h4 className="font-black text-white text-base hover:text-[#ffc640] transition-colors truncate">
                      {car.user?.dealerName || car.user?.name}
                    </h4>
                  </Link>
                  <p className="text-slate-400 text-xs font-semibold">بائع في كارس جو</p>
                </div>
              </div>

              <SellerActionsBlock />

              {car.locationLat && car.locationLng && (
                <div className="space-y-2 pt-3 border-t border-white/[0.06]">
                  <label className="block text-xs font-bold text-slate-300">موقع معاينة السيارة</label>
                  <div className="h-44 rounded-2xl overflow-hidden border border-white/[0.08] relative">
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

        {/* Similar Cars */}
        {similarCars.length > 0 && (
          <section className="mt-12 sm:mt-16 space-y-5">
            <h2 className="text-xl sm:text-2xl font-black text-white">سيارات مشابهة قد تهمك</h2>
            <CarGrid cars={similarCars} columns={4} />
          </section>
        )}
      </div>

      {/* Floating Mobile Contact Bar */}
      <div className="fixed bottom-[78px] left-3 right-3 z-40 p-2 rounded-2xl bg-[#14181f]/95 backdrop-blur-2xl border border-white/15 md:hidden shadow-2xl">
        {isOwner ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/cars/${car.id}/edit`}
              className="flex-1 h-11 rounded-xl bg-[#ffc640] text-[#0e1013] font-black text-xs flex items-center justify-center gap-1.5"
            >
              <Pencil className="w-4 h-4" />
              <span>تعديل الإعلان</span>
            </Link>
            <button
              type="button"
              onClick={handleShare}
              className="h-11 px-4 rounded-xl bg-white/[0.06] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <a
              href={`tel:${car.phone}`}
              className="flex-1 h-11 rounded-xl bg-[#ffc640] text-[#0e1013] font-black text-[11px] flex flex-col items-center justify-center gap-0.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>اتصال</span>
            </a>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-11 rounded-xl bg-emerald-500 text-slate-950 font-black text-[11px] flex flex-col items-center justify-center gap-0.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => startSellerChat('message')}
              disabled={!!actionLoading}
              className="flex-1 h-11 rounded-xl bg-white/[0.06] border border-white/10 text-slate-200 font-extrabold text-[11px] flex flex-col items-center justify-center gap-0.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#ffc640]" />
              <span>رسالة</span>
            </button>

            <button
              type="button"
              onClick={() => startSellerChat('negotiate')}
              disabled={!!actionLoading}
              className="flex-1 h-11 rounded-xl bg-violet-500/20 border border-violet-500/35 text-violet-200 font-black text-[11px] flex flex-col items-center justify-center gap-0.5"
            >
              <Handshake className="w-3.5 h-3.5 text-violet-300" />
              <span>تفاوض</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReportModal carId={car.id} carTitle={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`} isOpen={reportOpen} onClose={() => setReportOpen(false)} />
      <BookingModal carId={car.id} carTitle={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`} askingPrice={car.price} dealerName={car.user?.dealerName || car.user?.name} isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />

      {/* Enhanced Lightbox Viewer */}
      {lightboxOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-[200] bg-[#0a0c0f]/98 flex flex-col select-none"
          onClick={() => setLightboxOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => handleGalleryTouchEnd(e, true)}
        >
          <div className="flex items-center justify-between p-4 text-white border-b border-white/[0.06]">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
              className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-200">{lightboxIndex + 1} / {allImages.length}</span>
            <div className="w-10" />
          </div>

          <div className="flex-1 flex items-center justify-center p-4 relative" onClick={(e) => e.stopPropagation()}>
            <Image
              src={allImages[lightboxIndex]?.url || '/images/placeholder-car.svg'}
              alt=""
              fill
              className="object-contain"
              sizes="100vw"
            />
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(prev => (prev - 1 + allImages.length) % allImages.length)}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 border border-white/15 text-white flex items-center justify-center hover:bg-[#ffc640] hover:text-[#0e1013] transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(prev => (prev + 1) % allImages.length)}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 border border-white/15 text-white flex items-center justify-center hover:bg-[#ffc640] hover:text-[#0e1013] transition-all cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="p-3 border-t border-white/[0.06] flex items-center justify-center gap-2 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
              {allImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className={`relative w-14 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    i === lightboxIndex ? 'border-[#ffc640]' : 'border-white/10 opacity-50 hover:opacity-90'
                  }`}
                >
                  <Image src={img.url || '/images/placeholder-car.svg'} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
