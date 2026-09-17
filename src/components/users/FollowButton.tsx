'use client';

import { useEffect, useState } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  userId: string;
  initialFollowing: boolean;
  onChange?: (data: { following: boolean; followersCount: number; followingCount: number }) => void;
  compact?: boolean;
}

export function FollowButton({ userId, initialFollowing, onChange, compact }: Props) {
  const { isAuthenticated, token } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing, userId]);

  const toggle = async () => {
    if (!isAuthenticated) {
      toast.error('سجل الدخول أولاً للمتابعة');
      return;
    }
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
        toast.success(d.data.following ? 'تمت المتابعة! 🤝' : 'تم إلغاء المتابعة');
      } else {
        toast.error(d.error || 'فشل تحديث المتابعة');
      }
    } catch {
      toast.error('تعذر الاتصال — تحقق من الإنترنت');
    }
    setLoading(false);
  };

  if (following) {
    return (
      <button onClick={toggle} disabled={loading}
        className={`flex items-center gap-2 rounded-xl text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'}`}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4 text-emerald-500" />}
        {compact ? 'أتابعه ✓' : 'تمت المتابعة ✓'}
      </button>
    );
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`flex items-center gap-2 rounded-xl text-sm font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'}`}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
      متابعة
    </button>
  );
}
