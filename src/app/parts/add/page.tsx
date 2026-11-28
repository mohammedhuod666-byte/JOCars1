'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2, Upload, X, Camera, ShieldCheck, Truck, Sparkles, ChevronLeft,
  DollarSign, MapPin, Tag, Wrench, CheckCircle2, AlertTriangle, PenTool,
  HelpCircle, Info, ShieldAlert, Cpu, Check, Search, Cog, Zap, Disc, Gauge,
  Snowflake, Lightbulb, Layers, Armchair, Flame, CircleDot, Car
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { fitGalleryToBudget } from '@/lib/media/image-compress-client';
import { MAX_PUBLISH_BODY_BYTES, formatMB, isPlatformTooLarge, galleryBudget } from '@/lib/media/upload-limits';
import { LocationSelector, ProvinceItem, CityItem } from '@/components/cars/LocationSelector';

// Comprehensive Auto Parts Taxonomy matching major international & Jordanian spare parts platforms
const PART_CATEGORIES = [
  {
    id: 'engine',
    label: 'المحرك وملحقاته',
    icon: Cpu,
    subParts: [
      'رأس محرك (Cylinder Head)', 'محرك كامل (شورت بلوك)', 'بساتم وشنبر', 'صبابات وكواشيك',
      'كازكيت رأس محرك', 'كارتير زيت', 'طرمبة زيت', 'طرمبة بنزين ضغط عالي', 'بكرات وقواشين صدر',
      'ثروتل وبوابة هواء', 'كويلات بواجي أصلية', 'حساس كرنك / كامات', 'قواعد محرك (كراسي موتور)'
    ]
  },
  {
    id: 'transmission',
    label: 'الجير ونظام الدفع',
    icon: Cog,
    subParts: [
      'جير أوتوماتيك كامل', 'جير عادي كامل', 'كلتش وديسك وصحن', 'عكوس ومفاصل أمامية',
      'بككس ودفرنس خلفي', 'عمود درايف (كردان)', 'طنجرة جير هيدروليك', 'مخ جير وشريحة إلكترونية',
      'قواعد جير (كراسي فتيس)', 'رديتر تبريد زيت الجير'
    ]
  },
  {
    id: 'hybrid',
    label: 'أنظمة الهايبرد والكهرباء',
    icon: Zap,
    subParts: [
      'بطارية هايبرد كاملة مفحوصة', 'خلايا بطارية هايبرد مفردة', 'انفيرتر محول طاقة (Inverter)',
      'محول كهربائي DC-DC', 'كمبيوتر بطارية هايبرد BMS', 'مضخة تبريد انفيرتر مائية',
      'كوابل برتقالية جهد عالي', 'شاحن سيارة كهربائية On-Board Charger'
    ]
  },
  {
    id: 'brake',
    label: 'الفرامل ومضخات ABS',
    icon: Disc,
    subParts: [
      'جهاز ومضخة ABS كاملة', 'دسكات بريك أمامية وخلفية', 'كليبرات بريك', 'فحمات فرامل سيراميك / أصلي',
      'بوستر فرامل (سيرفو)', 'ماستر سلندر رئيسي', 'موتور بريك يد إلكتروني EPB', 'حساسات سرعة عجلات ABS'
    ]
  },
  {
    id: 'suspension',
    label: 'الهيئة الأمامية ونظام التعليق',
    icon: Gauge,
    subParts: [
      'مساعدات أمامية كاملة (طبلات)', 'مساعدات خلفية', 'مقصات علوية وسفلية', 'جوزات وركبات هيئة',
      'دودة ستيرنج كهربائية / زيت', 'طرمبة باور ستيرنج', 'صواني ركبة ومحاور', 'زنبركات ويايات رياضية',
      'قضيب توازن وروابط ميزان'
    ]
  },
  {
    id: 'cooling',
    label: 'التبريد والمكيف',
    icon: Snowflake,
    subParts: [
      'راديتر ماء أصلي', 'كمبروسر مكيف', 'كوندنسر مكيف (سربنتينة)', 'ثلاجة مكيف داخلية',
      'راديتر تدفئة داخلي', 'مروحة تبريد راديتر كهربائية', 'ثيرموستات كوع حرارة', 'طرمبة ماء تبريد',
      'مواسير وخراطيم مكيف'
    ]
  },
  {
    id: 'electrical',
    label: 'الإنارة والكهرباء والحساسات',
    icon: Lightbulb,
    subParts: [
      'ضوء أمامي كامل LED / زنون', 'ستوب خلفي LED', 'كشافات ضباب أمامية', 'دينامو شحن أصلي',
      'سلف تشغيل محرك (Starter)', 'كمبيوتر محرك رئيسي ECU', 'كمبيوتر بودي BCM', 'ضفيرة كهرباء كاملة',
      'حساس شكمان (أكسجين)', 'حساس هواء MAF', 'شريحة طارة بوري وإيرباق'
    ]
  },
  {
    id: 'body',
    label: 'قطع الهيكل والبودي الخارجي',
    icon: Layers,
    subParts: [
      'طمبون أمامي كامل مع الشبك', 'طمبون خلفي', 'غطاء محرك (بونيت/كبوت)', 'غطاء صندوق خلفي (دبة)',
      'أبواب كاملة يمين/يسار', 'رفارف أمامية وخلفية', 'شبك تهوية أمامي راديتر', 'مرايا جانبية كهربائية',
      'زجاج أمامي / خلفي أصلي', 'فتحة سقف بانوراما كاملة', 'بطانات عجلات بلاستيكية'
    ]
  },
  {
    id: 'interior',
    label: 'المقصورة والفرش الداخلي',
    icon: Armchair,
    subParts: [
      'كراسي جلد كهربائية كاملة', 'فرش قماش أصلي وكالة', 'تابلوه أمامي سليم مع الإيرباق',
      'طارة ستيرنج جلد مع التحكم', 'شاشة ملاحة ونظام أندرويد', 'وحدة أزرار شبابيك ومرايا',
      'لوحة تحكم مكيف إلكترونية', 'كونسول وسطي وتكاية', 'ديكورات أبواب داخلية'
    ]
  },
  {
    id: 'exhaust',
    label: 'العادم والتيربو وتغذية الوقود',
    icon: Flame,
    subParts: [
      'تيربو تشارجر أصلي', 'دبة بيئة وفلتر كربوني (كاتالايزر)', 'شكمان واكزوزت كامل',
      'طرمبة بنزين داخل التانكي', 'بخاخات بنزين (Injectors)', 'مسطرة بخاخات مع الحساس', 'مبرد هواء إنتركولر'
    ]
  },
  {
    id: 'wheel',
    label: 'الجنوط والإطارات',
    icon: CircleDot,
    subParts: [
      'طقم جنوط أصلية قياس 17/18/19', 'جنط مفرد سبير وكالة', 'كوشوك وإطارات بحالة ممتازة',
      'صواميل وبراغي أمان عجلات', 'حساسات ضغط الإطارات TPMS'
    ]
  },
  {
    id: 'other',
    label: 'قطع متنوعة وتجهيزات أخرى',
    icon: Wrench,
    subParts: [
      'مجموعة أدوات سبير وجك أصلي', 'هوك جر وسحب سيارات', 'دعاسات وفرشات أرضية أصلية', 'إكسسوارات حماية وتعديل'
    ]
  }
];

