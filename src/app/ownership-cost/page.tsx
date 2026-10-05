'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Wallet, Fuel, ShieldCheck, Wrench, TrendingDown, Info } from 'lucide-react';

const FUEL_LABELS: Record<string, string> = {
  PETROL: 'بنزين', DIESEL: 'ديزل', HYBRID: 'هايبرد', ELECTRIC: 'كهرباء',
};

export default function OwnershipCostPage() {
  const [price, setPrice] = useState(18000);
  const [fuelType, setFuelType] = useState('HYBRID');
  const [kmPerYear, setKmPerYear] = useState(20000);
  const [years, setYears] = useState(5);
  const [fuelPrice, setFuelPrice] = useState(0.9); // د.أ/لتر (قابل للتعديل)
  const [engineCC, setEngineCC] = useState(2000);

  const calc = useMemo(() => {
    // استهلاك تقديري لتر/100كم حسب الوقود والسعة
    let consumption = 8;
    if (fuelType === 'ELECTRIC') consumption = 0;
    else if (fuelType === 'HYBRID') consumption = 4.5;
    else if (fuelType === 'DIESEL') consumption = 6;
    else consumption = engineCC <= 1600 ? 7 : engineCC <= 2000 ? 8.5 : 11;

    const elecKwhPer100 = 18; // متوسط استهلاك الكهرباء
    const elecTariff = 0.113; // تعرفة EMRC الجزئية د.أ/ك.و.س (قابلة للتعديل من سعر الوقود؟ نثبتها)

    const fuelYear = fuelType === 'ELECTRIC'
      ? (kmPerYear / 100) * elecKwhPer100 * elecTariff
      : (kmPerYear / 100) * consumption * fuelPrice;

    // ترخيص سنوي تقديري (نفس منطق الحاسبة)
    const licenseYear = fuelType === 'ELECTRIC' ? 80 : fuelType === 'HYBRID' ? (engineCC <= 2000 ? 130 : 250) : 120;
    // تأمين إجباري + شامل تقديري
    const insuranceYear = 120 + price * 0.028;
    // صيانة تقديرية
    const maintPerKm = fuelType === 'ELECTRIC' ? 0.015 : fuelType === 'HYBRID' ? 0.03 : 0.045;
    const maintYear = kmPerYear * maintPerKm;
    // استهلاك القيمة (نسبة سنوية متناقصة)
    const depRate = 0.1;
    let remaining = price;
    let totalDep = 0;
    for (let i = 0; i < years; i++) { const d = remaining * depRate; totalDep += d; remaining -= d; }

    const yearlyOperating = fuelYear + licenseYear + insuranceYear + maintYear;
    const total = yearlyOperating * years + totalDep;
    return {
      consumption, fuelYear: Math.round(fuelYear), licenseYear: Math.round(licenseYear),
      insuranceYear: Math.round(insuranceYear), maintYear: Math.round(maintYear),
      yearlyOperating: Math.round(yearlyOperating), totalDep: Math.round(totalDep),
      total: Math.round(total), monthly: Math.round(total / Math.max(1, years * 12)),
      remaining: Math.round(remaining),
    };
  }, [price, fuelType, kmPerYear, years, fuelPrice, engineCC]);

  const bars = [
    { label: 'وقود/شحن', value: calc.fuelYear * years, color: 'from-amber-500 to-orange-500' },
    { label: 'ترخيص', value: calc.licenseYear * years, color: 'from-blue-500 to-indigo-500' },
    { label: 'تأمين', value: calc.insuranceYear * years, color: 'from-purple-500 to-violet-500' },
    { label: 'صيانة', value: calc.maintYear * years, color: 'from-rose-500 to-pink-500' },
    { label: 'نقص القيمة', value: calc.totalDep, color: 'from-slate-500 to-gray-500' },
  ];
  const maxBar = Math.max(...bars.map(b => b.value), 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="container-custom max-w-5xl mx-auto px-4 py-8 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5 mb-3">
            <Wallet className="w-3.5 h-3.5" /> حاسبة التكلفة الكاملة 
          </span>
          <h1 className="text-3xl font-extrabold mb-2">كم ستكلفك السيارة فعلاً؟</h1>
          <p className="text-sm text-slate-400">السعر المعلن ليس كل شيء — احسب الوقود والترخيص والتأمين والصيانة ونقص القيمة قبل الشراء</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-300">سعر الشراء (د.أ)</label>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value) || 0)} className="input mt-1 font-black text-emerald-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300">نوع الوقود</label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {Object.entries(FUEL_LABELS).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => setFuelType(k)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${fuelType === k ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300">ممشى سنوي (كم)</label>
                <input type="number" value={kmPerYear} onChange={e => setKmPerYear(Number(e.target.value) || 0)} className="input mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300">سنوات الاحتفاظ</label>
                <input type="number" value={years} min={1} max={15} onChange={e => setYears(Number(e.target.value) || 1)} className="input mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300">سعر لتر الوقود (د.أ) — عدّله حسب اليوم</label>
                <input type="number" step="0.01" value={fuelPrice} onChange={e => setFuelPrice(Number(e.target.value) || 0)} className="input mt-1" disabled={fuelType === 'ELECTRIC'} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300">سعة المحرك (CC)</label>
                <input type="number" value={engineCC} onChange={e => setEngineCC(Number(e.target.value) || 0)} className="input mt-1" disabled={fuelType === 'ELECTRIC'} />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 flex items-start gap-1"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> الأرقام تقديرية للاسترشاد (تعرفة الشحن 113 فلس، استهلاك ~{calc.consumption} لتر/100كم) وليست عرضاً رسمياً.</p>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-xl">
              <p className="text-xs opacity-90">التكلفة الشهرية الحقيقية (شامل نقص القيمة)</p>
              <p className="text-4xl font-black mt-1">{calc.monthly.toLocaleString('ar-JO')} د.أ<span className="text-sm font-normal">/شهر</span></p>
              <p className="text-xs opacity-80 mt-2">الإجمالي خلال {years} سنوات: {calc.total.toLocaleString('ar-JO')} د.أ • القيمة المتبقية: {calc.remaining.toLocaleString('ar-JO')} د.أ</p>
            </div>
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
              <h3 className="text-sm font-bold mb-4">تفصيل التكاليف ({years} سنوات)</h3>
              <div className="space-y-3">
                {bars.map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{b.label}</span><span className="font-bold text-slate-200">{b.value.toLocaleString('ar-JO')} د.أ</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-l ${b.color}`} style={{ width: `${Math.max(3, (b.value / maxBar) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950"><Fuel className="w-4 h-4 mx-auto text-amber-400 mb-1" /><p className="font-black text-sm">{calc.fuelYear.toLocaleString('ar-JO')}</p><p className="text-[10px] text-slate-500">وقود/سنة</p></div>
                <div className="p-2.5 rounded-xl bg-slate-950"><ShieldCheck className="w-4 h-4 mx-auto text-blue-400 mb-1" /><p className="font-black text-sm">{calc.licenseYear.toLocaleString('ar-JO')}</p><p className="text-[10px] text-slate-500">ترخيص/سنة</p></div>
                <div className="p-2.5 rounded-xl bg-slate-950"><ShieldCheck className="w-4 h-4 mx-auto text-purple-400 mb-1" /><p className="font-black text-sm">{calc.insuranceYear.toLocaleString('ar-JO')}</p><p className="text-[10px] text-slate-500">تأمين/سنة</p></div>
                <div className="p-2.5 rounded-xl bg-slate-950"><Wrench className="w-4 h-4 mx-auto text-rose-400 mb-1" /><p className="font-black text-sm">{calc.maintYear.toLocaleString('ar-JO')}</p><p className="text-[10px] text-slate-500">صيانة/سنة</p></div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <TrendingDown className="w-4 h-4 text-slate-500" />
                نقص القيمة التقديري: {calc.totalDep.toLocaleString('ar-JO')} د.أ خلال {years} سنوات (~10% سنوياً)
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
