import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Lock,
  Database,
  Cpu,
  Share2,
  Cookie,
  UserCheck,
  Mail,
  ChevronRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | JO Cars',
  description:
    'كيف تجمع منصة JO Cars بياناتك وتحميها وتستخدمها بشفافية كاملة في المملكة الأردنية الهاشمية.',
};

const PRIVACY_PILLARS = [
  {
    icon: Lock,
    title: 'تشفير شامل للبيانات',
    desc: 'اتصالات مشفرة HTTPS وحماية كلمات المرور بأحدث المعايير.',
  },
  {
    icon: Share2,
    title: 'لا لبيع البيانات',
    desc: 'لا نبيع أو نؤجر معلوماتك الشخصية لأي جهة تسويقية.',
  },
  {
    icon: UserCheck,
    title: 'تحكم كامل بحسابك',
    desc: 'يمكنك تعديل بياناتك أو طلب حذف حسابك في أي وقت.',
  },
];

const SECTIONS = [
  {
    number: '01',
    icon: Database,
    title: 'البيانات التي نقوم بجمعها',
    bullets: [
      'بيانات الهوية والحساب: الاسم الكامل، البريد الإلكتروني، رقم الهاتف الأردني، ونوع الحساب (مستخدم، تاجر، أو معرض)، إضافة إلى السجل التجاري الاختياري للتجار.',
      'بيانات المركبات والإعلانات: صور السيارة، المواصفات الفنية، رقم الشاصي أو تقارير الفحص المرفوعة، وتفاصيل السعر والموقع.',
      'بيانات التفاعل والرسائل: المحادثات المباشرة داخل المنصة، طلبات الحجز عبر CliQ، وتفضيلات السيارات المحفوظة.',
      'البيانات التقنية: نوع المتصفح والجهاز، عنوان IP لأغراض الحماية ومنع الاحتيال، وسجلات الأخطاء لتحسين سرعة واستقرار التطبيق.',
    ],
  },
  {
    number: '02',
    icon: Cpu,
    title: 'أغراض استخدام البيانات والذكاء الاصطناعي',
    bullets: [
      'إنشاء حسابك وتوثيقه عبر رموز التحقق (OTP) على واتساب أو البريد الإلكتروني ومنع الحسابات الوهمية.',
      'نشر إعلاناتك وتسهيل تواصل المشترين الجادين معك عبر المكالمات أو واتساب أو الدردشة الفورية.',
      'تشغيل أدوات التقييم الذكي والمستشار الذكي للسيارات لتحليل أسعار السوق وتقديم توصيات دقيقة ومخصصة.',
      'كشف الأنشطة المشبوهة أو الاحتيالية وحماية مجتمع المنصة والامتثال للمتطلبات القانونية الرسمية.',
    ],
  },
  {
    number: '03',
    icon: Share2,
    title: 'مشاركة البيانات مع الأطراف الأخرى',
    paragraphs: [
      'تُعرض بيانات الإعلان الأساسية واسم المعلن ورقم التواصل فقط عند نشرك لإعلان عام لتمكين المشترين من التواصل معك.',
      'لا نبيع بياناتك لأي طرف ثالث مطلقاً. وقد نشارك الحد الأدنى الضروري فقط مع مزودي البنية التحتية الموثوقين (مثل خدمات إرسال رموز واتساب أو استضافة السيرفرات) بموجب اتفاقيات سرية صارمة، أو عند وجود طلب قضائي رسمي صادر عن جهة مختصة في المملكة الأردنية الهاشمية.',
    ],
  },
  {
    number: '04',
    icon: Cookie,
    title: 'ملفات تعريف الارتباط (Cookies) والتخزين المحلي',
    paragraphs: [
      'نستخدم ملفات تعريف الارتباط الضرورية والتخزين المحلي في متصفحك للحفاظ على تسجيل دخولك بأمان، وحفظ تفضيلات المظهر (الداكن/الفاتح)، وتذكّر آخر عمليات البحث والمقارنات التي أجريتها.',
      'يمكنك إدارة أو مسح ملفات تعريف الارتباط من إعدادات متصفحك في أي وقت، مع العلم أن تعطيلها قد يؤثر على بقاء جلسة تسجيل الدخول مفعلة.',
    ],
  },
  {
    number: '05',
    icon: ShieldCheck,
    title: 'أمن المعلومات والاحتفاظ بالبيانات',
    bullets: [
      'يتم تشفير جميع البيانات المنقولة بين جهازك وخوادمنا باستخدام بروتوكول HTTPS/TLS، كما تُحفظ كلمات المرور بصيغة مشفرة غير قابلة للاسترجاع.',
      'نحتفظ ببيانات حسابك طالما أن الحساب نشط؛ وعند طلب حذفه، نقوم بإزالة بياناتك الشخصية خلال فترة معقولة مع الاحتفاظ فقط بالسجلات المالية أو الأمنية التي يفرض القانون حفظها.',
    ],
  },
  {
    number: '06',
    icon: UserCheck,
    title: 'حقوقك الكاملة كمستخدم',
    bullets: [
      'الحق في الوصول إلى بياناتك الشخصية ومراجعتها وتحديثها مباشرة من صفحة الملف الشخصي.',
      'الحق في إخفاء أو تعديل أو حذف إعلاناتك في أي وقت.',
      'الحق في طلب حذف حسابك نهائياً وإزالة بياناتك الشخصية من قواعد بيانات المنصة.',
      'الحق في إيقاف الإشعارات الترويجية أو الرسائل غير الضرورية.',
    ],
  },
  {
    number: '07',
    icon: Mail,
    title: 'تحديثات السياسة والتواصل معنا',
    paragraphs: [
      'قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر لتعكس التحسينات التقنية أو التغييرات التشريعية. سيتم نشر النسخة المحدثة على هذه الصفحة مع تحديث تاريخ المراجعة.',
      'لأي استفسار حول خصوصية بياناتك أو لتقديم طلب حذف، تواصل معنا عبر البريد الإلكتروني: support@jocars.jo.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07090d] text-white pb-24 lg:pb-16" dir="rtl">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-[#111520] to-[#07090d]">
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[460px] h-[260px] bg-emerald-500/10 blur-[120px] pointer-events-none" />

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
              <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-[#080a0a]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-2">
                سياسة الخصوصية وحماية البيانات
              </h1>
              <p className="text-xs sm:text-sm text-[#9ca3af] leading-relaxed max-w-2xl">
                نلتزم في JO Cars بأعلى معايير الشفافية والأمان لحماية بياناتك الشخصية ومعلومات مركباتك.
              </p>
            </div>
          </div>

          {/* 3 Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7">
            {PRIVACY_PILLARS.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#11141b]/85 border border-white/[0.08] flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-emerald-400" />
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
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
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
              خصوصيتك أولوية دائمة في JO Cars
            </h3>
            <p className="text-xs text-[#9ca3af]">
              لأي طلب يتعلق ببياناتك تواصل معنا عبر{' '}
              <span className="text-[#ffc640] font-semibold" dir="ltr">
                support@jocars.jo
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/terms"
              className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-xs font-bold text-white transition-colors"
            >
              شروط الاستخدام
            </Link>
            <Link
              href="/auth/login"
              className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl bg-[#ffc640] hover:brightness-105 text-xs font-bold text-[#080a0a] transition-all"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
