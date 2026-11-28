'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Image as ImageIcon, Sparkles, Star, Trash2, Upload, X } from 'lucide-react';
import { analysePhotos, summarisePhotoHints, type PhotoAnalysis } from '@/lib/media/photo-quality';

/**
 * Photo manager for the listing wizard.
 *
 * Adds three things the previous UI lacked:
 *   1. REORDERING — HTML5 drag-and-drop plus explicit ◀ ▶ buttons. The buttons
 *      are not a fallback: drag-and-drop does not work on touch screens, and a
 *      Jordanian seller on a phone is the main user.
 *   2. COVER PICKING — "اجعلها الغلاف" on any thumbnail, instead of only being
 *      able to re-upload a cover file and losing the gallery position.
 *   3. GUIDANCE — a shot list and a live recommendation, so the seller knows
 *      what to shoot next instead of uploading five near-identical angles.
 *
 * Ordering is meaningful downstream: POST assigns `order` by array index and
 * flags index 0 as the cover.
 */
export default function PhotoManager({
  previews, files, coverIndex, onReorder, onSetCover, onRemove, max = 20,
}: {
  previews: string[];
  /** Real File objects — the quality check needs pixels, not preview URLs. */
  files: File[];
  coverIndex: number; // -1 when no explicit cover
  onReorder: (from: number, to: number) => void;
  onSetCover: (index: number) => void;
  onRemove: (index: number) => void;
  max?: number;
}) {
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<PhotoAnalysis[]>([]);
  const [checking, setChecking] = useState(false);

  /**
   * Assistant-only quality pass. Debounced and skipped while the seller is
   * still adding photos, so it never competes with the upload for bandwidth.
   */
  useEffect(() => {
    if (!files.length) { setAnalysis([]); return; }
    let cancelled = false;
    setChecking(true);
    const t = setTimeout(async () => {
      const res = await analysePhotos(files);
      if (!cancelled) { setAnalysis(res); setChecking(false); }
    }, 1200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [files]);

  const summary = summarisePhotoHints(analysis);
  const hintsFor = (i: number) => analysis.find((a) => a.index === i)?.hints ?? [];

  const move = useCallback((from: number, to: number) => {
    if (to < 0 || to >= previews.length || from === to) return;
    onReorder(from, to);
  }, [onReorder, previews.length]);

  const count = previews.length;

  return (
    <div className="space-y-3">
      {/* Shot list — cheap quality guidance */}
      <details className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
        <summary className="cursor-pointer text-xs font-bold text-slate-300 select-none flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          ما الصور التي تُبرز سيارتك؟ (اضغط للعرض)
        </summary>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
          {[
            'أمامية', 'خلفية', 'الجانب الأيمن', 'الجانب الأيسر',
            'الداخلية', 'لوحة العدادات', 'المقاعد', 'المحرك',
            'الشنطة', 'الإطارات', 'أي خدوش أو ضرر', 'رقم الشاسي',
          ].map((s, i) => {
            const done = i < count;
            return (
              <span key={s} className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg ${
                done ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-900 text-slate-500'
              }`}>
                {done ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <span className="w-3 h-3 shrink-0 border border-slate-700 rounded-full" />}
                {s}
              </span>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-500 mt-2.5 leading-relaxed">
          هذه توصيات وليست متطلبات — صورة واحدة على الأقل تكفي للنشر، والمزيد من الصور يعني إعلاناً أقوى.
        </p>
      </details>

      {count > 0 && (
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="text-slate-400">أضفت {count} صورة</span>
          {count < 5 && (
            <span className="flex items-center gap-1 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              ننصح بإضافة {5 - count} أخرى للحصول على إعلان أقوى
            </span>
          )}
          {count >= 8 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Star className="w-3.5 h-3.5 fill-emerald-400" />
              عدد ممتاز من الصور
            </span>
          )}
        </div>
      )}

      {count > 0 && summary.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-1.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            ملاحظات على الصور (اختيارية — لا تمنع النشر)
          </p>
          <ul className="space-y-0.5">
            {summary.map((s) => (
              <li key={s} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0 text-amber-500/70" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {count > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
          {previews.map((src, i) => {
            const isCover = i === coverIndex;
            const isDragOver = dragOver === i;
            return (
              <div
                key={`${src}-${i}`}
                draggable
                onDragStart={() => { dragFrom.current = i; }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = dragFrom.current;
                  if (from != null && from !== i) move(from, i);
                  dragFrom.current = null;
                  setDragOver(null);
                }}
                onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
                className={`relative aspect-square rounded-2xl overflow-hidden border transition-all ${
                  isDragOver
                    ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-105'
                    : isCover
                      ? 'border-amber-400 ring-2 ring-amber-400/40'
                      : 'border-slate-800'
                }`}
              >
                <img src={src} alt={`صورة ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />

                {isCover && (
                  <span className="absolute top-1 right-1 flex items-center gap-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black rounded-md">
                    <Star className="w-2.5 h-2.5 fill-slate-950" />
                    الغلاف
                  </span>
                )}

                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1">
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(i, i - 1)}
                      disabled={i === 0}
                      aria-label="نقل الصورة للأمام"
                      className="w-6 h-6 rounded-md bg-slate-950/85 text-white text-[10px] font-black disabled:opacity-25 hover:bg-slate-900"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, i + 1)}
                      disabled={i === count - 1}
                      aria-label="نقل الصورة للخلف"
                      className="w-6 h-6 rounded-md bg-slate-950/85 text-white text-[10px] font-black disabled:opacity-25 hover:bg-slate-900"
                    >
                      ›
                    </button>
                  </div>
                  <div className="flex gap-0.5">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => onSetCover(i)}
                        aria-label="اجعلها صورة الغلاف"
                        title="اجعلها صورة الغلاف"
                        className="w-6 h-6 rounded-md bg-amber-500/90 text-slate-950 hover:bg-amber-500 flex items-center justify-center"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(i)}
                      aria-label="حذف الصورة"
                      className="w-6 h-6 rounded-md bg-rose-500/90 text-white hover:bg-rose-500 flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-950/85 text-white text-[9px] font-mono rounded">
                  {i + 1}
                </span>

                {hintsFor(i).length > 0 && (
                  <span
                    title={hintsFor(i).map((h) => h.message).join(' • ')}
                    aria-label={`ملاحظات على الصورة ${i + 1}`}
                    className="absolute bottom-8 left-1 w-5 h-5 rounded-md bg-amber-500/90 text-slate-950 flex items-center justify-center"
                  >
                    <AlertCircle className="w-3 h-3" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {count >= max && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
          <AlertCircle className="w-3.5 h-3.5" />
          وصلت للحد الأقصى ({max} صورة)
        </p>
      )}

      {count === 0 && (
        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" />
          لم تُضف صور بعد — صورة واحدة على الأقل مطلوبة للنشر
        </p>
      )}
    </div>
  );
}

/** Reorder helper kept here so both the manager and the wizard share one rule. */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= arr.length || to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
