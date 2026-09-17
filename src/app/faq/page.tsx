'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'كيف أنشر إعلان سيارة؟',
    a: 'سجل الدخول ثم اضغط «بيع سيارتك» واتبع 4 خطوات: المعلومات الأساسية، الفحص والجمرك، الصور والفيديو، السعر والموقع. الإعلان يراجَع من الإدارة ثم يُنشر.',
  },
  {
    q: 'كم تبلغ جمارك السيارات في الأردن (2026)؟',
    a: 'حسب التعرفة الخاصة المعدلة (حزيران 2025): كهرباء 27%، هايبرد 39%، بنزين/ديزل 51%، مع خصم عمر 5% سنوياً حتى 25% وضريبة مبيعات 16%. استخدم حاسبة الجمارك بأي إعلان لحساب دقيق حسب نوع الوقود.',
  },
  {
    q: 'كيف أتحقق من سعر عادل لسيارة؟',
    a: 'كل إعلان فيه قسم «تحليل وتقييم الذكاء الاصطناعي» يقارن السعر بمتوسط السوق من إعلانات الموقع والسوق المفتوح مع نسبة ثقة ومصادر. كما يمكنك تجربة مستشار السيارات (car-finder) ومؤشر السوق.',
  },
  {
    q: 'ما هو الفحص المعتمد؟',
    a: 'شارة تمنحها الإدارة للإعلانات المفحوصة بمراكز معتمدة. التاجر يصرّح بمركز وتاريخ الفحص من لوحته، والإدارة تعتمد الشارة بعد المراجعة.',
  },
  {
    q: 'كيف أتواصل مع البائع؟',
    a: 'من صفحة الإعلان: اتصال مباشر، واتساب، أو رسائل الموقع. ومن أي بروفايل: زر «تواصل» يفتح محادثة مباشرة.',
  },
  {
    q: 'كيف أوثّق حساب التاجر الخاص بي؟',
    a: 'من لوحة التاجر اضغط «طلب توثيق الحساب» وأضف ملاحظاتك (السجل التجاري مثلاً). تراجع الإدارة الطلب من صفحة اعتماد التجار وتمنح شارة «موثّق».',
  },
  {
    q: 'هل يمكنني البدل بسيارتي؟',
    a: 'نعم — فعّل خيار «قابل للبدل» عند النشر، واستخدم حاسبة البدل والمقاصة لحساب فرق السعر العادل.',
  },
  {
    q: 'كيف أتابع سيارة أو سعراً معيناً؟',
    a: 'احفظ السيارة بالمفضلة ليصلك تنبيه عند انخفاض سعرها، وأنشئ تنبيه سعر من صفحة تنبيهات الأسعار ليصلك جديد المطابق لميزانيتك.',
  },
  {
    q: 'ما هي خدمات التاجر (معرض)؟',
    a: 'غلاف وشعار وصورة شخصية للمعرض، إحصائيات مشاهدات واستفسارات، إدارة مخزون، طلبات تمييز، استيراد CSV جماعي، ستوري 24 ساعة، تقرير أداء PDF، وإدارة العملاء المحتملين.',
  },
  {
    q: 'كيف أبلّغ عن إعلان مخالف؟',
    a: 'من صفحة الإعلان زر البلاغ، أو من التعليقات، وتراجع الإدارة البلاغات من لوحة التحكم.',
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="container-custom max-w-3xl mx-auto px-4 py-8 flex-1">
        <div className="text-center mb-8">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1.5 mb-3">
            <HelpCircle className="w-3.5 h-3.5" /> الأسئلة الشائعة
          </span>
          <h1 className="text-3xl font-extrabold">عندك سؤال؟ عندنا الجواب</h1>
        </div>

        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={i} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 p-4 text-right">
                <span className="text-sm font-bold">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <p className="px-4 pb-4 text-sm text-slate-400 leading-relaxed">{f.a}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 p-6 text-center">
          <p className="font-bold mb-1">ما لقيت جوابك؟</p>
          <p className="text-xs text-slate-400 mb-4">اسأل المساعد الذكي أو راسل الدعم مباشرة</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Link href="/ai" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all">اسأل المساعد الذكي ✨</Link>
            <Link href="/contact" className="px-5 py-2.5 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700 transition-all flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> تواصل معنا
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