const CONDITIONS = [
  { value: 'USED', label: 'مستعملة أصلية بحالة ممتازة (تشليح / سكراب)' },
  { value: 'NEW', label: 'جديدة بالكرتونة (وكالة أصلية)' },
  { value: 'REFURBISHED', label: 'مُجددة ومفحوصة مع كفالة' },
];

const ORIGINS = [
  'ياباني أصلي وكالة',
  'كوري أصلي وكالة',
  'ألماني أصلي',
  'أمريكي أصلي',
  'تجاري نخب أول مكفول',
  'تشليح خليجي / وارد يابان',
  'تشليح وارد أمريكا',
  'محلي الأردن (سكراب ماركا / البيادر / الحرة)'
];

const WARRANTY_OPTIONS = [
  'كفالة تجربة وتشغيل 3 أيام (الموصى بها)',
  'كفالة فحص وتشغيل أسبوع كامل',
  'كفالة شهر كامل في الورشة',
  'كفالة 3 أشهر للمحركات والجيرات',
  'بدون كفالة (بيع بحالتها الراهنة)'
];

const JORDAN_GOVERNORATES = [
  {
    name: 'عمان',
    districts: ['بيادر وادي السير والمنطقة الصناعية', 'ماركا الشمالية والصناعية', 'سحاب والمدينة الصناعية', 'الوحدات وشارع اليرموك', 'شارع الأردن وعين الباشا', 'خلدا وتلاع العلي', 'شفا بدران وأبو نصير', 'طبربور والهاشمي الشمالي', 'وسط البلد وجبل عمان']
  },
  {
    name: 'الزرقاء',
    districts: ['المنطقة الحرة بالزرقاء (سوق قطع السيارات)', 'الزرقاء الجديدة', 'الرصيفة والحرفيين', 'عوجان وحي معصوم', 'الضليل والحلابات']
  },
  {
    name: 'إربد',
    districts: ['المنطقة الصناعية الحرفية', 'إربد الجديدة وحي الجامعة', 'الحصن والصريح', 'الرمثا والحدود', 'دير أبي سعيد']
  },
  {
    name: 'العقبة',
    districts: ['المنطقة الحرفية بالعقبة', 'المنطقة الاقتصادية الخاصة', 'وسط البلد بالعقبة']
  },
  {
    name: 'البلقاء',
    districts: ['السلط والمنطقة الحرفية', 'الفحيص وماحص', 'عين الباشا ومخيم البقعة', 'دير علا والشونة الجنوبية']
  },
  {
    name: 'مادبا',
    districts: ['مادبا الحرفية', 'ذيبان والفيصلية']
  },
  {
    name: 'الكرك',
    districts: ['الكرك والمنطقة الصناعية', 'المزار الجنوبي', 'الأغوار الجنوبية']
  },
  {
    name: 'المفرق',
    districts: ['المفرق وقرب الحرفية', 'البلعما ورحاب', 'الرويشد والصفاوي']
  },
  {
    name: 'جرش',
    districts: ['جرش والمنطقة الحرفية', 'برما والمصطبة']
  },
  {
    name: 'عجلون',
    districts: ['عجلون وعين جنا', 'كفرنجة']
  },
  {
    name: 'معان',
    districts: ['معان والمنطقة التنموية', 'وادي موسى والبتراء', 'الشوبك']
  },
  {
    name: 'الطفيلة',
    districts: ['الطفيلة والمنطقة الحرفية', 'بصيرا والعين البيضاء']
  }
];

