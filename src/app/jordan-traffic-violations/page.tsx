'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ShieldAlert, Calculator, Car, FileText, CheckCircle2, AlertTriangle, Sparkles, DollarSign, Award, Clock, MapPin, Zap, AlertCircle } from 'lucide-react';

// Real traffic violations from the updated Jordanian Traffic Law (2023-2024)
const TRAFFIC_VIOLATIONS = [
  { id: 'v1', title: 'تجاوز الإشارة الضوئية الحمراء', fine: 250, prison: '1 - 2 شهر', description: 'تجاوز الإشارة الضوئية الحمراء (مخالفة خطيرة)' },
  { id: 'v2', title: 'استخدام الهاتف المحمول أثناء القيادة', fine: 50, prison: 'لا يوجد', description: 'التحدث بالهاتف أو الانشغال به أثناء القيادة' },
  { id: 'v3', title: 'عدم ارتداء حزام الأمان', fine: 20, prison: 'لا يوجد', description: 'عدم وضع حزام الأمان للسائق أو الراكب الأمامي' },
  { id: 'v4', title: 'تجاوز السرعة المقررة (أقل من 10 كم/س)', fine: 15, prison: 'لا يوجد', description: 'تجاوز السرعة المقررة بأقل من 10 كم/س' },
  { id: 'v5', title: 'تجاوز السرعة المقررة (10 - 20 كم/س)', fine: 30, prison: 'لا يوجد', description: 'تجاوز السرعة المقررة بـ 10 وحتى 20 كم/س' },
  { id: 'v6', title: 'تجاوز السرعة المقررة (20 - 30 كم/س)', fine: 50, prison: 'لا يوجد', description: 'تجاوز السرعة المقررة بـ 20 وحتى 30 كم/س' },
  { id: 'v6b', title: 'تجاوز السرعة المقررة (أكثر من 30 كم/س)', fine: 100, prison: '1 - 3 أشهر', description: 'تجاوز السرعة المقررة بأكثر من 30 كم/س (حجز رخصة القيادة)' },
  { id: 'v7', title: 'القيادة المتهورة (التفحيط والاستعراض)', fine: 250, prison: '1 - 2 شهر', description: 'قيادة المركبة بصورة متهورة أو استعراضية' },
  { id: 'v8', title: 'القيادة عكس السير (في شارع مفصول بجزيرة)', fine: 250, prison: '1 - 2 شهر', description: 'القيادة بعكس اتجاه السير في شارع مفصول بجزيرة وسطية' },
  { id: 'v9', title: 'تغيير المسرب بشكل مفاجئ', fine: 50, prison: 'لا يوجد', description: 'تغيير المسرب بشكل مفاجئ دون إعطاء إشارة' },
  { id: 'v10', title: 'وقوف مزدوج أو إعاقة حركة السير', fine: 20, prison: 'لا يوجد', description: 'الوقوف المزدوج أو التوقف الذي يعيق حركة السير' },
  { id: 'v11', title: 'القيادة تحت تأثير الكحول أو المخدرات', fine: 500, prison: '1 - 3 أشهر', description: 'حجز المركبة وسحب الرخصة فوراً' },
  { id: 'v12', title: 'إلقاء النفايات من المركبة', fine: 50, prison: 'لا يوجد', description: 'إلقاء أي مواد أو نفايات من نوافذ المركبة' },
  { id: 'v13', title: 'انتهاء رخصة الاقتناء (الترخيص)', fine: 35, prison: 'لا يوجد', description: 'القيادة برخصة مركبة منتهية الصلاحية لأكثر من 6 أشهر' },
  { id: 'v14', title: 'تغيير ملامح المركبة (لون/هيكل) دون ترخيص', fine: 75, prison: 'لا يوجد', description: 'تغيير لون أو شكل أو محرك المركبة دون إبلاغ دائرة الترخيص' },
  { id: 'v15', title: 'استخدام مواقف ذوي الاحتياجات الخاصة', fine: 50, prison: 'لا يوجد', description: 'الوقوف في المواقف المخصصة للأشخاص ذوي الإعاقة' },
  { id: 'v16', title: 'القيادة دون رخصة قيادة', fine: 150, prison: 'لا يوجد', description: 'قيادة المركبة دون حمل رخصة قيادة سارية المفعول' },
  { id: 'v17', title: 'القيادة دون تأمين إجباري', fine: 40, prison: 'لا يوجد', description: 'القيادة بمركبة غير مؤمنة إجبارياً' },
  { id: 'v18', title: 'التظليل العشوائي للنوافذ', fine: 35, prison: 'لا يوجد', description: 'تظليل نوافذ المركبة دون ترخيص' },
];

