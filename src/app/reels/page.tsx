'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Clapperboard, Loader2, ExternalLink, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface ReelCar {
  id: string; slug: string; price: number; year: number; videoUrl: string;
  brand: { nameAr: string }; model: { nameAr: string }; city: { nameAr: string };
  images: { url: string }[];
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

export default function ReelsPage() {
  const [cars, setCars] = useState<ReelCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cars?limit=30&hasVideo=true')
      .then(r => r.json())
      .then(d => {
        const list: ReelCar[] = (d.data?.cars || d.data || []).filter((c: any) => c.videoUrl);
        setCars(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <main className="container-custom max-w-6xl mx-auto px-4 py-8 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1.5 mb-3">
            <Clapperboard className="w-3.5 h-3.5" /> ريلز السيارات 
          </span>
          <h1 className="text-3xl font-extrabold mb-2">شاهد السيارات فيديو قبل المعاينة</h1>
          <p className="text-sm text-slate-400">جولات فيديو حقيقية من البائعين —mov إعلانات فيها فيديو تظهر هنا تلقائياً</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-rose-500" /></div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20">
            <Clapperboard className="w-14 h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">لا توجد فيديوهات بعد</p>
            <p className="text-xs text-slate-500 mt-1">أضف فيديو لإعلانك من صفحة بيع سيارتك ليظهر هنا</p>
            <Link href="/cars/add" className="btn btn-emerald px-5 py-2 text-xs mt-4 inline-block font-bold">أضف إعلان بفيديو</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map(car => {
              const yt = youtubeId(car.videoUrl);
              return (
                <div key={car.id} className="rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
                  <div className="aspect-video bg-black">
                    {yt ? (
                      <iframe src={`https://www.youtube.com/embed/${yt}`} title="" className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    ) : (
                      <video src={car.videoUrl} controls preload="metadata" className="w-full h-full" poster={car.images[0]?.url} />
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{car.brand?.nameAr} {car.model?.nameAr} {car.year}</p>
                      <p className="text-xs text-slate-400">{car.city?.nameAr}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="font-black text-emerald-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />{car.price.toLocaleString('ar-JO')}
                      </p>
                      <Link href={`/cars/${car.slug || car.id}`} className="text-[11px] text-blue-400 hover:underline flex items-center gap-0.5">
                        عرض الإعلان <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
