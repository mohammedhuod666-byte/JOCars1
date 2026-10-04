'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { ConditionEditor } from '@/components/cars/ConditionEditor';
import type { ConditionItem } from '@/types';
import { useDropzone } from 'react-dropzone';
import {
  Car, Upload, Image as ImageIcon, X, Plus, Video, MapPin, ChevronDown,
  Sparkles, Loader2, AlertCircle, Check, Camera, Star, Search, ShieldCheck,
  Zap, Fuel, Gauge, DollarSign, Tag, CheckCircle2, ChevronRight, ChevronLeft, FileText,
  Info, RefreshCw, Layers
} from 'lucide-react';
import { MapPicker } from '@/components/cars/MapPicker';
import { compressImagesClient } from '@/lib/image-compress-client';
import { AIPriceEstimator } from '@/components/cars/AIPriceEstimator';
import toast from 'react-hot-toast';

interface Brand { id: string; nameAr: string; nameEn: string; slug: string; }
interface Model { id: string; nameAr: string; nameEn: string; slug: string; }
interface City { id: string; nameAr: string; nameEn: string; slug: string; }

type CarFormData = {
  brandId: string; modelId: string; year: number; trim: string;
  kilometers: number; fuelType: string; transmission: string; color: string;
  doors: number; engineCapacity: string; cylinders: string; drivetrain: string;
  horsepower: string; acceleration: string; features: string[];
  condition: string; bodyType: string; lightingType: string; rimType: string;
  vin: string; description: string; price: number; cityId: string;
  locationLat: string; locationLng: string; phone: string; whatsapp: string;
  isNegotiable: boolean; hasWarranty: boolean; hasServiceHistory: boolean;
  isDamaged: boolean; isPaintOriginal: boolean; ownerCount: number;
  isWholesale: boolean; // بيع جملة تاجر → تاجر
  platesNumber: string; videoUrl: string;
  // Jordanian Market Specific Features
  customsStatus: string; // مجمركة بالكامل / حرة غير مجمركة / إعفاء / تكسي
  batteryHealthSoh: string; // EV/Hybrid Battery SOH %
  electricRangeKm: string; // EV Range KM
  inspectionSummary: string; // فحص كامل 7 جيد / 4 جيد / دقة شاسي
  tradeOption: string; // للبيع فقط / قابل للبدل
  paymentMode: string; // كاش / أقساط
};

const initialForm: CarFormData = {
  brandId: '', modelId: '', year: new Date().getFullYear(), trim: '',
  kilometers: 0, fuelType: '', transmission: 'AUTOMATIC', color: 'أبيض',
  doors: 4, engineCapacity: '', cylinders: '', drivetrain: '',
  horsepower: '', acceleration: '', features: [],
  condition: 'EXCELLENT', bodyType: 'SEDAN', lightingType: 'LED', rimType: 'ALLOY',
  vin: '', description: '', price: 0, cityId: '',
  locationLat: '', locationLng: '', phone: '', whatsapp: '',
  isNegotiable: true, hasWarranty: true, hasServiceHistory: true,
  isDamaged: false, isPaintOriginal: true, ownerCount: 1,
  isWholesale: false,
  platesNumber: '', videoUrl: '',
  customsStatus: 'DUTY_PAID',
  batteryHealthSoh: '95',
  electricRangeKm: '400',
  inspectionSummary: 'فحص كامل 7 جيد',
  tradeOption: 'CASH_ONLY',
  paymentMode: 'CASH',
};

const CUSTOMS_OPTIONS = [
  { value: 'DUTY_PAID', label: 'مجمركة بالكامل ' },
  { value: 'FREE_ZONE', label: 'منطقة حرة (غير مجمركة) ' },
  { value: 'DISABLED_EXEMPTION', label: 'إعفاء ذوي الإحتياجات ' },
  { value: 'TAXI_SPECIAL', label: 'تكسي / تطبيقي مميز ' },
];

const INSPECTION_OPTIONS = [
  'فحص كامل 7 جيد',
  'فحص 4 جيد',
  '3 جيد وضربة شاسي أمامي',
  'قصعة دقة شاسي أمامي',
  'ميكانيك وكهرباء وكالة (بحاجة بودي)',
  'ملاحظات خفيفة بدون حوادث',
];

