'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Calendar, Eye, Shield, Gauge, ChevronLeft,
  Settings2, Fuel as FuelIcon, Car as CarIcon, BadgeCheck, GitCompare, Clock,
} from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';
import { useCompareStore } from '@/store';
import { warmCarDetailCache } from '@/lib/car-detail-cache';
import type { Car } from '@/types';
import { cloudinaryThumb } from '@/lib/img-url';
import { formatPrice, formatDistance, getTransmissionLabel, getFuelTypeLabel, getConditionLabel } from '@/lib/utils';

interface CarCardProps {
  car: Car;
  index?: number;
  /** Owner's own listing: shows the readiness chip + verification status. */
  isOwnerView?: boolean;
}

export function CarCard({ car, index = 0, isOwnerView = false }: CarCardProps) {
  const { ref, isInView } = useInScrollView(0.1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { addCar, removeCar, isInCompare } = useCompareStore();
  const inCompare = isInCompare(car.id);

  // Readiness comes from /api/cars/my (server-scored). Optional so the public
  // grid, which has no score, keeps rendering unchanged.
  const readiness = (car as any).completeness as
    | { percent: number; strength: number; canPublish: boolean }
    | undefined;

  const thumbnail = useMemo(() => {
    const raw = (() => {
      if (car.coverImage) return car.coverImage;
      if (car.images && car.images.length > 0) {
        const cover = car.images.find((img) => img.isCover);
        return cover?.url || car.images[0]?.url || null;
      }
      return null;
    })();
    // Card size is ~400-600px: serve a Cloudinary thumbnail variant instead
    // of the full 1600px upload. Non-Cloudinary URLs pass through untouched.
    return raw ? cloudinaryThumb(raw, 640) : null;
  }, [car.coverImage, car.images]);

  const brandName = car.brand?.nameAr || '';
  const modelName = car.model?.nameAr || '';
  const cityName = car.city?.nameAr || '';

  // next/image can optimize remote (Cloudinary) and same-origin URLs.
  // Legacy data-URI blobs and unknown absolute hosts fall back to plain <img>.
  const optimizable = !!thumbnail && !thumbnail.startsWith('data:') && (
    thumbnail.startsWith('/') || thumbnail.includes('res.cloudinary.com')
  );

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) removeCar(car.id);
    else addCar(car);
  };

  return (
    <div ref={ref} style={scrollStyle(isInView, { delay: Math.min(index * 0.04, 0.3) })}>
      <Link
        href={`/cars/${car.id}`}
        onMouseEnter={() => warmCarDetailCache(car.id)}
        onFocus={() => warmCarDetailCache(car.id)}
        className="group flex flex-col overflow-hidden rounded-3xl bg-surface-900 border border-gold-100/20 transition-all duration-200 hover:border-gold-100/60 hover:-translate-y-1.5"
        style={{ boxShadow: '0 12px 32px -14px rgba(0,0,0,0.7)' }}
      >
        {/* Image — full bleed */}
        <div className="relative overflow-hidden bg-surface-950 aspect-[16/10]">
          {thumbnail ? (
            <>
              {optimizable ? (
                <Image
                  src={thumbnail}
                  alt={`${car.year} ${brandName} ${modelName}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  onLoad={() => setImgLoaded(true)}
                  className={`object-cover transition-all duration-700 group-hover:scale-[1.05] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              ) : (
                <img
                  src={thumbnail}
                  alt={`${car.year} ${brandName} ${modelName}`}
                  loading="lazy"
                  onLoad={() => setImgLoaded(true)}
                  className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.05] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              )}
              {!imgLoaded && (
                <div className="absolute inset-0 shimmer" />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-surface-700">
              <CarIcon className="h-16 w-16" strokeWidth={1} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-3 right-3 z-10">
            {car.featured ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-gold-100 px-3 py-1 text-[11px] font-black text-gold-900" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.45)' }}>
                <Shield className="w-3.5 h-3.5" strokeWidth={2.5} />
                مميزة
              </span>
            ) : car.isNew ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-success-600/95 px-3 py-1 text-[11px] font-black text-white">
                <BadgeCheck className="w-3.5 h-3.5" />
                تم التحقق
              </span>
            ) : null}
          </div>

          {car.views !== undefined && car.views > 0 && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-white/90 tabular-nums">
                {car.views}
                <Eye className="w-3.5 h-3.5" />
              </span>
            </div>
          )}

          {/* Owner-only readiness chip. Hidden from the public grid: a
              completeness score is feedback for the seller, not a sales pitch,
              and showing "87% complete" to buyers would be meaningless. */}
          {isOwnerView && readiness && (
            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2">
              <span
                title={`اكتمال البيانات ${readiness.percent}%`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-black/70 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-white/90"
              >
                <Gauge className="w-3 h-3 text-emerald-400" />
                {readiness.percent}%
              </span>
              {readiness.canPublish && (car as any).hasLicenseDoc && (car as any).hasInspectionDoc && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/85 px-2.5 py-1 text-[10px] font-bold text-white">
                  <Shield className="w-3 h-3" />
                  مستندات مكتملة
                </span>
              )}
              {car.status === 'PENDING' && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/85 px-2.5 py-1 text-[10px] font-bold text-white">
                  <Clock className="w-3 h-3" />
                  قيد المراجعة
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price ticket overlapping image */}
        <div className="px-5">
          <div className="w-fit -mt-7 relative z-10 rounded-2xl bg-gold-100 text-gold-900 px-5 py-2.5" style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.45)' }}>
            <p className="font-black text-2xl leading-none tabular-nums">
              {formatPrice(car.price)}
            </p>
            {car.isNegotiable && (
              <p className="text-[10px] font-black text-gold-900/70 mt-1">قابل للتفاوض</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col px-5 pt-3 pb-5">
          <h3 className="font-black text-lg text-surface-50 leading-snug text-right">
            {brandName} {modelName} {car.year}
          </h3>

          {/* Meta pills */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 mt-2.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-surface-700 px-2.5 py-1 text-[11px] font-bold text-surface-400">
              <Calendar className="w-3 h-3 text-gold-100" />
              {car.year}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-surface-700 px-2.5 py-1 text-[11px] font-bold text-surface-400">
              <CarIcon className="w-3 h-3 text-gold-100" />
              {getConditionLabel(car.condition)}
            </span>
            {cityName && (
              <span className="inline-flex items-center gap-1 rounded-full border border-surface-700 px-2.5 py-1 text-[11px] font-bold text-surface-400">
                <MapPin className="w-3 h-3 text-gold-100" />
                {cityName}
              </span>
            )}
          </div>

          {/* Spec tiles */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { icon: Gauge, label: formatDistance(car.kilometers) },
              { icon: Settings2, label: getTransmissionLabel(car.transmission) },
              { icon: FuelIcon, label: getFuelTypeLabel(car.fuelType) },
            ].map((s, i) => (
              <div key={i} className="rounded-xl bg-surface-950/70 border border-surface-700/70 px-2 py-2.5 flex flex-col items-center gap-1">
                <s.icon className="w-4 h-4 text-gold-100" />
                <span className="text-[11px] font-bold text-surface-300 truncate max-w-full">{s.label}</span>
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div className="flex items-center gap-2 mt-4">
            <span className="flex flex-1 items-center justify-center gap-2 h-12 rounded-xl bg-gold-100 text-gold-900 font-black text-sm group-hover:bg-gold-200 transition-colors">
              <span>عرض التفاصيل</span>
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={3} />
            </span>
            <button
              type="button"
              onClick={toggleCompare}
              title={inCompare ? 'إزالة من المقارنة' : 'أضف للمقارنة'}
              aria-pressed={inCompare}
              className={`w-12 h-12 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                inCompare
                  ? 'bg-gold-100 border-gold-100 text-gold-900'
                  : 'border-surface-700 text-surface-400 hover:border-gold-100/60 hover:text-gold-100'
              }`}
            >
              <GitCompare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