export default function AddPartPage() {
  const { user, isAuthenticated, _hydrated, token } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<{ id: string; nameAr: string }[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Selected Category and Custom Manual Input
  const [selectedCategory, setSelectedCategory] = useState<string>('engine');
  const [selectedSubPart, setSelectedSubPart] = useState<string>('');
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [manualPartName, setManualPartName] = useState<string>('');

  // Location Selector
  const [selectedGov, setSelectedGov] = useState<string>('عمان');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('بيادر وادي السير والمنطقة الصناعية');
  const [districtSearch, setDistrictSearch] = useState<string>('');

  // Anti-Fraud Agreement
  const [antiFraudAgreed, setAntiFraudAgreed] = useState<boolean>(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    partType: 'engine',
    brandId: '',
    partNumber: '',
    oemNumber: '',
    originCountry: 'ياباني أصلي وكالة',
    compatibleModels: '',
    condition: 'USED',
    price: '',
    currency: 'JOD',
    quantity: '1',
    phone: '',
    whatsapp: '',
    cityId: '',
    isNegotiable: true,
    hasWarranty: true,
    warrantyPeriod: 'كفالة تجربة وتشغيل 3 أيام (الموصى بها)',
    hasDelivery: false,
    deliveryFee: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push('/login?redirect=/parts/add');
      return;
    }
    if (isAuthenticated) {
      if (user?.phone) setForm((f) => ({ ...f, phone: user.phone || '', whatsapp: user.whatsapp || user.phone || '' }));
      fetch('/api/cars/brands').then((r) => r.json()).then((d) => setBrands(d.data || [])).catch(() => {});
      fetch('/api/cars/provinces').then((r) => r.json()).then((d) => setProvinces(d.data || [])).catch(() => {});
      fetch('/api/cars/cities').then((r) => r.json()).then((d) => setCities(d.data || [])).catch(() => {});
    }
  }, [isAuthenticated, _hydrated, router, user]);

  // Sync title when subPart or manualName changes
  const handleSelectSubPart = (sub: string) => {
    setSelectedSubPart(sub);
    setIsManualInput(false);
    setForm((f) => ({
      ...f,
      partType: selectedCategory,
      title: f.title ? f.title : sub,
    }));
  };

  const handleManualNameChange = (val: string) => {
    setManualPartName(val);
    setForm((f) => ({
      ...f,
      title: val,
      partType: selectedCategory || 'other',
    }));
  };

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 8 - images.length);
    setImages((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    const finalTitle = isManualInput ? manualPartName.trim() : (form.title || selectedSubPart || manualPartName);
    if (!finalTitle || !form.price || !form.phone) {
      toast.error('يرجى تحديد أو كتابة اسم القطعة، السعر، ورقم الهاتف');
      return;
    }

    if (images.length === 0) {
      toast.error('يرجى إرفاق صورة حقيقية واحدة على الأقل للقطعة لتأكيد مصداقية الإعلان ومنع الاحتيال');
      return;
    }

    if (!antiFraudAgreed) {
      toast.error('يرجى تأكيد إقرار حماية الصور وعدم أخذها من الإنترنت للمتابعة');
      return;
    }

    setLoading(true);
    let sendImages = images;
    try {
      const fit = await fitGalleryToBudget(images, galleryBudget(images.length));
      sendImages = fit.files;
    } catch { /* best-effort */ }

    const totalBytes = sendImages.reduce((n, f) => n + (f.size || 0), 0);
    if (totalBytes > MAX_PUBLISH_BODY_BYTES) {
      setLoading(false);
      toast.error(`حجم الصور ${formatMB(totalBytes)} ميجابايت — الحد الأقصى ${formatMB(MAX_PUBLISH_BODY_BYTES)} ميجابايت.`);
      return;
    }

    try {
      const fd = new FormData();
      const chosenCity = cities.find((c) => c.id === form.cityId);
      const locationFull = chosenCity
        ? `${chosenCity.province?.nameAr ? chosenCity.province.nameAr + ' - ' : ''}${chosenCity.nameAr}`
        : `${selectedGov} - ${selectedDistrict}`;
      
      const payload = {
        ...form,
        title: finalTitle,
        partType: selectedCategory || form.partType || 'other',
        description: `${form.description ? form.description + '\n\n' : ''}الموقع: ${locationFull}`,
      };

      Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
      sendImages.forEach((img) => fd.append('images', img));

      const headers: Record<string, string> = {};
      const currentToken = token || useAuth.getState().token;
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

      const res = await fetch('/api/parts', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: fd,
      });

      if (isPlatformTooLarge(res.status, res.headers.get('content-type') || '')) {
        toast.error(`حجم الصور كبير جداً. يرجى تقليل عدد الصور والمحاولة ثانية.`);
        return;
      }

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        toast.success('تم نشر إعلان قطعة الغيار بنجاح في سوق كارس جو');
        router.push('/parts');
      } else {
        toast.error(data?.error || `فشل إرسال الإعلان (خطأ ${res.status})`);
      }
    } catch {
      toast.error('حدث خطأ غير متوقع أثناء إرسال الإعلان');
    } finally {
      setLoading(false);
    }
  };

  const activeGovData = JORDAN_GOVERNORATES.find((g) => g.name === selectedGov) || JORDAN_GOVERNORATES[0];
  const filteredDistricts = activeGovData.districts.filter((d) => d.includes(districtSearch.trim()));

  if (_hydrated && !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 pb-28 pt-4 sm:pt-6">
      <div className="container-custom max-w-4xl space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href="/parts" className="hover:text-amber-400 transition-colors flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>سوق قطع الغيار</span>
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-amber-400 font-bold">إضافة إعلان قطعة غيار احترافي</span>
        </div>

        {/* Main Publishing Container */}
        <div className="p-5 sm:p-8 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-7 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="border-b border-white/[0.08] pb-5 space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نظام بيع قطع الغيار الشامل في الأردن</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              إضافة إعلان قطعة غيار سيارات
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              انشر قطعتك بدقة، اختر نوع القطعة من التصنيف الشامل أو اكتب اسمها يدوياً، مع كفالة الفحص ومطابقة رقم OEM لحماية المشتري.
            </p>
          </div>

          <div className="space-y-7 relative z-10">

            {/* STEP 1: Deep Parts Taxonomy & Manual Custom Input */}
            <div className="space-y-4 p-4 sm:p-6 rounded-2xl bg-[#0c0e15] border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-black text-white">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>1. تصنيف ونوع قطعة الغيار *</span>
                </label>
                
                {/* Manual Name Toggle */}
                <button
                  type="button"
                  onClick={() => setIsManualInput(!isManualInput)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isManualInput
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md shadow-amber-400/20'
                      : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:text-white'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isManualInput ? 'العودة للقائمة الجاهزة' : 'لم تجد القطعة؟ اكتبها يدوياً'}</span>
                </button>
              </div>

              {/* If Manual Input is Active */}
              {isManualInput ? (
                <div className="space-y-2 pt-2">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-semibold leading-relaxed">
                    اكتب اسم القطعة بدقة كما تبحث عنها الناس (مثال: كمبروسر مكيف نيسان التيما 2017 أصلي، أو طرمبة ماء هايبرد كيا أوبتيما).
                  </div>
                  <input
                    type="text"
                    value={manualPartName}
                    onChange={(e) => handleManualNameChange(e.target.value)}
                    placeholder="اكتب اسم القطعة يدوياً هنا..."
                    className="w-full h-12 px-4 rounded-xl border border-amber-400/50 bg-[#121622] text-white text-sm outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              ) : (
                /* Category Buttons & Subparts Grid */
                <div className="space-y-3.5">
                  <p className="text-[11px] text-slate-400">اختر القسم الرئيسي للقطعة:</p>
                  
                  {/* Category Chips Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {PART_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      const IconComponent = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setSelectedSubPart('');
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border text-right ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md shadow-amber-400/20 scale-[1.02]'
                              : 'bg-[#181d2a] text-slate-300 border-white/[0.06] hover:bg-[#1f2536]'
                          }`}
                        >
                          <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Subparts Quick Selector */}
                  {(() => {
                    const catObj = PART_CATEGORIES.find((c) => c.id === selectedCategory);
                    if (!catObj) return null;
                    return (
                      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                        <p className="text-[11px] font-bold text-slate-300">
                          اختر القطعة المحددة ضمن ({catObj.label}):
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto scrollbar-none p-1">
                          {catObj.subParts.map((sub) => {
                            const isSubSelected = selectedSubPart === sub;
                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => handleSelectSubPart(sub)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                  isSubSelected
                                    ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-sm'
                                    : 'bg-[#121622] text-slate-300 hover:text-white border-white/[0.06] hover:border-amber-400/40'
                                }`}
                              >
                                {isSubSelected && <Check className="w-3.5 h-3.5 inline ml-1" />}
                                {sub}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-slate-300">
                  عنوان الإعلان الظاهر للمشترين *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: طرمبة ماء هايبرد تويوتا كامري 2012-2017 أصلية وكالة"
                  className="w-full h-12 px-4 rounded-xl border border-white/[0.08] bg-[#121622] text-white text-sm outline-none focus:border-amber-400 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* STEP 2: Compatibility, Brand, and OEM Numbers */}
            <div className="space-y-4 p-4 sm:p-6 rounded-2xl bg-[#0c0e15] border border-white/[0.06]">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-black text-white">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>2. الماركة والتوافق وأرقام القطعة (OEM)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Brand */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">ماركة السيارة المتوافقة</label>
                  <select
                    value={form.brandId}
                    onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-white/[0.08] bg-[#121622] text-white text-xs sm:text-sm outline-none focus:border-amber-400"
                  >
                    <option value="">اختر الماركة (تويوتا، هيونداي، كيا، مرسيدس...)</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id} className="bg-[#121622]">
                        {b.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Condition */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">حالة القطعة *</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-white/[0.08] bg-[#121622] text-white text-xs sm:text-sm outline-none focus:border-amber-400"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value} className="bg-[#121622]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* OEM / Serial Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>رقم القطعة الأصلي (OEM Number)</span>
                    <span className="text-[10px] text-amber-400 font-medium">مهم للمطابقة</span>
                  </label>
                  <input
                    type="text"
                    value={form.oemNumber}
                    onChange={(e) => setForm({ ...form, oemNumber: e.target.value })}
                    placeholder="مثال: 04465-33471"
                    className="w-full h-12 px-4 rounded-xl border border-white/[0.08] bg-[#121622] text-white text-sm outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                {/* Country of Origin */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">بلد المنشأ / مصدر القطعة</label>
                  <select
                    value={form.originCountry}
                    onChange={(e) => setForm({ ...form, originCountry: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-white/[0.08] bg-[#121622] text-white text-xs sm:text-sm outline-none focus:border-amber-400"
                  >
                    {ORIGINS.map((o) => (
                      <option key={o} value={o} className="bg-[#121622]">
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Compatible Models */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-300">
                  الموديلات والسنوات المتوافقة
                </label>
                <input
                  type="text"
                  value={form.compatibleModels}
                  onChange={(e) => setForm({ ...form, compatibleModels: e.target.value })}
                  placeholder="مثال: كامري 2012-2017، أفالون 2013-2018، لكزس ES300h"
                  className="w-full h-12 px-4 rounded-xl border border-white/[0.08] bg-[#121622] text-white text-sm outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* STEP 3: Jordan Governorate & Industrial Area Selector */}
            <div className="space-y-4 p-4 sm:p-6 rounded-2xl bg-[#0c0e15] border border-white/[0.06]">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-black text-white">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>3. موقع تواجد القطعة في الأردن *</span>
              </label>

              <LocationSelector
                provinces={provinces}
                cities={cities}
                selectedCityId={form.cityId}
                onCityChange={(cityId) => setForm((f) => ({ ...f, cityId }))}
              />
            </div>

            {/* STEP 4: Strict Anti-Fraud Photo Rules & Upload */}
            <div className="space-y-4 p-4 sm:p-6 rounded-2xl bg-[#0c0e15] border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-black text-white">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>4. صور القطعة (نظام الحماية من الاحتيال) *</span>
                </label>
                <span className="text-xs text-slate-400">{images.length}/8 صور</span>
              </div>

              {/* Anti-Fraud Photos Rules Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs leading-relaxed text-amber-300">
                <div className="flex items-center gap-2 font-black text-amber-400 text-sm">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>قوانين الصور الصارمة لمنع النصب والاحتيال في قطع الغيار:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] sm:text-xs">
                  <li><strong className="text-white">التقاط صور حقيقية للقطعة:</strong> يُمنع منعاً باتاً تنزيل صور من جوجل أو كتالوجات الشركات. الإعلانات المخالفة تُحذف فوراً.</li>
                  <li><strong className="text-white">صورة واضحة لملصق OEM / الباركود:</strong> لتأكيد أصالة القطعة ومطابقتها لموديل سيارة المشتري.</li>
                  <li><strong className="text-white">الشفافية في العيوب:</strong> صوّر أي خدش أو كسر إن وجد لضمان الأمانة في البيع وتفادي استرجاع القطعة.</li>
                </ul>
              </div>

              {/* Upload Input & Thumbnails */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={(e) => handleImages(e.target.files)}
                className="hidden"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/[0.1] shadow-lg group">
                    <img src={src} alt="معاينة" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-rose-600 rounded-full text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px]">
                        الصورة الرئيسية
                      </span>
                    )}
                  </div>
                ))}

                {images.length < 8 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-white/[0.15] bg-[#121622] hover:border-amber-400/60 text-slate-400 hover:text-amber-400 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">رفع صور القطعة</span>
                    <span className="text-[10px] text-slate-500">حتى 8 صور واضحة</span>
                  </button>
                )}
              </div>

              {/* Anti-Fraud Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#121622] border border-white/[0.08] cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={antiFraudAgreed}
                  onChange={(e) => setAntiFraudAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-white/20 bg-slate-900"
                />
                <span className="text-xs text-slate-300 leading-relaxed font-semibold">
                  أقر وأتعهد بأن الصور المرفقة حقيقية وملتقطة بنفسي للقطعة المعروضة وليست منسوخة من الإنترنت، وألتزم بتقديم كفالة الفحص والتجربة المتفق عليها.
                </span>
              </label>
            </div>

            {/* STEP 5: Pricing, Warranty & Anti-Scam Buyer Guarantee */}
            <div className="space-y-4 p-4 sm:p-6 rounded-2xl bg-[#0c0e15] border border-white/[0.06]">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-black text-white">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>5. السعر والكفالة ومعلومات التواصل</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">السعر المطلوب (دينار أردني) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="مثال: 85"
                      className="w-full h-12 px-4 rounded-xl border border-white/[0.08] bg-[#121622] text-white text-sm outline-none focus:border-amber-400 font-bold"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">
                      د.أ
                    </span>
                  </div>
                </div>

                {/* Warranty Period */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">كفالة التجربة والفحص *</label>
                  <select
                    value={form.warrantyPeriod}
                    onChange={(e) => setForm({ ...form, warrantyPeriod: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-white/[0.08] bg-[#121622] text-white text-xs sm:text-sm outline-none focus:border-amber-400"
                  >
                    {WARRANTY_OPTIONS.map((w) => (
                      <option key={w} value={w} className="bg-[#121622]">
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">رقم الهاتف للاتصال *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="079XXXXXXXX"
                    className="w-full h-12 px-4 rounded-xl border border-white/[0.08] bg-[#121622] text-white text-sm outline-none focus:border-amber-400"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">رقم الواتساب</label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="07XXXXXXXX"
                    className="w-full h-12 px-4 rounded-xl border border-white/[0.08] bg-[#121622] text-white text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Delivery and Negotiation Checkboxes */}
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isNegotiable}
                    onChange={(e) => setForm({ ...form, isNegotiable: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-white/20"
                  />
                  <span>السعر قابل للتفاوض البسيط</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasDelivery}
                    onChange={(e) => setForm({ ...form, hasDelivery: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-white/20"
                  />
                  <span>يتوفر توصيل لكافة المحافظات</span>
                </label>
              </div>

              {/* Buyer Anti-Scam Shield Pill */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed space-y-1">
                <div className="flex items-center gap-2 font-black text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>حماية كارس جو ضد النصب والاحتيال:</span>
                </div>
                <p>
                  يُحظر طلب أي عربون مسبق عبر المحافظ الإلكترونية. ننصح المشتري دائماً بفحص القطعة ومطابقتها في الورشة قبل تسليم المبلغ للبائع.
                </p>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                تفاصيل إضافية عن القطعة (ملاحظات الفحص، النظافة، سبب البيع)
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="اشرح أي تفاصيل تهم المشتري: هل القطعة مفكوكة من سيارة وارد يابان؟ هل تم فحصها على الكمبيوتر؟ مدة الاستخدام السابقة..."
                className="w-full p-4 rounded-2xl border border-white/[0.08] bg-[#0c0e15] text-white text-sm outline-none focus:border-amber-400 resize-none placeholder:text-slate-600 leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-amber-500/20 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري معالجة ونشر الإعلان...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>نشر إعلان قطعة الغيار في سوق كارس جو</span>
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
