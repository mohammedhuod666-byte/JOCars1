'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Car, DollarSign, Calculator, Sparkles, CheckCircle2, ShieldCheck, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function SwapCalculatorPage() {
  const [carA, setCarA] = useState({ brand: 'تويوتا', model: 'كامري', year: 2019, price: 18000, km: 80000 });
  const [carB, setCarB] = useState({ brand: 'هيونداي', model: 'توسان', year: 2022, price: 23500, km: 35000 });
  
  const [isDealerSwap, setIsDealerSwap] = useState<boolean>(true); // Trade in with dealer vs normal person

  // Realistic Market Logic for Jordan
  // Dealers typically drop trade-in value by 10-15% for resale margin
  const dealerDiscountMargin = isDealerSwap ? 0.12 : 0; 
  const marketValueOfCarA = carA.price;
  const tradeInValueOfCarA = Math.round(marketValueOfCarA * (1 - dealerDiscountMargin));
  
  const rawDiff = carB.price - tradeInValueOfCarA;
  
  // Mileage difference adjustment: every 10,000km difference roughly equals 150 JOD impact
  const kmDiffAdjustment = Math.round(((carA.km - carB.km) / 10000) * 150);
  
  // Total recommended difference to pay
  const finalDifference = rawDiff; // Usually dealers don't care about the formula, just price diff. But let's show tradeInValueOfCarA explicitly

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between">
      <Header />
      <main className="container max-w-5xl mx-auto px-4 py-8 flex-1">
        
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 inline-flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> أداة البدل والمقاصة الأردنية 
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">حاسبة فرق البدل للسيارات (Trade-in)</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            احسب فرق البدل العادل في السوق الأردني سواء مع تاجر أو شخص عادي. تستند القيم الافتراضية إلى أسعار السوق الفعلية في الأردن: كامري 2019 بين 16,370 – 19,740 ديناراً، وكامري 2023 بين 23,200 – 23,700 ديناراً.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-200 dark:bg-gray-800 rounded-full p-1 border border-gray-300 dark:border-gray-700">
            <button onClick={() => setIsDealerSwap(false)} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${!isDealerSwap ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              بدل مباشر (مالك لمالك)
            </button>
            <button onClick={() => setIsDealerSwap(true)} className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${isDealerSwap ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              <Briefcase className="w-4 h-4" /> بدل مع تاجر / معرض
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card p-5 border-2 border-blue-200 dark:border-blue-500/30 bg-blue-50/20 dark:bg-blue-500/5 shadow-lg">
            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 font-bold">
              <Car className="w-5 h-5" /> <h2>سيارتك الحالية للتنازل (أ)</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">سعر السوق لسيارتك (البيع الكاش)</label>
                <input type="number" value={carA.price} onChange={(e) => setCarA({ ...carA, price: Number(e.target.value) })} className="input mt-1 text-base font-black text-blue-700 dark:text-blue-400" />
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-center text-xs text-blue-800 dark:text-blue-300">
                  <span>قيمة التثمين الفعلية {isDealerSwap && '(بعد خصم هامش المعرض)'}:</span>
                  <span className="font-black text-sm">{tradeInValueOfCarA.toLocaleString('ar-JO')} د.أ</span>
                </div>
                {isDealerSwap && <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">* المعارض تخصم عادة 10% إلى 15% من السعر لتغطية المخاطرة وهامش الربح.</p>}
              </div>
            </div>
          </div>

          <div className="card p-5 border-2 border-purple-200 dark:border-purple-500/30 bg-purple-50/20 dark:bg-purple-500/5 shadow-lg">
            <div className="flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400 font-bold">
              <Car className="w-5 h-5" /> <h2>السيارة المستهدفة للبدل (ب)</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">سعر الكاش المعروض للسيارة (ب)</label>
                <input type="number" value={carB.price} onChange={(e) => setCarB({ ...carB, price: Number(e.target.value) })} className="input mt-1 text-base font-black text-purple-700 dark:text-purple-400" />
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
                 <p className="text-[10px] text-purple-800 dark:text-purple-300 leading-relaxed">
                   يفترض هذا السعر أن السيارة (ب) لا تتضمن أي رفع إضافي لسعرها لمجرد أنها للبدل. في الأردن، البعض يرفع السعر 5% عند البدل.
                 </p>
              </div>
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-2xl rounded-3xl border border-indigo-500/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-1">
                <ArrowLeftRight className="w-4 h-4" />
                صافي فرق البدل المنطقي للدفع
              </div>
              <h3 className="text-4xl font-black text-emerald-400">
                {finalDifference > 0 ? `${finalDifference.toLocaleString('ar-JO')} د.أ` : finalDifference < 0 ? `تسترد: ${Math.abs(finalDifference).toLocaleString('ar-JO')} د.أ` : 'بدل رأس برأس (0 د.أ)'}
              </h3>
              <p className="text-xs text-slate-300 mt-2 max-w-lg leading-relaxed">
                * فرق الدفع = (سعر السيارة المستهدفة) - (قيمة التثمين لسيارتك). {isDealerSwap && 'يتضمن ذلك خصم المعرض التقديري لسيارتك.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <Link href="/cars" className="btn btn-emerald px-6 py-3 text-sm font-bold text-center shadow-lg shadow-emerald-500/20">تصفح السيارات المتاحة للبدل</Link>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
