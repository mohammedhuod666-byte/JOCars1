'use client';

import { useEffect, useState } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  userId: string;
  initialFollowing: boolean;
  followsViewer?: boolean;
  onChange?: (data: { following: boolean; followersCount: number; followingCount: number }) => void;
  compact?: boolean;
}

export function FollowButton({ userId, initialFollowing, followsViewer, onChange, compact }: Props) {
  const { isAuthenticated, token } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing, userId]);

  // Listen for follow changes elsewhere on the page so UI stays in sync immediately
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.targetUserId === userId && typeof detail.following === 'boolean') {
        setFollowing(detail.following);
      }
    };
    window.addEventListener('jocars:follow-changed', handler);
    return () => window.removeEventListener('jocars:follow-changed', handler);
  }, [userId]);

  const toggle = async () => {
    if (!isAuthenticated) {
      toast.error('سجل الدخول أولاً للمتابعة');
      return;
    }

    // Optimistic instant toggle
    const prev = following;
    setFollowing(!prev);
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const d = await res.json();
      if (d.success) {
        setFollowing(d.data.following);
        onChange?.(d.data);
        window.dispatchEvent(
          new CustomEvent('jocars:follow-changed', {
            detail: { targetUserId: userId, ...d.data },
          })
        );
        toast.success(d.data.following ? 'تمت المتابعة' : 'تم إلغاء المتابعة');
      } else {
        setFollowing(prev);
        toast.error(d.error || 'فشل تحديث المتابعة');
      }
    } catch {
      setFollowing(prev);
      toast.error('تعذر الاتصال — تحقق من الإنترنت');
    }
    setLoading(false);
  };

  if (following) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all bg-white/[0.08] border border-white/[0.1] text-gray-200 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/30 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        }`}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
        <span>{compact ? 'أتابعه' : 'تمت المتابعة'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all ${
        followsViewer
          ? 'bg-gradient-to-r from-[#ffc640] to-[#eab308] text-[#080a0a] hover:brightness-105 shadow-md shadow-[#ffc640]/15'
          : 'bg-emerald-600 text-white hover:bg-emerald-700'
      } ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
      <span>{followsViewer ? 'رد المتابعة' : 'متابعة'}</span>
    </button>
  );
}
