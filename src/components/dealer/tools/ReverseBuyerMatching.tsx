'use client';

import React, { useState } from 'react';
import {
  Target,
  Send,
  CheckCircle2,
  Phone,
  DollarSign,
  MapPin,
  Car,
  Filter,
  Sparkles,
  Calendar,
  ShieldCheck,
  Fuel,
} from 'lucide-react';

interface Props {
  dealerCars: any[];
  dealerName?: string;
  onShowToast: (msg: string) => void;
}

interface BuyerRequest {
  id: string;
  buyerName: string;
  phoneMasked: string;
  requestedMake: string;
  requestedModel: string;
  yearRange: string;
  maxBudget: number;
  fuelType: string;
  inspectionRequirement: string;
  city: string;
  matchedCarId?: string;
  matchScore: number;
  timeAgo: string;
  paymentType: 'CASH' | 'FINANCE_APPROVED';
}

const INITIAL_REQUESTS: BuyerRequest[] = [
  {
    id: 'req-101',
    buyerName: 'معتز المجالي',
    phoneMasked: '0799***412',
    requestedMake: 'تويوتا',
    requestedModel: 'كامري هايبرد',
    yearRange: '2020 - 2023',
    maxBudget: 19500,
    fuelType: 'HYBRID',
    inspectionRequirement: 'فحص 4 جيد كرت أبيض خالي من القصعات',
    city: 'عمان (الدوار السابع)',
    matchScore: 98,
    timeAgo: 'منذ 14 دقيقة',
    paymentType: 'CASH',
  },
  {
    id: 'req-102',
    buyerName: 'عمر الكردي',
    phoneMasked: '0788***901',
    requestedMake: 'كيا',
    requestedModel: 'نيرو',
    yearRange: '2021 - 2023',
    maxBudget: 18500,
    fuelType: 'HYBRID',
    inspectionRequirement: 'فحص ممتاز مع كفالة بطارية معتمدة',
    city: 'الزرقاء / عمان',
    matchScore: 95,
    timeAgo: 'منذ 45 دقيقة',
    paymentType: 'FINANCE_APPROVED',
  },
  {
    id: 'req-103',
    buyerName: 'د. رامي العبادي',
    phoneMasked: '0777***334',
    requestedMake: 'هيونداي',
    requestedModel: 'سوناتا',
    yearRange: '2019 - 2022',
    maxBudget: 17800,
    fuelType: 'HYBRID',
    inspectionRequirement: 'فحص شاصي نظيف لون أبيض أو لؤلؤي',
    city: 'إربد',
    matchScore: 91,
    timeAgo: 'منذ ساعتين',
    paymentType: 'CASH',
  },
  {
    id: 'req-104',
    buyerName: 'المهندس طارق خريس',
    phoneMasked: '0795***880',
    requestedMake: 'مرسيدس',
    requestedModel: 'C200 / E200',
    yearRange: '2019 - 2022',
    maxBudget: 34000,
    fuelType: 'PETROL',
    inspectionRequirement: 'سجل صيانة وكالة مثبت ممشى أقل من 60 ألف',
    city: 'عمان (عبدون)',
    matchScore: 88,
    timeAgo: 'منذ 3 ساعات',
    paymentType: 'CASH',
  },
  {
    id: 'req-105',
    buyerName: 'فراس حداد',
    phoneMasked: '0790***112',
    requestedMake: 'بي واي دي',
    requestedModel: 'Song Plus EV',
    yearRange: '2023 - 2024',
    maxBudget: 22000,
    fuelType: 'ELECTRIC',
    inspectionRequirement: 'فحص بطارية فوق 95% SOH شاحن أصلي',
    city: 'عمان',
    matchScore: 84,
    timeAgo: 'اليوم',
    paymentType: 'FINANCE_APPROVED',
  },
];

