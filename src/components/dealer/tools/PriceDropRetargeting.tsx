'use client';

import React, { useState } from 'react';
import {
  TrendingDown,
  BellRing,
  Users,
  Send,
  Eye,
  Heart,
  Search,
  CheckCircle2,
  Sparkles,
  DollarSign,
} from 'lucide-react';

interface Props {
  dealerCars: any[];
  dealerName?: string;
  onShowToast: (msg: string) => void;
}

export function PriceDropRetargeting({
  dealerCars,
  dealerName = 'معرض السيارات',
  onShowToast,
}: Props) {
  const [selectedCarId, setSelectedCarId] = useState<string>(dealerCars[0]?.id || 'demo');
  const [discountAmount, setDiscountAmount] = useState<number>(700);
  const [isCampaignLaunched, setIsCampaignLaunched] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const selectedCar = dealerCars.find((c) => c.id === selectedCarId) || {
    id: 'demo',
    brand: { nameAr: 'كيا' },
    model: { nameAr: 'سبورتاج هايبرد' },
    year: 2022,
    price: 19500,
  };

  const oldPrice = selectedCar.price;
  const newPrice = Math.max(1000, oldPrice - discountAmount);

  // Audience simulation
  const favoritedCount = 384;
  const viewedCount = 1290;
  const searchingCount = 92;
  const totalAudience = favoritedCount + viewedCount + searchingCount;

  const handleLaunchCampaign = () => {
    setIsLaunching(true);
    setTimeout(() => {
      setIsLaunching(false);
      setIsCampaignLaunched(true);
      onShowToast(`تم إطلاق حملة تخفيض السعر بنجاح إلى ${totalAudience.toLocaleString()} مستخدم مهتم!`);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-orange-500/10 to-amber-500/15 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm block">
              مُطلق حملات إعادة الاستهداف الآلي عند تخفيض السعر (Price-Drop Retargeting)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              عندما تخفض سعر سيارتك؛ يرسل المحرك إشعاراً فورياً على هواتف كل من حفظ السيارة بالمفضلة أو شاهدها خلال آخر 14 يوماً!
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          معدل استجابة +42% خلال 24 ساعة
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              اختر السيارة لتخفيض سعرها
            </label>
            <select
              value={selectedCarId}
              onChange={(e) => {
                setSelectedCarId(e.target.value);
                setIsCampaignLaunched(false);
              }}
              className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
            >
              {dealerCars.length > 0 ? (
                dealerCars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.brand?.nameAr} {c.model?.nameAr} ({c.year}) — السعر الحالي: {c.price?.toLocaleString()} د.أ
                  </option>
                ))
              ) : (
                <option value="demo">كيا سبورتاج 2022 — 19,500 د.أ</option>
              )}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                قيمة التخفيض المقترح (د.أ)
              </label>
              <span className="text-xs font-black text-rose-500 font-mono">
                -{discountAmount} د.أ
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={3000}
              step={50}
              value={discountAmount}
              onChange={(e) => {
                setDiscountAmount(Number(e.target.value));
                setIsCampaignLaunched(false);
              }}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>100 د.أ</span>
              <span>1,500 د.أ</span>
              <span>3,000 د.أ</span>
            </div>
          </div>

          {/* Pricing Comparison Box */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">السعر السابق المعروض:</span>
              <span className="font-mono line-through text-slate-400">
                {oldPrice.toLocaleString()} د.أ
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 dark:text-slate-200">السعر المخفّض الجديد:</span>
              <span className="text-base font-black font-mono text-emerald-500">
                {newPrice.toLocaleString()} د.أ
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="text-rose-500 font-bold">نسبة الخصم:</span>
              <span className="font-mono font-bold text-rose-500">
                {((discountAmount / oldPrice) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <button
            onClick={handleLaunchCampaign}
            disabled={isLaunching || isCampaignLaunched}
            className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
              isCampaignLaunched
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                : 'bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:opacity-95 text-white'
            }`}
          >
            {isLaunching ? (
              <span>جاري الإرسال لشبكة المشترين...</span>
            ) : isCampaignLaunched ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم إرسال الحملة بنجاح ✓</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>إطلاق إشعار التخفيض لـ {totalAudience.toLocaleString()} زبون 🚀</span>
              </>
            )}
          </button>
        </div>

        {/* Audience & Message Preview Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Target Audience Reach Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 block">حفظ بالمفضلة</span>
              <strong className="text-base font-black text-slate-900 dark:text-white font-mono">
                {favoritedCount}
              </strong>
              <span className="text-[9px] text-slate-400 block">مشترٍ مباشر</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <Eye className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 block">مشاهدات آخر 14 يوم</span>
              <strong className="text-base font-black text-slate-900 dark:text-white font-mono">
                {viewedCount.toLocaleString()}
              </strong>
              <span className="text-[9px] text-slate-400 block">تفاعل حقيقي</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <Search className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 block">باحثون عن الموديل</span>
              <strong className="text-base font-black text-slate-900 dark:text-white font-mono">
                {searchingCount}
              </strong>
              <span className="text-[9px] text-slate-400 block">تنبيه بحث</span>
            </div>
          </div>

          {/* Phone Notification Preview Mockup */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <BellRing className="w-3.5 h-3.5 text-rose-400" />
                معاينة الإشعار الفوري كما سيظهر على هواتف الزبائن
              </span>
              <span className="font-mono text-[10px]">الآن • عبر تطبيق وموقع JO Cars</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow font-black">
                %
              </div>
              <div className="space-y-1">
                <span className="text-xs font-black text-white block">
                  🔥 تخفيض سعر حصري! {selectedCar.brand?.nameAr} {selectedCar.model?.nameAr} {selectedCar.year}
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  السيارة التي تتابعها بقائمتك انخفض سعرها بمقدار <strong>{discountAmount} د.أ</strong>! السعر الجديد الآن: <strong className="text-emerald-400">{newPrice.toLocaleString()} د.أ</strong> لدى {dealerName}. انقر هنا لمعاينة الفحص والتواصل المباشر مع المعرض.
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
              <span>يتم الإرسال عبر: Push Notifications + إشعار داخل المنصة</span>
              <span className="text-emerald-400 font-bold">وصول مضمون 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
