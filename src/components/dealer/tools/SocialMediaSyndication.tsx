'use client';

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  CheckCircle2,
  Sparkles,
  Video,
  Instagram,
  Facebook,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface Props {
  dealerCars: any[];
  dealerName?: string;
  dealerPhone?: string;
  onShowToast: (msg: string) => void;
}

export function SocialMediaSyndication({
  dealerCars,
  dealerName = 'معرض السيارات المعتمد',
  dealerPhone = '0790000000',
  onShowToast,
}: Props) {
  const [selectedCarId, setSelectedCarId] = useState<string>(dealerCars[0]?.id || 'demo');
  const [activePlatform, setActivePlatform] = useState<'facebook' | 'instagram' | 'tiktok'>('facebook');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedCar = dealerCars.find((c) => c.id === selectedCarId) || {
    id: 'demo',
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

  const facebookPost = `🔥 فرصة اليوم لدى ${dealerName} 🔥
✨ ${selectedCar.brand?.nameAr} ${selectedCar.model?.nameAr} موديل ${selectedCar.year} بحالة الوكالة!
━━━━━━━━━━━━━━━━━━━━
📌 المواصفات الفنية:
• المحرك ونوع الوقود: هايبرد اقتصادي جداً فائق الاعتمادية
• عداد المسافة الحقيقي: ${selectedCar.kilometers?.toLocaleString()} كم فقط (مفحوص ومطابق)
• الفحص الفني: فحص 4 جيد كامل كرت أبيض معتمد
• الموقع: ${dealerName} - ${selectedCar.city?.nameAr || 'عمان'}

💰 السعر المطلوب نقداً: ${selectedCar.price?.toLocaleString()} دينار أردني
🏦 إمكانية التمويل البنكي حتى 80% بأقساط ميسرة!

📲 للمعاينة والاستفسار المباشر:
هاتف المعرض: ${dealerPhone}
معاينة الفحص الكامل وتفاصيل السيارة بالرابط: ${carUrl}

#سيارات_الأردن #حرة_الزرقاء #${selectedCar.brand?.nameAr}_الأردن #عمان #سيارات_للبيع`;

  const instagramCaption = `الجمال والاعتمادية في مكان واحد ✨
${selectedCar.brand?.nameAr} ${selectedCar.model?.nameAr} ${selectedCar.year} 🚘
عداد ${selectedCar.kilometers?.toLocaleString()} كم فقط | فحص 4 جيد كامل كرت أبيض 💎

📍 متوفرة الآن في صالة عرض ${dealerName}
السعر: ${selectedCar.price?.toLocaleString()} د.أ 
(مع إمكانية البدل وتسهيلات التمويل البنكي)

📞 للتواصل السريع: ${dealerPhone}
رابط تقرير الفحص والتقييم العادل في البايو أو تفضلوا بزيارتنا!

#سيارات #عمان #الاردن #cars_jo #${selectedCar.brand?.nameAr}`;

  const tiktokScript = `🎬 سكريبت فيديو تيك توك / ريلز مدته 30 ثانية لـ (${dealerName})

[00:00 - 00:05] الكاميرا: تصوير بانورامي سريع من مقدمة السيارة مع تشغيل الإضاءة النهارية.
الصوت: "يا هلا والله! إذا بتدوّر على سيارة تويوتا كامري هايبرد نظيفة من الآخر وما بدك تدفع عليها قرش صيانة، هاي اللقطة إلك اليوم!"

[00:05 - 00:15] الكاميرا: تقريب على العداد والمقصورة الداخلية الفاخرة وشاشة اللمس.
الصوت: "موديل 2022، قاطعة 48 ألف كم فقط فحص عداد أصلي، وفحص الشاصي 4 جيد كرت أبيض وكالة مع كفالة معتمدة!"

[00:15 - 00:25] الكاميرا: تصويرك وأنت واقف بجانب السيارة واللوحة.
الصوت: "معروضة بسعر ولا في الخيال: 19,500 دينار فقط، ومع تسهيلات أقساط بتبدأ من 245 دينار شهرياً!"

[00:25 - 00:30] الكاميرا: توجيه الشاشة نحو كرت المعرض أو لوحة الزجاج مع الـ QR.
الصوت: "زورونا اليوم في ${dealerName} أو رن علينا فوراً على ${dealerPhone} قبل ما تطير القطعة! نتشرف بالجميع!"`;

  const currentContent =
    activePlatform === 'facebook'
      ? facebookPost
      : activePlatform === 'instagram'
      ? instagramCaption
      : tiktokScript;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentContent);
      setCopiedKey(activePlatform);
      onShowToast(`تم نسخ نص ${activePlatform.toUpperCase()} بنجاح!`);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-pink-500/15 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm block">
              زر النشر السريع المتعدد لمنصات التواصل (One-Click Multi-Channel Syndication)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              توليد إعلانات احترافية منسقة بنقرة واحدة لفيسبوك وإنستغرام، وسكريبت فيديو تصويري لـ TikTok & Reels
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          توفير 45 دقيقة لكل سيارة
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Car Selector (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              اختر السيارة المراد نشرها
            </label>
            <select
              value={selectedCarId}
              onChange={(e) => setSelectedCarId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
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

          {/* Platform Tabs */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
              اختر منصة النشر المستهدفة
            </span>

            <button
              onClick={() => setActivePlatform('facebook')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                activePlatform === 'facebook'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Facebook className="w-4 h-4" />
                <span>إعلان فيسبوك والغروبات</span>
              </div>
              <span className="text-[10px] opacity-80">جاهز للنشر</span>
            </button>

            <button
              onClick={() => setActivePlatform('instagram')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                activePlatform === 'instagram'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-500 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                <span>إنستغرام وكاروسيل</span>
              </div>
              <span className="text-[10px] opacity-80">نص كابشن فاخر</span>
            </button>

            <button
              onClick={() => setActivePlatform('tiktok')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                activePlatform === 'tiktok'
                  ? 'bg-slate-900 text-white border-slate-700 shadow-md ring-1 ring-cyan-500'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                <span>سكريبت تيك توك / ريلز (30 ثانية)</span>
              </div>
              <span className="text-[10px] text-cyan-300">نص تصويري</span>
            </button>
          </div>
        </div>

        {/* Copy Box (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                النص المولد بالذكاء الاصطناعي الخاص بالمنصة
              </span>

              <button
                onClick={handleCopy}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
              >
                {copiedKey === activePlatform ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تم النسخ بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ النص كاملاً</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed mt-3 max-h-[360px] overflow-y-auto">
              {currentContent}
            </pre>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>منسق مع رقم هاتف معرضك ورابط فحص السيارة التفاعلي</span>
            <span className="text-emerald-500 font-bold">جاهز للنشر الفوري ✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}
