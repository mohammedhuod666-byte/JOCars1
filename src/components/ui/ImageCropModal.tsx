'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Move, Check, RotateCcw, Minimize2 } from 'lucide-react';

interface ImageCropModalProps {
  file: File | null;
  aspect?: number; // 1 for square/avatar, 16/9 for cover
  shape?: 'round' | 'rounded' | 'rect';
  title?: string;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
}

export function ImageCropModal({
  file,
  aspect = 1,
  shape = 'rounded',
  title = 'ضبط وقص الصورة',
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Viewport frame dimensions (responsive for mobile 390px)
  const frameWidth = aspect >= 1.5 ? 320 : 270;
  const frameHeight = Math.round(frameWidth / aspect);

  // Compute base scale so zoom=1 covers the frame, while lower zoom fits whole image
  const coverScale =
    naturalSize.width && naturalSize.height
      ? Math.max(frameWidth / naturalSize.width, frameHeight / naturalSize.height)
      : 1;

  const containScale =
    naturalSize.width && naturalSize.height
      ? Math.min(frameWidth / naturalSize.width, frameHeight / naturalSize.height)
      : 1;

  const minZoom = Math.min(0.4, (containScale / (coverScale || 1)) * 0.95);
  const fitZoom = Number((containScale / (coverScale || 1)).toFixed(3));

  useEffect(() => {
    if (!file) {
      setImgSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imgRef.current = img;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalSize({ width: nw, height: nh });

    // Default to "fit whole image" if aspect differs noticeably so nothing is cut off initially,
    // or 1 if already matching aspect
    const cScale = Math.max(frameWidth / nw, frameHeight / nh);
    const fScale = Math.min(frameWidth / nw, frameHeight / nh);
    const initialFit = Number((fScale / cScale).toFixed(3));
    setZoom(initialFit < 0.92 ? initialFit : 1);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: dragStartRef.current.ox + dx,
      y: dragStartRef.current.oy + dy,
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current || !file) return;
    setProcessing(true);

    try {
      const outWidth = aspect >= 1.5 ? 1280 : 800;
      const outHeight = Math.round(outWidth / aspect);
      const ratio = outWidth / frameWidth;

      const canvas = document.createElement('canvas');
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Sleek dark backdrop when image is zoomed out ("show whole image")
      ctx.fillStyle = '#0b0e14';
      ctx.fillRect(0, 0, outWidth, outHeight);

      const currentScale = coverScale * zoom;
      const drawW = naturalSize.width * currentScale * ratio;
      const drawH = naturalSize.height * currentScale * ratio;
      const drawX = (outWidth - drawW) / 2 + offset.x * ratio;
      const drawY = (outHeight - drawH) / 2 + offset.y * ratio;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setProcessing(false);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
          const outFile = new File([blob], `${baseName}-cropped.jpg`, {
            type: 'image/jpeg',
          });
          setProcessing(false);
          onConfirm(outFile);
        },
        'image/jpeg',
        0.92
      );
    } catch {
      setProcessing(false);
    }
  }, [aspect, coverScale, file, frameWidth, naturalSize, offset, onConfirm, zoom]);

  if (!file || !imgSrc) return null;

  const displayScale = coverScale * zoom;
  const shapeClass =
    shape === 'round' ? 'rounded-full' : shape === 'rounded' ? 'rounded-3xl' : 'rounded-2xl';

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-[#11141b] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">{title}</h3>
            <p className="text-[11px] text-[#9ca3af] flex items-center gap-1 mt-0.5">
              <Move className="w-3 h-3 text-[#ffc640]" />
              <span>اسحب الصورة لتحديد الجهة المطلوبة أو صغّرها لإظهارها كاملة</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-gray-300 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Stage */}
        <div className="p-5 flex flex-col items-center">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ width: frameWidth, height: frameHeight }}
            className={`relative overflow-hidden bg-[#0b0e14] border-2 border-[#ffc640]/70 shadow-inner select-none touch-none ${
              dragging ? 'cursor-grabbing' : 'cursor-grab'
            } ${shapeClass}`}
          >
            <img
              src={imgSrc}
              alt="معاينة"
              onLoad={handleImageLoad}
              draggable={false}
              style={{
                width: naturalSize.width ? naturalSize.width * displayScale : 'auto',
                height: naturalSize.height ? naturalSize.height * displayScale : 'auto',
                maxWidth: 'none',
                maxHeight: 'none',
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />

            {/* Subtle grid lines while dragging */}
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity ${
                dragging ? 'opacity-60' : 'opacity-0'
              }`}
            >
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/25" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/25" />
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="w-full mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(minZoom, Number((z - 0.15).toFixed(2))))}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-gray-300"
              aria-label="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={minZoom}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-[#ffc640] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.15).toFixed(2))))}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-gray-300"
              aria-label="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Mode Pills */}
          <div className="w-full grid grid-cols-3 gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setZoom(fitZoom);
                setOffset({ x: 0, y: 0 });
              }}
              className="py-2 px-2 rounded-xl bg-white/[0.05] hover:bg-[#ffc640]/15 border border-white/[0.08] hover:border-[#ffc640]/40 text-[11px] font-semibold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5 text-[#ffc640]" />
              <span>إظهار كاملة</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              className="py-2 px-2 rounded-xl bg-white/[0.05] hover:bg-[#ffc640]/15 border border-white/[0.08] hover:border-[#ffc640]/40 text-[11px] font-semibold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#ffc640]" />
              <span>ملء الإطار</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(fitZoom < 0.92 ? fitZoom : 1);
                setOffset({ x: 0, y: 0 });
              }}
              className="py-2 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] font-semibold text-gray-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-white/[0.08] flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] text-xs sm:text-sm font-bold text-gray-300 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#ffc640] to-[#e3aa00] text-[#080a0a] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ffc640]/20 disabled:opacity-50"
          >
            {processing ? (
              <div className="w-4 h-4 border-2 border-[#080a0a]/25 border-t-[#080a0a] rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>اعتماد الصورة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
