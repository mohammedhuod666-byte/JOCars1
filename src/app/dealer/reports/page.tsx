'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FileText, Printer, Loader2, Eye, Heart, MessageCircle, DollarSign, Car, CheckCircle2 } from 'lucide-react';

interface Row {
  id: string; slug: string; price: number; year: number; status: string;
  brand: { nameAr: string }; model: { nameAr: string };
  views: number; saves: number; inquiries: number; createdAt?: string;
}

export default function DealerReportsPage() {
  const { user, token, isAuthenticated, _hydrated } = useAuth();
  const [cars, setCars] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/cars/my', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          setCars(d.data.map((c: any) => ({
            id: c.id, slug: c.slug, price: c.price || 0, year: c.year, status: c.status,
            brand: c.brand || { nameAr: '' }, model: c.model || { nameAr: '' },
            views: c._count?.carViews ?? c.views ?? 0,
            saves: c._count?.favorites ?? 0,
            inquiries: c._count?.messages ?? 0,
            createdAt: c.createdAt,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, token]);

  if (!_hydrated) return null;

  const active = cars.filter(c => c.status === 'APPROVED');
  const sold = cars.filter(c => c.status === 'SOLD');
  const views = cars.reduce((a, c) => a + c.views, 0);
  const saves = cars.reduce((a, c) => a + c.saves, 0);
  const inquiries = cars.reduce((a, c) => a + c.inquiries, 0);
  const stockValue = active.reduce((a, c) => a + c.price, 0);
  const today = new Date().toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <style>{`@media print { header, footer, nav, .no-print { display: none !important; } body { background: white !important; } .print-card { box-shadow: none !important; border: 1px solid #ddd !important; } }`}</style>
      <div className="no-print"><Header /></div>
      <main className="container-custom max-w-5xl mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center no-print">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">تقرير أداء المعرض </h1>
              <p className="text-xs text-gray-500">{user?.dealerName || user?.name} • بتاريخ {today}</p>
            </div>
          </div>
          <button onClick={() => window.print()} className="no-print px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all">
            <Printer className="w-4 h-4" /> طباعة / حفظ PDF
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-slate-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'إعلانات نشطة', value: active.length, icon: Car },
                { label: 'سيارات مباعة', value: sold.length, icon: CheckCircle2 },
                { label: 'إجمالي المشاهدات', value: views.toLocaleString('ar-JO'), icon: Eye },
                { label: 'قيمة المخزون', value: `${stockValue.toLocaleString('ar-JO')} د.أ`, icon: DollarSign },
                { label: 'حفظ بالمفضلة', value: saves.toLocaleString('ar-JO'), icon: Heart },
                { label: 'استفسارات', value: inquiries.toLocaleString('ar-JO'), icon: MessageCircle },
              ].map(s => (
                <div key={s.label} className="card print-card p-4">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs font-bold mb-1"><s.icon className="w-4 h-4" />{s.label}</div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="card print-card overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-bold text-gray-900 dark:text-white">تفصيل السيارات</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="text-right p-3 font-medium text-gray-500">السيارة</th>
                      <th className="text-right p-3 font-medium text-gray-500">السعر</th>
                      <th className="text-right p-3 font-medium text-gray-500">الحالة</th>
                      <th className="text-right p-3 font-medium text-gray-500">مشاهدات</th>
                      <th className="text-right p-3 font-medium text-gray-500">حفظ</th>
                      <th className="text-right p-3 font-medium text-gray-500">استفسارات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {cars.map(c => (
                      <tr key={c.id}>
                        <td className="p-3 font-bold">{c.brand?.nameAr} {c.model?.nameAr} {c.year}</td>
                        <td className="p-3">{c.price.toLocaleString('ar-JO')} د.أ</td>
                        <td className="p-3">{c.status === 'SOLD' ? 'مباعة' : c.status === 'APPROVED' ? 'نشطة' : c.status}</td>
                        <td className="p-3">{c.views}</td>
                        <td className="p-3">{c.saves}</td>
                        <td className="p-3">{c.inquiries}</td>
                      </tr>
                    ))}
                    {cars.length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-400">لا توجد سيارات</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-3">تقرير generated من منصة JO Cars — {today}</p>
          </>
        )}
      </main>
      <div className="no-print"><Footer /></div>
    </div>
  );
}