const TRADE_OPTIONS = [
  { value: 'CASH_ONLY', label: 'للبيع كاش فقط ' },
  { value: 'ALLOW_TRADE', label: 'قابل للبدل بسيارة أخرى ' },
  { value: 'INSTALLMENTS', label: 'إمكانية الأقساط بدفعة أولى ' },
];

import { CAR_FEATURES, CAR_FEATURES_AR } from '@/lib/car-features';

/**
 * Maps every server-validated field (carSchema in src/lib/validations.ts +
 * the POST /api/cars guards) to its Arabic label and the wizard step that
 * contains it, so a rejected publish can point at the exact field instead of
 * a generic "verify the selected fields" toast.
 */
const FIELD_META: Record<string, { label: string; step: number }> = {
  brandId: { label: 'الشركة المصنعة', step: 1 },
  modelId: { label: 'الموديل', step: 1 },
  year: { label: 'سنة الصنع', step: 1 },
  kilometers: { label: 'عداد الكيلومترات (الممشى)', step: 1 },
  fuelType: { label: 'نوع الوقود', step: 1 },
  transmission: { label: 'ناقل الحركة (الجير)', step: 1 },
  color: { label: 'لون السيارة', step: 1 },
  doors: { label: 'عدد الأبواب', step: 1 },
  engineCapacity: { label: 'سعة المحرك (CC)', step: 1 },
  cylinders: { label: 'عدد السلندر', step: 1 },
  horsepower: { label: 'القدرة بالحصان (HP)', step: 1 },
  acceleration: { label: 'التسارع 0-100 (ثانية)', step: 1 },
  drivetrain: { label: 'نوع الدفع', step: 1 },
  condition: { label: 'حالة السيارة', step: 1 },
  bodyType: { label: 'نوع الهيكل', step: 1 },
  features: { label: 'المواصفات الإضافية', step: 1 },
  vin: { label: 'رقم الهيكل (VIN)', step: 2 },
  description: { label: 'وصف السيارة', step: 2 },
  customsStatus: { label: 'حالة الجمرك', step: 2 },
  videoUrl: { label: 'رابط الفيديو', step: 3 },
  images: { label: 'صور السيارة', step: 3 },
  price: { label: 'السعر المطلوب (د.أ)', step: 4 },
  phone: { label: 'رقم الهاتف', step: 4 },
  whatsapp: { label: 'رقم الواتساب', step: 4 },
  cityId: { label: 'المحافظة', step: 4 },
  locationLat: { label: 'الموقع على الخريطة', step: 4 },
  locationLng: { label: 'الموقع على الخريطة', step: 4 },
  ownerCount: { label: 'عدد المالكين', step: 4 },
};

const fieldLabel = (field: string) => FIELD_META[field]?.label || field || 'البيانات المُدخلة';
const fieldStep = (field: string) => FIELD_META[field]?.step || 1;

