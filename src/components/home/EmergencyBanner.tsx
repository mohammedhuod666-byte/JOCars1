'use client';

import Link from 'next/link';
import { PhoneCall, ShieldAlert, Truck, Wrench, AlertTriangle, Sparkles } from 'lucide-react';

export function EmergencyBanner() {
  return (
    <section className="py-8 bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 border-y border-rose-500/20 text-slate-100 relative overflow-hidden">
      <div className="container-custom max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-slate-900/80 border border-rose-500/30 backdrop-blur-xl shadow-2xl">
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 font-bold border border-rose-500/30 animate-pulse">
              <Truck className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/30">
                  خدمة طوارئ الطرق 24/7 
                </span>
                <span className="text-slate-400 text-xs font-semibold">عُطل على الطريق؟</span>
              </div>
              <h3 className="text-lg md:text-xl font-black text-white">
                ونش وسحب سيارات وصيانة طارئة في كافة المحافظات الأردنية
              </h3>
              <p className="text-slate-400 text-xs">
                تواصل فوراً مع أقرب ورشة أو خدمة قطر وسحب معتمدة في عمان، الزرقاء، إربد، والعقبة.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <a
              href="tel:0790000000"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all shadow-lg shadow-rose-600/30"
            >
              <PhoneCall className="w-4 h-4" />
              <span>اتصال طوارئ سريع </span>
            </a>

            <Link
              href="/workshops?towing=true"
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs hover:text-white hover:border-slate-700 transition-all"
            >
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>أقرب ورشة سحب </span>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
