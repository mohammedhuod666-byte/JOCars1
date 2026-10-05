'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2, Upload, X, Camera, ShieldCheck, Truck, Sparkles, ChevronLeft,
  DollarSign, MapPin, Tag, Wrench, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { compressImagesClient } from '@/lib/image-compress-client';
import { MAX_PUBLISH_BODY_BYTES, formatMB, isPlatformTooLarge } from '@/lib/upload-limits';

const PART_TYPES = [
  { value: 'engine', label: 'محرك وفواصل' },
  { value: 'transmission', label: 'جير وفتيس' },
  { value: 'body', label: 'هيكل وبودي' },
  { value: 'electrical', label: 'كهرباء وإلكترونيات' },
  { value: 'suspension', label: 'تعليق وهيئة' },
  { value: 'brake', label: 'فرامل وبريكات' },
  { value: 'cooling', label: 'تبريد وراديتر' },
  { value: 'exhaust', label: 'عادم واكزوزت' },
  { value: 'interior', label: 'فرش وداخلي' },
  { value: 'wheel', label: 'جنوط وإطارات' },
  { value: 'turbo', label: 'توربو وسوبر' },
  { value: 'ac', label: 'مكيف وكمبروسر' },
  { value: 'other', label: 'قطع متنوعة' },
];

const CONDITIONS = [
  { value: 'NEW', label: 'جديدة وكالة ' },
  { value: 'USED', label: 'مستعملة أصلية ' },
  { value: 'REFURBISHED', label: 'مُجددة ومفحوصة ' },
];

const ORIGINS = ['ياباني أصلي', 'كوري أصلي', 'ألماني', 'أمريكي', 'تجاري درجة أولى', 'تشليح / سكراب'];

