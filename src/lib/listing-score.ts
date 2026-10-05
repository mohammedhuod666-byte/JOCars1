/**
 * Listing completeness + strength scoring.
 *
 * Design rules that this module deliberately follows:
 *  - the score is COMPUTED SERVER-SIDE from explicit rules. The client never
 *    invents a percentage, so the number the seller sees is the same one an
 *    auditor can reproduce from the stored row.
 *  - completeness and strength are SEPARATE. Completeness = "is this publishable
 *    and trustworthy enough"; strength = "will it attract buyers". A listing can
 *    be 100% complete yet still be a weak listing (one photo, no video).
 *  - nothing here is an AI judgement. No model output feeds these numbers.
 *  - every item carries its own weight so the UI can explain the score instead
 *    of showing an unexplained percentage.
 */

export interface CompletenessInput {
  brandId?: string | null;
  modelId?: string | null;
  year?: number | null;
  kilometers?: number | null;
  fuelType?: string | null;
  transmission?: string | null;
  color?: string | null;
  description?: string | null;
  price?: number | null;
  cityId?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  phone?: string | null;
  imageCount?: number;
  hasLicenseDoc?: boolean;
  hasInspectionDoc?: boolean;
  videoUrl?: string | null;
  vin?: string | null;
  condition?: string | null;
  featuresCount?: number;
  customsStatus?: string | null;
  hasServiceHistory?: boolean;
  /** Declarations (not verified facts) — they raise strength, never block. */
  accidentHistory?: string | null;
  serviceRecordStatus?: string | null;
  ownershipSource?: string | null;
}

export interface ScoreItem {
  key: string;
  label: string;
  /** 'REQUIRED' blocks publish; 'RECOMMENDED' only affects the strength score. */
  kind: 'REQUIRED' | 'RECOMMENDED';
  done: boolean;
  hint?: string;
}

export interface CompletenessResult {
  /** 0-100, weighted over all items. */
  percent: number;
  /** 0-5 stars, from the recommended items only. */
  strength: number;
  items: ScoreItem[];
  missingRequired: ScoreItem[];
  /** True when nothing required is missing — the only real publish gate. */
  canPublish: boolean;
}

const REQUIRED_WEIGHT = 3;
const RECOMMENDED_WEIGHT = 1;

export function scoreListing(input: CompletenessInput): CompletenessResult {
  const has = (v: unknown) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);

  const items: ScoreItem[] = [
    // ── REQUIRED: without these the ad cannot be published at all ──
    { key: 'brandId', label: 'الشركة المصنعة', kind: 'REQUIRED', done: has(input.brandId) },
    { key: 'modelId', label: 'الموديل', kind: 'REQUIRED', done: has(input.modelId) },
    { key: 'year', label: 'سنة الصنع', kind: 'REQUIRED', done: has(input.year) },
    { key: 'kilometers', label: 'الممشى', kind: 'REQUIRED', done: has(input.kilometers) },
    { key: 'fuelType', label: 'نوع الوقود', kind: 'REQUIRED', done: has(input.fuelType) },
    { key: 'transmission', label: 'ناقل الحركة', kind: 'REQUIRED', done: has(input.transmission) },
    { key: 'color', label: 'لون السيارة', kind: 'REQUIRED', done: has(input.color) },
    { key: 'condition', label: 'الحالة العامة', kind: 'REQUIRED', done: has(input.condition) },
    { key: 'description', label: 'وصف السيارة', kind: 'REQUIRED', done: (input.description?.trim().length ?? 0) >= 20 },
    { key: 'price', label: 'السعر المطلوب', kind: 'REQUIRED', done: !!input.price && input.price > 0 },
    { key: 'cityId', label: 'المحافظة', kind: 'REQUIRED', done: has(input.cityId) },
    { key: 'phone', label: 'رقم الهاتف', kind: 'REQUIRED', done: has(input.phone) },
    { key: 'licenseDoc', label: 'صورة ترخيص السيارة', kind: 'REQUIRED', done: !!input.hasLicenseDoc, hint: 'مطلوبة للتحقق' },
    { key: 'inspectionDoc', label: 'صورة فحص السيارة', kind: 'REQUIRED', done: !!input.hasInspectionDoc, hint: 'مطلوبة للتحقق' },
    {
      key: 'images',
      label: 'صور السيارة',
      kind: 'REQUIRED',
      // One real photo is the minimum bar for a listing that claims to sell
      // something. Forcing 8 would push sellers to abandon the flow.
      done: (input.imageCount ?? 0) >= 1,
      hint: 'صورة واحدة على الأقل',
    },

    // ── RECOMMENDED: these raise attractiveness, never block publishing ──
    { key: 'imageCount5', label: '5 صور أو أكثر', kind: 'RECOMMENDED', done: (input.imageCount ?? 0) >= 5, hint: 'أضف صوراً متعددة الزوايا' },
    { key: 'imageCount8', label: '8 صور أو أكثر', kind: 'RECOMMENDED', done: (input.imageCount ?? 0) >= 8 },
    { key: 'videoUrl', label: 'فيديو السيارة', kind: 'RECOMMENDED', done: has(input.videoUrl) },
    { key: 'vin', label: 'رقم الهيكل (VIN)', kind: 'RECOMMENDED', done: has(input.vin) },
    { key: 'location', label: 'موقع على الخريطة', kind: 'RECOMMENDED', done: input.locationLat != null && input.locationLng != null },
    { key: 'features', label: 'المواصفات والمزايا', kind: 'RECOMMENDED', done: (input.featuresCount ?? 0) > 0 },
    { key: 'customsStatus', label: 'حالة الجمرك', kind: 'RECOMMENDED', done: has(input.customsStatus) },
    { key: 'serviceHistory', label: 'سجل صيانة بالوكالة', kind: 'RECOMMENDED', done: !!input.hasServiceHistory },
    { key: 'accidentHistory', label: 'صرّح عن حالة الحوادث', kind: 'RECOMMENDED', done: has(input.accidentHistory), hint: 'لا يغني عن الفحص' },
    { key: 'serviceRecord', label: 'تفاصيل سجل الصيانة', kind: 'RECOMMENDED', done: has(input.serviceRecordStatus) },
    { key: 'ownershipSource', label: 'مصدر السيارة', kind: 'RECOMMENDED', done: has(input.ownershipSource) },
  ];

  const required = items.filter((i) => i.kind === 'REQUIRED');
  const recommended = items.filter((i) => i.kind === 'RECOMMENDED');

  const requiredWeight = required.length * REQUIRED_WEIGHT;
  const requiredGot = required.filter((i) => i.done).length * REQUIRED_WEIGHT;
  const recommendedWeight = recommended.length * RECOMMENDED_WEIGHT;
  const recommendedGot = recommended.filter((i) => i.done).length * RECOMMENDED_WEIGHT;

  const totalWeight = requiredWeight + recommendedWeight;
  const gotWeight = requiredGot + recommendedGot;
  const percent = totalWeight === 0 ? 0 : Math.round((gotWeight / totalWeight) * 100);

  // Strength is driven ONLY by the recommended items, so a listing cannot look
  // "strong" while missing something publishable.
  const strength = recommendedWeight === 0
    ? 0
    : Math.max(1, Math.ceil((recommendedGot / recommendedWeight) * 5));

  const missingRequired = required.filter((i) => !i.done);

  return {
    percent,
    strength,
    items,
    missingRequired,
    canPublish: missingRequired.length === 0,
  };
}
