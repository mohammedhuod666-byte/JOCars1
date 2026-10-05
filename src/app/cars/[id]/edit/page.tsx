'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Save, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const FUELS = [
  { id: 'PETROL', label: 'بنزين' },
  { id: 'DIESEL', label: 'ديزل' },
  { id: 'HYBRID', label: 'هايبرد' },
  { id: 'ELECTRIC', label: 'كهرباء' },
  { id: 'PLUGIN_HYBRID', label: 'بلق-إن' },
];
const TRANSMISSIONS = [
  { id: 'AUTOMATIC', label: 'أوتوماتيك' },
  { id: 'MANUAL', label: 'عادي' },
  { id: 'CVT', label: 'CVT' },
  { id: 'DCT', label: 'DCT' },
];

export default function EditCarPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, _hydrated, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([]);
  const [form, setForm] = useState({
    price: '', phone: '', whatsapp: '', description: '',
    cityId: '', fuelType: '', transmission: '', kilometers: '',
  });
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (_hydrated && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!isAuthenticated) return;
    const id = params.id as string;
    fetch(`/api/cars/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success || !d.data) { toast.error('السيارة غير موجودة'); router.push('/my-cars'); return; }
        const car = d.data;
        if (car.userId !== user?.id && user?.role !== 'ADMIN') {
          toast.error('لا تملك صلاحية تعديل هذا الإعلان');
          router.push(`/cars/${id}`);
          return;
        }
        setTitle(`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year || ''}`);
        setForm({
          price: String(car.price ?? ''),
          phone: car.phone || '',
          whatsapp: car.whatsapp || '',
          description: car.description || '',
          cityId: car.cityId || '',
          fuelType: car.fuelType || '',
          transmission: car.transmission || '',
          kilometers: String(car.kilometers ?? ''),
        });
        setLoading(false);
      })
      .catch(() => { toast.error('تعذر تحميل الإعلان'); router.push('/my-cars'); });
    fetch('/api/cars/cities').then(r => r.json()).then(d => setCities(d.data || [])).catch(() => {});
  }, [isAuthenticated, _hydrated, params.id, router, user]);

  const save = async () => {
    const price = parseFloat(form.price);
    if (!price || price <= 0) { toast.error('يرجى إدخال سعر صالح'); return; }
    if (!form.phone.trim()) { toast.error('رقم الهاتف مطلوب'); return; }
    if (!form.description.trim() || form.description.trim().length < 20) { toast.error('الوصف يجب أن يكون 20 حرفاً على الأقل'); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        price,
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
        description: form.description.trim(),
      };
      if (form.cityId) body.cityId = form.cityId;
      if (form.fuelType) body.fuelType = form.fuelType;
      if (form.transmission) body.transmission = form.transmission;
      if (form.kilometers !== '') {
        const km = parseInt(form.kilometers);
        if (!isNaN(km) && km >= 0) body.kilometers = km;
      }
      const res = await fetch(`/api/cars/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      let data: any = null;
      try { data = await res.json(); } catch { toast.error(`تعذر الحفظ (خطأ ${res.status})`); return; }
      if (res.ok && data.success) {
        toast.success('تم حفظ التعديلات');
        router.push(`/cars/${params.id}`);
      } else {
        toast.error(data?.error || 'فشل حفظ التعديلات');
      }
    } catch {
      toast.error('تعذر الاتصال');
    } finally {
      setSaving(false);
    }
  };

  if (!_hydrated || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>;
  }

  const inputCls = 'w-full p-3 rounded-2xl border border-slate-800 bg-slate-950 text-white text-sm outline-none focus:border-emerald-500';

  return (
    <div className="min-h-screen pb-16">
      <div className="container-custom max-w-2xl py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href={`/cars/${params.id}`} className="hover:text-emerald-400">الإعلان</Link>
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          <span className="text-white font-bold">تعديل الإعلان</span>
        </div>
        <h1 className="text-2xl font-black text-white">تعديل: {title}</h1>
        <p className="text-xs text-slate-400">التعديل يعيد الإعلان للمراجعة. لتغيير الصور أو المواصفات الأساسية احذف الإعلان وأعد إنشاءه.</p>

        <div className="space-y-4 rounded-3xl bg-slate-900 border border-slate-800 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">السعر (دينار) *</label>
              <input type="number" min="1" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">الممشى (كم)</label>
              <input type="number" min="0" value={form.kilometers} onChange={e => setForm({ ...form, kilometers: e.target.value })} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">الهاتف *</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">واتساب</label>
              <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className={inputCls} dir="ltr" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">المحافظة</label>
            <select value={form.cityId} onChange={e => setForm({ ...form, cityId: e.target.value })} className={inputCls}>
              <option value="">بدون تغيير</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">نوع الوقود</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {FUELS.map(f => (
                <button key={f.id} type="button" onClick={() => setForm({ ...form, fuelType: f.id })}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${form.fuelType === f.id ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">ناقل الحركة</label>
            <div className="grid grid-cols-4 gap-2">
              {TRANSMISSIONS.map(t => (
                <button key={t.id} type="button" onClick={() => setForm({ ...form, transmission: t.id })}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${form.transmission === t.id ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">الوصف (20 حرفاً على الأقل) *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={6} className={`${inputCls} resize-none`} />
          </div>

          <button onClick={save} disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  );
}
