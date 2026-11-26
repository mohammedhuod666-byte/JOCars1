'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { X, Search, Users, Loader2, ShieldCheck, Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FollowButton } from './FollowButton';

interface FollowUserItem {
  id: string;
  name: string;
  image?: string | null;
  dealerName?: string | null;
  role?: string;
  phoneVerified?: boolean;
  isFollowing: boolean;
  followsViewer: boolean;
}

interface FollowersModalProps {
  open: boolean;
  userId: string;
  initialTab?: 'followers' | 'following';
  followersCount?: number;
  followingCount?: number;
  onClose: () => void;
  onCountsChange?: (counts: { followersCount: number; followingCount: number }) => void;
}

export function FollowersModal({
  open,
  userId,
  initialTab = 'followers',
  followersCount: propFollowersCount = 0,
  followingCount: propFollowingCount = 0,
  onClose,
  onCountsChange,
}: FollowersModalProps) {
  const { user: currentUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [users, setUsers] = useState<FollowUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState({
    followersCount: propFollowersCount,
    followingCount: propFollowingCount,
  });

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setSearch('');
    }
  }, [open, initialTab]);

  useEffect(() => {
    setCounts({ followersCount: propFollowersCount, followingCount: propFollowingCount });
  }, [propFollowersCount, propFollowingCount]);

  const loadList = useCallback(async () => {
    if (!open || !userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow?list=${activeTab}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const d = await res.json();
      if (d.success && d.data) {
        setUsers(d.data.users || []);
        const nextCounts = {
          followersCount: d.data.followersCount ?? counts.followersCount,
          followingCount: d.data.followingCount ?? counts.followingCount,
        };
        setCounts(nextCounts);
        onCountsChange?.(nextCounts);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [open, userId, activeTab, token]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  if (!open) return null;

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      (u.dealerName && u.dealerName.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[#11141b] border border-white/[0.1] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#ffc640]" />
            <h3 className="text-base font-bold text-white">المتابعات</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-gray-300"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-white/[0.08] bg-[#0b0e14]">
          <button
            type="button"
            onClick={() => setActiveTab('followers')}
            className={`py-3 text-xs sm:text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'followers'
                ? 'border-[#ffc640] text-[#ffc640]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            المتابعون ({counts.followersCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`py-3 text-xs sm:text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'following'
                ? 'border-[#ffc640] text-[#ffc640]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            يتابع ({counts.followingCount})
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم..."
              className="w-full h-10 pr-9 pl-3 rounded-xl bg-[#090b10] border border-white/[0.08] text-white text-xs sm:text-sm placeholder-gray-500 outline-none focus:border-[#ffc640]/60"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#ffc640]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs sm:text-sm">
              {activeTab === 'followers' ? 'لا يوجد متابعون حتى الآن' : 'لا يتابع أي حساب حتى الآن'}
            </div>
          ) : (
            filtered.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-colors"
              >
                <Link
                  href={`/profile/${u.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#d97706] flex items-center justify-center text-[#080a0a] font-bold text-sm shrink-0 overflow-hidden">
                    {u.image ? (
                      <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      u.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white truncate">{u.name}</span>
                      {(u.role === 'TRADER' || u.role === 'DEALER') && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    {u.dealerName && (
                      <div className="flex items-center gap-1 text-[11px] text-[#ffc640] truncate">
                        <Store className="w-3 h-3 shrink-0" />
                        <span className="truncate">{u.dealerName}</span>
                      </div>
                    )}
                  </div>
                </Link>

                {currentUser?.id !== u.id && (
                  <FollowButton
                    userId={u.id}
                    initialFollowing={u.isFollowing}
                    followsViewer={u.followsViewer}
                    compact
                    onChange={() => loadList()}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
