'use client';

import { CarCard } from './CarCard';
import type { Car } from '@/types';
import Link from 'next/link';
import { Car as CarIcon, Plus } from 'lucide-react';

interface CarGridProps {
  cars: Car[];
  featured?: boolean;
  columns?: 2 | 3 | 4;
  loading?: boolean;
  emptyMessage?: string;
  /** Owner's own listings: enables the readiness/verification chips. */
  isOwnerView?: boolean;
}

export function CarGrid({ cars, featured, columns = 3, loading, emptyMessage, isOwnerView = false }: CarGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (loading) {
    return (
      <div className={`grid ${gridCols[columns]} gap-6`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-[#121622]/80 border border-white/[0.08]">
            <div className="h-56 bg-slate-900/60 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-white/[0.06] rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-white/[0.06] rounded w-1/2 animate-pulse" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="h-3 bg-white/[0.04] rounded animate-pulse" />
                ))}
              </div>
              <div className="h-10 bg-white/[0.05] rounded-xl animate-pulse mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!cars || cars.length === 0) {
    return (
      <div className="text-center py-14 px-4 rounded-3xl bg-[#111520]/60 border border-white/[0.06] backdrop-blur-md max-w-lg mx-auto my-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <CarIcon className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-white mb-1.5">
          {emptyMessage || 'لا توجد سيارات معروضة حالياً'}
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm mb-5 max-w-sm mx-auto">
          كن أول من ينشر إعلان سيارته وتواصل مباشرة مع المشترين في كافة محافظات الأردن
        </p>
        <Link
          href="/cars/add"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs px-5 py-2.5 shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>أضف أول إعلان سيارة الآن</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {cars.map((car, index) => (
        <CarCard key={car.id} car={car} index={index} isOwnerView={isOwnerView} />
      ))}
    </div>
  );
}
