'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Bell, UserPlus, CheckCheck, ExternalLink, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { FollowButton } from '@/components/users/FollowButton';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { isAuthenticated, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success && d.data) {
        const list: NotificationItem[] = d.data.notifications || [];
        setNotifications(list);
        setUnreadCount(d.data.unreadCount || 0);

        // Live toast when a brand new unread notification arrives
        if (initializedRef.current) {
          for (const n of list) {
            if (!n.read && !seenIdsRef.current.has(n.id)) {
              toast(n.message, {
                duration: 4500,
              });
            }
          }
        }
        initializedRef.current = true;
        list.forEach((n) => seenIdsRef.current.add(n.id));
      }
    } catch {
      // ignore polling errors
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 5000);
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);
    window.addEventListener('jocars:refresh-notifications', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('jocars:refresh-notifications', onFocus);
    };
  }, [isAuthenticated, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // When dropdown opens, check follow status for NEW_FOLLOWER notifications & mark read
  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && token) {
      // Load follow status for follower links so "رد المتابعة" shows accurately
      const followerIds = notifications
        .filter((n) => n.type === 'NEW_FOLLOWER' && n.link?.startsWith('/profile/'))
        .map((n) => n.link!.replace('/profile/', '').split('?')[0])
        .slice(0, 10);

      if (followerIds.length > 0) {
        Promise.all(
          followerIds.map((fid) =>
            fetch(`/api/users/${fid}/follow`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => r.json())
              .then((d) => ({ fid, following: !!d.data?.following }))
              .catch(() => ({ fid, following: false }))
          )
        ).then((results) => {
          const map: Record<string, boolean> = {};
          results.forEach((r) => {
            map[r.fid] = r.following;
          });
          setFollowingMap((prev) => ({ ...prev, ...map }));
        });
      }

      if (unreadCount > 0) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        fetch('/api/notifications', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2.5 rounded-xl border border-white/[0.08] bg-[#121622]/80 text-slate-300 hover:text-amber-400 hover:border-amber-400/40 transition-all duration-200"
        aria-label="الإشعارات"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-auto top-16 sm:top-full sm:mt-2 sm:w-96 bg-[#11141b]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden z-[95]"
          dir="rtl"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#ffc640]" />
              <span className="text-sm font-bold text-white">الإشعارات</span>
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5" />
              تحديث فوري
            </span>
          </div>

          <div className="max-h-[65vh] overflow-y-auto divide-y divide-white/[0.06]">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-xs">
                لا توجد إشعارات حالياً
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => {
                const isFollowNotif =
                  n.type === 'NEW_FOLLOWER' && n.link?.startsWith('/profile/');
                const followerId = isFollowNotif
                  ? n.link!.replace('/profile/', '').split('?')[0]
                  : null;

                return (
                  <div
                    key={n.id}
                    className={`p-3.5 transition-colors ${
                      n.read ? 'bg-transparent' : 'bg-[#ffc640]/[0.05]'
                    } hover:bg-white/[0.04]`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isFollowNotif
                            ? 'bg-[#ffc640]/15 text-[#ffc640]'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}
                      >
                        {isFollowNotif ? (
                          <UserPlus className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white">{n.title}</p>
                        <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {n.link && (
                            <Link
                              href={n.link}
                              onClick={() => setOpen(false)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ffc640] hover:underline"
                            >
                              <span>عرض البروفايل</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                          {followerId && (
                            <FollowButton
                              userId={followerId}
                              initialFollowing={!!followingMap[followerId]}
                              followsViewer={true}
                              compact
                              onChange={(d) =>
                                setFollowingMap((prev) => ({
                                  ...prev,
                                  [followerId]: d.following,
                                }))
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
