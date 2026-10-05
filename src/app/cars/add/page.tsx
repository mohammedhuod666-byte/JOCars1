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
  Info, RefreshCw, Layers, FileCheck2, RotateCcw, CalendarCheck
} from 'lucide-react';
import { MapPicker } from '@/components/cars/MapPicker';
import { compressImagesClient, compressDocsClient, fitGalleryToBudget } from '@/lib/image-compress-client';
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
  // ── Vehicle identity ──
  firstRegistrationYear: string; interiorColor: string; seats: string; keysCount: string;
  // ── Ownership ──
  ownershipSource: string; isFirstOwner: boolean;
  // ── History & condition (seller declarations) ──
  accidentHistory: string; accidentDetails: string;
  bodyPaintStatus: string; chassisStatus: string;
  engineStatus: string; transmissionStatus: string;
  // ── Service record ──
  serviceRecordStatus: string; lastServiceDate: string; lastServiceType: string; serviceNotes: string;
  // ── Customs ──
  customsTransactionStatus: string; customsNotes: string;
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
  // New fields default to empty/UNKNOWN rather than to a flattering value: a
  // seller who has not declared anything must not look like they declared
  // "original paint" and "no accidents".
  firstRegistrationYear: '', interiorColor: '', seats: '', keysCount: '',
  ownershipSource: '', isFirstOwner: false,
  accidentHistory: '', accidentDetails: '',
  bodyPaintStatus: '', chassisStatus: '', engineStatus: '', transmissionStatus: '',
  serviceRecordStatus: '', lastServiceDate: '', lastServiceType: '', serviceNotes: '',
  customsTransactionStatus: '', customsNotes: '',
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

// ── History & ownership option sets ──────────────────────────────────────────
// These are SELLER DECLARATIONS, not verified facts. The wording of every label
// is deliberately declarative ("بحسب معرفة البائع") so the UI can never imply
// a certified judgment.
const OWNERSHIP_SOURCES = [
  { value: 'AGENCY', label: 'وكالة' },
  { value: 'LOCAL', label: 'محلي' },
  { value: 'IMPORTED', label: 'مستورد (جديد)' },
  { value: 'USED_IMPORT', label: 'وارد / مستعمل مستورد' },
  { value: 'OTHER', label: 'أخرى' },
];

const ACCIDENT_OPTIONS = [
  { value: 'NONE', label: 'لا، لم تتعرض لحادث' },
  { value: 'YES', label: 'نعم، تعرضت لحادث' },
  { value: 'UNKNOWN', label: 'غير معروف' },
];

const BODY_PAINT_OPTIONS = [
  { value: 'ORIGINAL', label: 'أصلي' },
  { value: 'PARTIAL_PAINT', label: 'يوجد أجزاء مصبوغة' },
  { value: 'FULL_PAINT', label: 'صبغ كامل' },
  { value: 'UNKNOWN', label: 'غير معروف' },
];

const CHASSIS_OPTIONS = [
  { value: 'SOUND', label: 'سليم حسب معرفة البائع' },
  { value: 'DAMAGED', label: 'يوجد ضرر' },
  { value: 'UNKNOWN', label: 'غير معروف' },
];

const ENGINE_OPTIONS = [
  { value: 'EXCELLENT', label: 'ممتاز' },
  { value: 'GOOD', label: 'جيد' },
  { value: 'NEEDS_INSPECTION', label: 'يحتاج فحص' },
  { value: 'NEEDS_SERVICE', label: 'يحتاج صيانة' },
  { value: 'UNKNOWN', label: 'غير معروف' },
];

const SERVICE_RECORD_OPTIONS = [
  { value: 'EXISTS', label: 'يوجد سجل صيانة' },
  { value: 'NONE', label: 'لا يوجد' },
  { value: 'UNKNOWN', label: 'غير معروف' },
];

const CUSTOMS_TRANSACTION_OPTIONS = [
  { value: 'COMPLETE', label: 'المعاملة مكتملة' },
  { value: 'PENDING', label: 'المعاملة قيد الإجراء' },
  { value: 'NOT_APPLICABLE', label: 'لا تنطبق' },
  { value: 'UNKNOWN', label: 'غير معروف' },
];

const INTERIOR_COLORS = ['أسود', 'بيج', 'رمادي', 'بني', 'أبيض', 'أحمر', 'أزرق', 'أخضر', 'أخرى'];

const TRADE_OPTIONS = [
  { value: 'CASH_ONLY', label: 'للبيع كاش فقط ' },
  { value: 'ALLOW_TRADE', label: 'قابل للبدل بسيارة أخرى ' },
  { value: 'INSTALLMENTS', label: 'إمكانية الأقساط بدفعة أولى ' },
];

import { CAR_FEATURES, CAR_FEATURES_AR } from '@/lib/car-features';
import ListingReview from '@/components/cars/ListingReview';
import OptionGroup, { DeclarationNote } from '@/components/cars/OptionGroup';
import PhotoManager, { moveItem } from '@/components/cars/PhotoManager';
import type { CompletenessResult } from '@/lib/listing-score';
import { scoreListing } from '@/lib/listing-score';
import { saveAddCarDraft, loadAddCarDraft, clearAddCarDraft, draftAgeLabel } from '@/lib/add-car-draft';
import type { DocKind } from '@/lib/doc-upload';
import { directUploadAvailable, uploadVideoDirect, SAFE_INLINE_MAX_BYTES } from '@/lib/video-upload';
import {
  MAX_PUBLISH_BODY_BYTES, MAX_SINGLE_FILE_BYTES, formatMB,
  isPlatformTooLarge, tooLargeMessage, singleFileTooLargeMessage, galleryBudget,
} from '@/lib/upload-limits';

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
  licenseDoc: { label: 'صورة ترخيص السيارة', step: 2 },
  inspectionDoc: { label: 'صورة فحص السيارة', step: 2 },
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

/**
 * One official-document slot (license / inspection / service record).
 *
 * Visual language is deliberately distinct from the marketing gallery dropzone:
 * amber instead of emerald, document iconography, and an explicit visibility
 * note — so the seller understands this is a verification artefact, not a
 * listing photo.
 *
 * Accepts an image OR a PDF, because an inspection report is often exported as
 * a PDF rather than photographed. PDFs get a document preview instead of an
 * <img>, which would render as a broken image.
 */
