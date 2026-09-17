'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Car, Wrench, Cpu, MessageCircle, Calculator, ShieldCheck, ArrowLeft, ChevronLeft, PhoneCall, Clapperboard, TrendingUp, Wallet, Factory } from 'lucide-react';

export function ServicesGrid() {
  const services = [
    {
      title: 'سوق الحراج والإعلانات',
      desc: 'بيع واشترِ سيارات هايبرد، كهرباء وبنزين بجميع المواصفات والجمرك في الأردن.',
      icon: <Car className="w-7 h-7 text-emerald-400" />,
      link: '/cars',
      btnText: 'تصفح السيارات',
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
      badge: 'أكثر من 50,000 زائر',
    },
    {
      title: 'دليل الورش ومراكز الصيانة',
      desc: 'احجز موعد صيانة فوري لدى أفضل ورش الهايبرد، فحص الكمبيوتر، والميكانيك في الأردن.',
      icon: <Wrench className="w-7 h-7 text-teal-400" />,
      link: '/workshops',
      btnText: 'استكشف الورش',
      color: 'from-teal-500/10 to-cyan-500/10 border-teal-500/20',
      badge: 'حجز موعد فوري',
    },
    {
      title: 'سوق قطع الغيار الأصلية',
      desc: 'محركات، جيرات، هيئات، وقطع بودي مستعملة وجديدة مع كفالة وتوصيل للمحافظات.',
      icon: <Cpu className="w-7 h-7 text-cyan-400" />,
      link: '/parts',
      btnText: 'تصفح قطع الغيار',
      color: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20',
      badge: 'كفالة وتوصيل',
    },
    {
      title: 'منتدى مجتمع كارس جو',
      desc: 'طرح استفساراتك حول مشاكل الأعطال والسيارات واصلح سيارتك مع خبرة الأعضاء والفنيين.',
      icon: <MessageCircle className="w-7 h-7 text-amber-400" />,
      link: '/forum',
      btnText: 'دخول المنتدى',
      color: 'from-amber-500/10 to-emerald-500/10 border-amber-500/20',
      badge: 'إجابات متخصصة',
    },
    {
      title: 'ريلز السيارات 🎬',
      desc: 'شاهد جولات فيديو حقيقية للسيارات قبل المعاينة — كل إعلان فيه فيديو يظهر هنا.',
      icon: <Clapperboard className="w-7 h-7 text-rose-400" />,
      link: '/reels',
      btnText: 'شاهد الريلز',
      color: 'from-rose-500/10 to-pink-500/10 border-rose-500/20',
      badge: 'جديد ✨',
    },
    {
      title: 'مؤشر السوق 📊',
      desc: 'متوسطات الأسعار الحقيقية حسب الماركة والوقود مع توقعات الذكاء الاصطناعي.',
      icon: <TrendingUp className="w-7 h-7 text-indigo-400" />,
      link: '/market-index',
      btnText: 'افتح المؤشر',
      color: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/20',
      badge: 'جديد ✨',
    },
    {
      title: 'التكلفة الكاملة 💰',
      desc: 'احسب كم ستكلفك السيارة فعلاً: وقود وترخيص وتأمين وصيانة ونقص القيمة.',
      icon: <Wallet className="w-7 h-7 text-emerald-400" />,
      link: '/ownership-cost',
      btnText: 'احسب التكلفة',
      color: 'from-emerald-500/10 to-lime-500/10 border-emerald-500/20',
      badge: 'وفّر فلوسك',
    },
    {
      title: 'سوق الجملة والمصدوم 🏭',
      desc: 'عروض الجملة تاجر → تاجر، وسيارات مصدومة بأسعار مخفضة للورش وأصحاب الخبرة.',
      icon: <Factory className="w-7 h-7 text-orange-400" />,
      link: '/wholesale',
      btnText: 'تصفح الجملة',
      color: 'from-orange-500/10 to-amber-500/10 border-orange-500/20',
      badge: 'للتجار',
    },
  ];

  return (
    <section className="py-16 bg-slate-950 text-slate-100 border-t border-slate-900 relative overflow-hidden">
      <div className="container-custom max-w-6xl space-y-10 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black">
            خدمات المنصة الأولى 🚗✨
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            كل ما تحتاجه لسيارتك في منصة واحدة
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            تمتع بتجربة متكاملة تبدأ من شراء السيارة وتثمينها، وصولاً لصيانتها وتوفير قطع غيارها.
          </p>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Link
                href={s.link}
                className={`group block p-6 rounded-3xl bg-gradient-to-b ${s.color} border bg-slate-900/90 hover:bg-slate-900 transition-all duration-300 shadow-xl flex flex-col justify-between h-full space-y-6`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      {s.icon}
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-950 text-[10px] font-bold text-slate-300 border border-slate-800">
                      {s.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-black text-white text-lg group-hover:text-emerald-400 transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 pt-2 border-t border-slate-800/80">
                  <span>{s.btnText}</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
