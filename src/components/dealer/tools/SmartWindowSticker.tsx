'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  QrCode,
  Award,
  ShieldCheck,
  Fuel,
  Gauge,
  Calendar,
  Building2,
  Phone,
  Sparkles,
  Car as CarIcon,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { generateQrDataUrl } from '@/lib/qrcode';

interface Props {
  dealerCars: any[];
  dealerName?: string;
  dealerPhone?: string;
  dealerLogo?: string;
  onShowToast: (msg: string) => void;
}

export function SmartWindowSticker({
  dealerCars,
  dealerName = 'معرض السيارات المعتمد',
  dealerPhone = '0790000000',
  dealerLogo,
  onShowToast,
}: Props) {
  const [selectedCarId, setSelectedCarId] = useState<string>(dealerCars[0]?.id || 'demo-car-1');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [chassisInspection, setChassisInspection] = useState<string>('فحص 4 جيد — كرت أبيض كامل');
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(245);
  const [warrantyIncluded, setWarrantyIncluded] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState(false);

  const selectedCar = dealerCars.find((c) => c.id === selectedCarId) || {
    id: 'demo-car-1',
    brand: { nameAr: 'تويوتا' },
    model: { nameAr: 'كامري هايبرد' },
    year: 2022,
    price: 19500,
    kilometers: 48000,
    fuelType: 'HYBRID',
    city: { nameAr: 'عمان' },
  };

  const carUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/cars/${selectedCar.id}`
    : `https://cars-jo.com/cars/${selectedCar.id}`;

  useEffect(() => {
    generateQrDataUrl(carUrl, { width: 240, margin: 1 }).then((url) => {
      setQrDataUrl(url);
    });
  }, [carUrl]);

  // Recalculate monthly installment on price change
  useEffect(() => {
    const loanAmount = selectedCar.price * 0.8; // 20% down payment
    const monthlyRate = 0.055 / 12; // 5.5% annual rate
    const months = 60; // 5 years
    const payment = Math.round(
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
        (Math.pow(1 + monthlyRate, months) - 1)
    );
    setMonthlyInstallment(payment || 245);
  }, [selectedCar.price]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(carUrl);
      setIsCopied(true);
      onShowToast('تم نسخ رابط فحص السيارة بنجاح!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Print-specific style rules: isolates the sticker and forces crisp A4 layout */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #sticker-printable-sheet, #sticker-printable-sheet * {
                visibility: visible !important;
              }
              #sticker-printable-sheet {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                min-height: 297mm !important;
                margin: 0 !important;
                padding: 12mm !important;
                background: #ffffff !important;
                color: #0f172a !important;
                z-index: 9999999 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-sizing: border-box !important;
              }
              .no-print {
                display: none !important;
              }
              @page {
                size: A4 portrait;
                margin: 0;
              }
            }
          `,
        }}
      />

      {/* Control Panel (Hidden during Print) */}
      <div className="no-print p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-500" />
              مُنشئ ملصق الزجاج الذكي للمعرض (Smart QR Window Sticker)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              اطبع ملصق A4 فاخر يوضع على زجاج السيارة في المعرض أو الحرة مزوداً برمز QR حقيقي يقود الزبون لتقرير الفحص والتقييم العادل
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة ملصق الزجاج (A4)</span>
          </button>
        </div>

        {/* Form controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              اختر السيارة من مخزونك
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
                <option value="demo-car-1">تويوتا كامري هايبرد (2022) — 19,500 د.أ</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              نتيجة الفحص الفني الأردني
            </label>
            <select
              value={chassisInspection}
              onChange={(e) => setChassisInspection(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="فحص 4 جيد — كرت أبيض كامل">فحص 4 جيد — كرت أبيض كامل</option>
              <option value="فحص 3 جيد / قصعة رأس">فحص 3 جيد / قصعة رأس بطانة</option>
              <option value="فحص 2 جيد / دقة شاصي">فحص 2 جيد / ضربة بنكيت</option>
              <option value="فحص كرت أبيض وكالة معتمد">فحص كرت أبيض وكالة معتمد</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              القسط التقديري (د.أ/شهر)
            </label>
            <input
              type="number"
              value={monthlyInstallment}
              onChange={(e) => setMonthlyInstallment(Number(e.target.value))}
              className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={warrantyIncluded}
                onChange={(e) => setWarrantyIncluded(e.target.checked)}
                className="rounded border-slate-400 text-emerald-600"
              />
              <span>إبراز ميزة الكفالة المجانية</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── THE PRINTABLE A4 SHEET PREVIEW ── */}
      <div className="flex justify-center">
        <div
          id="sticker-printable-sheet"
          className="w-full max-w-[210mm] bg-white text-slate-900 border-4 border-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between"
          style={{ minHeight: '290mm' }}
        >
          {/* Header Bar */}
          <div>
            <div className="flex items-center justify-between pb-6 border-b-4 border-slate-900">
              <div className="flex items-center gap-4">
                {dealerLogo ? (
                  <img src={dealerLogo} alt={dealerName} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-900" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl">
                    <Building2 className="w-9 h-9" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {dealerName}
                  </h1>
                  <p className="text-xs font-bold text-slate-600 mt-0.5 flex items-center gap-1.5">
                    <span>معرض مرخص ومعتمد لدى منصة كارس جو</span>
                    <span>•</span>
                    <span className="font-mono">{dealerPhone}</span>
                  </p>
                </div>
              </div>

              <div className="text-left font-mono">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300">
                  سيارة مفحوصة وموثقة ✓
                </span>
                <p className="text-[10px] text-slate-500 mt-1">JO CARS VERIFIED LOT</p>
              </div>
            </div>

            {/* Vehicle Title & Model Banner */}
            <div className="my-6 p-6 rounded-2xl bg-slate-100 border-2 border-slate-300 text-center">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500 block mb-1">
                سنة الصنع والموديل
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                {selectedCar.brand?.nameAr} {selectedCar.model?.nameAr} {selectedCar.year}
              </h2>
              <p className="text-sm font-bold text-slate-600 mt-1">
                وارد حرة الزرقاء / جاهزة للترخيص ونقل الملكية الفوري
              </p>
            </div>

            {/* Key Technical Specs Grid */}
            <div className="grid grid-cols-3 gap-3 my-4 text-center">
              <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                <Gauge className="w-6 h-6 text-slate-700 mx-auto mb-1" />
                <span className="text-[11px] text-slate-500 block">عداد المسافة</span>
                <strong className="text-lg font-black text-slate-900">
                  {selectedCar.kilometers?.toLocaleString()} كم
                </strong>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                <Fuel className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] text-slate-500 block">نوع الوقود / المحرك</span>
                <strong className="text-lg font-black text-slate-900">
                  {selectedCar.fuelType === 'HYBRID'
                    ? 'هايبرد (Hybrid)'
                    : selectedCar.fuelType === 'ELECTRIC'
                    ? 'كهرباء 100%'
                    : 'بنزين اقتصادي'}
                </strong>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                <Calendar className="w-6 h-6 text-slate-700 mx-auto mb-1" />
                <span className="text-[11px] text-slate-500 block">الموقع</span>
                <strong className="text-lg font-black text-slate-900">
                  {selectedCar.city?.nameAr || 'عمان'}
                </strong>
              </div>
            </div>

            {/* Jordanian Inspection Seal Box */}
            <div className="my-5 p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-emerald-800 uppercase block">
                    الفحص الفني للشاصي والهيكل (Jordan Inspection)
                  </span>
                  <h4 className="text-lg font-black text-emerald-950">
                    {chassisInspection}
                  </h4>
                </div>
              </div>

              {warrantyIncluded && (
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black shrink-0 shadow">
                  شاملة كفالة الهايبرد والبطارية
                </div>
              )}
            </div>

            {/* Price & Monthly Financing Hero */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="p-6 rounded-2xl bg-slate-900 text-white text-center">
                <span className="text-xs font-bold text-slate-300 block mb-1">
                  السعر النقدي المطلوب (كاش)
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
                  {selectedCar.price?.toLocaleString()} <span className="text-lg text-white">د.أ</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">شامل التخليص والتسجيل</span>
              </div>

              <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-center">
                <span className="text-xs font-bold text-amber-800 block mb-1">
                  التمويل البنكي والأقساط الميسرة
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono text-amber-900">
                  {monthlyInstallment} <span className="text-lg">د.أ / شهر</span>
                </div>
                <span className="text-[10px] text-amber-700 mt-1 block">بدفعة أولى 20% وأقساط حتى 5 سنوات</span>
              </div>
            </div>
          </div>

          {/* Bottom QR Code Scanner & Authentic Verification Box */}
          <div className="mt-6 pt-6 border-t-4 border-slate-900 flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Actual QR Code generated via @/lib/qrcode */}
              <div className="p-2 rounded-2xl bg-white border-2 border-slate-900 shadow-md shrink-0">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code Verification"
                    className="w-28 h-28 object-contain"
                  />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center bg-slate-100 text-xs">
                    جاري التوليد...
                  </div>
                )}
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-900">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  امسح الرمز بكاميرا هاتفك (Scan for Full Dossier)
                </span>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mt-1">
                  يفتح لك هذا الكود فوراً: الصور عالية الدقة بزاوية 360°، تقرير الفحص الفني، فاحص صحة البطارية (SOH)، ومطابقة القيمة العادلة المعتمدة في كارس جو.
                </p>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                  ID: {selectedCar.id} • www.cars-jo.com
                </span>
              </div>
            </div>

            {/* Official Inspection Stamp */}
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-emerald-600 p-1 flex items-center justify-center text-center rotate-[-10deg] shrink-0">
              <div className="w-full h-full rounded-full border border-emerald-600 flex flex-col items-center justify-center bg-emerald-50">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <span className="text-[8px] font-black uppercase text-emerald-900">معتمد للبيع</span>
                <span className="text-[7px] text-slate-600 font-bold">JO CARS LOT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
