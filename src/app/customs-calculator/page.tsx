'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Calculator, ShieldCheck, Zap, Fuel, Sparkles, AlertCircle, Info, RefreshCw, FileText } from 'lucide-react';

type FuelCategory = 'EV' | 'HYBRID' | 'PETROL';

export default function CustomsCalculatorPage() {
  const [fuelType, setFuelType] = useState<FuelCategory>('EV');
  const [year, setYear] = useState<number>(2024);
  const [engineCc, setEngineCc] = useState<number>(2000);
  const [kwPower, setKwPower] = useState<number>(150);
  const [estimatedValue, setEstimatedValue] = useState<number>(20000);

  // Calculations based on 2024-2026 Jordanian Customs Regulations
  const calculateFees = () => {
    let specialTaxRate = 0;
    let salesTaxRate = 0.16; // Standard 16% sales tax on top
    let customsFeeRate = 0.05; // Standard 5% customs duty
    let weightTax = 0;
    
    // Age depreciation discount allowance (Max 5 years)
    const age = Math.max(0, 2026 - year);
    const ageDiscount = Math.min(0.25, age * 0.05);
    const adjustedValue = estimatedValue * (1 - ageDiscount);

    let annualLicensingFee = 150;
    let compulsoryInsurance = 100;

    if (fuelType === 'EV') {
      // EV Jordan Tariffs — flat 27% special tax (amended June 2025)
      specialTaxRate = 0.27;
      weightTax = 250; // Electric vehicle weight tax
      annualLicensingFee = 80;
      compulsoryInsurance = 85;
    } else if (fuelType === 'HYBRID') {
      // Hybrid Jordan Tariffs — flat 39% special tax (amended June 2025)
      specialTaxRate = 0.39;
      weightTax = 150;
      annualLicensingFee = engineCc <= 2000 ? 130 : 250;
      compulsoryInsurance = engineCc <= 2000 ? 105 : 130;
    } else {
      // Petrol / Diesel (ICE) — flat 51% special tax (amended June 2025)
      specialTaxRate = 0.51;
      weightTax = 100;
      annualLicensingFee = 120;
      compulsoryInsurance = 92;
    }

    const customsDuty = adjustedValue * customsFeeRate;
    const specialTax = (adjustedValue + customsDuty) * specialTaxRate;
    const salesTax = (adjustedValue + customsDuty + specialTax) * salesTaxRate;
    
    // Add weight tax and fixed stamp fees
    const totalCustomsAndTaxes = Math.round(customsDuty + specialTax + salesTax + weightTax + 100); // 100 stamps
    
    // Registration & Plates
    const totalRegistration = Math.round(annualLicensingFee + compulsoryInsurance + 150); // 150 registration/plates/inspection

    return {
      adjustedValue: Math.round(adjustedValue),
      customsDuty: Math.round(customsDuty),
      specialTax: Math.round(specialTax),
      salesTax: Math.round(salesTax),
      weightTax,
      totalCustomsAndTaxes,
      annualLicensingFee,
      compulsoryInsurance,
      totalRegistration,
      grandTotal: totalCustomsAndTaxes + totalRegistration,
      specialTaxPercent: Math.round(specialTaxRate * 100),
    };
  };

  const results = calculateFees();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans dir-rtl">
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Banner Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
            <Calculator className="w-4 h-4" />
            حاسبة التخمين الرسمية 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            حاسبة الجمارك والترخيص الأردنية 
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            احسب التكلفة التقديرية لجمارك ورسوم ترخيص وتأمين سيارتك (كهرباء، هايبرد، بنزين) وفقاً للتعريفة الجمركية والترخيص المعمول بها في الأردن.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Form */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              مواصفات السيارة
            </h2>

            {/* Fuel Type selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">نوع المحرك / الوقود</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFuelType('EV')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    fuelType === 'EV'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10 font-bold'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Zap className="w-6 h-6 mb-1" />
                  <span>كهرباء (EV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFuelType('HYBRID')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    fuelType === 'HYBRID'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10 font-bold'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <RefreshCw className="w-6 h-6 mb-1" />
                  <span>هايبرد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFuelType('PETROL')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    fuelType === 'PETROL'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10 font-bold'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Fuel className="w-6 h-6 mb-1" />
                  <span>بنزين / ديزل</span>
                </button>
              </div>
            </div>

            {/* Estimated CIF Value */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-300">القيمة التقديرية للسيارة (JOD)</label>
                <span className="text-emerald-400 font-bold text-lg">{estimatedValue.toLocaleString()} د.أ</span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="1000"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>5,000 د.أ</span>
                <span>50,000 د.أ</span>
                <span>100,000 د.أ</span>
              </div>
            </div>

            {/* EV specific inputs */}
            {fuelType === 'EV' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">قوة المحرك (كيلوواط - kW)</label>
                <input
                  type="number"
                  value={kwPower}
                  onChange={(e) => setKwPower(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="مثال: 150 kW"
                />
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-emerald-400" />
                  ضريبة خاصة موحدة 27% لجميع السيارات الكهربائية وفق تعديل التعرفة الخاصة (حزيران 2025). يُمنع استيراد السيارات الكهربائية الأقدم من 3 سنوات.
                </p>
              </div>
            )}

            {/* Engine CC inputs */}
            {fuelType !== 'EV' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">سعة المحرك (CC)</label>
                <input
                  type="number"
                  value={engineCc}
                  onChange={(e) => setEngineCc(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="مثال: 2000 CC"
                />
              </div>
            )}

            {/* Year selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">سنة الصنع</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              >
                {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((y) => (
                  <option key={y} value={y}>
                    موديل {y}
                  </option>
                ))}
              </select>
            </div>

            {/* EV import age ban warning */}
            {fuelType === 'EV' && year <= 2023 && (
              <div className="mb-4 flex items-start gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>
                  <strong>ممنوع الاستيراد:</strong> السيارات الكهربائية الأقدم من 3 سنوات (موديل قبل {new Date().getFullYear() - 3}) لا يجوز التخليص الجمركي عليها في الأردن وفق تعليمات 2025.
                </span>
              </div>
            )}
          </div>

          {/* Detailed Calculations Output */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                <FileText className="w-5 h-5 text-emerald-400" />
                تفاصيل الرسوم الجمركية والترخيص
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">رسوم الجمارك الأساسية (5%)</span>
                  <span className="font-semibold text-white">{results.customsDuty.toLocaleString()} د.أ</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">الضريبة الخاصة ({results.specialTaxPercent}%)</span>
                  <span className="font-semibold text-amber-400">{results.specialTax.toLocaleString()} د.أ</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">ضريبة المبيعات العامة (16%)</span>
                  <span className="font-semibold text-white">{results.salesTax.toLocaleString()} د.أ</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">ضريبة الوزن وطوابع جمركية</span>
                  <span className="font-semibold text-white">{(results.weightTax + 100).toLocaleString()} د.أ</span>
                </div>

                <div className="flex justify-between items-center py-3 bg-emerald-500/10 px-4 rounded-xl text-emerald-400 font-bold border border-emerald-500/20">
                  <span>إجمالي رسوم الجمارك والضرائب</span>
                  <span className="text-lg">{results.totalCustomsAndTaxes.toLocaleString()} د.أ</span>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-slate-400">رسوم الترخيص السنوي (سير واقتناء)</span>
                    <span className="font-semibold text-white">{results.annualLicensingFee.toLocaleString()} د.أ</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-slate-400">التأمين الإلزامي (ضد الغير) ورسوم لوحات</span>
                    <span className="font-semibold text-white">{(results.compulsoryInsurance + 150).toLocaleString()} د.أ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="bg-emerald-600 rounded-2xl p-6 text-white text-center shadow-xl shadow-emerald-900/30">
                <span className="text-xs uppercase tracking-wider font-semibold opacity-90 block mb-1">المجموع الكلي للتخليص والترخيص</span>
                <span className="text-4xl font-black">{results.grandTotal.toLocaleString()} د.أ</span>
                <p className="text-xs opacity-80 mt-2">تشمل الجمارك، والضريبة الخاصة، ورسوم الترخيص والتأمين السنوي</p>
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <span>ملاحظة: هذه الحسابات تقديرية وتستند إلى التعرفة الخاصة المعدلة (حزيران 2025) وتعريفات دائرة الجمارك الأردنية وإدارة الترخيص. التخمين النهائي يخضع لمعاينة دائرة الجمارك.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
