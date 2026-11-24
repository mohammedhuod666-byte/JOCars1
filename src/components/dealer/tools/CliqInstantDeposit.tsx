'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Copy,
  Share2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Printer,
  Car,
  DollarSign,
  User,
  Phone,
} from 'lucide-react';

interface Props {
  dealerCars: any[];
  dealerName?: string;
  dealerPhone?: string;
  onShowToast: (msg: string) => void;
}

export function CliqInstantDeposit({
  dealerCars,
  dealerName = 'معرض السيارات المعتمد',
  dealerPhone = '0790000000',
  onShowToast,
}: Props) {
  const [selectedCarId, setSelectedCarId] = useState<string>(dealerCars[0]?.id || 'demo');
  const [buyerName, setBuyerName] = useState('حسام القضاة');
  const [buyerPhone, setBuyerPhone] = useState('0791234567');
  const [buyerNationalId, setBuyerNationalId] = useState('9921045612');
  const [depositAmount, setDepositAmount] = useState<number>(300);
  const [cliqAlias, setCliqAlias] = useState('JOCARS-SHOWROOM');
  const [isReceiptGenerated, setIsReceiptGenerated] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');

  const selectedCar = dealerCars.find((c) => c.id === selectedCarId) || {
    id: 'demo',
    brand: { nameAr: 'تويوتا' },
    model: { nameAr: 'كامري هايبرد' },
    year: 2022,
    price: 19500,
  };

  const handleGenerateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const num = `CLIQ-HOLD-${Date.now().toString().slice(-6)}`;
    setReceiptNumber(num);
    setIsReceiptGenerated(true);
    onShowToast(`تم إنشاء سند الحجز الرقمي رقم ${num} بنجاح!`);
  };

  const receiptText = `*سند حجز وعربون إلكتروني رسمي (24 ساعة)*
رقم السند: ${receiptNumber}
اسم المعرض: ${dealerName} (هاتف: ${dealerPhone})
اسم المشتري: ${buyerName} (هاتف: ${buyerPhone} / رقم وطني: ${buyerNationalId})
المركبة: ${selectedCar.brand?.nameAr} ${selectedCar.model?.nameAr} ${selectedCar.year}
السعر الإجمالي المتفق عليه: ${selectedCar.price?.toLocaleString()} د.أ
قيمة العربون المدفوع عبر كليك: ${depositAmount} د.أ
معرّف كليك (CliQ Alias): ${cliqAlias}
تاريخ وساعة الحجز: ${new Date().toLocaleString('ar-JO')}
مدة الحجز: 24 ساعة ملزمة للطرفين عملاً بأحكام القانون المدني الأردني. في حال تخلف المشتري يسقط العربون، وفي حال تراجع البائع يلتزم برد ضعف العربون.`;

  const handleCopyReceipt = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(receiptText);
      onShowToast('تم نسخ نص السند لمشاركته على واتساب الزبون');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow shrink-0 font-black">
            CliQ
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm block">
              العربون الرقمي الفوري وسند حجز الـ 24 ساعة (Instant CliQ e-Deposit)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              تثبيت حجز المركبة فورياً عبر كليك الأردني، وإصدار سند إلكتروني ملزم يثبت جدية المشتري ويمنع إضاعة وقت المعرض
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          متوافق مع البنك المركزي الأردني
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Input Form (5 cols) */}
        <form
          onSubmit={handleGenerateReceipt}
          className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
        >
          <h4 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
            بيانات عملية الحجز والعربون
          </h4>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              المركبة المراد حجزها
            </label>
            <select
              value={selectedCarId}
              onChange={(e) => setSelectedCarId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                اسم المشتري
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                required
                className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                هاتف المشتري
              </label>
              <input
                type="text"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                required
                className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                الرقم الوطني
              </label>
              <input
                type="text"
                value={buyerNationalId}
                onChange={(e) => setBuyerNationalId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                قيمة العربون (د.أ)
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                min={50}
                required
                className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              اسم كليك المعتمد للمعرض (CliQ Alias)
            </label>
            <input
              type="text"
              value={cliqAlias}
              onChange={(e) => setCliqAlias(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer pt-2 mt-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>إصدار سند الحجز الإلكتروني فوراً</span>
          </button>
        </form>

        {/* Digital Receipt Preview (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  سند حجز وعربون رقمي معتمد (Digital Reservation Slip)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {receiptNumber || 'CLIQ-HOLD-PREVIEW'}
              </span>
            </div>

            {/* Receipt Content */}
            <div className="space-y-3 pt-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">المعرض المستلم</span>
                  <strong className="text-slate-900 dark:text-white block mt-0.5">{dealerName}</strong>
                  <span className="text-[10px] text-slate-500 font-mono">{dealerPhone}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">المشتري الحاجز</span>
                  <strong className="text-slate-900 dark:text-white block mt-0.5">{buyerName}</strong>
                  <span className="text-[10px] text-slate-500 font-mono">{buyerPhone}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                    قيمة العربون المدفوع عبر CliQ
                  </span>
                  <span className="text-[10px] text-slate-500">
                    لحساب كليك: <strong>{cliqAlias}</strong>
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {depositAmount} د.أ
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">السيارة المحجوزة:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {selectedCar.brand?.nameAr} {selectedCar.model?.nameAr} {selectedCar.year}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">السعر الإجمالي المتفق عليه:</span>
                  <strong className="text-emerald-500 font-mono">
                    {selectedCar.price?.toLocaleString()} د.أ
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المتبقي عند التنازل:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {(selectedCar.price - depositAmount).toLocaleString()} د.أ
                  </strong>
                </div>
              </div>

              {/* Legal binding footnote */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>أثر العربون القانوني:</strong> يعتبر هذا السند حجزاً ملزماً لمدة 24 ساعة. في حال استنكاف المشتري يفقد العربون، وفي حال نكول البائع يلتزم برد مثليه عملاً بالقانون المدني الأردني.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
            <button
              onClick={handleCopyReceipt}
              className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>نسخ السند لواتساب الزبون</span>
            </button>
            <button
              onClick={() => {
                window.print();
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة إيصال</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