export function ReverseBuyerMatching({ dealerCars, dealerName, onShowToast }: Props) {
  const [requests, setRequests] = useState<BuyerRequest[]>(INITIAL_REQUESTS);
  const [pitchedIds, setPitchedIds] = useState<Set<string>>(new Set());
  const [filterOnlyMatches, setFilterOnlyMatches] = useState(false);
  const [selectedPitchCar, setSelectedPitchCar] = useState<any>(dealerCars[0] || null);

  const handleSendDirectPitch = (req: BuyerRequest) => {
    setPitchedIds((prev) => new Set([...prev, req.id]));
    onShowToast(`تم إرسال عرض سيارة معرضك بنجاح للزبون (${req.buyerName})!`);
  };

  return (
    <div className="space-y-4">
      {/* Header & Stats Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-emerald-500/15 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm block">
              رادار "الطلبات المعكوسة" (Reverse Buyer Matching Engine)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              بدلاً من انتظار دخول الزبون لإعلانك؛ يعرض هذا الرادار طلبات المشترين الجاهزين بكاش أو تمويل بنكي معتمد، مع نسبة مطابقتها لسيارات معرضك!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white shrink-0">
            {requests.length} طلبات شراء نشطة اليوم
          </span>
        </div>
      </div>

      {/* Pitch Selector Bar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-emerald-500" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            السيارة التي ترغب بتقديمها بالعروض المباشرة:
          </span>
          <select
            value={selectedPitchCar?.id || ''}
            onChange={(e) => {
              const c = dealerCars.find((car) => car.id === e.target.value);
              if (c) setSelectedPitchCar(c);
            }}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
          >
            {dealerCars.length > 0 ? (
              dealerCars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brand?.nameAr} {c.model?.nameAr} ({c.year}) — {c.price?.toLocaleString()} د.أ
                </option>
              ))
            ) : (
              <option value="demo">تويوتا كامري 2022 — 19,500 د.أ</option>
            )}
          </select>
        </div>

        <label className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={filterOnlyMatches}
            onChange={(e) => setFilterOnlyMatches(e.target.checked)}
            className="rounded border-slate-400 text-blue-600"
          />
          <span>عرض المطابقة العالية فقط (+90%)</span>
        </label>
      </div>

      {/* Buyer Requests Cards List */}
      <div className="grid grid-cols-1 gap-3">
        {requests
          .filter((req) => !filterOnlyMatches || req.matchScore >= 90)
          .map((req) => {
            const isPitched = pitchedIds.has(req.id);
            return (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left/Middle Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-900 dark:text-white text-base">
                      {req.requestedMake} {req.requestedModel} ({req.yearRange})
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        req.matchScore >= 95
                          ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                          : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      مطابقة المعرض {req.matchScore}%
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.paymentType === 'CASH'
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                      }`}
                    >
                      {req.paymentType === 'CASH' ? 'كاش جاهز للتنازل' : 'تمويل بنكي حاصل على موافقة'}
                    </span>

                    <span className="text-[10px] text-slate-400 mr-auto font-mono">{req.timeAgo}</span>
                  </div>

                  {/* Requirements Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">الميزانية المرصودة</span>
                      <strong className="text-emerald-500 font-mono text-sm">
                        {req.maxBudget.toLocaleString()} د.أ
                      </strong>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">اسم المشتري</span>
                      <strong className="text-slate-800 dark:text-slate-200">{req.buyerName}</strong>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">الموقع</span>
                      <strong className="text-slate-800 dark:text-slate-200 truncate block">{req.city}</strong>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">رقم الهاتف</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">{req.phoneMasked}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>شرط الفحص المطلوب: <strong>{req.inspectionRequirement}</strong></span>
                  </p>
                </div>

                {/* Direct Pitch Action CTA */}
                <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                  <button
                    onClick={() => handleSendDirectPitch(req)}
                    disabled={isPitched}
                    className={`w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md ${
                      isPitched
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer'
                    }`}
                  >
                    {isPitched ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>تم إرسال العرض ✓</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>إرسال عرض مباشر (Direct Pitch)</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-slate-400 text-center">
                    {isPitched ? 'الزبون يراجع سيارة معرضك حالياً' : 'تصل رسالة فورية لهاتف المشتري'}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
