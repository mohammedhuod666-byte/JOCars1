'use client';

import React, { useState } from 'react';
import {
  Building2,
  Lock,
  ShieldCheck,
  DollarSign,
  PlusCircle,
  Car,
  CheckCircle2,
  Phone,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface Props {
  dealerCars: any[];
  dealerName?: string;
  isVerified?: boolean;
  onShowToast: (msg: string) => void;
}

interface WholesaleLot {
  id: string;
  showroomName: string;
  location: string;
  title: string;
  quantity: number;
  condition: string;
  customsStatus: 'FREE_ZONE_UNREGISTERED' | 'CUSTOMS_PAID_INTERNAL';
  wholesalePriceJod: number;
  marketFmvJod: number;
  expectedMarginPerCar: number;
  phoneMasked: string;
}

const INITIAL_LOTS: WholesaleLot[] = [
  {
    id: 'lot-1',
    showroomName: 'معرض الأوائل — حرة الزرقاء',
    location: 'شارع 14 جنوبي، المنطقة الحرة',
    title: 'لوط 3 سيارات تويوتا راف 4 هايبرد 2023 LE وارد أمريكا',
    quantity: 3,
    condition: 'فحص كلين تايتل بدون غرق أو حادث شاصي',
    customsStatus: 'FREE_ZONE_UNREGISTERED',
    wholesalePriceJod: 15400, // FOB / Free-zone price in JOD
    marketFmvJod: 18200,
    expectedMarginPerCar: 2800,
    phoneMasked: '0798***331',
  },
  {
    id: 'lot-2',
    showroomName: 'معرض النخبة الملكي — عمان',
    location: 'طريق المطار، عمان',
    title: 'مرسيدس C200 موديل 2021 AMG بكج كامل — تصفية سيولة',
    quantity: 1,
    condition: 'فحص 4 جيد كرت أبيض، دهان وكالة كامل',
    customsStatus: 'CUSTOMS_PAID_INTERNAL',
    wholesalePriceJod: 27500,
    marketFmvJod: 30200,
    expectedMarginPerCar: 2700,
    phoneMasked: '0795***900',
  },
  {
    id: 'lot-3',
    showroomName: 'شركة الوادي لتجارة السيارات',
    location: 'حرة الزرقاء — البوابة الرئيسية',
    title: 'لوط 4 سيارات هيونداي كونا EV موديل 2022 بطارية 64kWh',
    quantity: 4,
    condition: 'فحص بطارية فوق 96% SOH ممشى قليل جداً',
    customsStatus: 'FREE_ZONE_UNREGISTERED',
    wholesalePriceJod: 12800,
    marketFmvJod: 14900,
    expectedMarginPerCar: 2100,
    phoneMasked: '0770***554',
  },
];

export function B2BWholesaleFloor({
  dealerCars,
  dealerName,
  isVerified,
  onShowToast,
}: Props) {
  const [lots, setLots] = useState<WholesaleLot[]>(INITIAL_LOTS);
  const [requestedLots, setRequestedLots] = useState<Set<string>>(new Set());

  const handleRequestLot = (lot: WholesaleLot) => {
    setRequestedLots((prev) => new Set([...prev, lot.id]));
    onShowToast(`تم إرسال طلب الشراء بسعر الجملة لمعرض (${lot.showroomName})!`);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-blue-500/15 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm block">
              سوق تجار الحرة وعمان المغلق (B2B Private Wholesale Trading Floor)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              قاعة تداول سرية ومغلقة مخصصة للتجار وأصحاب المعارض لتبادل السيارات ولوطات الحرة بسعر الجملة دون ظهور الأسعار للمشترين العاديين
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          مساحة تجار معتمدة
        </span>
      </div>

      {/* Wholesale listings */}
      <div className="grid grid-cols-1 gap-4">
        {lots.map((lot) => {
          const isRequested = requestedLots.has(lot.id);
          return (
            <div
              key={lot.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-slate-900 dark:text-white text-base">
                    {lot.title}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-500 border border-purple-500/30">
                    الكمية: {lot.quantity} {lot.quantity > 1 ? 'سيارات' : 'سيارة'}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      lot.customsStatus === 'FREE_ZONE_UNREGISTERED'
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    }`}
                  >
                    {lot.customsStatus === 'FREE_ZONE_UNREGISTERED'
                      ? 'حرة الزرقاء (غير مجمركة)'
                      : 'مجمركة وجاهزة داخلي'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-purple-500" />
                    <strong>{lot.showroomName}</strong>
                  </span>
                  <span>•</span>
                  <span>{lot.location}</span>
                  <span>•</span>
                  <span>هاتف التاجر: <strong className="font-mono text-slate-800 dark:text-slate-200">{lot.phoneMasked}</strong></span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                   حالة الفحص والملاحظات: <strong>{lot.condition}</strong>
                </p>

                {/* Price Matrix */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs max-w-lg">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">سعر الجملة للتاجر</span>
                    <strong className="text-purple-600 dark:text-purple-400 font-mono text-sm">
                      {lot.wholesalePriceJod.toLocaleString()} د.أ
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">سعر التجزئة بالسوق</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">
                      {lot.marketFmvJod.toLocaleString()} د.أ
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">هامش ربحك الصافي</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      +{lot.expectedMarginPerCar.toLocaleString()} د.أ
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0">
                <button
                  onClick={() => handleRequestLot(lot)}
                  disabled={isRequested}
                  className={`w-full lg:w-auto px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                    isRequested
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                  }`}
                >
                  {isRequested ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>تم إرسال الرغبة للشراء ✓</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4" />
                      <span>طلب شراء جملة فوري</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-slate-400 text-center">
                  صفقة مباشرة بين المعارض
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
