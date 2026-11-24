'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  Percent,
} from 'lucide-react';

interface Props {
  dealerCars: any[];
  dealerName?: string;
  onShowToast: (msg: string) => void;
}

export function WarrantyUpsellCalculator({ dealerCars, dealerName, onShowToast }: Props) {
  const [monthlySalesVolume, setMonthlySalesVolume] = useState<number>(12);
  const [warrantyAttachRatePct, setWarrantyAttachRatePct] = useState<number>(65);

  const plans = [
    {
      name: 'كفالة بلاتينيوم (سنة واحدة)',
      desc: 'تغطية المحرك، الجير، والدينامو مع مساعدة على الطريق',
      costToShowroom: 180,
      priceToBuyer: 350,
      dealerNetMargin: 170,
    },
    {
      name: 'كفالة دايموند بلس (سنتان)',
      desc: 'تغطية شاملة + بطارية الهايبرد/EV وخلايا الليثيوم والكمبروسر',
      costToShowroom: 320,
      priceToBuyer: 590,
      dealerNetMargin: 270,
      popular: true,
    },
    {
      name: 'درع الـ VIP الملكي (3 سنوات)',
      desc: 'حماية كاملة من الصدام للصدام + صيانة دورية مجانية 3 مرات',
      costToShowroom: 490,
      priceToBuyer: 880,
      dealerNetMargin: 390,
    },
  ];

  const estimatedSoldWithWarranty = Math.round((monthlySalesVolume * warrantyAttachRatePct) / 100);
  const averageMarginPerWarranty = 270;
  const projectedMonthlyProfit = estimatedSoldWithWarranty * averageMarginPerWarranty;
  const projectedAnnualProfit = projectedMonthlyProfit * 12;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-indigo-500/15 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm block">
              حاسبة أرباح الكفالة الإضافية كمدخول إضافي (Extended Warranty Upsell Commission)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              توفير كفالات ممتدة للبطارية والمحرك بالتعاون مع كبرى شركات الكفالة الأردنية وتحقيق دخل إضافي صافٍ بين 170 إلى 390 د.أ لكل سيارة مباعة!
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
          ربح صافٍ بدون رأس مال إضافي
        </span>
      </div>

      {/* Simulator Inputs & Projection Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
            إعدادات مبيعات المعرض الشهرية
          </h4>

          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-400">
                معدل مبيعات سيارات المعرض شهرياً
              </label>
              <strong className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                {monthlySalesVolume} سيارات / شهر
              </strong>
            </div>
            <input
              type="range"
              min={3}
              max={50}
              value={monthlySalesVolume}
              onChange={(e) => setMonthlySalesVolume(Number(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-400">
                نسبة الزبائن الراغبين بكفالة أمان
              </label>
              <strong className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                {warrantyAttachRatePct}%
              </strong>
            </div>
            <input
              type="range"
              min={20}
              max={90}
              step={5}
              value={warrantyAttachRatePct}
              onChange={(e) => setWarrantyAttachRatePct(Number(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
          </div>

          {/* Monthly Profit Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 text-center space-y-1">
            <span className="text-[10px] uppercase font-extrabold text-cyan-700 dark:text-cyan-300 block">
              الربح الشهري الإضافي الصافي للمعرض
            </span>
            <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              +{projectedMonthlyProfit.toLocaleString()} <span className="text-sm">د.أ / شهر</span>
            </div>
            <span className="text-[11px] text-slate-500 font-bold block pt-1">
              أرباح سنوية متوقعة: <strong className="text-slate-900 dark:text-white font-mono">+{projectedAnnualProfit.toLocaleString()} د.أ</strong>
            </span>
          </div>
        </div>

        {/* Warranty Packages Table (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            باقات الكفالة المتاحة للمشترين وهوامش عمولة المعرض
          </h4>

          <div className="space-y-3">
            {plans.map((p, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  p.popular
                    ? 'bg-cyan-500/5 dark:bg-cyan-950/20 border-cyan-500/40 shadow-md ring-1 ring-cyan-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {p.name}
                      </span>
                      {p.popular && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-500 text-white">
                          الأكثر طلباً للهايبرد
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {p.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block">سعر الزبون</span>
                      <strong className="text-slate-900 dark:text-white font-mono text-xs">
                        {p.priceToBuyer} د.أ
                      </strong>
                    </div>

                    <div className="text-center px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block">ربح معرضك</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-black">
                        +{p.dealerNetMargin} د.أ
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
