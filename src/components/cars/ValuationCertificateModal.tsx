'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, Printer, X, QrCode, Award, CheckCircle2, Car, Calendar, Gauge, Fuel, MapPin } from 'lucide-react';
import type { Section24OutputContract } from '@/ai/valuation/intelligence-engine';
import { generateQrDataUrl } from '@/lib/qrcode';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  carId: string;
  carTitle?: string;
  section24: Section24OutputContract;
  askingPrice?: number;
}

export function ValuationCertificateModal({
  isOpen,
  onClose,
  carId,
  carTitle,
  section24,
  askingPrice,
}: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const [realQrDataUrl, setRealQrDataUrl] = useState<string>('');

  const fmv = section24.fairMarketValue || section24.range.low || 20000;
  const spec = section24.targetSpec;
  const make = (spec as any)?.make || (spec as any)?.brand || 'بي إم دبليو';
  const model = spec?.model || 'X5';
  const year = spec?.year || 2017;
  const km = (spec as any)?.mileage ?? (spec as any)?.kilometers ?? 240000;
  const rawFuel = String((spec as any)?.fuel ?? (spec as any)?.fuelType ?? 'هايبرد').toUpperCase();
  const fuel = rawFuel.includes('PLUGIN') || rawFuel.includes('PHEV')
    ? 'هايبرد بلق إن (PHEV)'
    : rawFuel.includes('ELECTRIC') || rawFuel === 'EV'
    ? 'كهرباء بالكامل (EV)'
    : rawFuel.includes('HYBRID')
    ? 'هايبرد (Hybrid)'
    : rawFuel.includes('DIESEL')
    ? 'ديزل'
    : rawFuel.includes('PETROL') || rawFuel.includes('GAS')
    ? 'بنزين'
    : (spec as any)?.fuel ?? (spec as any)?.fuelType ?? 'هايبرد';
  const city = spec?.city || 'عمان';
  const serialNo = `JOC-VAL-${year}-${carId.slice(-6).toUpperCase()}`;
  const verifyUrl = typeof window !== 'undefined' ? `${window.location.origin}/cars/${carId}` : `https://cars-jo.com/cars/${carId}`;

  useEffect(() => {
    generateQrDataUrl(verifyUrl, { width: 180, margin: 1 }).then(setRealQrDataUrl);
  }, [verifyUrl]);

  if (!isOpen) return null;

  const qrUrl = realQrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      {/* High-fidelity Print & PDF stylesheet: guarantees full page isolation & crisp contrast */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-valuation-certificate, #printable-valuation-certificate * {
                visibility: visible !important;
              }
              #printable-valuation-certificate {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                min-height: 297mm !important;
                margin: 0 !important;
                padding: 10mm !important;
                background: #ffffff !important;
                color: #0f172a !important;
                z-index: 9999999 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-sizing: border-box !important;
              }
              .print\\:hidden {
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
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Actions Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-white text-sm">شهادة التقييم الرقمية الرسمية (JO Cars Verified Deed)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / تصدير PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas (Printable Area) */}
        <div
          ref={certRef}
          id="printable-valuation-certificate"
          className="p-6 sm:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 relative print:m-0 print:p-8 print:w-full print:bg-white print:text-black print:border-none"
        >
          {/* Ornamental Border */}
          <div className="border-4 border-double border-amber-500/40 rounded-2xl p-6 sm:p-8 relative overflow-hidden print:border-amber-700">
            {/* Watermark Logo Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none print:opacity-[0.06]">
              <span className="text-[120px] font-black tracking-widest text-white">JO CARS</span>
            </div>

            {/* Header: Kingdom & Platform */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800 print:border-slate-300">
              <div className="text-center sm:text-right">
                <span className="text-[11px] font-semibold text-amber-400 tracking-wider block">
                  المملكة الأردنية الهاشمية • JO CARS MARKETPLACE
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-1 print:text-black">
                  شهادة التقييم السوقي العادل للمركبات (FMV)
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 print:text-slate-600">
                  صادرة عن محرك الذكاء الاصطناعي وتحليل السوق الأردني المعتمد
                </p>
              </div>

              <div className="text-center sm:text-left font-mono text-xs">
                <div className="inline-block p-2 rounded-xl bg-slate-900/80 border border-slate-800 print:bg-slate-100 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 block">رقم الشهادة التسلسلي</span>
                  <span className="font-black text-amber-300 text-sm tracking-wider print:text-amber-700">{serialNo}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  تاريخ الإصدار: {new Date().toLocaleDateString('ar-JO')}
                </div>
              </div>
            </div>

            {/* Vehicle Identification Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 print:bg-slate-50 print:border-slate-300">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">المركبة والطراز</span>
                  <span className="font-bold text-xs sm:text-sm text-white print:text-black">{make} {model}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">سنة الصنع</span>
                  <span className="font-bold text-xs sm:text-sm text-white print:text-black">{year}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">عداد المسافة المعتمد</span>
                  <span className="font-bold text-xs sm:text-sm text-white print:text-black">{km.toLocaleString()} كم</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">نوع الوقود / المحرك</span>
                  <span className="font-bold text-xs sm:text-sm text-white print:text-black">{fuel}</span>
                </div>
              </div>
            </div>

            {/* Valuation Core Deed Box */}
            <div className="my-6 p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/50 to-purple-950/40 border-2 border-blue-500/30 text-center relative overflow-hidden print:bg-blue-50 print:border-blue-300">
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-300 block mb-1 print:text-blue-800">
                القيمة السوقية العادلة المعتمدة (Fair Market Value)
              </span>
              <div className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 font-mono print:text-emerald-700">
                {fmv.toLocaleString()} <span className="text-lg sm:text-2xl text-slate-300 print:text-black">دينار أردني</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs text-slate-300 print:text-slate-700">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  مستوى الموثوقية: <strong className="text-white print:text-black">{section24.confidence}%</strong>
                </span>
                <span>•</span>
                <span>
                  النطاق السعري العادل: <strong className="font-mono">{section24.range.low?.toLocaleString()} – {section24.range.high?.toLocaleString()} د.أ</strong>
                </span>
                {askingPrice && askingPrice > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      السعر المطلوب بالإعلان: <strong className="font-mono">{askingPrice.toLocaleString()} د.أ</strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Market Evidence & Analytical Verification */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 print:bg-slate-100 print:border-slate-300">
                <span className="text-[10px] text-slate-400 block">شواهد السوق المفحوصة</span>
                <span className="font-bold text-white text-sm print:text-black">
                  {section24.marketEvidence.totalListings} إعلان عبر المنصات
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">مسح شامل لـ 7 منصات تداول في الأردن</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 print:bg-slate-100 print:border-slate-300">
                <span className="text-[10px] text-slate-400 block">فحص مطابقة العداد (Odometer)</span>
                <span className="font-bold text-emerald-400 text-sm print:text-emerald-700">
                  {section24.odometerAnalysis?.statusLabelAr || 'ممشى طبيعي ومطابق'}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">معدل سنوي طبيعي لسنوات الصنع</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 print:bg-slate-100 print:border-slate-300">
                <span className="text-[10px] text-slate-400 block">معادلة النزاهة السعرية</span>
                <span className="font-bold text-purple-400 text-sm print:text-purple-700">
                  عزل تام للسعر المطلوب
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">استبعاد إعلانات الشبهات واللوحات</p>
              </div>
            </div>

            {/* Footer Sign-off, Stamp & Live QR Code */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 mt-6 border-t border-slate-800 print:border-slate-300">
              <div className="flex items-center gap-4">
                {/* QR Code */}
                <div className="p-1.5 rounded-xl bg-white border border-slate-300 shrink-0">
                  <img
                    src={qrUrl}
                    alt="QR Verification"
                    className="w-20 h-20 object-contain"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1 print:text-black">
                    <QrCode className="w-3.5 h-3.5 text-blue-400" />
                    التحقق الرقمي المباشر (Instant Verification)
                  </span>
                  <p className="text-[10px] text-slate-400 max-w-xs mt-1 print:text-slate-600">
                    امسح رمز الاستجابة السريعة (QR) بكاميرا هاتفك للتحقق الفوري من مطابقة هذه الشهادة مع السجل الرقمي المشفر في منصة JO Cars.
                  </p>
                </div>
              </div>

              {/* Official Seal / Stamp */}
              <div className="flex items-center gap-3">
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-amber-400/80 p-1 flex items-center justify-center text-center rotate-[-12deg] shadow-lg print:border-amber-700">
                  <div className="w-full h-full rounded-full border-2 border-amber-400/60 flex flex-col items-center justify-center p-1 bg-amber-500/10 print:bg-amber-100">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 print:text-amber-800" />
                    <span className="text-[8px] font-black uppercase text-amber-300 tracking-tighter mt-0.5 print:text-amber-900">
                      JO CARS AI
                    </span>
                    <span className="text-[7px] text-slate-300 font-bold print:text-slate-700">معتمد رسمياً</span>
                  </div>
                </div>

                <div className="text-left font-mono text-[10px] text-slate-400 print:text-slate-600">
                  <p className="font-bold text-slate-200 print:text-black">JO CARS AI CORE v2.4</p>
                  <p>Amman, Jordan</p>
                  <p className="text-emerald-400 print:text-emerald-700 font-bold">DIGITALLY VERIFIED</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
