import { z } from 'zod';
import { USER_ROLES } from './enums';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون أكثر من حرفين').max(100),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(passwordRegex, 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص (!@#$%^&*)'),
  phone: z.string().optional(),
  // USER = regular member, DEALER = legacy car dealer, TRADER = new marketplace
  // trader (تاجر سيارات) awaiting admin approval via TraderVerification.
  // ADMIN can never be self-assigned — enforced again server-side on register.
  role: z.enum(USER_ROLES).default('USER'),
  dealerName: z.string().optional(),
  dealerDescription: z.string().max(1000).optional(),
  dealerAddress: z.string().max(300).optional(),
  dealerLogo: z.string().optional(),
  commercialReg: z.string().max(100).optional(), // trader commercial registration
});

export const loginSchema = z.object({
  // Accepts email OR Jordanian phone (07XXXXXXXX) — routed by presence of '@'
  email: z.string().min(3, 'أدخل البريد الإلكتروني أو رقم الهاتف'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  bio: z.string().max(500).optional(),
  dealerName: z.string().max(100).optional(),
  dealerDescription: z.string().max(1000).optional(),
  dealerAddress: z.string().max(300).optional(),
  dealerLat: z.number().optional(),
  dealerLng: z.number().optional(),
  dealerLogo: z.string().optional(),
  dealerBannerImage: z.string().optional(),
  dealerCommercialReg: z.string().max(100).optional(),
  image: z.string().max(2000).optional(),
  whatsappNotifications: z.boolean().optional(),
});

export const carSchema = z.object({
  brandId: z.string().min(1, 'الشركة مطلوبة'),
  modelId: z.string().min(1, 'الموديل مطلوب'),
  year: z.number().int().min(1990, 'سنة الصنع يجب أن تكون 1990 أو أحدث').max(2030),
  trim: z.string().optional(),
  kilometers: z.number().int().min(0, 'عدد الكيلومترات يجب أن يكون 0 أو أكثر'),
  fuelType: z.enum(['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUGIN_HYBRID']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'CVT', 'DCT', 'SEMI_AUTOMATIC']),
  color: z.string().min(1, 'اللون مطلوب'),
  doors: z.number().int().min(1).max(7).default(4),
  // Optional server-side (AI/bulk flows don't always know them); the add-car
  // form enforces real values client-side so no silent 2500/FWD defaults persist.
  engineCapacity: z.number().min(500, 'سعة المحرك غير منطقية').max(10000, 'سعة المحرك غير منطقية').optional(),
  cylinders: z.number().int().min(2).max(16).optional(),
  horsepower: z.number().int().min(50).max(2000).optional(),
  acceleration: z.number().min(2).max(30).optional(),
  features: z.string().max(5000).optional(),
  drivetrain: z.enum(['FWD', 'RWD', 'AWD', 'FOUR_WD']).optional(),
  condition: z.enum(['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'NEEDS_MAINTENANCE', 'NEEDS_INSPECTION']),
  bodyType: z.enum(['SUV', 'SEDAN', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'WAGON', 'PICKUP', 'VAN', 'MINIVAN', 'CROSSOVER', 'SPORTS', 'LUXURY']).optional(),
  lightingType: z.enum(['HALOGEN', 'LED', 'XENON', 'LASER', 'MATRIX_LED']).optional(),
  rimType: z.enum(['STEEL', 'ALLOY', 'CHROME', 'FORGED']).optional(),
  vin: z.string().length(17, 'رقم الهيكل يجب أن يكون 17 حرفاً').optional().or(z.literal('')),
  description: z.string().min(20, 'الوصف يجب أن يكون 20 حرفاً على الأقل').max(5000),
  price: z.number().positive('السعر يجب أن يكون أكبر من 0'),
  cityId: z.string().min(1, 'المحافظة مطلوبة'),
  locationLat: z.number().min(-90, 'خط العرض غير صالح').max(90, 'خط العرض غير صالح').optional(),
  locationLng: z.number().min(-180, 'خط الطول غير صالح').max(180, 'خط الطول غير صالح').optional(),
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  whatsapp: z.string().optional(),
  isNegotiable: z.boolean().default(false),
  hasWarranty: z.boolean().default(false),
  hasServiceHistory: z.boolean().default(false),
  isDamaged: z.boolean().default(false),
  isPaintOriginal: z.boolean().default(true),
  // Wholesale (بيع جملة: تاجر → تاجر). Was MISSING from this schema, so the
  // wizard's checkbox and GET /api/cars?wholesale=true could never work — the
  // filter queried a column nothing could ever set. Same class of bug as
  // customsStatus.
  isWholesale: z.boolean().default(false),
  ownerCount: z.number().int().min(1).max(20).default(1),
  platesNumber: z.string().optional(),
  videoUrl: z.string().url('رابط الفيديو غير صحيح').optional().or(z.literal('')),
  // ── Vehicle identity ──
  firstRegistrationYear: z.number().int().min(1950).max(2030).optional(),
  interiorColor: z.string().max(40).optional(),
  seats: z.number().int().min(1).max(20).optional(),
  keysCount: z.number().int().min(1).max(10).optional(),
  // ── Ownership ──
  ownershipSource: z.enum(['AGENCY', 'LOCAL', 'IMPORTED', 'USED_IMPORT', 'OTHER']).optional(),
  isFirstOwner: z.boolean().optional(),
  // ── History & condition ──
  // These are SELLER DECLARATIONS. Nothing in the system may present them as
  // a verified fact; the wording of every message is kept declarative.
  accidentHistory: z.enum(['NONE', 'YES', 'UNKNOWN']).optional(),
  accidentDetails: z.string().max(1500).optional(),
  accidentAreas: z.string().max(500).optional(),
  bodyPaintStatus: z.enum(['ORIGINAL', 'PARTIAL_PAINT', 'FULL_PAINT', 'UNKNOWN']).optional(),
  chassisStatus: z.enum(['SOUND', 'DAMAGED', 'UNKNOWN']).optional(),
  engineStatus: z.enum(['EXCELLENT', 'GOOD', 'NEEDS_INSPECTION', 'NEEDS_SERVICE', 'UNKNOWN']).optional(),
  transmissionStatus: z.enum(['EXCELLENT', 'GOOD', 'NEEDS_INSPECTION', 'NEEDS_SERVICE', 'UNKNOWN']).optional(),
  // ── Service record ──
  serviceRecordStatus: z.enum(['EXISTS', 'NONE', 'UNKNOWN']).optional(),
  lastServiceDate: z.string().max(40).optional(),
  lastServiceType: z.string().max(200).optional(),
  serviceNotes: z.string().max(1500).optional(),
  // ── Customs ──
  // Previously customsStatus existed ONLY inside the description text, so it
  // was silently dropped by this schema and could never be filtered on. It is
  // a real field now.
  // Values match CUSTOMS_OPTIONS in the wizard exactly (DUTY_PAID,
  // FREE_ZONE, DISABLED_EXEMPTION, TAXI_SPECIAL) — a mismatch here is what
  // caused customsStatus to be silently dropped before.
  customsStatus: z.enum(['DUTY_PAID', 'FREE_ZONE', 'DISABLED_EXEMPTION', 'TAXI_SPECIAL', 'UNKNOWN']).optional(),
  customsTransactionStatus: z.enum(['COMPLETE', 'PENDING', 'NOT_APPLICABLE', 'UNKNOWN']).optional(),
  customsNotes: z.string().max(1000).optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1, 'الرسالة مطلوبة').max(5000, 'الرسالة طويلة جدا (الحد 5000 حرف)'),
  receiverId: z.string().min(1),
  carId: z.string().optional(),
});

export const reportSchema = z.object({
  reason: z.enum(['SPAM', 'FAKE_PRICE', 'WRONG_INFO', 'SOLD', 'DUPLICATE', 'OFFENSIVE', 'SCAM', 'OTHER']),
  description: z.string().max(500).optional(),
});

export const searchSchema = z.object({
  query: z.string().optional(),
  brandId: z.string().optional(),
  modelId: z.string().optional(),
  yearMin: z.coerce.number().optional(),
  yearMax: z.coerce.number().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  cityId: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  kilometersMin: z.coerce.number().optional(),
  kilometersMax: z.coerce.number().optional(),
  condition: z.string().optional(),
  bodyType: z.string().optional(),
  drivetrain: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
