'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Car, Wrench, Cpu, MessageCircle, Clapperboard, TrendingUp, Wallet, Factory, ArrowLeft } from 'lucide-react';

export function ServicesGrid() {
  const services = [
    {
      title: 'سوق الحراج والإعلانات',
      desc: 'بيع واشترِ سيارات هايبرد، كهرباء وبنزين بجميع المواصفات والجمرك في الأردن.',
      icon: <Car className="w-6 h-6 text-gold-100" />,
      link: '/cars',
      btnText: 'تصفح السيارات',
      badge: 'أكثر من 50,000 زائر',
    },
    {
      title: 'دليل الورش ومراكز الصيانة',
      desc: 'احجز موعد صيانة فوري لدى أفضل ورش الهايبرد، فحص الكمبيوتر، والميكانيك في الأردن.',
      icon: <Wrench className="w-6 h-6 text-gold-100" />,
      link: '/workshops',
      btnText: 'استكشف الورش',
      badge: 'حجز موعد فوري',
    },
    {
      title: 'سوق قطع الغيار الأصلية',
      desc: 'محركات، جيرات، هيئات، وقطع بودي مستعملة وجديدة مع كفالة وتوصيل للمحافظات.',
      icon: <Cpu className="w-6 h-6 text-gold-100" />,
      link: '/parts',
      btnText: 'تصفح قطع الغيار',
      badge: 'كفالة وتوصيل',
    },
    {
      title: 'منتدى مجتمع كارس جو',
      desc: 'اطرح استفساراتك حول الأعطال والسيارات وأصلح سيارتك مع خبرة الأعضاء والفنيين.',
      icon: <MessageCircle className="w-6 h-6 text-gold-100" />,
      link: '/forum',
      btnText: 'دخول المنتدى',
      badge: 'إجابات متخصصة',
    },
    {
      title: 'ريلز السيارات',
      desc: 'شاهد جولات فيديو حقيقية للسيارات قبل المعاينة — كل إعلان فيه فيديو يظهر هنا.',
      icon: <Clapperboard className="w-6 h-6 text-gold-100" />,
      link: '/reels',
      btnText: 'شاهد الريلز',
      badge: 'جديد',
    },
    {
      title: 'مؤشر السوق',
      desc: 'متوسطات الأسعار الحقيقية حسب الماركة والوقود مع توقعات الذكاء الاصطناعي.',
      icon: <TrendingUp className="w-6 h-6 text-gold-100" />,
      link: '/market-index',
      btnText: 'افتح المؤشر',
      badge: 'جديد',
    },
    {
      title: 'التكلفة الكاملة',
      desc: 'احسب كم ستكلفك السيارة فعلا: وقود وترخيص وتأمين وصيانة ونقص القيمة.',
      icon: <Wallet className="w-6 h-6 text-gold-100" />,
      link: '/ownership-cost',
      btnText: 'احسب التكلفة',
      badge: 'وفر فلوسك',
    },
    {
      title: 'سوق الجملة والمصدوم',
      desc: 'عروض الجملة تاجر → تاجر، وسيارات مصدومة بأسعار مخفضة للورش وأصحاب الخبرة.',
      icon: <Factory className="w-6 h-6 text-gold-100" />,
      link: '/wholesale',
      btnText: 'تصفح الجملة',
      badge: 'للتجار',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-surface-950 border-t border-surface-800 relative">
      <div className="container-custom max-w-6xl space-y-10 relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <p className="kicker">خدمات المنصة</p>
            <h2 className="display text-3xl sm:text-4xl text-surface-50">
              كل ما تحتاجه لسيارتك بمكان واحد
            </h2>
          </div>
          <p className="text-surface-500 text-sm leading-relaxed max-w-sm">
            من الشراء والتثمين، وصولا للصيانة وقطع الغيار — تجربة متكاملة.
          </p>
        </div>

        <div className="road-line opacity-30" />

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index * 0.06, 0.4) }}
            >
              <Link
                href={s.link}
                className="card-hard-hover group block p-6 rounded-2xl bg-surface-900 border-2 border-surface-700 h-full"
              >
                <div className="flex items-start justify-between mb-5">
                  <span className="w-12 h-12 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center group-hover:border-gold-100/40 transition-colors">
                    {s.icon}
                  </span>
                  <span className="text-xs font-black text-surface-600 tabular-nums" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="font-black text-surface-50 text-base mb-1.5">
                  {s.title}
                </h3>
                <p className="text-surface-500 text-xs leading-relaxed mb-4">{s.desc}</p>

                <div className="flex items-center justify-between pt-3 border-t border-surface-700/60">
                  <span className="text-[11px] font-bold text-surface-500">{s.badge}</span>
                  <span className="text-xs font-black text-gold-100 flex items-center gap-1 group-hover:gap-2 transition-all">
                    {s.btnText}
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