function DocumentSlot({
  id, title, hint, required, file, preview, error, onPick, onClear, extraCount = 0,
}: {
  id: string;
  title: string;
  hint: string;
  required?: boolean;
  file: File | null;
  preview: string;
  error?: string;
  onPick: (f: File | null) => void;
  onClear: () => void;
  extraCount?: number;
}) {
  const isPdf = !!file && file.type === 'application/pdf';
  const accept = 'image/jpeg,image/png,image/webp,application/pdf';
  const inputId = `${id}Input`;

  /**
   * ONE input element, rendered unconditionally at the bottom of the slot.
   *
   * Both the empty-state dropzone and the "replace" button are <label
   * htmlFor={inputId}>, so they activate this same input. Previously the input
   * lived INSIDE the "replace" label, which is only rendered once a file exists
   * — so on an empty slot the dropzone pointed at a non-existent id and
   * clicking it did nothing. That was a real regression, not a styling issue.
   */
  const replaceButton = (
    <label
      htmlFor={inputId}
      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer transition-colors"
    >
      استبدال
    </label>
  );

  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
      <div className="space-y-1">
        <label className="flex items-center gap-2 text-xs font-extrabold text-slate-200">
          <FileCheck2 className="w-4 h-4 text-amber-400" />
          {title}
          {required && <span className="text-rose-400">*</span>}
        </label>
        <p className="text-[11px] leading-relaxed text-slate-400">{hint}</p>
      </div>

      {file && preview ? (
        <div className="space-y-2">
          {isPdf ? (
            <div className="relative rounded-xl border border-amber-500/30 bg-slate-900 overflow-hidden">
              <div className="h-32 flex flex-col items-center justify-center gap-1.5 text-center px-4">
                <FileText className="w-8 h-8 text-amber-400" />
                <p className="text-[11px] font-bold text-slate-300">{file.name}</p>
                <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} ميجابايت — ملف PDF</p>
              </div>
              <a
                href={preview}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-end justify-center pb-2 text-[10px] font-bold text-emerald-400 opacity-0 hover:opacity-100 transition-opacity bg-slate-950/40"
              >
                فتح للمعاينة
              </a>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-amber-500/30 bg-slate-900">
              <img src={preview} alt={title} className="w-full h-44 object-contain" />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              تم رفع {isPdf ? 'الملف' : 'الصورة'}
              {extraCount > 0 && ` (+${extraCount} صفحة إضافية)`}
            </span>
            <div className="mr-auto flex items-center gap-2">
              {replaceButton}
              <button
                type="button"
                onClick={onClear}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor={`${id}Input`}
          className="flex flex-col items-center justify-center gap-1.5 p-6 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/60 hover:border-amber-500 transition-all cursor-pointer text-center"
        >
          <Upload className="w-7 h-7 text-amber-400" />
          <span className="text-xs font-bold text-white">اضغط لاختيار المستند</span>
          <span className="text-[11px] text-slate-500">صورة أو ملف PDF — حتى 8 ميجابايت</span>
        </label>
      )}

      {/* The single file input for this slot. Always rendered — see inputId note. */}
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { onPick(e.target.files?.[0] || null); e.target.value = ''; }}
      />

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-[11px] font-bold text-rose-400">
          <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default function AddCarPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated, token } = useAuth();
  
  const [loading, setLoading] = useState(false);
  // Progress text for the document-staging phase. Publishing is no longer one
  // opaque request: documents upload individually first, and without this the
  // seller sees a frozen button for the whole transfer.
  const [stageLabel, setStageLabel] = useState('');
  const [step, setStep] = useState(1);
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  // Cover is an index into `images` (-1 = none). Kept in addition to the old
  // `coverImage` File so nothing else breaks, but publishing derives the file
  // from the gallery so the seller can promote any shot to the cover.
  const [coverIndex, setCoverIndexState] = useState(-1);
  // Real video upload state. Previously `videoFile` was appended to the car
  // FormData, but no input ever populated it and POST /api/cars explicitly
  // ignored the `video` key — a dead end. Video now goes to /api/upload/video
  // and the returned URL is stored in form.videoUrl.
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  // Official documents (مستندات وتحقق) — kept in separate state so they are
  // never mixed into the marketing gallery array.
  const [licenseDoc, setLicenseDoc] = useState<File | null>(null);
  const [licenseDocPreview, setLicenseDocPreview] = useState<string>('');
  const [inspectionDoc, setInspectionDoc] = useState<File | null>(null);
  const [inspectionDocPreview, setInspectionDocPreview] = useState<string>('');
  // A multi-page inspection report: first file is the primary document, these
  // are extra pages. Capped client-side too, so the seller finds out before a
  // 6MB multipart upload rather than after.
  const [extraInspectionDocs, setExtraInspectionDocs] = useState<File[]>([]);
  const [serviceRecordDoc, setServiceRecordDoc] = useState<File | null>(null);
  const [serviceRecordPreview, setServiceRecordPreview] = useState<string>('');
  
  const [form, setForm] = useState<CarFormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState({ price: false, description: false });
  const [vinInfo, setVinInfo] = useState<any>(null);
  const [vinHistory, setVinHistory] = useState<any[]>([]);
  const [conditionDetails, setConditionDetails] = useState<ConditionItem[]>([]);
  const [draftRestored, setDraftRestored] = useState<{ at: number; hadFiles: boolean } | null>(null);
  // Step-5 review. The completeness figure is produced by the SAME scoring
  // module the server uses (lib/listing-score), so the pre-publish number and
  // the post-publish /completeness endpoint cannot drift apart. The server
  // remains the authority: it re-validates everything on POST.
  const [reviewScore, setReviewScore] = useState<CompletenessResult | null>(null);

  // ── Crash recovery ────────────────────────────────────────────────────────
  // Restores text fields after an accidental tab close. Images/documents are
  // NOT restored (base64 would exceed the storage quota) and the banner says so
  // rather than silently losing the seller's files.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const draft = loadAddCarDraft(user.id);
    if (!draft) return;
    setForm(f => ({ ...f, ...(draft.form as Partial<CarFormData>) }));
    setConditionDetails(
      Array.isArray((draft.form as any)?.conditionDetails) ? (draft.form as any).conditionDetails : [],
    );
    if (draft.step >= 1 && draft.step <= 4) setStep(draft.step);
    setDraftRestored({ at: draft.savedAt, hadFiles: draft.hadFiles });
  }, [isAuthenticated, user?.id]);

  // Debounced autosave.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    // Don't overwrite a fresh draft with the empty initial state on mount.
    const t = setTimeout(() => {
      saveAddCarDraft(user.id, {
        step,
        form: { ...form, conditionDetails },
        hadFiles: images.length > 0 || !!coverImage || !!licenseDoc || !!inspectionDoc || !!serviceRecordDoc,
      });
    }, 800);
    return () => clearTimeout(t);
  }, [form, step, conditionDetails, images.length, coverImage, licenseDoc, inspectionDoc, isAuthenticated, user?.id]);

  // Warn before losing a long, partially-typed form.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const touched = Object.values(form).some((v) => v !== '' && v !== 0 && v !== false) || images.length > 0;
      if (!touched || loading) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [form, images.length, loading]);

  const discardDraft = () => {
    if (user?.id) clearAddCarDraft(user.id);
    setDraftRestored(null);
    setForm(initialForm);
    setConditionDetails([]);
    setStep(1);
    toast.success('تم مسح المسودة المحفوظة');
  };

  /**
   * Gate step navigation. Previously the wizard jumped steps with a bare
   * setStep(), so a seller could reach "publish" with an empty stage 1 and only
   * discover the problem after filling everything else in.
   *
   * Scope note: only genuinely required-for-publish fields are checked, to
   * avoid the "make everything mandatory" trap. Optional fields stay optional.
   */
  const STEP_REQUIRED: Record<number, () => Record<string, string>> = {
    1: () => {
      const e: Record<string, string> = {};
      if (!form.brandId) e.brandId = 'اختر الشركة المصنعة';
      if (!form.modelId) e.modelId = 'اختر الموديل';
      if (!form.year || form.year < 1990 || form.year > 2030) e.year = 'أدخل سنة صنع صحيحة';
      if (form.kilometers === null || form.kilometers === undefined || isNaN(Number(form.kilometers)) || Number(form.kilometers) < 0) {
        e.kilometers = 'أدخل عدد الكيلومترات';
      }
      if (!form.fuelType) e.fuelType = 'اختر نوع الوقود';
      if (!form.transmission) e.transmission = 'اختر ناقل الحركة';
      if (!form.color || !form.color.trim()) e.color = 'أدخل لون السيارة';
      return e;
    },
    2: () => {
      const e: Record<string, string> = {};
      if (!licenseDoc) e.licenseDoc = 'صورة ترخيص السيارة مطلوبة للتحقق من بيانات السيارة ومطابقة معلومات الإعلان';
      if (!inspectionDoc) e.inspectionDoc = 'صورة فحص السيارة مطلوبة كإثبات مرتبط بحالة السيارة ومطابقة معلومات الإعلان';
      if (form.description.trim().length < 20) e.description = 'الوصف يجب أن يكون 20 حرفاً على الأقل';
      return e;
    },
    3: () => {
      // Marketing photos are recommended, not forced: a bad minimum here is a
      // direct cause of abandonment. Documents already enforce a real minimum.
      const e: Record<string, string> = {};
      if (form.videoUrl && !/^https?:\/\/\S+$/i.test(form.videoUrl)) {
        e.videoUrl = 'رابط الفيديو غير صحيح — يجب أن يبدأ بـ http:// أو https://';
      }
      return e;
    },
    4: () => {
      const e: Record<string, string> = {};
      if (!form.price || form.price <= 0) e.price = 'أدخل سعراً صحيحاً أكبر من صفر';
      if (!form.phone || !form.phone.trim()) e.phone = 'أدخل رقم الهاتف';
      if (!form.cityId) e.cityId = 'اختر المحافظة';
      return e;
    },
    5: () => {
      // The review stage itself gates on everything: a seller must not reach a
      // publish button while a required item is missing.
      const e: Record<string, string> = {};
      if (!form.brandId) e.brandId = 'اختر الشركة المصنعة';
      if (!form.modelId) e.modelId = 'اختر الموديل';
      if (!form.fuelType) e.fuelType = 'اختر نوع الوقود';
      if (!form.transmission) e.transmission = 'اختر ناقل الحركة';
      if (!form.color?.trim()) e.color = 'أدخل لون السيارة';
      if (!form.description || form.description.trim().length < 20) e.description = 'الوصف يجب أن يكون 20 حرفاً على الأقل';
      if (!form.price || form.price <= 0) e.price = 'أدخل سعراً صحيحاً أكبر من صفر';
      if (!form.phone?.trim()) e.phone = 'أدخل رقم الهاتف';
      if (!form.cityId) e.cityId = 'اختر المحافظة';
      if (!licenseDoc) e.licenseDoc = 'صورة ترخيص السيارة مطلوبة للتحقق من بيانات السيارة';
      if (!inspectionDoc) e.inspectionDoc = 'صورة فحص السيارة مطلوبة للتحقق من حالة السيارة';
      return e;
    },
  };

  const goToStep = (next: number) => {
    // Validate only the stages being SKIPPED OVER, not the one being left.
    for (let s = step + 1; s < next; s++) {
      const errs = STEP_REQUIRED[s]?.() ?? {};
      if (Object.keys(errs).length) {
        setErrors(errs);
        setStep(s);
        focusFirstError(errs);
        return;
      }
    }
    setErrors({});
    setStep(next);
  };

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

  /**
 * feedback; the server re-validates with magic-byte checks (validateUploadedImage)
 * so a crafted request cannot bypass this.
 */
  /**
   * Document slot handler. Accepts an image OR a PDF, since inspection reports
   * are usually exported rather than photographed. Type and size are checked in
   * the browser for instant feedback; the server re-validates with magic-byte
   * checks (image-validate / pdf-validate) so a crafted request cannot bypass it.
   */
  const handleDocPick = useCallback((file: File | null, kind: DocKind) => {
    const errKey = kind === 'license' ? 'licenseDoc' : kind === 'inspection' ? 'inspectionDoc' : 'serviceRecordDoc';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      setErrors(e => ({ ...e, [errKey]: 'صيغة الملف غير مدعومة — JPG أو PNG أو WEBP أو PDF' }));
      return;
    }
    // Reject at pick time with the REAL ceiling. This used to advertise 8MB,
    // which the platform cannot accept in any single request (4.5MB measured),
    // so the seller uploaded a file and only then saw a failure.
    if (file.size > MAX_SINGLE_FILE_BYTES) {
      setErrors(e => ({ ...e, [errKey]: singleFileTooLargeMessage(
        file.size,
        kind === 'license' ? 'صورة الرخصة' : kind === 'service' ? 'سجل الصيانة' : 'تقرير الفحص',
      ).replace(/\n/g, ' ') }));
      return;
    }
    if (file.size === 0) {
      setErrors(e => ({ ...e, [errKey]: 'الملف فارغ — أعد اختيار ملف صحيح' }));
      return;
    }
    const preview = URL.createObjectURL(file);
    if (kind === 'license') { setLicenseDoc(file); setLicenseDocPreview(preview); }
    else if (kind === 'inspection') { setInspectionDoc(file); setInspectionDocPreview(preview); }
    else { setServiceRecordDoc(file); setServiceRecordPreview(preview); }
    // Clear any stale error for this slot once a valid file is chosen.
    setErrors(e => {
      if (!e[errKey]) return e;
      const next = { ...e };
      delete next[errKey];
      return next;
    });
  }, []);

  /** Extra inspection-report pages. Bounded at 5 to keep the multipart body sane. */
  const addExtraInspectionDocs = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next = [...extraInspectionDocs];
    let skipped = 0;
    Array.from(files).forEach((f) => {
      if (next.length >= 5) { skipped++; return; }
      if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type)) { skipped++; return; }
      if (f.size > MAX_SINGLE_FILE_BYTES) { skipped++; return; }
      next.push(f);
    });
    setExtraInspectionDocs(next);
    if (skipped > 0) {
      toast.error(
        `تم تجاهل ${skipped} ملف — الحد 5 صفحات إضافية، و${formatMB(MAX_SINGLE_FILE_BYTES)} ميجابايت للملف الواحد`,
        { duration: 6000 },
      );
    }
  }, [extraInspectionDocs, toast]);

  const clearExtraInspectionDocs = useCallback(() => setExtraInspectionDocs([]), []);

  const clearDoc = useCallback((kind: DocKind) => {
    const errKey = kind === 'license' ? 'licenseDoc' : kind === 'inspection' ? 'inspectionDoc' : 'serviceRecordDoc';
    if (kind === 'license') { URL.revokeObjectURL(licenseDocPreview); setLicenseDoc(null); setLicenseDocPreview(''); }
    else if (kind === 'inspection') {
      URL.revokeObjectURL(inspectionDocPreview);
      setInspectionDoc(null); setInspectionDocPreview('');
      setExtraInspectionDocs([]);
    } else {
      URL.revokeObjectURL(serviceRecordPreview);
      setServiceRecordDoc(null); setServiceRecordPreview('');
    }
    setErrors(e => {
      if (!e[errKey]) return e;
      const next = { ...e };
      delete next[errKey];
      return next;
    });
  }, [licenseDocPreview, inspectionDocPreview, serviceRecordPreview]);

  const handleVideoPick = useCallback(async (file: File | null) => {
    setVideoError(null);
    if (!file) return;

    // Client-side pre-checks for instant feedback. The server repeats all of
    // them (plus container sniffing and duration) — never trust this alone.
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
    if (!allowed.includes(file.type)) {
      setVideoError('صيغة الفيديو غير مدعومة — استخدم MP4 أو WebM أو MOV');
      return;
    }
    // Reject early only when NEITHER path can work. With a direct-upload preset
// configured, large files are fine; without one, the inline route is capped by
// the platform (not by us) and we say so before the seller uploads 40MB.
    const canUploadDirect = directUploadAvailable();
    if (!canUploadDirect && file.size > SAFE_INLINE_MAX_BYTES) {
      setVideoError(
        `حجم الفيديو ${(file.size / 1024 / 1024).toFixed(1)} ميجابايت — الحد الأقصى ` +
        `${(SAFE_INLINE_MAX_BYTES / 1024 / 1024).toFixed(1)} ميجابايت.\n` +
        'اضغط على الفيديو لقلّص مدته أو استخدم رابط YouTube.',
      );
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setVideoError('حجم الفيديو يتجاوز 100 ميجابايت — اختر فيديو أقصر أو أقل جودة');
      return;
    }

    setVideoUploading(true);
    setVideoProgress(0);
    try {
      // Large videos go straight to Cloudinary. A Vercel serverless function
      // rejects any body over 4.5MB, and its 413 arrives as an HTML page — the
      // old `res.json()` call then threw and the seller saw "connection
      // error" for a file that satisfied our own 100MB limit.
      if (directUploadAvailable() && file.size > SAFE_INLINE_MAX_BYTES) {
        const res = await uploadVideoDirect(file, {
          onProgress: setVideoProgress,
        });
        setVideoUrl(res.url);
        setForm(f => ({ ...f, videoUrl: res.url }));
        setVideoProgress(100);
        toast.success('تم رفع الفيديو بنجاح');
        return;
      }

      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/video', {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });

      // The platform may answer with HTML (body-too-large, gateway errors).
      // Parsing that as JSON throws and used to surface as a fake network
      // error, so check the content type and the status first.
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        if (res.status === 413) {
          throw new Error(
            `حجم الفيديو ${(file.size / 1024 / 1024).toFixed(1)} ميجابايت أكبر من الحد المسموح ` +
            `(${(SAFE_INLINE_MAX_BYTES / 1024 / 1024).toFixed(1)} ميجابايت للرفع المباشر).\n` +
            'اضغط على الفيديو لقلّص مدته أو استخدم رابط YouTube.',
          );
        }
        throw new Error(`تعذر رفع الفيديو (خطأ ${res.status}) — حاول مجدداً`);
      }

      const json = await res.json();
      if (res.ok && json?.data?.url) {
        setVideoUrl(json.data.url);
        setForm(f => ({ ...f, videoUrl: json.data.url }));
        setVideoProgress(100);
        toast.success('تم رفع الفيديو بنجاح');
      } else {
        setVideoError(json?.error || 'تعذر رفع الفيديو');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setVideoError(
        msg && msg !== 'Failed to fetch' && !/network|load failed/i.test(msg)
          ? msg
          : 'تعذر الاتصال بالخادم — تأكد من الإنترنت ثم أعد المحاولة',
      );
    } finally {
      setVideoUploading(false);
    }
  }, [token, toast]);

  const clearVideo = useCallback(() => {
    setVideoUrl(null);
    setVideoProgress(0);
    setVideoError(null);
    setForm(f => ({ ...f, videoUrl: '' }));
  }, []);

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
    // If the removed image WAS the chosen cover, fall back to the first one so
    // the listing never ends up with a dangling cover index.
    setCoverIndexState((prev) => {
      if (prev === index) return newImages.length > 0 ? 0 : -1;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  /**
   * The cover is now an INDEX into the gallery rather than a separate uploaded
   * file. Previously the seller could only change it by re-picking a file, and
   * the server hard-coded `isCover: i === 0` — so a great shot uploaded second
   * could never become the cover.
   */
  const setCoverIndex = useCallback((idx: number) => {
    setCoverIndexState(idx);
  }, []);

  const reorderImages = useCallback((from: number, to: number) => {
    setImages((prev) => {
      const next = moveItem(prev, from, to);
      setImagePreviews(next.map(f => URL.createObjectURL(f)));
      // Keep the cover pointing at the same photo after a move.
      setCoverIndexState((c) => {
        if (c === from) return to;
        if (from < to && c > from && c <= to) return c - 1;
        if (from > to && c >= to && c < from) return c + 1;
        return c;
      });
      return next;
    });
  }, []);

  const updateForm = (field: keyof CarFormData, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // A field the user is fixing should stop showing a stale error.
    setErrors(prev => (prev[field] ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== field)) : prev));
    if (field === 'vin') {
      setVinInfo(null);
      setVinHistory([]);
    }
  };

  /**
   * Scroll the first failing control into view and focus it.
   * Declared as a hoisted function statement (not a const arrow) so it can be
   * called from `goToStep`, which is defined earlier in the component body.
   */
  function focusFirstError(errMap: Record<string, string>) {
    const first = Object.keys(errMap)[0];
    if (!first) return;
    // Wait for the step panel to paint before scrolling.
    setTimeout(() => {
      const el = document.getElementById(`err-${first}`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        const focusable = el.parentElement?.querySelector<HTMLElement>('input, textarea, select');
        focusable?.focus({ preventScroll: true });
      }
    }, 120);
  }

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
    // Official documents are mandatory for publication.
    if (!licenseDoc) pre.licenseDoc = 'صورة ترخيص السيارة مطلوبة للتحقق من بيانات السيارة ومطابقة معلومات الإعلان';
    if (!inspectionDoc) pre.inspectionDoc = 'صورة فحص السيارة مطلوبة كإثبات مرتبط بحالة السيارة ومطابقة معلومات الإعلان';
    if (Object.keys(pre).length) {
      applyErrors(pre);
      return;
    }
    // Total upload guard. The ceiling is the platform's, measured at 4.5MB, not
    // an invented number: an earlier 9MB guard let 4.5-9MB ads through our check
    // and then the edge killed them with an HTML 413 that surfaced as a fake
    // "تعذر استلام البيانات" error. See src/lib/upload-limits.ts.
    setLoading(true);
    setErrors({});
    let sendImages = images;
    // The cover is normally just a gallery image, so sending it a SECOND time as
    // its own file duplicated up to ~400KB of the request body. That duplication
    // was enough to push a legitimate ad past the platform ceiling and die with
    // "تعذر استلام البيانات". Instead we send the INDEX and let the server reuse
    // the gallery URL it already uploaded — same result, strictly smaller body,
    // and the cover can no longer drift from the gallery entry it points at.
    //
    // The legacy `coverImage` file is still sent when it is a genuinely separate
    // file (no gallery image chosen), and when nothing is chosen the server
    // marks image 0 as cover.
    const sendCoverFile = coverIndex < 0 ? coverImage : null;
    let sendCover: File | null = sendCoverFile;
    let sendLicense: File | null = licenseDoc;
    let sendInspection: File | null = inspectionDoc;
    try {
      // Documents are compressed for the same reason gallery images are: a
      // full-page license photo from a modern phone is 4-6MB, and two of them
      // plus a gallery would exceed the platform body ceiling.
      //
      // PDFs are EXCLUDED: they are already compressed formats, and running an
      // image compressor over one would either fail or corrupt it. That is also
      // why the guard below reports the real numbers — a large scan PDF is the
      // single most likely cause of an over-budget publish.
      const compressibleDocs = [
        ...(licenseDoc && licenseDoc.type !== 'application/pdf' ? [licenseDoc] : []),
        ...(inspectionDoc && inspectionDoc.type !== 'application/pdf' ? [inspectionDoc] : []),
      ];
      const [fit, cover, docs] = await Promise.all([
        // ADAPTIVE, not fixed: the wizard promises up to 20 photos, so the
        // compression has to fit the count rather than reject it. A fixed
        // 1280px/q0.78 profile gave ~180KB each, and 20 of them straddled the
        // platform ceiling — the seller picked 20 valid photos and was refused.
        fitGalleryToBudget(images, galleryBudget(images.length)),
        sendCoverFile ? compressImagesClient([sendCoverFile]) : null,
        compressDocsClient(compressibleDocs),
      ]);
      sendImages = fit.files;
      if (cover) sendCover = cover.files[0] || null;
      let cursor = 0;
      if (licenseDoc && licenseDoc.type !== 'application/pdf') {
        sendLicense = docs.files[cursor++] || licenseDoc;
      }
      if (inspectionDoc && inspectionDoc.type !== 'application/pdf') {
        sendInspection = docs.files[cursor++] || inspectionDoc;
      }
    } catch { /* compression best-effort; server validates anyway */ }
    // Video is uploaded separately (/api/upload/video) and referenced by URL, so it
    // is intentionally NOT part of this multipart body — including it here was
    // the dead `video` key the server dropped.
    // Gallery bytes only. Documents are staged in their own requests below, so
    // they are NOT part of this body — counting them here used to reject ads
    // that would in fact have published fine.
    const totalBytes = [...sendImages, ...(sendCover ? [sendCover] : [])]
      .reduce((n, f) => n + (f.size || 0), 0);
    if (totalBytes > MAX_PUBLISH_BODY_BYTES) {
      setLoading(false);
      // Safety net. fitGalleryToBudget should have made this unreachable, so
      // reaching it means the images are pathological (e.g. a decoder failure
      // left them un-recompressable). The message says exactly that instead of
      // the vague "too many images", because the seller's actual mistake here is
      // choosing many photos, which is ALLOWED — so blaming the count is wrong.
      const over = totalBytes - MAX_PUBLISH_BODY_BYTES;
      toast.error(
        `تعذر تجهيز ${sendImages.length} صورة ضمن الحد المسموح ` +
        `(${formatMB(MAX_PUBLISH_BODY_BYTES)} ميجابايت، والزيادة ${formatMB(over)} ميجابايت).\n` +
        'قلّل عدد الصور قليلاً — عادةً تكفي صورة أقل.',
        { duration: 9000, id: 'car-publish' },
      );
      applyErrors({
        images: `عدد الصور كبير جداً على حجم الطلب الواحد. الحد ` +
          `${formatMB(MAX_PUBLISH_BODY_BYTES)} ميجابايت — احذف ${Math.max(1, Math.ceil(over / 400000))} صورة.`,
      });
      return;
    }

    // Per-file ceiling, checked before any upload so a seller learns immediately
    // rather than after a failed request.
    for (const [label, f] of [
      ['صورة الرخصة', sendLicense],
      ['تقرير الفحص', sendInspection],
      ['سجل الصيانة', serviceRecordDoc],
      ...extraInspectionDocs.map((f, i) => [`صفحة الفحص ${i + 2}`, f] as [string, File]),
    ] as [string, File | null][]) {
      if (f && f.size > MAX_SINGLE_FILE_BYTES) {
        setLoading(false);
        toast.error(singleFileTooLargeMessage(f.size, label).replace(/\n/g, ' '), {
          duration: 9000, id: 'car-publish',
        });
        applyErrors({
          [label === 'صورة الرخصة' ? 'licenseDoc' : label === 'سجل الصيانة' ? 'serviceRecordDoc' : 'inspectionDoc']:
            singleFileTooLargeMessage(f.size, label).replace(/\n/g, ' '),
        });
        return;
      }
    }

    try {
      const formData = new FormData();

      /**
       * Stage every document in its OWN request, then send only the signed
       * references.
       *
       * This is the structural fix for "تعذر استلام البيانات": the publish body
       * now carries nothing but gallery images (~200KB x 10 ≈ 2MB), so the 4.5MB
       * platform ceiling stops being reachable regardless of how large the
       * seller's PDFs are. Documents are still fully validated server-side and
       * still stored privately (authenticated Cloudinary assets); they simply
       * travel on a route where each request fits.
       */
      const stageDoc = async (file: File, kind: string, label: string): Promise<string> => {
        const fd = new FormData();
        fd.append('kind', kind);
        fd.append('file', file);
        const res = await fetch('/api/upload/stage', {
          method: 'POST',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: fd,
        });
        const ct = res.headers.get('content-type') || '';
        // The edge answers an oversized body with HTML before our handler runs.
        if (isPlatformTooLarge(res.status, ct)) {
          throw new Error(singleFileTooLargeMessage(file.size, label));
        }
        let json: any = null;
        try {
          json = await res.json();
        } catch {
          throw new Error(`تعذر رفع ${label} (خطأ ${res.status}) — حاول مجدداً`);
        }
        if (!res.ok || !json?.success || !json?.data?.ref) {
          throw new Error(json?.error || `تعذر رفع ${label}`);
        }
        return json.data.ref as string;
      };

      const staged: { license?: string; inspection?: string; service?: string; extras: string[] } = { extras: [] };
      // Ordered so the two MANDATORY documents upload first: if the seller is on
      // a slow connection, the failure surfaces on a document they cannot skip.
      const jobs: { label: string; file: File; kind: string; slot: 'license' | 'inspection' | 'service' }[] = [];
      if (sendLicense) jobs.push({ label: 'صورة الرخصة', file: sendLicense, kind: 'license', slot: 'license' });
      if (sendInspection) jobs.push({ label: 'تقرير الفحص', file: sendInspection, kind: 'inspection', slot: 'inspection' });
      if (serviceRecordDoc) jobs.push({ label: 'سجل الصيانة', file: serviceRecordDoc, kind: 'serviceRecord', slot: 'service' });

      setStageLabel('');
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        setStageLabel(`جارٍ رفع ${job.label} (${i + 1}/${jobs.length})…`);
        const ref = await stageDoc(job.file, job.kind, job.label);
        staged[job.slot] = ref;
      }
      for (let i = 0; i < extraInspectionDocs.length; i++) {
        setStageLabel(`جارٍ رفع صفحة الفحص ${i + 2}…`);
        staged.extras.push(
          await stageDoc(extraInspectionDocs[i], 'inspectionExtra', `صفحة الفحص ${i + 2}`),
        );
      }
      setStageLabel('');

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
      // Index, not a second copy of the same bytes. The server resolves the
      // cover from the gallery URL it already has.
      if (coverIndex >= 0 && sendImages[coverIndex]) formData.append('coverIndex', String(coverIndex));
      else if (sendCover) formData.append('coverImage', sendCover);
      // Signed references only — no document bytes in this request.
      if (staged.license) formData.append('licenseDocRef', staged.license);
      if (staged.inspection) formData.append('inspectionDocRef', staged.inspection);
      if (staged.service) formData.append('serviceRecordDocRef', staged.service);
      if (staged.extras.length) formData.append('inspectionDocExtraRefs', JSON.stringify(staged.extras));

      const res = await fetch('/api/cars', {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      // The platform rejects an oversized body with an HTML 413 from the edge,
      // before this app's handler runs. `res.json()` on that page throws and the
      // seller used to be shown a misleading "تعذر استلام البيانات". Read the
      // content type first so the real reason survives.
      const resType = res.headers.get('content-type') || '';
      if (isPlatformTooLarge(res.status, resType)) {
        setLoading(false);
        toast.error(tooLargeMessage(totalBytes), { duration: 9000, id: 'car-publish' });
        return;
      }
      let data: any;
      try {
        data = await res.json();
      } catch {
        setLoading(false);
        toast.error(`تعذر قراءة رد الخادم (خطأ ${res.status}) — حاول مجدداً`, { duration: 7000, id: 'car-publish' });
        return;
      }

      if (data.success) {
        // Published: the recovery copy is now stale and would restore a listing
        // that already exists, so drop it.
        if (user?.id) clearAddCarDraft(user.id);
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
    } catch (err) {
      // A staged-document failure carries a real, actionable reason (wrong
      // format, too large, storage refused). Swallowing it into "connection
      // error" is what made the original report impossible to diagnose.
      const msg = err instanceof Error ? err.message : '';
      if (msg) {
        toast.error(msg, { duration: 9000, id: 'car-publish' });
      } else {
        toast.error('حدث خطأ أثناء الاتصال بالنظام', { duration: 7000, id: 'car-publish' });
      }
    } finally {
      setStageLabel('');
      setLoading(false);
    }
  };

  const selectedBrand = brands.find(b => b.id === form.brandId);
  const selectedModel = models.find(m => m.id === form.modelId);
  const selectedCity = cities.find(c => c.id === form.cityId);
  const isEVOrHybrid = form.fuelType === 'ELECTRIC' || form.fuelType === 'HYBRID' || form.fuelType === 'PLUGIN_HYBRID';

  // Keep the step-5 score in sync while the seller edits earlier stages.
  useEffect(() => {
    if (step !== 5) return;
    setReviewScore(scoreListing({
      brandId: form.brandId,
      modelId: form.modelId,
      year: form.year,
      kilometers: form.kilometers,
      fuelType: form.fuelType,
      transmission: form.transmission,
      color: form.color,
      condition: form.condition,
      description: form.description,
      price: form.price,
      cityId: form.cityId,
      locationLat: form.locationLat ? parseFloat(form.locationLat) : null,
      locationLng: form.locationLng ? parseFloat(form.locationLng) : null,
      phone: form.phone,
      imageCount: images.length || (coverImage ? 1 : 0),
      hasLicenseDoc: !!licenseDoc,
      hasInspectionDoc: !!inspectionDoc,
      videoUrl: videoUrl || form.videoUrl,
      vin: form.vin,
      featuresCount: form.features.length,
      customsStatus: form.customsStatus,
      hasServiceHistory: form.hasServiceHistory,
      accidentHistory: form.accidentHistory,
      serviceRecordStatus: form.serviceRecordStatus,
      ownershipSource: form.ownershipSource,
    }));
  }, [step, form, images.length, coverImage, licenseDoc, inspectionDoc, videoUrl]);

  const reviewData = {
    brandName: selectedBrand?.nameAr || '',
    modelName: selectedModel?.nameAr || '',
    year: form.year || null,
    kilometers: form.kilometers || null,
    fuelType: form.fuelType,
    transmission: form.transmission,
    color: form.color,
    doors: Number(form.doors) || null,
    engineCapacity: form.engineCapacity,
    cylinders: form.cylinders,
    drivetrain: form.drivetrain,
    horsepower: form.horsepower,
    condition: form.condition,
    description: form.description,
    price: form.price,
    cityName: selectedCity?.nameAr || '',
    phone: form.phone,
    whatsapp: form.whatsapp,
    tradeOption: TRADE_OPTIONS.find(t => t.value === form.tradeOption)?.label || '',
    inspectionSummary: form.inspectionSummary,
    customsStatus: CUSTOMS_OPTIONS.find(c => c.value === form.customsStatus)?.label || 'غير محدد',
    features: form.features.map(f => CAR_FEATURES_AR[f] || f),
    imagePreviews,
    coverPreview: (coverIndex >= 0 ? imagePreviews[coverIndex] : undefined) || imagePreviews[0] || '',
    hasLicenseDoc: !!licenseDoc,
    hasInspectionDoc: !!inspectionDoc,
    hasServiceRecordDoc: !!serviceRecordDoc,
    extraInspectionPages: extraInspectionDocs.length,
    videoPreviewUrl: videoUrl || '',
  };

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

          {/* Draft restored banner */}
          {draftRestored && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <RotateCcw className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs text-amber-200 leading-relaxed flex-1 min-w-[220px]">
                <p className="font-black">تمت استعادة بياناتك المحفوظة ({draftAgeLabel(draftRestored.at)})</p>
                {draftRestored.hadFiles && (
                  <p className="text-amber-200/80 mt-0.5">
                    تنبيه: الصور والمستندات لا تُحفظ تلقائياً — يرجى رفعها من جديد قبل النشر.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={discardDraft}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-[11px] font-bold transition-colors"
              >
                بدء إعلان جديد
              </button>
              <button
                type="button"
                onClick={() => setDraftRestored(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors"
              >
                متابعة الاستكمال
              </button>
            </div>
          )}

          {/* Progress Steps Header */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400">
                الخطوة {step} من 5
              </span>
              <span className="text-[11px] text-slate-500">
                {step === 5 ? 'مراجعة نهائية قبل النشر' : 'أكمل البيانات ثم راجع إعلانك'}
              </span>
            </div>
            {/* Progress bar mirrors the step chips below. */}
            <div
              className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden"
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={5}
              aria-label="تقدم إنشاء الإعلان"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { num: 1, title: 'المعلومات الأساسية', icon: <Car className="w-4 h-4" /> },
              { num: 2, title: 'الفحص والجمرك', icon: <ShieldCheck className="w-4 h-4" /> },
              { num: 3, title: 'الصور والفيديو', icon: <Camera className="w-4 h-4" /> },
              { num: 4, title: 'السعر والموقع', icon: <DollarSign className="w-4 h-4" /> },
              { num: 5, title: 'المراجعة والنشر', icon: <CheckCircle2 className="w-4 h-4" /> },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => goToStep(s.num)}
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

              {/* ── Additional vehicle identity ── */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">سنة أول ترخيص</label>
                    <input
                      type="number"
                      value={form.firstRegistrationYear}
                      onChange={e => updateForm('firstRegistrationYear', e.target.value)}
                      placeholder="مثال: 2021"
                      className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">عدد المقاعد</label>
                    <input
                      type="number"
                      value={form.seats}
                      onChange={e => updateForm('seats', e.target.value)}
                      placeholder="5"
                      className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">عدد المفاتيح</label>
                    <input
                      type="number"
                      value={form.keysCount}
                      onChange={e => updateForm('keysCount', e.target.value)}
                      placeholder="2"
                      className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">اللون الداخلي</label>
                    <select
                      value={form.interiorColor}
                      onChange={e => updateForm('interiorColor', e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-emerald-500"
                    >
                      <option value="">غير محدد</option>
                      {INTERIOR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  كل هذه الحقول اختيارية — تُغني عن التكرار في الوصف وتساعد المشتري على المقارنة.
                </p>
              </div>

              {/* ── Ownership ── */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  معلومات الملكية
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <OptionGroup
                    name="ownershipSource"
                    label="مصدر السيارة"
                    options={OWNERSHIP_SOURCES}
                    value={form.ownershipSource}
                    onChange={(v) => updateForm('ownershipSource', v)}
                  />
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">عدد المالكين السابقين *</label>
                      <input
                        type="number"
                        value={form.ownerCount}
                        onChange={e => updateForm('ownerCount', Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        max={20}
                        className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-sm outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <label className="flex items-center gap-2 px-3.5 py-3 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isFirstOwner}
                        onChange={e => updateForm('isFirstOwner', e.target.checked)}
                        className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-300">السيارة أول مالك (لم تُنتقل بين上过)</span>
                    </label>
                  </div>
                </div>
                <DeclarationNote>
                  هذه البيانات يصرّح بها البائع ولا تُعدّ توثيقاً رسمياً، وقد يراجعها المشتري أو الإدارة قبل الشراء.
                </DeclarationNote>
              </div>

              {/* ── History & condition ── */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  تاريخ السيارة وحالتها
                </h4>

                <OptionGroup
                  name="accidentHistory"
                  label="هل تعرضت السيارة لحادث سابق؟"
                  hint="التصريح بوجود حادث لا يقلل من قيمة الإعلان — إخفاؤه هو الخطر."
                  options={ACCIDENT_OPTIONS}
                  value={form.accidentHistory}
                  onChange={(v) => updateForm('accidentHistory', v)}
                />

                {form.accidentHistory === 'YES' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">وصف الحادث والمناطق المتضررة</label>
                    <textarea
                      rows={3}
                      value={form.accidentDetails}
                      onChange={e => updateForm('accidentDetails', e.target.value)}
                      placeholder="مثال: حادث خلفي بسيط، تم إصلاح الصدام الخلفي والأمامية، الشاصي سليم حسب فحص المركز."
                      className="w-full p-3.5 rounded-2xl border border-slate-800 bg-slate-900 text-white text-sm outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <OptionGroup
                    name="bodyPaintStatus"
                    label="الهيكل والدهان"
                    options={BODY_PAINT_OPTIONS}
                    value={form.bodyPaintStatus}
                    onChange={(v) => updateForm('bodyPaintStatus', v)}
                  />
                  <OptionGroup
                    name="chassisStatus"
                    label="الشاصي"
                    options={CHASSIS_OPTIONS}
                    value={form.chassisStatus}
                    onChange={(v) => updateForm('chassisStatus', v)}
                  />
                  <OptionGroup
                    name="engineStatus"
                    label="المحرك"
                    options={ENGINE_OPTIONS}
                    value={form.engineStatus}
                    onChange={(v) => updateForm('engineStatus', v)}
                  />
                  <OptionGroup
                    name="transmissionStatus"
                    label="ناقل الحركة"
                    options={ENGINE_OPTIONS}
                    value={form.transmissionStatus}
                    onChange={(v) => updateForm('transmissionStatus', v)}
                  />
                </div>
              </div>

              {/* ── Service record ── */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  سجل الصيانة
                </h4>
                <OptionGroup
                  name="serviceRecordStatus"
                  label="هل يوجد سجل صيانة؟"
                  options={SERVICE_RECORD_OPTIONS}
                  value={form.serviceRecordStatus}
                  onChange={(v) => updateForm('serviceRecordStatus', v)}
                />
                {form.serviceRecordStatus === 'EXISTS' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">تاريخ آخر صيانة</label>
                      <input
                        type="date"
                        value={form.lastServiceDate}
                        onChange={e => updateForm('lastServiceDate', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-emerald-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">نوع آخر صيانة</label>
                      <input
                        type="text"
                        value={form.lastServiceType}
                        onChange={e => updateForm('lastServiceType', e.target.value)}
                        placeholder="مثال: زيت وفلتر"
                        className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">ملاحظات الصيانة</label>
                      <input
                        type="text"
                        value={form.serviceNotes}
                        onChange={e => updateForm('serviceNotes', e.target.value)}
                        placeholder="مثال: صيانة دورية كل 10,000 كم"
                        className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
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
                  onClick={() => goToStep(2)}
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

              {/* Customs detail — the status above used to be thrown away by the
                  server schema; it is now a real, filterable field. */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <OptionGroup
                  name="customsTransactionStatus"
                  label="حالة المعاملة الجمركية"
                  hint="معلومات يصرّح بها البائع، وليست استفساراً قانونياً ولا تُغني عن مستندات الجمرك."
                  options={CUSTOMS_TRANSACTION_OPTIONS}
                  value={form.customsTransactionStatus}
                  onChange={(v) => updateForm('customsTransactionStatus', v)}
                />
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">ملاحظات الجمرك</label>
                  <textarea
                    rows={2}
                    value={form.customsNotes}
                    onChange={e => updateForm('customsNotes', e.target.value)}
                    placeholder="مثال: الجمرك مكتمل، كتيب السيارة مستخرج، التأمين ساري."
                    className="w-full p-3.5 rounded-2xl border border-slate-800 bg-slate-900 text-white text-sm outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
                <DeclarationNote>
                  النظام لا يصدر أي حكم قانوني أو رسمي بناءً على إدخال البائع — البيانات تُستخدم للعرض والبحث فقط.
                </DeclarationNote>
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

              {/* ── Official documents (مستندات وتحقق) ──
                  Kept in a visually distinct block (amber, document iconography)
                  so a seller never confuses a verification artefact with a
                  marketing photo. These are NOT part of the step-3 gallery. */}
              <div className="space-y-3 pt-2">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-amber-400" />
                    مستندات السيارة (إلزامية للنشر)
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-400 mt-1.5">
                    تُستخدم للتحقق من بيانات السيارة ومطابقة معلومات الإعلان. تظهر في قسم «المستندات والتحقق»
                    داخل صفحة الإعلان، ولا تظهر أبداً ضمن معرض صور السيارة.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <DocumentSlot
                    id="licenseDoc"
                    title="صورة ترخيص السيارة"
                    hint="مطلوبة للتحقق من بيانات السيارة ومطابقة معلومات الإعلان. تأكد أن أرقام الترخيص واضحة ومقروءة."
                    required
                    file={licenseDoc}
                    preview={licenseDocPreview}
                    error={errors.licenseDoc}
                    onPick={(f) => handleDocPick(f, 'license')}
                    onClear={() => clearDoc('license')}
                  />
                  <DocumentSlot
                    id="inspectionDoc"
                    title="صورة فحص السيارة"
                    hint="إثبات مرتبط بفحص السيارة وحالتها الفنية (الشاسي والميكانيك)، وليس صورة من صور الإعلان التسويقية."
                    required
                    file={inspectionDoc}
                    preview={inspectionDocPreview}
                    error={errors.inspectionDoc}
                    onPick={(f) => handleDocPick(f, 'inspection')}
                    onClear={() => clearDoc('inspection')}
                    extraCount={extraInspectionDocs.length}
                  />
                </div>

                {/* Extra inspection-report pages — an inspection report is often
                    several sheets, and forcing sellers to merge them into one
                    image loses legibility. */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-xs font-bold text-slate-300">صفحات إضافية لتقرير الفحص (اختياري)</p>
                      <p className="text-[11px] text-slate-500">
                        إن كان التقرير عدة صفحات، ارفعها هنا — حتى 5 صفحات إضافية.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {extraInspectionDocs.length > 0 && (
                        <button
                          type="button"
                          onClick={clearExtraInspectionDocs}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold transition-colors"
                        >
                          مسح الكل
                        </button>
                      )}
                      <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer transition-colors">
                        إضافة صفحات
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="hidden"
                          onChange={(e) => { addExtraInspectionDocs(e.target.files); e.target.value = ''; }}
                        />
                      </label>
                    </div>
                  </div>
                  {extraInspectionDocs.length > 0 && (
                    <ul className="flex flex-wrap gap-2 pt-1">
                      {extraInspectionDocs.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                          <FileText className="w-3 h-3 text-amber-400" />
                          <span className="max-w-[120px] truncate">{f.name}</span>
                          <span className="text-slate-500">{(f.size / 1024).toFixed(0)}KB</span>
                          <button
                            type="button"
                            aria-label={`حذف ${f.name}`}
                            onClick={() => setExtraInspectionDocs(prev => prev.filter((_, j) => j !== i))}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Service-record document — optional, and only meaningful when the
                    seller declared a record exists. */}
                {form.serviceRecordStatus === 'EXISTS' && (
                  <DocumentSlot
                    id="serviceRecordDoc"
                    title="مستند سجل الصيانة (اختياري)"
                    hint="صورة دفتر الصيانة أو كتيّب الصيانة — تُستخدم للتحقق من ادعاء وجود سجل صيانة."
                    file={serviceRecordDoc}
                    preview={serviceRecordPreview}
                    error={errors.serviceRecordDoc}
                    onPick={(f) => handleDocPick(f, 'service')}
                    onClear={() => clearDoc('service')}
                  />
                )}
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
                  onClick={() => goToStep(3)}
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

{/* Cover is chosen from the gallery below, not uploaded twice —
                  the old separate picker could not promote a later shot. */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-xs font-bold text-slate-300 mb-1">صورة الغلاف الرئيسية</p>
                {coverIndex >= 0 && imagePreviews[coverIndex] ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreviews[coverIndex]}
                      alt="صورة الغلاف"
                      className="w-32 h-24 object-cover rounded-xl border border-amber-500/40"
                    />
                    <p className="text-[11px] text-slate-400 leading-relaxed flex-1">
                      تُختار من مصغّرات الصور بالأسفل — اضغط نجمة الصورة التي تريدها كغلاف.
                      الصورة الأولى تُستخدم كغلاف تلقائياً إن لم تختر واحدة.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    لم تُحدد غلاف بعد — ستُستخدم أول صورة ترفعها كغلاف. يمكنك تغييرها لاحقاً من المصغّرات.
                  </p>
                )}
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

                <PhotoManager
                  previews={imagePreviews}
                  files={images}
                  coverIndex={coverIndex}
                  onReorder={reorderImages}
                  onSetCover={setCoverIndex}
                  onRemove={removeImage}
                />
              </div>

              {/* Car video — real upload (MP4/WebM/MOV, ≤100MB, ≤3 min) + external link */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  فيديو السيارة (اختياري — يزيد جاذبية الإعلان)
                </label>

                {videoUrl ? (
                  <div className="space-y-2">
                    <video
                      src={videoUrl}
                      controls
                      preload="metadata"
                      className="w-full max-w-md h-52 rounded-2xl bg-slate-950 border border-slate-800 object-contain"
                    />
                    <div className="flex gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer transition-colors">
                        استبدال الفيديو
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                          className="hidden"
                          onChange={(e) => { handleVideoPick(e.target.files?.[0] || null); e.target.value = ''; }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={clearVideo}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold transition-colors"
                      >
                        حذف الفيديو
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label
                      htmlFor="carVideoInput"
                      className="flex flex-col items-center justify-center gap-1.5 p-6 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 hover:border-emerald-500 transition-all cursor-pointer text-center"
                    >
                      {videoUploading ? (
                        <>
                          <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
                          <span className="text-xs font-bold text-white">جاري رفع الفيديو…</span>
                          {/* Real progress from XHR upload events — the previous
                              percentage was stuck at whatever it last was. */}
                          <span className="w-full max-w-[220px] h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
                            <span
                              className="block h-full rounded-full bg-emerald-500 transition-all duration-200"
                              style={{ width: `${Math.max(3, videoProgress)}%` }}
                            />
                          </span>
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            {videoProgress > 0 ? `${videoProgress}%` : 'قد يستغرق بعض الوقت'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Video className="w-7 h-7 text-emerald-400" />
                          <span className="text-xs font-bold text-white">اضغط لاختيار فيديو للسيارة</span>
                          <span className="text-[11px] text-slate-500">
                            MP4 أو WebM أو MOV — حتى 3 دقائق
                          </span>
                          {!directUploadAvailable() && (
                            <span className="text-[10px] text-amber-400/90 max-w-[240px] leading-relaxed">
                              الحد الأقصى للرفع المباشر { (SAFE_INLINE_MAX_BYTES / 1024 / 1024).toFixed(1) } ميجابايت —
                              صوّر المقطع الأقصر، أو استخدم رابط YouTube.
                            </span>
                          )}
                        </>
                      )}
                    </label>
                    <input
                      id="carVideoInput"
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                      className="hidden"
                      disabled={videoUploading}
                      onChange={(e) => { handleVideoPick(e.target.files?.[0] || null); e.target.value = ''; }}
                    />

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="flex-1 h-px bg-slate-800" />
                      أو استخدم رابطاً خارجياً
                      <span className="flex-1 h-px bg-slate-800" />
                    </div>

                    <input
                      type="text"
                      value={form.videoUrl}
                      onChange={e => updateForm('videoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full h-11 px-4 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500 font-mono"
                      dir="ltr"
                    />
                    <FieldErrors fields={['videoUrl']} errors={errors} />
                  </div>
                )}

                {videoError && (
                  <p role="alert" className="flex items-start gap-1.5 text-[11px] font-bold text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
                    <span>{videoError}</span>
                  </p>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
                >
                  السابق
                </button>

                <button
                  type="button"
                  onClick={() => goToStep(4)}
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

              {/* Stage 4 footer — publishing moved to stage 5 so the seller always reviews
                  the finished ad first. */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
                >
                  السابق
                </button>

                <button
                  type="button"
                  onClick={() => goToStep(5)}
                  className="px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <span>التالي: مراجعة الإعلان</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

          {/* ── STEP 5: Review before publishing ── */}
          {step === 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <ListingReview
                data={reviewData}
                completeness={reviewScore}
                strength={reviewScore?.strength ?? 1}
                onEditStep={setStep}
              />

              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
                >
                  السابق
                </button>

                <button
                  type="submit"
                  disabled={loading || reviewScore?.canPublish === false}
                  title={reviewScore?.canPublish === false ? 'أكمل البيانات الإلزامية أولاً' : undefined}
                  className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-xl shadow-emerald-500/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {/* Names the current phase: documents upload one at a time
                      before the publish request, and a frozen button during
                      that is indistinguishable from a hang. */}
                  <span>{stageLabel || 'نشر إعلان السيارة الآن'}</span>
                </button>
              </div>
            </motion.div>
          )}

        </form>

      </div>
    </div>
  );
}
