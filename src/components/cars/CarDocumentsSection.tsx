'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, FileCheck2, FileText, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';

/**
 * "المستندات والتحقق" — the documents block on the ad page.
 *
 * Privacy model (deliberate):
 *   - Documents are stored as authenticated Cloudinary assets; the public URL
 *     403s. They are never embedded in the ad payload.
 *   - Visitors see a VERIFICATION STATUS only ("تم التحقق من بيانات السيارة"),
 *     which is the trust signal buyers actually need.
 *   - Only the car's owner and admins get the image, fetched on demand from
 *     /api/cars/[id]/documents, which authorizes before signing a short-lived
 *     URL. So changing the car id in the URL yields nothing.
 *
 * Nothing here is auto-derived from seller input: the chips say a document was
 * *submitted*, and the green state only appears after an admin has verified the
 * listing — never because the uploader claimed anything.
 */
export default function CarDocumentsSection({
  carId,
  hasLicenseDoc,
  hasInspectionDoc,
  hasServiceRecordDoc,
  extraInspectionCount,
  canViewDocuments,
  verificationStatus,
}: {
  carId: string;
  hasLicenseDoc: boolean;
  hasInspectionDoc: boolean;
  hasServiceRecordDoc: boolean;
  /** Extra pages of a multi-page inspection report. A COUNT, never the URLs. */
  extraInspectionCount: number;
  canViewDocuments: boolean;
  /** 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NONE' */
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NONE';
}) {
  // A slot is identified by type + index so extra pages are distinct targets.
  type Slot = { type: 'license' | 'inspection' | 'inspectionExtra' | 'serviceRecord'; index?: number };
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!openKey) {
      setUrl(null);
      setError(null);
    }
  }, [openKey]);

  const openDocument = useCallback(async (slot: Slot) => {
    setLoading(true);
    setError(null);
    setUrl(null);
    const key = `${slot.type}:${slot.index ?? ''}`;
    try {
      const qs = new URLSearchParams({ type: slot.type });
      if (slot.index !== undefined) qs.set('index', String(slot.index));
      const res = await fetch(`/api/cars/${carId}/documents?${qs.toString()}`, {
        credentials: 'include',
        headers: tokenHeader(),
      });
      const json = await res.json();
      if (res.ok && json?.data?.url) {
        setUrl(json.data.url);
        setIsPdf(!!json.data.isPdf);
        setOpenKey(key);
      } else {
        setError(json?.error || 'تعذر فتح المستند');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [carId]);

  const hasDocs = hasLicenseDoc || hasInspectionDoc || hasServiceRecordDoc || extraInspectionCount > 0;

  const verification = {
    VERIFIED: {
      icon: ShieldCheck,
      text: 'تم التحقق من بيانات السيارة',
      cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    PENDING: {
      icon: Clock,
      text: 'بانتظار التحقق من الإدارة',
      cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    REJECTED: {
      icon: ShieldAlert,
      text: 'تعذر التحقق من المستندات',
      cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
    NONE: {
      icon: AlertCircle,
      text: 'لم يتم إرفاق مستندات لهذا الإعلان',
      cls: 'bg-slate-800 text-slate-400 border-slate-700',
    },
  }[verificationStatus];
  const VIcon = verification.icon;

  const docRow = (label: string, present: boolean, Icon: typeof FileText, note?: string) => (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800">
      <span className="flex items-center gap-2 text-xs font-bold text-slate-300 min-w-0">
        <Icon className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="truncate">
          {label}
          {note && <span className="text-[10px] font-normal text-slate-500"> {note}</span>}
        </span>
      </span>
      <span className={`flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0 ${
        present
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          : 'bg-slate-800 text-slate-500 border border-slate-700'
      }`}>
        {present ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
        {present ? 'مُرفق' : 'غير مُرفق'}
      </span>
    </div>
  );

  /**
   * The viewable slots, built from what actually exists rather than from a fixed
   * list of branches. Extra inspection pages were previously uploaded, stored and
   * counted in the wizard's own review screen, but had no way to be opened here —
   * a seller who paid the effort to attach four pages could never see them again.
   */
  const viewable: { slot: Slot; label: string }[] = [];
  if (hasLicenseDoc) viewable.push({ slot: { type: 'license' }, label: 'عرض صورة الترخيص' });
  if (hasInspectionDoc) viewable.push({ slot: { type: 'inspection' }, label: 'عرض صورة الفحص' });
  for (let i = 0; i < extraInspectionCount; i++) {
    viewable.push({
      slot: { type: 'inspectionExtra', index: i },
      label: `صفحة الفحص ${i + 2}`,
    });
  }
  if (hasServiceRecordDoc) {
    viewable.push({ slot: { type: 'serviceRecord' }, label: 'عرض سجل الصيانة' });
  }

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
        <h3 className="font-black text-white text-base flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-amber-400" />
          المستندات والتحقق
        </h3>
        <span className={`flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-lg border ${verification.cls}`}>
          <VIcon className="w-3.5 h-3.5" />
          {verification.text}
        </span>
      </div>

      {!hasDocs ? (
        <div className="p-5 rounded-2xl bg-slate-950 border border-dashed border-slate-700 text-center space-y-1.5">
          <AlertCircle className="w-6 h-6 text-slate-600 mx-auto" />
          <p className="text-xs font-bold text-slate-400">لم يتم إرفاق مستندات لهذا الإعلان</p>
          <p className="text-[11px] text-slate-500">الإعلانات الجديدة تتطلب صورة ترخيص وصورة فحص للتحقق من البيانات.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {docRow('صورة ترخيص السيارة', hasLicenseDoc, FileText)}
            {docRow('صورة فحص السيارة', hasInspectionDoc, FileCheck2)}
            {extraInspectionCount > 0 && docRow(
              'صفحات إضافية لتقرير الفحص',
              true,
              FileCheck2,
              `(${extraInspectionCount})`,
            )}
            {hasServiceRecordDoc && docRow('سجل الصيانة', true, FileText)}
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-xs font-bold text-slate-300">حالة التحقق</span>
              <span className={`flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-lg border ${verification.cls}`}>
                <VIcon className="w-3.5 h-3.5" />
                {verificationStatus === 'VERIFIED' ? 'موثّق'
                  : verificationStatus === 'REJECTED' ? 'تعذّر'
                  : verificationStatus === 'PENDING' ? 'قيد المراجعة' : '—'}
              </span>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3">
            المستندات تُستخدم للتحقق من مطابقة بيانات الإعلان مع بيانات السيارة، وتُراجع من إدارة الموقع.
            لا تُعرض نسخة من المستند للزوار حفاظاً على خصوصية صاحب السيارة.
          </p>

          {canViewDocuments && viewable.length > 0 && (
            <div className="space-y-3 pt-1">
              <p className="text-[11px] font-bold text-amber-400/90 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                وصول خاص — أنت مالك هذا الإعلان أو مدير الموقع
              </p>
              <div className="flex flex-wrap gap-2">
                {viewable.map(({ slot, label }) => {
                  const key = `${slot.type}:${slot.index ?? ''}`;
                  const active = openKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => openDocument(slot)}
                      disabled={loading}
                      aria-pressed={active}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
                        active
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {loading && (
                <p className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  جاري تجهيز رابط آمن…
                </p>
              )}
              {error && (
                <p role="alert" className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}
              {url && openKey && (
                <div className="space-y-2">
                  {isPdf ? (
                    // A PDF cannot render inside <img>. Offering a link keeps the
                    // signed URL working without embedding a third-party frame
                    // (which CSP frame-src would have to allow for every origin).
                    <>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        فتح المستند (PDF) في تبويب جديد
                      </a>
                      <p className="text-[10px] text-slate-500">
                        الرابط مؤقت وينتهي خلال دقائق، لذا افتحه قبل انتهاء المهلة.
                      </p>
                    </>
                  ) : (
                    <img
                      src={url}
                      alt="مستند السيارة"
                      className="w-full max-w-md h-56 object-contain rounded-xl border border-amber-500/30 bg-slate-950"
                    />
                  )}
                  <p className="text-[10px] text-slate-500">
                    هذا الرابط مؤقت وينتهي خلال دقائق. عند الطباعة أو المشاركة، يُفضّل إخفاء أي بيانات شخصية ظاهرة.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Bearer token is only needed for API clients; the browser uses the cookie. */
function tokenHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const t = window.localStorage.getItem('jo-cars-auth-token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}
