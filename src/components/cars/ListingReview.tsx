'use client';

import { useMemo } from 'react';
import {
  AlertCircle, CalendarCheck, CheckCircle2, Clock, Eye, FileCheck2,
  Gauge, Image as ImageIcon, MapPin, Palette, Phone, Settings, ShieldCheck, Sparkles, Star, Zap,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { ScoreItem } from '@/lib/listing-score';

/**
 * Step 5 — pre-publish review.
 *
 * Shows the listing back to the seller in the shape a buyer will see it, plus a
 * server-computed checklist. Deliberately read-only with "edit" links back to
 * each step: the failure this stage prevents is "publish, then spot a typo".
 *
 * The completeness percentage is NOT computed here. It arrives from
 * lib/listing-score via the API, so the number matches what an auditor derives
 * from the stored row.
 */
export interface ReviewData {
  brandName: string;
  modelName: string;
  year: number | null;
  kilometers: number | null;
  fuelType: string;
  transmission: string;
  color: string;
  doors: number | null;
  engineCapacity: string;
  cylinders: string;
  drivetrain: string;
  horsepower: string;
  condition: string;
  description: string;
  price: number;
  cityName: string;
  phone: string;
  whatsapp: string;
  tradeOption: string;
  inspectionSummary: string;
  customsStatus: string;
  features: string[];
  imagePreviews: string[];
  coverPreview: string;
  hasLicenseDoc: boolean;
  hasInspectionDoc: boolean;
  hasServiceRecordDoc: boolean;
  extraInspectionPages: number;
  videoPreviewUrl: string;
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
      <p className="text-slate-400 text-xs font-semibold">{label}</p>
      <p className="font-bold text-white text-xs sm:text-sm truncate">{value || '—'}</p>
    </div>
  );
}

