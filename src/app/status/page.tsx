'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Activity, CheckCircle2, XCircle, Loader2, RefreshCw, Database, Brain, Bell, MessageCircle, Mail, HardDrive } from 'lucide-react';

interface Svc {
  ok: boolean;
  [k: string]: unknown;
}

interface StatusData {
  status: string;
  uptimeSec: number;
  responseMs: number;
  services: Record<string, Svc>;
  updatedAt: string;
}

const META: Record<string, { label: string; icon: typeof Database; desc: (s: Svc) => string }> = {
  database: { label: 'قاعدة البيانات', icon: Database, desc: (s) => `متصلة — زمن الاستجابة ${s.latencyMs}ms` },
  ai: {
    label: 'الذكاء الاصطناعي', icon: Brain,
    desc: (s) => (s.ok ? `متصل — ${s.model} مع ${s.failovers} بدائل + محرك محلي` : 'غير معدّ — يعمل المحرك المحلي فقط'),
  },
  backups: {
    label: 'النسخ الاحتياطية', icon: HardDrive,
    desc: (s) => {
      const last = s.last as { name: string; status: string; createdAt: string } | null;
      return `${s.auto ? 'جدولة تلقائية مفعّلة' : 'الجدولة غير مفعّلة'}${last ? ` — آخر نسخة: ${new Date(last.createdAt).toLocaleString('ar-JO')} (${last.status})` : ''}`;
    },
  },
  push: { label: 'إشعارات المتصفح', icon: Bell, desc: (s) => (s.ok ? 'مفعّلة — تنبيهات الأسعار تعمل' : 'غير مفعّلة') },
  whatsapp: { label: 'واتساب', icon: MessageCircle, desc: (s) => (s.ok ? 'متصل — الرموز والتنبيهات تعمل' : 'غير معدّ — الإشعارات تُسجل فقط') },
  email: { label: 'البريد الإلكتروني', icon: Mail, desc: (s) => (s.ok ? 'معدّ — إرسال النسخ يعمل' : 'غير معدّ') },
};

function fmtUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} يوم و${h} ساعة`;
  if (h > 0) return `${h} ساعة و${m} دقيقة`;
  return `${m} دقيقة`;
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    fetch('/api/status')
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  const allOk = data && Object.values(data.services).every(s => s.ok);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="container-custom max-w-3xl mx-auto px-4 py-8 flex-1">
        <div className="text-center mb-8">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5 mb-3">
            <Activity className="w-3.5 h-3.5" /> حالة الأنظمة
          </span>
          <h1 className="text-3xl font-extrabold mb-2">كل شيء تحت السيطرة؟</h1>
          <p className="text-sm text-slate-400">شفافية كاملة: حالة خدمات الموقع لحظة بلحظة</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>
        ) : !data ? (
          <p className="text-center text-slate-400 py-20">تعذر التحميل</p>
        ) : (
          <>
            <div className={`rounded-3xl border p-5 mb-5 flex items-center justify-between ${allOk ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
              <div className="flex items-center gap-3">
                {allOk
                  ? <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  : <XCircle className="w-8 h-8 text-amber-400" />}
                <div>
                  <p className="font-black text-lg">{allOk ? 'جميع الأنظمة تعمل ' : 'بعض الخدمات تحتاج إعداداً'}</p>
                  <p className="text-xs text-slate-400">مدة التشغيل: {fmtUptime(data.uptimeSec)} • الاستجابة: {data.responseMs}ms</p>
                </div>
              </div>
              <button onClick={() => { setRefreshing(true); load(); }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-700 transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> تحديث
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(data.services).map(([key, svc]) => {
                const meta = META[key] || { label: key, icon: Activity, desc: () => '' };
                const Icon = meta.icon;
                return (
                  <div key={key} className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${svc.ok ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <Icon className={`w-5 h-5 ${svc.ok ? 'text-emerald-400' : 'text-red-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{meta.label}</p>
                        <span className={`w-2 h-2 rounded-full ${svc.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{meta.desc(svc)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-4 text-center">آخر فحص: {new Date(data.updatedAt).toLocaleString('ar-JO')}</p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