export default function JordanTrafficViolationsPage() {
  const [engineCc, setEngineCc] = useState<number>(2000);
  const [fuelType, setFuelType] = useState<'PETROL' | 'HYBRID' | 'EV'>('PETROL');
  
  // Real customs & licensing fees for 2024-2026 in Jordan
  const calculateLicenseFee = () => {
    let baseFee = 50;
    if (fuelType === 'EV') {
      baseFee = 35; // EV fees are reduced
    } else if (fuelType === 'HYBRID') {
      if (engineCc <= 1600) baseFee = 60;
      else if (engineCc <= 2000) baseFee = 90;
      else if (engineCc <= 2500) baseFee = 150;
      else baseFee = 250;
    } else {
      // Petrol/Diesel
      if (engineCc <= 1000) baseFee = 45;
      else if (engineCc <= 1600) baseFee = 75;
      else if (engineCc <= 2000) baseFee = 120;
      else if (engineCc <= 2500) baseFee = 225;
      else if (engineCc <= 3000) baseFee = 250;
      else if (engineCc <= 4000) baseFee = 450;
      else baseFee = 600;
    }

    const inspectionFee = 15; // فحص فني إدارة السير
    // Real approximate third-party insurance fees in Jordan
    const mandatoryInsurance = fuelType === 'EV' ? 85 : engineCc <= 1600 ? 92 : engineCc <= 2000 ? 105 : engineCc <= 3000 ? 130 : 160;

    return {
      licenseFee: baseFee,
      inspectionFee,
      insuranceFee: mandatoryInsurance,
      total: baseFee + inspectionFee + mandatoryInsurance,
    };
  };

  const [selectedViolations, setSelectedViolations] = useState<Set<string>>(new Set());

  const toggleViolation = (id: string) => {
    const newSet = new Set(selectedViolations);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedViolations(newSet);
  };

  const licenseResult = calculateLicenseFee();
  const totalFines = Array.from(selectedViolations).reduce((total, id) => {
    const v = TRAFFIC_VIOLATIONS.find(x => x.id === id);
    return total + (v?.fine || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between text-gray-900 dark:text-gray-100">
      <Header />

      <main className="container-custom max-w-5xl mx-auto px-4 py-8 flex-1">
        <div className="card p-6 sm:p-8 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white mb-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-50" />
          <div className="relative z-10">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 inline-flex items-center gap-1.5 mb-3">
              <ShieldAlert className="w-4 h-4" /> قانون السير الأردني المعدل 2024-2026 
            </span>
            <h1 className="text-2xl sm:text-4xl font-black mb-2">حاسبة ترخيص المركبات والمخالفات المرورية الواقعية</h1>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              احسب تكاليف الترخيص السنوي والتأمين الإجباري في الأردن. واستعرض قيمة المخالفات المرورية الحقيقية المسجلة حسب التعديلات القانونية الأخيرة لدائرة السير الأردنية.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section 1: License Renewal */}
          <div className="card p-6 space-y-5 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white">رسوم الترخيص والتأمين الحقيقية</h2>
                <p className="text-xs text-gray-500">مبنية على لوائح دائرة الترخيص الأردنية</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">نوع وقود المحرك</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setFuelType('EV')} className={`py-2 rounded-xl text-xs font-bold border transition-all ${fuelType === 'EV' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}> كهرباء</button>
                <button onClick={() => setFuelType('HYBRID')} className={`py-2 rounded-xl text-xs font-bold border transition-all ${fuelType === 'HYBRID' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}> هايبرد</button>
                <button onClick={() => setFuelType('PETROL')} className={`py-2 rounded-xl text-xs font-bold border transition-all ${fuelType === 'PETROL' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}> بنزين/ديزل</button>
              </div>
            </div>

            {fuelType !== 'EV' && (
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  سعة المحرك (CC): <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{engineCc} CC</span>
                </label>
                <input type="range" min="1000" max="6000" step="100" value={engineCc} onChange={(e) => setEngineCc(parseInt(e.target.value, 10))} className="w-full accent-emerald-500" />
              </div>
            )}

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 space-y-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>رسوم رخصة المركبة:</span>
                <span className="font-bold text-gray-900 dark:text-white">{licenseResult.licenseFee} د.أ</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>رسوم الفحص الفني:</span>
                <span className="font-bold text-gray-900 dark:text-white">{licenseResult.inspectionFee} د.أ</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>التأمين الإجباري (تقريبي):</span>
                <span className="font-bold text-gray-900 dark:text-white">{licenseResult.insuranceFee} د.أ</span>
              </div>
              <div className="pt-2 border-t border-emerald-500/20 flex justify-between items-center text-sm font-black text-emerald-700 dark:text-emerald-400">
                <span>الإجمالي المتوقع:</span>
                <span className="text-xl">{licenseResult.total} د.أ</span>
              </div>
            </div>
          </div>

          {/* Section 2: Real Traffic Violations */}
          <div className="card p-6 border border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white">قائمة المخالفات المرورية وقيمتها</h2>
                <p className="text-xs text-gray-500">اختر المخالفات لحساب المجموع التراكمي (أرقام حقيقية)</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[400px] custom-scrollbar">
              {TRAFFIC_VIOLATIONS.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => toggleViolation(v.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedViolations.has(v.id) 
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                    : 'border-gray-200 dark:border-gray-800 hover:border-amber-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${selectedViolations.has(v.id) ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                        {selectedViolations.has(v.id) && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{v.title}</h4>
                        <p className="text-[10px] text-gray-500 mt-1">{v.description}</p>
                        {v.prison !== 'لا يوجد' && (
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            عقوبة الحبس: {v.prison}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-black text-amber-600 flex-shrink-0">
                      {v.fine} د.أ
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20">
              <div className="flex justify-between items-center text-sm font-black text-amber-700 dark:text-amber-400">
                <span>إجمالي المخالفات المحددة:</span>
                <span className="text-2xl">{totalFines} د.أ</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
