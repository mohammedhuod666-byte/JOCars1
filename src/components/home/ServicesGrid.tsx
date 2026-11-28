'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Car, Wrench, Cpu, MessageCircle, Clapperboard, TrendingUp, Wallet,
  Store, ArrowLeft, Sparkles, ShieldCheck, CheckCircle
} from 'lucide-react';

export function ServicesGrid() {
  const services = [
    {
      title: 'سوق الحراج والإعلانات',
      desc: 'بيع واشترِ سيارات هايبرد، كهرباء وبنزين بجميع المواصفات والجمرك في الأردن.',
      icon: Car,
      iconColor: 'text-amber-400',
      bgColor: 'from-amber-500/20 to-amber-500/5',
      borderColor: 'group-hover:border-amber-400/50',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
      link: '/cars',
      btnText: 'تصفح السيارات',
      badge: 'بيع وشراء مباشر',
      badgeClass: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
    },
    {
      title: 'دليل الورش ومراكز الصيانة',
      desc: 'احجز موعد صيانة فوري لدى أفضل ورش الهايبرد، فحص الكمبيوتر، والميكانيك في الأردن.',
      icon: Wrench,
      iconColor: 'text-emerald-400',
      bgColor: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'group-hover:border-emerald-400/50',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      link: '/workshops',
      btnText: 'استكشف الورش',
      badge: 'حجز موعد فوري',
      badgeClass: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    },
    {
      title: 'سوق قطع الغيار الأصلية',
      desc: 'محركات، جيرات، هيئات، وقطع بودي مستعملة وجديدة مع كفالة وتوصيل للمحافظات.',
      icon: Cpu,
      iconColor: 'text-cyan-400',
      bgColor: 'from-cyan-500/20 to-cyan-500/5',
      borderColor: 'group-hover:border-cyan-400/50',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
      link: '/parts',
      btnText: 'تصفح قطع الغيار',
      badge: 'كفالة وتوصيل',
      badgeClass: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
    },
    {
      title: 'منتدى مجتمع كارس جو',
      desc: 'اطرح استفساراتك حول الأعطال والسيارات وأصلح سيارتك مع خبرة الأعضاء والفنيين.',
      icon: MessageCircle,
      iconColor: 'text-purple-400',
      bgColor: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'group-hover:border-purple-400/50',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
      link: '/forum',
      btnText: 'دخول المنتدى',
      badge: 'إجابات متخصصة',
      badgeClass: 'bg-purple-400/10 text-purple-300 border-purple-400/20',
    },
    {
      title: 'ريلز جولات السيارات',
      desc: 'شاهد جولات فيديو حقيقية للسيارات قبل المعاينة — كل إعلان فيه فيديو يظهر هنا.',
      icon: Clapperboard,
      iconColor: 'text-rose-400',
      bgColor: 'from-rose-500/20 to-rose-500/5',
      borderColor: 'group-hover:border-rose-400/50',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]',
      link: '/reels',
      btnText: 'شاهد الريلز',
      badge: 'فيديو حي',
      badgeClass: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
    },
    {
      title: 'مؤشر أسعار السوق بالـ AI',
      desc: 'متوسطات الأسعار الحقيقية حسب الماركة والوقود مع توقعات الذكاء الاصطناعي.',
      icon: TrendingUp,
      iconColor: 'text-sky-400',
      bgColor: 'from-sky-500/20 to-sky-500/5',
      borderColor: 'group-hover:border-sky-400/50',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(14,165,233,0.15)]',
      link: '/market-index',
      btnText: 'افتح المؤشر',
      badge: 'ذكاء اصطناعي',
      badgeClass: 'bg-sky-400/10 text-sky-300 border-sky-400/20',
    },
    {
      title: 'حاسبة التكلفة الكاملة',
      desc: 'احسب كم ستكلفك السيارة فعلا: وقود وترخيص وتأمين وصيانة ونقص القيمة.',
      icon: Wallet,
      iconColor: 'text-teal-400',
      bgColor: 'from-teal-500/20 to-teal-500/5',
      borderColor: 'group-hover:border-teal-400/50',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(20,184,166,0.15)]',
      link: '/ownership-cost',
      btnText: 'احسب التكلفة',
      badge: 'وفر فلوسك',
      badgeClass: 'bg-teal-400/10 text-teal-300 border-teal-400/20',
    },
    {
      title: 'سوق الجملة والمصدوم',
      desc: 'عروض الجملة تاجر → تاجر، وسيارات مصدومة بأسعار مخفضة للورش وأصحاب الخبرة.',
      icon: Store,
      iconColor: 'text-orange-400',
      bgColor: 'from-orange-500/20 to-orange-500/5',
      borderColor: 'group-hover:border-orange-400/50',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]',
      link: '/wholesale',
      btnText: 'تصفح الجملة',
      badge: 'حصري للتجار',
      badgeClass: 'bg-orange-400/10 text-orange-300 border-orange-400/20',
    },
  ];

  return (
    <section className="hidden md:block py-20 sm:py-28 bg-[#090b10] border-t border-white/[0.06] relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container-custom relative z-10 space-y-12">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/[0.06]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>منظومة كارس جو المتكاملة</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              كل ما تحتاجه لسيارتك في مكان واحد
            </h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            من البحث والفحص الذكي، إلى حجز الورش وشراء قطع الغيار المضمونة — تجربة قيادة وامتلاك خالية من المتاعب.
          </p>
        </div>

        {/* Bento Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((s, index) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.05, 0.35) }}
              >
                <Link
                  href={s.link}
                  className={`group relative flex flex-col justify-between p-6 rounded-3xl bg-[#10141f]/90 border border-white/[0.08] backdrop-blur-xl h-full transition-all duration-300 hover:-translate-y-1.5 ${s.borderColor} ${s.glowColor} overflow-hidden`}
                >
                  {/* Subtle hover gradient wash */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                  <div>
                    {/* Top Row: Icon + Badge + Index */}
                    <div className="flex items-center justify-between mb-5 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center ${s.iconColor} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.badgeClass}`}>
                          {s.badge}
                        </span>
                        <span className="text-xs font-black text-slate-400 tabular-nums">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-black text-white text-base sm:text-lg mb-2 relative z-10 group-hover:text-amber-300 transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 relative z-10 line-clamp-3">
                      {s.desc}
                    </p>
                  </div>

                  {/* Bottom Action CTA */}
                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between relative z-10 mt-auto">
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                      {s.btnText}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-white/[0.04] group-hover:bg-amber-400 group-hover:text-slate-950 flex items-center justify-center text-slate-300 transition-all duration-300">
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
