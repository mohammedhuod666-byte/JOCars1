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
import { AIPriceEstimator } from '@/components/cars/AIPriceEstimator';
import toast from 'react-hot-toast';

interface Brand { id: string; nameAr: string; nameEn: string; slug: string; }
interface Model { id: string; nameAr: string; nameEn: string; slug: string; }
interface City { id: string; nameAr: string; nameEn: string; slug: string; }

type CarFormData = {
  brandId: string; modelId: string; year: number; trim: string;
  kilometers: number; fuelType: string; transmission: string; color: string;
  doors: number; engineCapacity: string; cylinders: string; drivetrain: string;
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
  kilometers: 0, fuelType: 'HYBRID', transmission: 'AUTOMATIC', color: 'أبيض',
  doors: 4, engineCapacity: '2500', cylinders: '4', drivetrain: 'FWD',
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
  { value: 'DUTY_PAID', label: 'مجمركة بالكامل ✅' },
  { value: 'FREE_ZONE', label: 'منطقة حرة (غير مجمركة) 🚗' },
  { value: 'DISABLED_EXEMPTION', label: 'إعفاء ذوي الإحتياجات ♿' },
  { value: 'TAXI_SPECIAL', label: 'تكسي / تطبيقي مميز 🚕' },
];

const INSPECTION_OPTIONS = [
  'فحص كامل 7 جيد ✨',
  'فحص 4 جيد',
  '3 جيد وضربة شاسي أمامي',
  'قصعة دقة شاسي أمامي',
  'ميكانيك وكهرباء وكالة (بحاجة بودي)',
  'ملاحظات خفيفة بدون حوادث',
];

const TRADE_OPTIONS = [
  { value: 'CASH_ONLY', label: 'للبيع كاش فقط 💵' },
  { value: 'ALLOW_TRADE', label: 'قابل للبدل بسيارة أخرى 🔄' },
  { value: 'INSTALLMENTS', label: 'إمكانية الأقساط بدفعة أولى 💳' },
];

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
    if (field === 'vin') {
      setVinInfo(null);
      setVinHistory([]);
    }
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
        toast.success('تم تحسين وتنسيق الوصف بالذكاء الاصطناعي ✨');
      }
    } catch {
      toast.error('تعذر تحسين الوصف');
    } finally {
      setAiLoading(prev => ({ ...prev, description: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brandId || !form.modelId || !form.year || !form.price || !form.phone || !form.cityId) {
      toast.error('يرجى تعبئة كافة الحقول الأساسية (الشركة، الموديل، السنة، السعر، المحافظة، ورقم الهاتف)');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const formData = new FormData();

      // Combine Jordanian custom attributes into description & conditionDetails
      let enrichedDescription = form.description || '';
      const customsLabel = CUSTOMS_OPTIONS.find(c => c.value === form.customsStatus)?.label || '';
      const tradeLabel = TRADE_OPTIONS.find(t => t.value === form.tradeOption)?.label || '';

      const jordanianSpecsText = `\n\n📌 **مواصفات السوق الأردني والفحص:**\n- الجمرك: ${customsLabel}\n- تقرير الفحص: ${form.inspectionSummary}\n- خيارات البيع: ${tradeLabel}\n` +
        (form.fuelType === 'ELECTRIC' || form.fuelType === 'HYBRID' ? `- صحة البطارية (SOH): ${form.batteryHealthSoh}%\n- مدى الشحنة: ${form.electricRangeKm} كم\n` : '');

      if (!enrichedDescription.includes('مواصفات السوق الأردني')) {
        enrichedDescription += jordanianSpecsText;
      }

      Object.entries({ ...form, description: enrichedDescription }).forEach(([key, value]) => {
        if (value !== '' && value !== null) formData.append(key, String(value));
      });

      if (conditionDetails.length > 0) formData.append('conditionDetails', JSON.stringify(conditionDetails));
      images.forEach(img => formData.append('images', img));
      if (coverImage) formData.append('coverImage', coverImage);
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
        const errMap: Record<string, string> = {};
        if (data.details && Array.isArray(data.details)) {
          data.details.forEach((d: { field: string; message: string }) => { errMap[d.field] = d.message; });
          setErrors(errMap);
          toast.error('يرجى التحقق من الحقول المحددة');
        } else {
          toast.error(data.error || 'فشل إضافة السيارة');
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
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-mono ${
                  step === s.num ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {s.num}
                </div>
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
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
                </div>

              </div>

              {/* Fuel Type Chips */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">نوع المحرك والوقود *</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'HYBRID', label: 'هايبرد 🔋' },
                    { id: 'ELECTRIC', label: 'كهرباء كاملة ⚡' },
                    { id: 'PETROL', label: 'بنزين ⛽' },
                    { id: 'DIESEL', label: 'ديزل 🚜' },
                    { id: 'PLUGIN_HYBRID', label: 'بلق-إن 🔌' },
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
              </div>

              {/* Transmission Chips */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">ناقل الحركة (الجير) *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'AUTOMATIC', label: 'أوتوماتيك ⚙️' },
                    { id: 'MANUAL', label: 'عادي / يدوي 🕹️' },
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
                      فك واستعلام الشاسي 🔍
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
                  { key: 'isNegotiable' as const, label: 'السعر قابل للتفاوض 💬' },
                  { key: 'hasWarranty' as const, label: 'تحت الكفالة والضمان 🛡️' },
                  { key: 'hasServiceHistory' as const, label: 'سجل صيانة بالوكالة 📖' },
                  { key: 'isPaintOriginal' as const, label: 'دهان أصلي وكالة ✨' },
                  { key: 'isDamaged' as const, label: 'مصدومة سابقاً ⚠️' },
                  { key: 'isWholesale' as const, label: 'بيع جملة لتاجر 🏭' },
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
                </div>
              </div>

              {/* Map Location */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">تحديد موقع معاينة السيارة على الخريطة</label>
                <MapPicker
                  lat={form.locationLat ? parseFloat(form.locationLat) : null}
                  lng={form.locationLng ? parseFloat(form.locationLng) : null}
                  onChange={(lat, lng) => {
                    updateForm('locationLat', lat.toString());
                    updateForm('locationLng', lng.toString());
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
                  disabled={loading || !form.brandId || !form.modelId || !form.price || !form.phone || !form.cityId}
                  className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-base transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xl shadow-emerald-500/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  <span>نشر إعلان السيارة الآن 🚀</span>
                </button>
              </div>

            </motion.div>
          )}

        </form>

      </div>
    </div>
  );
}
