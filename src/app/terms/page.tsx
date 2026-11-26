import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  Scale,
  ShieldCheck,
  Car,
  Sparkles,
  Wallet,
  AlertTriangle,
  Gavel,
  ChevronRight,
  Clock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'شروط الاستخدام | JO Cars',
  description:
    'الشروط والأحكام القانونية المنظمة لاستخدام منصة JO Cars لبيع وشراء السيارات وتقييمها في المملكة الأردنية الهاشمية.',
};

const HIGHLIGHTS = [
  {
    icon: Scale,
    title: 'منصة وساطة شفافة',
    desc: 'نربط البائع بالمشتري مباشرة دون تدخل في الملكية.',
  },
  {
    icon: ShieldCheck,
    title: 'نزاهة الفحص والبيانات',
    desc: 'يُحظر التلاعب بالعداد أو إخفاء الحوادث الجوهرية.',
  },
  {
    icon: Wallet,
    title: 'ضمانات العربون عبر CliQ',
    desc: 'حجز موثق لمدة 24 ساعة وفق القانون المدني الأردني.',
  },
];

const SECTIONS = [
  {
    number: '01',
    icon: FileText,
    title: 'التعريفات ونطاق التطبيق',
    paragraphs: [
      'تنظم هذه الوثيقة العلاقة القانونية بين منصة «JO Cars» (ويُشار إليها لاحقاً بـ «المنصة») وجميع مستخدميها من زوار، بائعين أفراد، مشتركين، تجار سيارات، ومعارض معتمدة داخل المملكة الأردنية الهاشمية.',
      'يُعد استخدامك للموقع أو تطبيقات الهاتف أو إنشاء حساب أو نشر أي إعلان إقراراً صريحاً وملزماً بموافقتك الكاملة على هذه الشروط وعلى سياسة الخصوصية المرتبطة بها.',
    ],
  },
  {
    number: '02',
    icon: ShieldCheck,
    title: 'الأهلية وتسجيل الحسابات',
    bullets: [
      'يجب أن يكون المستخدم بالغاً للأهلية القانونية الكاملة (18 سنة شمسية فأكثر) لإبرام التصرفات القانونية وفق القوانين الأردنية.',
      'يلتزم المستخدم بتقديم بيانات صحيحة ومطابقة للواقع (الاسم، رقم الهاتف الأردني الفعال، والبريد الإلكتروني) وتحديثها فور أي تغيير.',
      'تخضع حسابات التجار والمعارض لمراجعة وتدقيق إداري خلال 24 ساعة؛ ويحق للمنصة طلب السجل التجاري أو رخصة المهن سارية المفعول قبل منح شارة التوثيق.',
      'يتحمل صاحب الحساب كامل المسؤولية القانونية عن جميع الأنشطة والإعلانات الصادرة من حسابه، ويلتزم بالحفاظ على سرية كلمة المرور ورموز التحقق (OTP).',
    ],
  },
  {
    number: '03',
    icon: Car,
    title: 'ضوابط الإعلانات ونزاهة الفحص',
    bullets: [
      'يجب أن تكون السيارة المعروضة حقيقية ومتوفرة فعلياً للبيع داخل المملكة الأردنية الهاشمية، مع صور حديثة وواضحة للمركبة نفسها دون تضليل.',
      'يُحظر تماماً التلاعب بقراءة عداد المسافات (العداد) أو إخفاء الأعطال الجوهرية أو تزوير تقارير الفحص الرباعي أو السباعي أو وصف حالة الشاصي والبطارية بشكل مخالف للحقيقة.',
      'يجب الإفصاح الصريح عن نوع الجمرك (مجمركة، حرة، إدخال مؤقت) وحالة الترخيص والتأمين وأي حجز أو رهن بنكي قائم على المركبة.',
      'تحتفظ إدارة المنصة بحق إزالة أي إعلان مخالف أو مكرر أو يحتوي على أسعار وهمية أو أرقام هواتف غير عائدة للمعلن دون إشعار مسبق.',
    ],
  },
  {
    number: '04',
    icon: Sparkles,
    title: 'خدمة التقييم الذكي بالذكاء الاصطناعي',
    paragraphs: [
      'تقدم JO Cars أدوات تحليل وتقييم أسعار السيارات بالذكاء الاصطناعي بالاعتماد على بيانات السوق الأردني والمواصفات المدخلة من المستخدم وحالة السوق السائدة.',
      'تُعد نتائج التقييم مؤشرات استرشادية تقديرية فقط للمساعدة في اتخاذ القرار، ولا تشكل تقييماً رسمياً ملزماً أو عرضاً للشراء أو ضماناً لسعر البيع الفعلي، والذي يتحدد نهائياً بعد المعاينة الميكانيكية والفحص الفني المباشر.',
    ],
  },
  {
    number: '05',
    icon: Wallet,
    title: 'حجز العربون الرقمي عبر نظام CliQ',
    bullets: [
      'عند تفعيل ميزة حجز المركبة بعربون عبر CliQ، يتم حجز الإعلان مؤقتاً للمشتري الجاد لمدة 24 ساعة لإتمام المعاينة والفحص في مراكز الفحص المعتمدة.',
      'يخضع العربون لأحكام القانون المدني الأردني: إذا نكل المشتري دون عذر مشروع أو عيب خفي غير معلن، تسري قواعد العربون المتفق عليها؛ أما إذا ثبت وجود عيب جوهري في الشاصي أو الماتور أو البطارية مخالف لما ورد في الإعلان، فيحق للمشتري استرداد العربون كاملاً.',
      'تعمل المنصة كأداة توثيق للحجز ولا تحتفظ بأموال المستخدمين كجهة مصرفية، وتتم التحويلات عبر القنوات البنكية الرسمية الخاضعة لرقابة البنك المركزي الأردني.',
    ],
  },
  {
    number: '06',
    icon: AlertTriangle,
    title: 'السلوك المحظور وحماية المنصة',
    bullets: [
      'يُحظر استخدام برامج السحب الآلي للبيانات (Scraping) أو محاولة اختراق الخوادم أو تعطيل الخدمة أو إرسال رسائل مزعجة (Spam) للمعلنين.',
      'يُمنع انتحال صفة موظفي JO Cars أو نشر محتوى مسيء أو مخل بالآداب العامة أو يتضمن احتيالاً مالياً.',
      'جميع التصاميم والشعارات والبرمجيات وقواعد البيانات الخاصة بـ JO Cars محمية بموجب قوانين الملكية الفكرية وحقوق النشر، ولا يجوز نسخها أو إعادة استغلالها تجارياً.',
    ],
  },
  {
    number: '07',
    icon: Gavel,
    title: 'حدود المسؤولية والقانون الواجب التطبيق',
    paragraphs: [
      'JO Cars هي منصة وساطة تقنية وإعلانية، ولا تُعد طرفاً في عقود البيع والشراء المبرمة بين البائع والمشتري ولا تضمن نقل الملكية في دائرة ترخيص السواقين والمركبات.',
      'ننصح جميع المشترين بإجراء فحص فني شامل لدى مركز فحص موثوق ومطابقة رقم الشاصي ورخصة المركبة قبل دفع أي مبالغ مالية.',
      'تخضع هذه الشروط وتُفسر وفقاً لقوانين المملكة الأردنية الهاشمية، وتختص محاكم العاصمة عمّان بالنظر في أي نزاع ينشأ عن تطبيقها.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07090d] text-white pb-24 lg:pb-16" dir="rtl">
      {/* Ambient top glow */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-[#111520] to-[#07090d]">
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[460px] h-[260px] bg-[#ffc640]/10 blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-10 relative z-10">
          <div className="flex items-center justify-between gap-3 mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#9ca3af] hover:text-[#ffc640] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span>العودة إلى الرئيسية</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] text-[#d1d5db]">
              <Clock className="w-3.5 h-3.5 text-[#ffc640]" />
              <span>آخر تحديث: نوفمبر 2026</span>
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#e3aa00] flex items-center justify-center shrink-0 shadow-lg shadow-[#ffc640]/20">
              <Scale className="w-6 h-6 sm:w-7 sm:h-7 text-[#080a0a]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-2">
                شروط الاستخدام والأحكام القانونية
              </h1>
              <p className="text-xs sm:text-sm text-[#9ca3af] leading-relaxed max-w-2xl">
                إطار واضح وعادل يحمي حقوق البائعين والمشترين والتجار على منصة JO Cars في المملكة الأردنية الهاشمية.
              </p>
            </div>
          </div>

          {/* 3 Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7">
            {HIGHLIGHTS.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#11141b]/85 border border-white/[0.08] flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-[#ffc640]/10 border border-[#ffc640]/20 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-[#ffc640]" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-white mb-0.5">{item.title}</h2>
                  <p className="text-[11px] text-[#9ca3af] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-4">
        {SECTIONS.map((section) => (
          <section
            key={section.number}
            className="rounded-3xl bg-[#11141b]/90 border border-white/[0.07] p-5 sm:p-7 hover:border-white/[0.14] transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-black text-[#080a0a] bg-[#ffc640] px-2.5 py-1 rounded-lg">
                {section.number}
              </span>
              <section.icon className="w-4 h-4 text-[#ffc640] shrink-0" />
              <h2 className="text-base sm:text-xl font-bold text-white">{section.title}</h2>
            </div>

            {section.paragraphs && (
              <div className="space-y-3 text-xs sm:text-sm text-[#d1d5db] leading-relaxed">
                {section.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            )}

            {section.bullets && (
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#d1d5db] leading-relaxed">
                {section.bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffc640] mt-2 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Bottom CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-[#141821] to-[#11141b] border border-[#ffc640]/20 p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-1">
              هل لديك استفسار قانوني أو بلاغ عن مخالفة؟
            </h3>
            <p className="text-xs text-[#9ca3af]">
              فريق الامتثال وخدمة العملاء جاهز لمساعدتك عبر{' '}
              <span className="text-[#ffc640] font-semibold" dir="ltr">
                support@jocars.jo
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/privacy"
              className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-xs font-bold text-white transition-colors"
            >
              سياسة الخصوصية
            </Link>
            <Link
              href="/auth/register"
              className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl bg-[#ffc640] hover:brightness-105 text-xs font-bold text-[#080a0a] transition-all"
            >
              إنشاء حساب
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
