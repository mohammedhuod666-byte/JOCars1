'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, ChevronLeft, ChevronRight, Store, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface StoryItem {
  id: string; imageUrl: string; caption: string | null;
  carId: string | null; car: { id: string; slug: string; price: number } | null;
  views: number; createdAt: string;
}

interface StoryGroup {
  user: { id: string; name: string; image: string | null; dealerName: string | null; dealerLogo: string | null };
  stories: StoryItem[];
}

export function StoriesStrip() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<{ g: number; s: number } | null>(null);

  const load = useCallback(() => {
    fetch('/api/stories')
      .then(r => r.json())
      .then(d => { if (d.success) setGroups(d.data.groups || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-advance viewer every 5s + count view
  useEffect(() => {
    if (!viewer) return;
    const g = groups[viewer.g];
    const story = g?.stories[viewer.s];
    if (!story) { setViewer(null); return; }
    fetch(`/api/stories/${story.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view' }),
    }).catch(() => {});
    const t = setTimeout(() => {
      if (viewer.s + 1 < g.stories.length) setViewer({ g: viewer.g, s: viewer.s + 1 });
      else if (viewer.g + 1 < groups.length) setViewer({ g: viewer.g + 1, s: 0 });
      else setViewer(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [viewer, groups]);

  if (loading || groups.length === 0) return null;

  const active = viewer ? groups[viewer.g]?.stories[viewer.s] : null;
  const activeUser = viewer ? groups[viewer.g]?.user : null;

  return (
    <>
      <div className="container-custom max-w-6xl mx-auto px-4 pt-5">
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
          {groups.map((g, gi) => (
            <button key={g.user.id} onClick={() => setViewer({ g: gi, s: 0 })}
              className="flex flex-col items-center gap-1.5 shrink-0 group">
              <div className="p-[3px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-500 group-hover:scale-105 transition-transform">
                <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-slate-950 bg-slate-800 flex items-center justify-center">
                  {g.user.dealerLogo || g.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.user.dealerLogo || g.user.image || ''} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-6 h-6 text-slate-400" />
                  )}
                </div>
              </div>
              <span className="text-[11px] text-slate-300 max-w-[72px] truncate">
                {g.user.dealerName || g.user.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {viewer && active && activeUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setViewer(null)}>
            <div className="relative w-full max-w-sm h-[75vh] rounded-3xl overflow-hidden bg-slate-900" onClick={e => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.imageUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none" />
              {/* Progress */}
              <div className="absolute top-3 right-3 left-3 flex gap-1">
                {groups[viewer.g].stories.map((_, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                    {i < viewer.s && <div className="h-full w-full bg-white" />}
                    {i === viewer.s && <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5, ease: 'linear' }} className="h-full bg-white" />}
                  </div>
                ))}
              </div>
              {/* Header */}
              <div className="absolute top-6 right-3 left-3 flex items-center justify-between">
                <Link href={`/profile/${activeUser.id}`}
                  className="flex items-center gap-2 text-white text-sm font-bold bg-black/40 rounded-full pl-3 pr-1 py-1 backdrop-blur">
                  <span className="w-7 h-7 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                    {activeUser.dealerLogo || activeUser.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeUser.dealerLogo || activeUser.image || ''} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-4 h-4" />
                    )}
                  </span>
                  {activeUser.dealerName || activeUser.name}
                </Link>
                <div className="flex items-center gap-2">
                  {(user?.id === activeUser.id || user?.role === 'ADMIN') && (
                    <button
                      onClick={async () => {
                        if (!confirm('حذف الستوري؟')) return;
                        const token = (() => { try { return JSON.parse(localStorage.getItem('jo-cars-auth') || '{}')?.state?.token; } catch { return null; } })();
                        await fetch(`/api/stories/${active.id}`, {
                          method: 'DELETE',
                          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                        });
                        load(); setViewer(null);
                      }}
                      className="p-2 rounded-full bg-black/40 text-white backdrop-blur" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setViewer(null)} className="p-2 rounded-full bg-black/40 text-white backdrop-blur">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Footer */}
              <div className="absolute bottom-0 right-0 left-0 p-4 space-y-2">
                {active.caption && <p className="text-white text-sm leading-relaxed">{active.caption}</p>}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-white/70 text-xs"><Eye className="w-3.5 h-3.5" /> {active.views} مشاهدة</span>
                  {active.car && (
                    <Link href={`/cars/${active.car.slug || active.carId}`}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black">
                      عرض السيارة • {active.car.price.toLocaleString('ar-JO')} د.أ
                    </Link>
                  )}
                </div>
              </div>
              {/* Nav arrows */}
              {viewer.s > 0 && (
                <button onClick={() => setViewer({ g: viewer.g, s: viewer.s - 1 })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white"><ChevronRight className="w-5 h-5" /></button>
              )}
              {(viewer.s + 1 < groups[viewer.g].stories.length || viewer.g + 1 < groups.length) && (
                <button onClick={() => {
                  if (viewer.s + 1 < groups[viewer.g].stories.length) setViewer({ g: viewer.g, s: viewer.s + 1 });
                  else setViewer({ g: viewer.g + 1, s: 0 });
                }} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white"><ChevronLeft className="w-5 h-5" /></button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