/** Inline error line(s) rendered directly under the offending control(s). */
function FieldErrors({ fields, errors }: { fields: string[]; errors: Record<string, string> }) {
  const shown = fields.filter(f => errors[f]);
  if (!shown.length) return null;
  return (
    <>
      {shown.map(f => (
        <p key={f} id={`err-${f}`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[11px] font-bold text-rose-400">
          <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
          <span>
            <span className="text-rose-300">{fieldLabel(f)}:</span> {errors[f]}
          </span>
        </p>
      ))}
    </>
  );
}

export default function AddCarPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated, token } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  const [form, setForm] = useState<CarFormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState({ price: false, description: false });
  const [vinInfo, setVinInfo] = useState<any>(null);
  const [vinHistory, setVinHistory] = useState<any[]>([]);
  const [conditionDetails, setConditionDetails] = useState<ConditionItem[]>([]);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isAuthenticated) {
      if (user?.phone) setForm(f => ({ ...f, phone: user.phone || '' }));
      fetch('/api/cars/brands').then(r => r.json()).then(d => setBrands(d.data || [])).catch(() => {});
      fetch('/api/cars/cities').then(r => r.json()).then(d => setCities(d.data || [])).catch(() => {});
    }
  }, [isAuthenticated, _hydrated, router, user]);

  useEffect(() => {
    if (form.brandId) {
      fetch(`/api/cars/models?brandId=${form.brandId}`)
        .then(r => r.json()).then(d => setModels(d.data || [])).catch(() => setModels([]));
    } else {
      setModels([]);
    }
  }, [form.brandId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = [...images, ...acceptedFiles].slice(0, 20);
    setImages(newImages);
    setImagePreviews(newImages.map(f => URL.createObjectURL(f)));
  }, [images]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 10485760,
    maxFiles: 20,
    useFsAccessApi: false,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newImages.map(f => URL.createObjectURL(f)));
  };

  const updateForm = (field: keyof CarFormData, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // A field the user is fixing should stop showing a stale error.
    setErrors(prev => (prev[field] ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== field)) : prev));
    if (field === 'vin') {
      setVinInfo(null);
      setVinHistory([]);
    }
  };

  /** Show a set of field errors, jump to the step containing the first one and
   *  scroll it into view so "which field failed" is always answered on screen. */
  const applyErrors = (errMap: Record<string, string>) => {
    const entries = Object.entries(errMap).filter(([, m]) => !!m);
    if (!entries.length) return;
    const [firstField, firstMessage] = entries[0];
    setErrors(errMap);
    setStep(fieldStep(firstField));
    const where = entries.length === 1
      ? `${fieldLabel(firstField)}: ${firstMessage}`
      : `${fieldLabel(firstField)}: ${firstMessage} (+${entries.length - 1} حقول أخرى مظللة بالأسفل)`;
    toast.error(`يرجى التحقق من ${where}`, { duration: 7000, id: 'car-validation' });
    // Wait for the step panel to render before scrolling to the inline error.
    setTimeout(() => {
      const el = document.getElementById(`err-${firstField}`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        const focusable = el.parentElement?.querySelector<HTMLElement>('input, textarea, select');
        focusable?.focus({ preventScroll: true });
      }
    }, 120);
  };

  const handleAiDescription = async () => {
    if (!form.description || form.description.length < 15) {
      toast.error('يرجى كتابة لمحة أو وصف بسيط أولاً ليتم تحسينه');
      return;
    }
    setAiLoading(prev => ({ ...prev, description: true }));
    try {
      const res = await fetch('/api/ai/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          customsText: CUSTOMS_OPTIONS.find(c => c.value === form.customsStatus)?.label,
          inspectionText: form.inspectionSummary,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        updateForm('description', data.data.description);
        toast.success('تم تحسين وتنسيق الوصف بالذكاء الاصطناعي');
      }
    } catch {
      toast.error('تعذر تحسين الوصف');
    } finally {
      setAiLoading(prev => ({ ...prev, description: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side pre-check mirrors carSchema so the user gets the exact field
    // (label + step + inline message) instead of a generic toast.
    const pre: Record<string, string> = {};
    if (!form.brandId) pre.brandId = 'الشركة مطلوبة';
    if (!form.modelId) pre.modelId = 'الموديل مطلوب';
    if (!form.year || form.year < 1990 || form.year > 2030) pre.year = 'سنة الصنع يجب أن تكون بين 1990 و 2030';
    if (!form.price || form.price <= 0) pre.price = 'السعر المطلوب مطلوب ويجب أن يكون أكبر من صفر';
    if (!form.phone || !form.phone.trim()) pre.phone = 'رقم الهاتف مطلوب';
    if (!form.cityId) pre.cityId = 'المحافظة مطلوبة';
    if (!form.fuelType) pre.fuelType = 'يرجى اختيار نوع الوقود (بنزين / ديزل / هايبرد / كهرباء)';
    if (!form.transmission) pre.transmission = 'يرجى اختيار ناقل الحركة';
    if (!form.color || !form.color.trim()) pre.color = 'لون السيارة مطلوب';
    const engCap = parseFloat(form.engineCapacity);
    if (!form.engineCapacity || isNaN(engCap) || engCap < 500 || engCap > 10000) pre.engineCapacity = 'أدخل سعة المحرك بالـ CC (مثال 2000)';
    if (!form.cylinders) pre.cylinders = 'يرجى اختيار عدد السلندر';
    if (!form.drivetrain) pre.drivetrain = 'يرجى اختيار نوع الدفع (أمامي / خلفي / رباعي)';
    const hpVal = parseInt(form.horsepower);
    if (form.horsepower !== '' && (isNaN(hpVal) || hpVal < 50 || hpVal > 2000)) pre.horsepower = 'القدرة يجب أن تكون بين 50 و 2000 حصان';
    const accVal = parseFloat(form.acceleration);
    if (form.acceleration !== '' && (isNaN(accVal) || accVal < 2 || accVal > 30)) pre.acceleration = 'التسارع (0-100) يجب أن يكون بين 2 و 30 ثانية';
    if (form.description.trim().length < 20) pre.description = 'الوصف يجب أن يكون 20 حرفاً على الأقل';
    if (form.vin && form.vin.length !== 0 && form.vin.length !== 17) pre.vin = 'رقم الهيكل (VIN) يجب أن يكون 17 حرفاً، أو اتركه فارغاً';
    if (form.videoUrl && !/^https?:\/\/\S+$/i.test(form.videoUrl)) pre.videoUrl = 'رابط الفيديو غير صحيح — يجب أن يبدأ بـ http:// أو https://';
    if (Object.keys(pre).length) {
      applyErrors(pre);
      return;
    }
    // Total upload guard: Next.js truncates route-handler bodies at 10MB —
    // anything bigger dies server-side as an unparseable form. Compress
    // client-side first (WebP ≤1600px), then enforce the cap.
    setLoading(true);
    setErrors({});
    let sendImages = images;
    let sendCover = coverImage;
    try {
      const [imgs, cover] = await Promise.all([
        compressImagesClient(images),
        coverImage ? compressImagesClient([coverImage]) : null,
      ]);
      sendImages = imgs.files;
      if (cover) sendCover = cover.files[0] || null;
    } catch { /* compression best-effort; server validates anyway */ }
    const totalBytes = [...sendImages, ...(sendCover ? [sendCover] : []), ...(videoFile ? [videoFile] : [])]
      .reduce((n, f) => n + (f.size || 0), 0);
    const totalMB = totalBytes / 1024 / 1024;
    if (totalMB > 9) {
      setLoading(false);
      toast.error(`حجم الصور بعد الضغط كبير جداً (${totalMB.toFixed(1)}MB) — الحد 9MB. احذف بعض الصور ثم حاول مجدداً.`, { duration: 6000 });
      return;
    }

    try {
      const formData = new FormData();

      // Combine Jordanian custom attributes into description & conditionDetails
      let enrichedDescription = form.description || '';
      const customsLabel = CUSTOMS_OPTIONS.find(c => c.value === form.customsStatus)?.label || '';
      const tradeLabel = TRADE_OPTIONS.find(t => t.value === form.tradeOption)?.label || '';

      const jordanianSpecsText = `\n\n **مواصفات السوق الأردني والفحص:**\n- الجمرك: ${customsLabel}\n- تقرير الفحص: ${form.inspectionSummary}\n- خيارات البيع: ${tradeLabel}\n` +
        (form.fuelType === 'ELECTRIC' || form.fuelType === 'HYBRID' || form.fuelType === 'PLUGIN_HYBRID' ? `- صحة البطارية (SOH): ${form.batteryHealthSoh}%\n- مدى الشحنة: ${form.electricRangeKm} كم\n` : '');

      if (!enrichedDescription.includes('مواصفات السوق الأردني')) {
        enrichedDescription += jordanianSpecsText;
      }

      Object.entries({ ...form, description: enrichedDescription }).forEach(([key, value]) => {
        if (key === 'features' || key === 'horsepower' || key === 'acceleration') return; // handled below
        if (value !== '' && value !== null) formData.append(key, String(value));
      });
      formData.append('features', JSON.stringify(form.features));
      const hp = parseInt(form.horsepower);
      if (!isNaN(hp) && hp > 0) formData.append('horsepower', String(hp));
      const acc = parseFloat(form.acceleration);
      if (!isNaN(acc) && acc > 0) formData.append('acceleration', String(acc));

      if (conditionDetails.length > 0) formData.append('conditionDetails', JSON.stringify(conditionDetails));
      sendImages.forEach(img => formData.append('images', img));
      if (sendCover) formData.append('coverImage', sendCover);
      if (videoFile) formData.append('video', videoFile);

      const res = await fetch('/api/cars', {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        toast.success('تمت إضافة السيارة بنجاح! الإعلان قيد التفعيل والمراجعة.');
        router.push(`/cars/${data.data.slug || data.data.id}`);
      } else {
        if (data.details && Array.isArray(data.details) && data.details.length) {
          // 422 from carSchema: pin every rejected field (label + step + inline
          // message) and jump to the first one instead of a generic toast.
          const errMap: Record<string, string> = {};
          data.details.forEach((d: { field: string; message: string }) => {
            const key = (d.field || '').trim();
            if (key && !errMap[key]) errMap[key] = d.message;
          });
          if (Object.keys(errMap).length) applyErrors(errMap);
          else toast.error(data.error || 'يرجى التحقق من البيانات المدخلة');
        } else {
          toast.error(data.error || 'فشل إضافة السيارة', { duration: 7000, id: 'car-publish' });
        }
      }
    } catch {
      toast.error('حدث خطأ أثناء الاتصال بالنظام');
    } finally {
      setLoading(false);
    }
  };

  const selectedBrand = brands.find(b => b.id === form.brandId);
  const selectedModel = models.find(m => m.id === form.modelId);
  const isEVOrHybrid = form.fuelType === 'ELECTRIC' || form.fuelType === 'HYBRID' || form.fuelType === 'PLUGIN_HYBRID';

  const errorEntries = Object.entries(errors).filter(([, m]) => !!m);
  const stepErrors = (n: number) => errorEntries.filter(([f]) => fieldStep(f) === n);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 py-8">
      <div className="container-custom max-w-4xl space-y-6">
        
        {/* Header Title */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border border-slate-800 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                <Car className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white">إضافة إعلان سيارة للبيع</h1>
                <p className="text-slate-400 text-xs mt-0.5">اعرض سيارتك لأكثر من 50,000 مشتري شهرياً في الأردن</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>ميزات الذكاء الاصطناعي مفعلة</span>
            </div>
          </div>

          {/* Progress Steps Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-800/80">
            {[
              { num: 1, title: 'المعلومات الأساسية', icon: <Car className="w-4 h-4" /> },
              { num: 2, title: 'الفحص والجمرك', icon: <ShieldCheck className="w-4 h-4" /> },
              { num: 3, title: 'الصور والفيديو', icon: <Camera className="w-4 h-4" /> },
              { num: 4, title: 'السعر والموقع', icon: <DollarSign className="w-4 h-4" /> },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num)}
                className={`p-3 rounded-2xl border text-xs font-extrabold transition-all flex items-center gap-2 ${
                  step === s.num
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : step > s.num
                      ? 'bg-slate-900 border-slate-800 text-emerald-400'
                      : 'bg-slate-950/60 border-slate-900 text-slate-500'
                } ${stepErrors(s.num).length ? 'ring-2 ring-rose-500/80 border-rose-500/60' : ''}`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-mono ${
                  step === s.num ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {s.num}
                </div>
                <span className="truncate">{s.title}</span>
                {stepErrors(s.num).length > 0 && (
                  <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                    {stepErrors(s.num).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Validation summary — names the exact rejected fields (label + message + step)
              and jumps to them; the inline messages appear under each control. */}
          {errorEntries.length > 0 && (
            <div className="p-4 md:p-5 rounded-3xl border border-rose-500/40 bg-rose-950/40 space-y-2.5" role="alert" aria-live="assertive">
              <div className="flex items-center gap-2 text-rose-200 font-black text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>لم يُنشر الإعلان — عدّل الحقول التالية ({errorEntries.length})</span>
              </div>
              <ul className="space-y-1.5">
                {errorEntries.map(([f, m]) => (
                  <li key={f}>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(fieldStep(f));
                        setTimeout(() => {
                          const el = document.getElementById(`err-${f}`);
                          if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                        }, 80);
                      }}
                      className="w-full text-right flex items-start gap-2 text-xs font-bold text-rose-100 hover:text-white transition-colors group"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 group-hover:bg-rose-300" />
                      <span>
                        <span className="text-rose-300">{fieldLabel(f)}</span>
                        <span className="text-rose-200/90"> — {m}</span>
                        <span className="text-rose-400/80"> (الخطوة {fieldStep(f)})</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Car className="w-5 h-5 text-emerald-400" />
                  البيانات الرئيسية للسيارة
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Brand */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الشركة المصنعة (الماركة) *</label>
                  <select
                    value={form.brandId}
                    onChange={e => { updateForm('brandId', e.target.value); updateForm('modelId', ''); }}
                    className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">اختر الشركة</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
                  </select>
                  <FieldErrors fields={['brandId']} errors={errors} />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الموديل (الطراز) *</label>
                  <select
                    value={form.modelId}
                    disabled={!form.brandId}
                    onChange={e => updateForm('modelId', e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="">{form.brandId ? 'اختر الموديل' : 'اختر الشركة أولاً'}</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.nameAr}</option>)}
                  </select>
                  <FieldErrors fields={['modelId']} errors={errors} />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">سنة الصنع *</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={e => updateForm('year', parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500 font-bold"
                  />
                  <FieldErrors fields={['year']} errors={errors} />
                </div>

                {/* Kilometers */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">عداد الكيلومترات (الممشى) *</label>
                  <input
                    type="number"
                    value={form.kilometers}
                    onChange={e => updateForm('kilometers', parseInt(e.target.value) || 0)}
                    placeholder="مثال: 85000"
                    className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500 font-bold"
                  />
                  <FieldErrors fields={['kilometers']} errors={errors} />
                </div>

                {/* Trim */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الفئة / الإضافات</label>
                  <input
                    type="text"
                    value={form.trim}
                    onChange={e => updateForm('trim', e.target.value)}
                    placeholder="مثال: فل كامل سقف بانوراما، GLX"
                    className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">لون السيارة</label>
                  <input
                    type="text"
                    value={form.color}
                    onChange={e => updateForm('color', e.target.value)}
                    placeholder="أبيض لؤلؤي، أسود ملكي..."
                    className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500"
                  />
                  <FieldErrors fields={['color']} errors={errors} />
                </div>

              </div>

              {/* Fuel Type Chips */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">نوع المحرك والوقود *</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'HYBRID', label: 'هايبرد ' },
                    { id: 'ELECTRIC', label: 'كهرباء كاملة ' },
                    { id: 'PETROL', label: 'بنزين ' },
                    { id: 'DIESEL', label: 'ديزل ' },
                    { id: 'PLUGIN_HYBRID', label: 'بلق-إن ' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updateForm('fuelType', f.id)}
                      className={`p-3 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                        form.fuelType === f.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <FieldErrors fields={['fuelType']} errors={errors} />
              </div>

              {/* Transmission Chips */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">ناقل الحركة (الجير) *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'AUTOMATIC', label: 'أوتوماتيك ' },
                    { id: 'MANUAL', label: 'عادي / يدوي ' },
                    { id: 'CVT', label: 'CVT اقتصادي' },
                    { id: 'DCT', label: 'دبل كلتش DCT' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updateForm('transmission', t.id)}
                      className={`p-3 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                        form.transmission === t.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <FieldErrors fields={['transmission']} errors={errors} />
              </div>

              {/* Engine & Drivetrain */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">المحرك والدفع *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number" min="500" max="10000" step="100"
                    value={form.engineCapacity}
                    onChange={e => updateForm('engineCapacity', e.target.value)}
                    placeholder="سعة المحرك CC (مثال 2000)"
                    className="w-full p-3 rounded-2xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                  />
                  <select
                    value={form.cylinders}
                    onChange={e => updateForm('cylinders', e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="">عدد السلندر *</option>
                    {['2', '3', '4', '5', '6', '8', '10', '12'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="number" min="50" max="2000"
                    value={form.horsepower}
                    onChange={e => updateForm('horsepower', e.target.value)}
                    placeholder="القدرة (HP)"
                    className="w-full p-3 rounded-2xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number" min="2" max="30" step="0.1"
                    value={form.acceleration}
                    onChange={e => updateForm('acceleration', e.target.value)}
                    placeholder="تسارع 0-100 (ثانية)"
                    className="w-full p-3 rounded-2xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <FieldErrors fields={['engineCapacity', 'cylinders', 'horsepower', 'acceleration']} errors={errors} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'FWD', label: 'دفع أمامي FWD' },
                    { id: 'RWD', label: 'دفع خلفي RWD' },
                    { id: 'AWD', label: 'دفع رباعي AWD' },
                    { id: 'FOUR_WD', label: '4x4' },
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => updateForm('drivetrain', d.id)}
                      className={`p-3 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                        form.drivetrain === d.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <FieldErrors fields={['drivetrain']} errors={errors} />
              </div>

              {/* Features checklist */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">المواصفات والمزايا (اختياري — {form.features.length} محدد)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto p-1">
                  {CAR_FEATURES.map(f => {
                    const on = form.features.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => updateForm('features', on ? form.features.filter(x => x !== f) : [...form.features, f])}
                        className={`px-2 py-2 rounded-xl border text-[11px] font-bold transition-all text-right ${
                          on ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {on ? '✓ ' : ''}{CAR_FEATURES_AR[f]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EV / Hybrid Battery Specific Options */}
              {isEVOrHybrid && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Zap className="w-4 h-4" />
                    <span>مواصفات بطارية الهايبرد / الكهرباء (السوق الأردني):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">صحة البطارية (SOH %)</label>
                      <input
                        type="text"
                        value={form.batteryHealthSoh}
                        onChange={e => updateForm('batteryHealthSoh', e.target.value)}
                        placeholder="مثال: 95%"
                        className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">مدى الشحنة الواحدة (KM)</label>
                      <input
                        type="text"
                        value={form.electricRangeKm}
                        onChange={e => updateForm('electricRangeKm', e.target.value)}
                        placeholder="مثال: 450 كم"
                        className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <span>التالي: الفحص والجمرك</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

          {/* STEP 2: Customs & Inspection */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  حالة الجمرك وفحص الشاسي والميكانيك
                </h3>
              </div>

              {/* Customs Status */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">حالة الجمرك الأردني *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CUSTOMS_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateForm('customsStatus', c.value)}
                      className={`p-3.5 rounded-2xl border text-xs font-extrabold text-right transition-all flex items-center justify-between cursor-pointer ${
                        form.customsStatus === c.value
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{c.label}</span>
                      {form.customsStatus === c.value && <CheckCircle2 className="w-4 h-4 text-slate-950" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspection Quick Select */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">ملخص نتيجة الفحص الفني (الشاسي والميكانيك)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INSPECTION_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateForm('inspectionSummary', opt)}
                      className={`p-3 rounded-xl border text-xs font-bold text-right transition-all cursor-pointer ${
                        form.inspectionSummary === opt
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* VIN Checker Helper */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">رقم الشاسي (VIN) - اختياري لفك الميزات والحوادث</label>
                  {form.vin.length >= 11 && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/car-history/decode/${form.vin}`);
                          const d = await res.json();
                          if (d.success && d.data) {
                            setVinInfo(d.data);
                            toast.success('تم جلب بيانات ومواصفات الشاسي بنجاح!');
                          }
                        } catch {}
                      }}
                      className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors"
                    >
                      فك واستعلام الشاسي 
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={form.vin}
                  onChange={e => updateForm('vin', e.target.value.toUpperCase())}
                  placeholder="17 حرف/رقم رقم الشاسي..."
                  className="w-full h-11 px-4 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-emerald-500 font-mono tracking-widest uppercase"
                />
                <FieldErrors fields={['vin']} errors={errors} />

                {vinInfo && (
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs space-y-1 text-slate-300">
                    <p className="font-bold text-blue-400">بيانات الشاسي المكتشفة:</p>
                    <p>المصنع: {vinInfo.manufacturer} | الموديل: {vinInfo.model} | سنة: {vinInfo.year}</p>
                  </div>
                )}
              </div>

              {/* Vehicle Condition Features Checks */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { key: 'isNegotiable' as const, label: 'السعر قابل للتفاوض ' },
                  { key: 'hasWarranty' as const, label: 'تحت الكفالة والضمان ' },
                  { key: 'hasServiceHistory' as const, label: 'سجل صيانة بالوكالة ' },
                  { key: 'isPaintOriginal' as const, label: 'دهان أصلي وكالة ' },
                  { key: 'isDamaged' as const, label: 'مصدومة سابقاً ' },
                  { key: 'isWholesale' as const, label: 'بيع جملة لتاجر ' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key] as boolean}
                      onChange={e => updateForm(key, e.target.checked)}
                      className="w-4 h-4 rounded-md accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-300">{label}</span>
                  </label>
                ))}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">وصف وملاحظات إضافية عن السيارة</label>
                  <button
                    type="button"
                    onClick={handleAiDescription}
                    disabled={aiLoading.description}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                  >
                    {aiLoading.description ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>تحسين الوصف بالذكاء الاصطناعي</span>
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  placeholder="اكتب شرحاً عن الإضافات، الترخيص، سبب البيع..."
                  className="w-full p-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500 resize-none"
                />
                <FieldErrors fields={['description']} errors={errors} />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
                >
                  السابق
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <span>التالي: الصور والفيديو</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

          {/* STEP 3: Images & Video */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  رفع صور وفيديو السيارة (حتى 20 صورة)
                </h3>
              </div>

              {/* Cover Image Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">صورة الغلاف الرئيسية الإبرازية</label>
                <div
                  onClick={() => document.getElementById('coverInput')?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 hover:border-emerald-500 transition-all text-center cursor-pointer relative"
                >
                  {coverImage ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden">
                      <img src={URL.createObjectURL(coverImage)} alt="غلاف" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCoverImage(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-slate-950/80 rounded-full text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Camera className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-slate-300 text-xs font-bold">اضغط لاختيار صورة الغلاف المميزة</p>
                    </div>
                  )}
                  <input
                    id="coverInput"
                    type="file"
                    accept="image/*"
                    onChange={e => setCoverImage(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Additional Photos Upload */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">صور إضافية لجوانب السيارة والمقصورة ({images.length}/20)</label>
                
                <div
                  {...getRootProps()}
                  className="p-8 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 hover:border-emerald-500 transition-all text-center cursor-pointer"
                >
                  <input {...getInputProps()} />
                  <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-white text-sm font-bold">اضغط هنا أو اسحب الصور لرفعها</p>
                  <p className="text-slate-500 text-xs mt-1">PNG, JPG, WEBP - يفضل صور عالية الجودة</p>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2">
                    {imagePreviews.map((preview, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800 group">
                        <img src={preview} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 p-1 bg-slate-950/80 rounded-full text-rose-400 opacity-90 hover:opacity-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">رابط فيديو للسيارة (YouTube أو MP4)</label>
                <input
                  type="text"
                  value={form.videoUrl}
                  onChange={e => updateForm('videoUrl', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500 font-mono"
                  dir="ltr"
                />
                <FieldErrors fields={['videoUrl']} errors={errors} />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
                >
                  السابق
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <span>التالي: السعر والموقع</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

          {/* STEP 4: Price & Contact */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  السعر، طرق البيع، ومعلومات الاتصال
                </h3>
              </div>

              {/* Trade & Payment Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">خيار البيع والبدل *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TRADE_OPTIONS.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => updateForm('tradeOption', t.value)}
                      className={`p-3.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                        form.tradeOption === t.value
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & AI Estimator */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">السعر المطلوب بالدينار الأردني (د.أ) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => updateForm('price', parseFloat(e.target.value) || 0)}
                    placeholder="مثال: 14500"
                    className="w-full h-14 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-emerald-400 font-black text-2xl outline-none focus:border-emerald-500"
                  />
                  <FieldErrors fields={['price']} errors={errors} />
                </div>

                <AIPriceEstimator
                  brandId={form.brandId}
                  modelId={form.modelId}
                  year={form.year}
                  trim={form.trim}
                  kilometers={form.kilometers}
                  condition={form.condition}
                  cityId={form.cityId}
                  fuelType={form.fuelType}
                  transmission={form.transmission}
                  engineCapacity={form.engineCapacity}
                  bodyType={form.bodyType}
                  color={form.color}
                  ownerCount={form.ownerCount}
                  isDamaged={form.isDamaged}
                  hasWarranty={form.hasWarranty}
                  hasServiceHistory={form.hasServiceHistory}
                  isPaintOriginal={form.isPaintOriginal}
                  currentPrice={form.price}
                  onPriceSelect={(price) => updateForm('price', price)}
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم الهاتف للاتصال *</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => updateForm('phone', e.target.value)}
                    placeholder="0791234567"
                    className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500 font-mono"
                    dir="ltr"
                  />
                  <FieldErrors fields={['phone']} errors={errors} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم الواتساب</label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={e => updateForm('whatsapp', e.target.value)}
                    placeholder="0791234567"
                    className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500 font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">المحافظة / المدينة *</label>
                  <select
                    value={form.cityId}
                    onChange={e => updateForm('cityId', e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">اختر المحافظة</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                  </select>
                  <FieldErrors fields={['cityId']} errors={errors} />
                </div>
              </div>

              {/* Map Location */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">تحديد موقع معاينة السيارة على الخريطة</label>
                <MapPicker
                  lat={form.locationLat ? parseFloat(form.locationLat) : null}
                  lng={form.locationLng ? parseFloat(form.locationLng) : null}
                  onChange={(lat, lng) => {
                    updateForm('locationLat', lat === null ? '' : lat.toString());
                    updateForm('locationLng', lng === null ? '' : lng.toString());
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
                >
                  السابق
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-base transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xl shadow-emerald-500/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  <span>نشر إعلان السيارة الآن </span>
                </button>
              </div>

            </motion.div>
          )}

        </form>

      </div>
    </div>
  );
}
