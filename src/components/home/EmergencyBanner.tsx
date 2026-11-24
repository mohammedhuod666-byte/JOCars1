'use client';

import Link from 'next/link';
import { PhoneCall, Truck, Wrench, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

export function EmergencyBanner() {
  return (
    <section className="py-8 bg-gradient-to-b from-[#090b10] via-[#0d121c] to-[#090b10] border-y border-white/[0.06] text-slate-100 relative overflow-hidden">
      {/* Ambient Red/Amber Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-40 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-40 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container-custom">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#141824]/90 via-[#181d2c]/90 to-[#141824]/90 border border-white/[0.1] backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col lg:flex-row lg:items-center justify-between gap-6 overflow-hidden">
          
          {/* Subtle Accent Glow Line */}
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-rose-500 opacity-60" />

          {/* Left Info Column */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/10">
              <Truck className="w-7 h-7" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[11px] font-black border border-rose-500/30">
                  خدمة إنقاذ الطرق 24/7
                </span>
                <span className="text-slate-400 text-xs font-semibold">عُطل أو بنشر أو حادث لا قدر الله؟</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                ونش وسحب سيارات وصيانة طارئة في كافة المحافظات الأردنية
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
                تواصل فوراً مع أقرب ونش قطر معتمد أو فريق صيانة متنقل في عمان، الزرقاء، إربد، العقبة، وكافة الطرق الخارجية.
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 pt-2 lg:pt-0">
            <a
              href="tel:+962771458569"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>اتصال طوارئ فوري</span>
            </a>

            <Link
              href="/workshops?towing=true"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#0e121a] border border-white/[0.12] hover:border-amber-400/50 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:bg-[#141a26]"
            >
              <Navigation className="w-4 h-4 text-amber-400" />
              <span>تحديد أقرب ورشة على الخريطة</span>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