function DocChip({ label, ok, note, optional }: { label: string; ok: boolean; note?: string; optional?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800">
      <span className="text-xs font-bold text-slate-300">
        {label}
        {note && <span className="text-[10px] text-slate-500 font-normal"> ({note})</span>}
      </span>
      <span className={`flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0 ${
        ok
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          : optional
            ? 'bg-slate-800 text-slate-500 border border-slate-700'
            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
      }`}>
        {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : optional ? <Clock className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
        {ok ? 'مُرفق' : optional ? 'اختياري' : 'مطلوب'}
      </span>
    </div>
  );
}

export default function ListingReview({
  data, completeness, strength, onEditStep,
}: {
  data: ReviewData;
  completeness: { percent: number; items: ScoreItem[]; missingRequired: ScoreItem[]; canPublish: boolean } | null;
  strength: number;
  onEditStep: (step: number) => void;
}) {
  const required = useMemo(() => (completeness?.items ?? []).filter((i) => i.kind === 'REQUIRED'), [completeness]);
  const recommended = useMemo(() => (completeness?.items ?? []).filter((i) => i.kind === 'RECOMMENDED'), [completeness]);

  const specs: { icon: typeof Gauge; label: string; value: string }[] = [
    { icon: CalendarCheck, label: 'سنة الصنع', value: data.year ? String(data.year) : 'غير محدد' },
    { icon: Gauge, label: 'الممشى', value: data.kilometers != null ? `${data.kilometers.toLocaleString('ar-JO')} كم` : 'غير محدد' },
    { icon: Zap, label: 'الوقود', value: data.fuelType },
    { icon: Settings, label: 'ناقل الحركة', value: data.transmission },
    { icon: Gauge, label: 'سعة المحرك', value: data.engineCapacity ? `${data.engineCapacity} CC` : 'غير محدد' },
    { icon: Gauge, label: 'عدد السلندر', value: data.cylinders || 'غير محدد' },
    { icon: Settings, label: 'نظام الدفع', value: data.drivetrain || 'غير محدد' },
    { icon: Zap, label: 'القوة', value: data.horsepower ? `${data.horsepower} حصان` : 'غير محدد' },
    { icon: Palette, label: 'اللون', value: data.color || 'غير محدد' },
    { icon: Settings, label: 'عدد الأبواب', value: data.doors != null ? String(data.doors) : 'غير محدد' },
  ];

  return (
    <div className="space-y-4">
      {/* ── Preview header ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-white text-base">راجع إعلانك قبل النشر</h3>
          </div>
          <p className="text-[11px] text-slate-400">هذه معاينة — اضغط «نشر الإعلان» لإرساله للإدارة</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-56 shrink-0">
            {data.coverPreview ? (
              <img src={data.coverPreview} alt="صورة الغلاف" className="w-full h-36 object-cover rounded-2xl border border-slate-800" />
            ) : (
              <div className="w-full h-36 rounded-2xl border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <h4 className="font-black text-white text-lg leading-snug">
              {data.brandName} {data.modelName} {data.year || ''}
            </h4>
            <p className="font-black text-emerald-400 text-2xl">{formatPrice(data.price)}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              {data.cityName || 'لم تُحدد المحافظة'}
            </p>
          </div>
        </div>

        {data.imagePreviews.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 mb-2">صور السيارة ({data.imagePreviews.length})</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.imagePreviews.map((src, i) => (
                <img key={i} src={src} alt={`صورة ${i + 1}`} className="w-20 h-20 rounded-xl object-cover border border-slate-800 shrink-0" />
              ))}
            </div>
          </div>
        )}

        {data.videoPreviewUrl && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 mb-2">فيديو السيارة</p>
            <video src={data.videoPreviewUrl} controls preload="metadata" className="w-full max-w-sm h-44 rounded-2xl bg-slate-950 border border-slate-800" />
          </div>
        )}
      </div>

      {/* ── Specs ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-black text-white text-base flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            مواصفات السيارة
          </h3>
          <button type="button" onClick={() => onEditStep(1)} className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300">تعديل</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {specs.map((s, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <s.icon className="w-4 h-4 text-emerald-400" />
                <span>{s.label}</span>
              </div>
              <p className="font-bold text-white text-xs sm:text-sm truncate">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Condition / customs / description ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-black text-white text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            حالة السيارة والفحص
          </h3>
          <button type="button" onClick={() => onEditStep(2)} className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300">تعديل</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Chip label="الحالة العامة" value={data.condition} />
          <Chip label="الجمرك" value={data.customsStatus} />
          <Chip label="تقرير الفحص" value={data.inspectionSummary} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 mb-1.5">وصف البائع</p>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{data.description || '—'}</p>
        </div>
        {data.features.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 mb-2">المواصفات والمزايا ({data.features.length})</p>
            <div className="flex flex-wrap gap-2">
              {data.features.map((f) => (
                <span key={f} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">{f}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Documents: status only, never the images ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-black text-white text-base flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-400" />
            المستندات والتحقق
          </h3>
          <button type="button" onClick={() => onEditStep(2)} className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300">تعديل</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DocChip label="صورة ترخيص السيارة" ok={data.hasLicenseDoc} />
          <DocChip
            label="صورة فحص السيارة"
            ok={data.hasInspectionDoc}
            note={data.extraInspectionPages > 0 ? `+${data.extraInspectionPages} صفحة` : undefined}
          />
          <DocChip label="مستند سجل الصيانة" ok={data.hasServiceRecordDoc} optional />
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          المستندات تُستخدم للتحقق من مطابقة بيانات الإعلان، ولا تظهر للمشترين حفاظاً على خصوصيتك.
        </p>
      </div>

      {/* ── Contact ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-black text-white text-base flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-400" />
            التواصل والموقع
          </h3>
          <button type="button" onClick={() => onEditStep(4)} className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300">تعديل</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Chip label="الهاتف" value={data.phone} />
          <Chip label="واتساب" value={data.whatsapp || '—'} />
          <Chip label="خيار البيع" value={data.tradeOption} />
        </div>
      </div>

      {/* ── Server-computed readiness ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-black text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          جاهزية الإعلان
        </h3>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300">اكتمال البيانات</span>
              <span className="text-sm font-black text-emerald-400">{completeness ? `${completeness.percent}%` : '—'}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                style={{ width: `${completeness?.percent ?? 0}%` }}
              />
            </div>
          </div>
          <div className="text-center shrink-0">
            <p className="text-[10px] font-bold text-slate-400 mb-1">قوة الإعلان</p>
            <div className="flex gap-0.5" aria-label={`قوة الإعلان ${strength} من 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`w-4 h-4 ${n <= strength ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
              ))}
            </div>
          </div>
        </div>

        {completeness?.canPublish ? (
          <p className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4" />
            كل البيانات الإلزامية مكتملة — يمكنك النشر
          </p>
        ) : (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4" />
              ينقص {completeness?.missingRequired.length ?? 0} عنصر إلزامي للنشر
            </p>
            <ul className="space-y-1">
              {(completeness?.missingRequired ?? []).map((m) => (
                <li key={m.key} className="text-[11px] text-slate-300 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  {m.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {completeness && (
          <details className="group">
            <summary className="cursor-pointer text-[11px] font-bold text-slate-400 hover:text-slate-300 select-none">
              عرض القائمة الكاملة ({required.length} إلزامي · {recommended.length} موصى به)
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[...required, ...recommended].map((it) => (
                <div key={it.key} className="flex items-center gap-2 text-[11px]">
                  {it.done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    : <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  <span className={it.done ? 'text-slate-300' : 'text-slate-500'}>
                    {it.label}
                    {it.hint && !it.done ? ` (${it.hint})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      <p className="text-[10px] text-slate-500 leading-relaxed text-center px-4">
        درجة الاكتمال محسوبة من الخادم وفق قواعد ثابتة، وقوة الإعلان مؤشر تقديري لجاذبية الإعلان —
        ولا تُعد ضماناً للبيع.
      </p>
    </div>
  );
}