export default function AddPartPage() {
  const { user, isAuthenticated, _hydrated, token } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<{ id: string; nameAr: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([]);
  
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    partType: '',
    brandId: '',
    partNumber: '',
    oemNumber: '',
    originCountry: 'ياباني أصلي',
    compatibleModels: '',
    condition: 'USED',
    price: '',
    currency: 'JOD',
    quantity: '1',
    phone: '',
    whatsapp: '',
    cityId: '',
    isNegotiable: false,
    hasWarranty: false,
    warrantyPeriod: '3 أيام تجربة',
    hasDelivery: false,
    deliveryFee: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      if (user?.phone) setForm(f => ({ ...f, phone: user.phone || '' }));
      fetch('/api/cars/brands').then(r => r.json()).then(d => setBrands(d.data || [])).catch(() => {});
      fetch('/api/cars/cities').then(r => r.json()).then(d => setCities(d.data || [])).catch(() => {});
    }
  }, [isAuthenticated, _hydrated, router, user]);

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 8 - images.length);
    setImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    if (!form.title || !form.partType || !form.price || !form.phone) {
      toast.error('العنوان، النوع، السعر، والهاتف مجالات مطلوبة');
      return;
    }
    setLoading(true);
    let sendImages = images;
    try {
      sendImages = (await compressImagesClient(images)).files;
    } catch { /* best-effort */ }
    // The 9MB figure this used to advertise was fiction: the platform caps a
    // route-handler body at 4.5MB (measured, see src/lib/upload-limits.ts), so
    // ads between 4.5MB and 9MB passed this check and were then killed by the
    // edge with an HTML 413 that surfaced as "تعذر إرسال الإعلان".
    const totalBytes = sendImages.reduce((n, f) => n + (f.size || 0), 0);
    if (totalBytes > MAX_PUBLISH_BODY_BYTES) {
      setLoading(false);
      toast.error(
        `حجم الصور ${formatMB(totalBytes)} ميجابايت — الحد الأقصى ${formatMB(MAX_PUBLISH_BODY_BYTES)} ميجابايت. ` +
        'احذف صورة أو اثنتين ثم حاول مجدداً.',
        { duration: 8000 },
      );
      return;
    }
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      sendImages.forEach(img => fd.append('images', img));

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/parts', { method: 'POST', headers, body: fd });

      // The edge answers an oversized body with HTML, not JSON.
      if (isPlatformTooLarge(res.status, res.headers.get('content-type') || '')) {
        toast.error(
          `حجم الصور ${formatMB(totalBytes)} ميجابايت — الحد الأقصى ${formatMB(MAX_PUBLISH_BODY_BYTES)} ميجابايت. ` +
          'احذف صورة أو اثنتين ثم حاول مجدداً.',
          { duration: 8000 },
        );
        return;
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        toast.error(`تعذر إرسال الإعلان (خطأ ${res.status}) — حاول مرة أخرى`);
        return;
      }
      if (res.ok && data.success) {
        toast.success('تم إرسال الإعلان! سيظهر في السوق بعد مراجعة الإدارة');
        router.push('/parts');
      } else {
        toast.error(data.error || `فشل إرسال الإعلان (خطأ ${res.status})`);
      }
    } catch {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  if (_hydrated && !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 py-8">
      <div className="container-custom max-w-3xl space-y-6">
        
        {/* Top Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href="/parts" className="hover:text-blue-400 transition-colors">سوق القطع</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-white font-bold">إضافة إعلان جديد</span>
        </div>

        <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
          
          <div className="border-b border-slate-800 pb-4 space-y-1">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              إضافة قطعة غيار جديدة
            </h1>
            <p className="text-slate-400 text-xs">عرض القطعة آلاف المشترين وأصحاب الورش في الأردن</p>
          </div>

          <div className="space-y-5">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان الإعلان *</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="مثلاً: محرك تويوتا كامري 2.5L موديل 2018-2023 فحص كامل"
                className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* Part Type & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">تصنيف القطعة *</label>
                <select
                  value={form.partType}
                  onChange={e => setForm({ ...form, partType: e.target.value })}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500"
                >
                  <option value="">اختر التصنيف</option>
                  {PART_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">حالة القطعة</label>
                <select
                  value={form.condition}
                  onChange={e => setForm({ ...form, condition: e.target.value })}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500"
                >
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Brand & Origin Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">ماركة السيارة (المصنع)</label>
                <select
                  value={form.brandId}
                  onChange={e => setForm({ ...form, brandId: e.target.value })}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500"
                >
                  <option value="">اختر الماركة</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">بلد المنشأ / مصدر القطعة</label>
                <select
                  value={form.originCountry}
                  onChange={e => setForm({ ...form, originCountry: e.target.value })}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500"
                >
                  {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* OEM Number & Compatible Models */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم القطعة الأصلي (OEM Part Number)</label>
                <input
                  value={form.oemNumber}
                  onChange={e => setForm({ ...form, oemNumber: e.target.value })}
                  placeholder="مثال: 23100-0C010"
                  className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500 font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">الموديلات والسيارات المتوافقة</label>
                <input
                  value={form.compatibleModels}
                  onChange={e => setForm({ ...form, compatibleModels: e.target.value })}
                  placeholder="مثال: تويوتا كامري 2018-2024 / أوريون 2019"
                  className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Price & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">السعر المطلوب (د.أ) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="150"
                  className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">الكمية المتوفرة</label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isNegotiable}
                    onChange={e => setForm({ ...form, isNegotiable: e.target.checked })}
                    className="w-5 h-5 rounded-md accent-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-300">السعر قابل للتفاوض </span>
                </label>
              </div>
            </div>

            {/* Warranty & Delivery Checks */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Warranty */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hasWarranty}
                      onChange={e => setForm({ ...form, hasWarranty: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> يوفر كفالة وتجربة للقطعة
                    </span>
                  </label>
                  {form.hasWarranty && (
                    <input
                      value={form.warrantyPeriod}
                      onChange={e => setForm({ ...form, warrantyPeriod: e.target.value })}
                      placeholder="مدة الكفالة (مثال: 7 أيام تجربة)"
                      className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-emerald-500"
                    />
                  )}
                </div>

                {/* Delivery */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hasDelivery}
                      onChange={e => setForm({ ...form, hasDelivery: e.target.checked })}
                      className="w-5 h-5 rounded-md accent-cyan-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                      <Truck className="w-4 h-4" /> خدمة التوصيل للمحافظات
                    </span>
                  </label>
                  {form.hasDelivery && (
                    <input
                      type="number"
                      value={form.deliveryFee}
                      onChange={e => setForm({ ...form, deliveryFee: e.target.value })}
                      placeholder="أجرة التوصيل بالدينار (اختياري)"
                      className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-cyan-500"
                    />
                  )}
                </div>

              </div>
            </div>

            {/* Phone, Whatsapp & City */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم الهاتف *</label>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="0791234567"
                  className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500 font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم الواتساب</label>
                <input
                  value={form.whatsapp}
                  onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="0791234567"
                  className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500 font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">المحافظة / الموقع</label>
                <select
                  value={form.cityId}
                  onChange={e => setForm({ ...form, cityId: e.target.value })}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500"
                >
                  <option value="">اختر المحافظة</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">تفاصيل وشرح إضافي للقطعة</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="اذكر حالة الفحص، سبب البيع، الخلو من العيوب..."
                className="w-full p-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Images Upload Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">صور القطعة (حتى 8 صور)</label>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={e => handleImages(e.target.files)}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-3">
                {previews.map((src, i) => (
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

                {previews.length < 8 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 hover:border-blue-500 text-slate-500 hover:text-blue-400 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px]">إضافة صورة</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={submit}
              disabled={loading || !form.title || !form.partType || !form.price || !form.phone}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-slate-950 font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-blue-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              نشر إعلان قطعة الغيار 
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}
