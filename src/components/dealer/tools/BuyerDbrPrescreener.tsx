'use client';

import React, { useState } from 'react';
import {
  Landmark,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  ShieldCheck,
  DollarSign,
  UserCheck,
} from 'lucide-react';

interface Props {
  dealerCars: any[];
  onShowToast: (msg: string) => void;
}

export function BuyerDbrPrescreener({ dealerCars, onShowToast }: Props) {
  const [buyerSalary, setBuyerSalary] = useState<number>(850);
  const [existingDebts, setExistingDebts] = useState<number>(120);
  const [targetCarPrice, setTargetCarPrice] = useState<number>(19500);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [tenureYears, setTenureYears] = useState<number>(5);
  const [sector, setSector] = useState<'GOVERNMENT' | 'PRIVATE_ACCREDITED' | 'SPECIAL'>('GOVERNMENT');

  // Central Bank of Jordan DBR limits
  const maxDbrPct = sector === 'SPECIAL' ? 0.55 : 0.50;
  const maxAllowedTotalInstallment = Math.round(buyerSalary * maxDbrPct);
  const maxAllowedCarInstallment = Math.max(0, maxAllowedTotalInstallment - existingDebts);

  // Car loan calculations
  const downPaymentAmount = Math.round((targetCarPrice * downPaymentPct) / 100);
  const loanPrincipal = Math.max(0, targetCarPrice - downPaymentAmount);
  const interestRate = 0.055; // 5.5% flat bank rate Jordan standard
  const months = tenureYears * 12;
  const totalInterest = loanPrincipal * interestRate * tenureYears;
  const totalLoanRepay = loanPrincipal + totalInterest;
  const requiredMonthlyPayment = Math.round(totalLoanRepay / months);

  const currentDbrPct = Math.round(((existingDebts + requiredMonthlyPayment) / buyerSalary) * 100);
  const isApproved = requiredMonthlyPayment <= maxAllowedCarInstallment && currentDbrPct <= (maxDbrPct * 100);

  // Max car price buyer can afford
  const maxAffordableLoan = (maxAllowedCarInstallment * months) / (1 + interestRate * tenureYears);
  const maxAffordableCarPrice = Math.round(maxAffordableLoan / (1 - downPaymentPct / 100));

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm block">
              فاحص عبء الدين وأهلية تمويل الزبون الفوري (Jordan DBR Prescreener)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              معايرة فورية وفق تعليمات البنك المركزي الأردني (حد عبء الدين DBR 50%) لتحديد قدرة الزبون على التمويل خلال 3 ثوانٍ فقط!
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          معتمد مصرفياً في الأردن
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Inputs (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
            بيانات الزبون المالية والراتب
          </h4>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              الراتب الشهري المحول للبنك (صافي الدخل)
            </label>
            <input
              type="number"
              value={buyerSalary}
              onChange={(e) => setBuyerSalary(Number(e.target.value))}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              إجمالي الالتزامات والأقساط الشهرية القائمة
            </label>
            <input
              type="number"
              value={existingDebts}
              onChange={(e) => setExistingDebts(Number(e.target.value))}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                سعر السيارة (د.أ)
              </label>
              <input
                type="number"
                value={targetCarPrice}
                onChange={(e) => setTargetCarPrice(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                الدفعة الأولى (%)
              </label>
              <select
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value={10}>10% دفعة</option>
                <option value={15}>15% دفعة</option>
                <option value={20}>20% دفعة قياسية</option>
                <option value={25}>25% دفعة</option>
                <option value={30}>30% دفعة</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              قطاع العمل (تحديد سقف الـ DBR)
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as any)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="GOVERNMENT">قطاع حكومي / قوات مسلحة (سقف 50%)</option>
              <option value="PRIVATE_ACCREDITED">قطاع خاص شركات معتمدة (سقف 50%)</option>
              <option value="SPECIAL">أطباء / مهندسون / فئات خاصة (سقف 55%)</option>
            </select>
          </div>
        </div>

        {/* Results & Verdict Column (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            {/* Status Badge */}
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 ${
                isApproved
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold ${
                  isApproved ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {isApproved ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-sm font-black block">
                  {isApproved
                    ? 'الزبون مؤهل لتمويل بنكي فوري مطابق للشروط!'
                    : 'يتجاوز سقف عبء الدين المسموح به من البنك المركزي!'}
                </span>
                <span className="text-xs">
                  {isApproved
                    ? `نسبة عبء الدين بعد القسط: ${currentDbrPct}% (أقل من السقف القانوني ${(maxDbrPct * 100)}%)`
                    : `نسبة عبء الدين الإجمالية ستصبح ${currentDbrPct}% (تتجاوز الحد المسموح ${(maxDbrPct * 100)}%)`}
                </span>
              </div>
            </div>

            {/* Matrix details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">القسط الشهري المطلوب</span>
                <strong className="text-sm font-mono text-slate-900 dark:text-white">
                  {requiredMonthlyPayment} د.أ
                </strong>
                <span className="text-[9px] text-slate-500 block">لـ 5 سنوات</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">أقصى قسط متاح له</span>
                <strong className="text-sm font-mono text-emerald-500">
                  {maxAllowedCarInstallment} د.أ
                </strong>
                <span className="text-[9px] text-slate-500 block">وفق سقف DBR</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">الدفعة الأولى المطلوبة</span>
                <strong className="text-sm font-mono text-slate-900 dark:text-white">
                  {downPaymentAmount.toLocaleString()} د.أ
                </strong>
                <span className="text-[9px] text-slate-500 block">نسبة {downPaymentPct}%</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">أقصى سعر سيارة مؤهل لها</span>
                <strong className="text-sm font-mono text-cyan-500">
                  {maxAffordableCarPrice.toLocaleString()} د.أ
                </strong>
                <span className="text-[9px] text-slate-500 block">سقف المعرض</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
             <strong>نصيحة المعرض للتعامل مع الزبون:</strong>{' '}
            {isApproved
              ? 'الزبون يمتلك سجلاً ائتمانياً ممتازاً، يمكنك البدء بمعاملة البنك فوراً دون خوف من الرفض.'
              : `لتمرير المعاملة بنجاح، اطلب من الزبون زيادة الدفعة الأولى إلى ${Math.round(downPaymentAmount + (requiredMonthlyPayment - maxAllowedCarInstallment) * 40).toLocaleString()} د.أ أو إدخال كفيل من الدرجة الأولى.`}
          </div>
        </div>
      </div>
    </div>
  );
}
