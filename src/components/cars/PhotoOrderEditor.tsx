'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft, ImageIcon, Loader2, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Reorder the gallery of an already-published listing and pick the cover.
 *
 * WHY THIS IS A SEPARATE COMPONENT AND NOT PART OF THE WIZARD
 * Before publishing, PhotoManager lets the seller arrange photos. Afterwards the
 * order was frozen: PUT /api/cars/[id] deliberately refuses an `images` array,
 * so a seller who realises the best angle is photo #7 had no way to fix it. Photo
 * order is not cosmetic — it decides what a buyer sees first, and in this market
 * it decides whether the ad sells.
 *
 * INTERACTION NOTE — buttons, not drag-and-drop
 * The wizard's drag-and-drop works with a mouse but is unusable on a phone, and
 * the majority of sellers here are on mobile. Every move therefore has an
 * explicit ‹ › pair, and the drag handlers are an addition rather than the only
 * path. (This is the same reason PhotoManager ships both.)
 *
 * The list is capped at what the API will load (30). If a listing somehow holds
 * more, the remaining photos keep their order and are reported, not silently
 * dropped from the save payload — sending a partial order would fail the
 * server's exact-set check anyway, and failing with an explanation is better.
 */

type Img = { id: string; url: string; isCover: boolean; order: number };

export default function PhotoOrderEditor({
  carId,
  onClose,
  onSaved,
}: {
  carId: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [images, setImages] = useState<Img[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  // Anchor for keyboard focus after a move, so the button the seller just used
  // stays focused instead of focus jumping to <body>.
  const focusIdRef = useRef<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // The detail endpoint returns only 6 by default, which is not the whole
        // gallery — reordering a truncated list would drop the unseen photos.
        const res = await fetch(`/api/cars/${carId}?imageLimit=30`, { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        const car = json?.data?.car || json?.data;
        const list: Img[] = Array.isArray(car?.images) ? car.images : [];
        if (!list.length) {
          setError('لا توجد صور لهذا الإعلان');
        } else {
          list.sort((a, b) => a.order - b.order);
          setImages(list);
          if ((car?.totalImageCount ?? list.length) > list.length) setTruncated(true);
        }
      } catch {
        if (!cancelled) setError('تعذر تحميل صور الإعلان');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [carId]);

  /** Moves an image by `delta` positions, clamped to the list bounds. */
  const move = useCallback((index: number, delta: number) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      focusIdRef.current = item.id;
      return next;
    });
  }, []);

  const setCover = useCallback((id: string) => {
    setImages((prev) => prev.map((i) => ({ ...i, isCover: i.id === id })));
    focusIdRef.current = id;
  }, []);

  // Restore focus after React commits the new order.
  useEffect(() => {
    const id = focusIdRef.current;
    if (!id) return;
    focusIdRef.current = null;
    itemRefs.current.get(id)?.focus();
  }, [images]);

  const save = async () => {
    if (truncated) {
      // Better to say "I can't save this" than to send a partial order that the
      // server rejects with a message the seller cannot act on.
      setError('عدد الصور يتجاوز ما يمكن عرضه هنا، لذا لم يُحفظ الترتيب. راجع الدعم.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const cover = images.find((i) => i.isCover);
      const res = await fetch(`/api/cars/${carId}/images`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: images.map((i) => i.id),
          ...(cover ? { coverImageId: cover.id } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success) {
        toast.success('تم حفظ ترتيب الصور');
        onSaved?.();
        onClose();
      } else {
        setError(json?.error || 'تعذر حفظ الترتيب');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="ترتيب صور الإعلان"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-black text-white text-base flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            ترتيب صور الإعلان
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="إغلاق"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          الصورة الأولى هي التي تظهر في بطاقة الإعلان وفي نتائج البحث، وهي الأهم.
          استخدم الأسهم لإعادة الترتيب، والنجمة لاختيار صورة الغلاف.
        </p>

        {error && (
          <p role="alert" className="text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : (
          <ul className="space-y-2">
            {images.map((img, i) => (
              <li
                key={img.id}
                className={`flex items-center gap-3 p-2 rounded-2xl border ${
                  img.isCover ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <span className="w-7 shrink-0 text-center text-[11px] font-black text-slate-500 tabular-nums">
                  {i + 1}
                </span>
                <div className="w-16 h-12 shrink-0 rounded-lg overflow-hidden bg-slate-800">
                  <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-300 truncate">
                    {img.isCover ? 'صورة الغلاف' : 'صورة'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    ref={(el) => { if (el) itemRefs.current.set(img.id, el); }}
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || saving}
                    aria-label={`نقل الصورة ${i + 1} للأمام`}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === images.length - 1 || saving}
                    aria-label={`نقل الصورة ${i + 1} للخلف`}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCover(img.id)}
                    disabled={img.isCover || saving}
                    aria-pressed={img.isCover}
                    aria-label={`تعيين صورة ${i + 1} كغلاف`}
                    className={`p-1.5 rounded-lg disabled:cursor-default ${
                      img.isCover
                        ? 'text-amber-400 bg-amber-500/15'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-500'
                    }`}
                  >
                    <Star className="w-4 h-4" fill={img.isCover ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={save}
            disabled={saving || loading || images.length === 0 || truncated}
            className="flex-1 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            حفظ الترتيب
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
