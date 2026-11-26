'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, MapPin, Calendar, Car, MessageCircle, Shield, ShieldCheck, Store, ChevronLeft, Phone, Share2, Eye, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { CarCard } from '@/components/cars/CarCard';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { FollowButton } from '@/components/users/FollowButton';
import { FollowersModal } from '@/components/users/FollowersModal';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  dealerName: string | null;
  dealerLogo: string | null;
  dealerDescription: string | null;
  dealerAddress: string | null;
  // Phase C trader marketplace fields
  dealerVerified?: boolean;
  dealerViewCount?: number;
  dealerBannerImage?: string | null;
  phoneVerified?: boolean;
  phone: string | null;
  rating: number;
  ratingCount: number;
  createdAt: string;
  role: string;
  badges: any;
  _count: { cars: number; favorites: number; forumTopics: number; forumPosts: number };
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollower, setIsFollower] = useState(false);
  const [followModal, setFollowModal] = useState<{ open: boolean; tab: 'followers' | 'following' }>({
    open: false,
    tab: 'followers',
  });
  const [accuracy, setAccuracy] = useState<{ count: number; avgOverPct: number | null; score: number | null; label: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/users?id=${params.id}`)      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProfile(data.data.user);
          setCars(data.data.cars);
          setRatings(data.data.recentRatings);
          setFollowersCount(data.data.followersCount || 0);
          setFollowingCount(data.data.followingCount || 0);
          setIsFollowing(!!data.data.isFollowing);
        } else {
          setError('المستخدم غير موجود');
        }
      })
      .catch(() => setError('حدث خطأ'))
      .finally(() => setLoading(false));
    // Seller pricing accuracy (based on AI fair-price estimates)
    fetch(`/api/users/${params.id}/accuracy`)
      .then(r => r.json())
      .then(data => { if (data.success) setAccuracy(data.data); })
      .catch(() => {});

    // Live sync follow status & counts (no manual refresh needed)
    const syncFollow = () => {
      const token = useAuth.getState().token;
      fetch(`/api/users/${params.id}/follow`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            setIsFollowing(!!d.data.following);
            setIsFollower(!!d.data.isFollower);
            setFollowersCount(d.data.followersCount || 0);
            setFollowingCount(d.data.followingCount || 0);
          }
        })
        .catch(() => {});
    };

    syncFollow();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') syncFollow();
    }, 6000);
    const onFollowChange = () => syncFollow();
    window.addEventListener('jocars:follow-changed', onFollowChange);
    return () => {
      clearInterval(timer);
      window.removeEventListener('jocars:follow-changed', onFollowChange);
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">{error || 'المستخدم غير موجود'}</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-500 hover:underline">العودة</button>
        </div>
      </div>
    );
  }

  const isDealer = !!profile.dealerName || profile.role === 'TRADER' || profile.role === 'DEALER';
  const isVerifiedTrader = !!profile.dealerVerified;
  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-[80vh] py-6">
      <div className="container-custom max-w-4xl">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> العودة
        </button>

        {/* Profile Header */}
        <div className="card overflow-hidden">
          {/* Phase C: trader banner replaces the gradient strip when set */}
          {profile.dealerBannerImage ? (
            <div className="h-44 sm:h-56 w-full overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.dealerBannerImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className={`h-44 sm:h-56 ${
              isDealer
                ? 'bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900'
                : isVerifiedTrader
                ? 'from-emerald-600 via-green-600 to-teal-600 bg-gradient-to-br'
                : 'from-blue-600 via-indigo-600 to-purple-600 bg-gradient-to-br'
            } relative overflow-hidden`}>
              <Store className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-white/10" />
            </div>
          )}
          <div className="px-6 pb-6">
            {/* Avatar sits ON TOP of the banner edge (Facebook-style overlap) */}
            <div className="flex items-end gap-4 -mt-16 sm:-mt-20 relative z-10">
              <div className="w-32 h-32 rounded-3xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 shadow-2xl flex items-center justify-center overflow-hidden ring-2 ring-emerald-500/30 shrink-0">
                {profile.dealerLogo && isDealer ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.dealerLogo} alt="" className="w-full h-full object-cover" />
                ) : profile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-blue-500">{profile.name.charAt(0)}</span>
                )}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-center sm:text-right pb-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                  {profile.phoneVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold" title="رقم هاتف موثّق">
                      مشترٍ جاد 
                    </span>
                  )}
                  {isVerifiedTrader && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold" title="تاجر موثّق">
                      <ShieldCheck className="w-3.5 h-3.5" /> موثّق
                    </span>
                  )}
                </div>
                {isDealer && profile.dealerName && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start mt-1">
                    <Store className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-500 font-medium">{profile.dealerName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
                  <BadgeDisplay badges={profile.badges} />
                </div>
                <div className="flex items-center gap-4 justify-center sm:justify-start mt-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setFollowModal({ open: true, tab: 'followers' })}
                    className="text-gray-600 dark:text-gray-300 hover:text-[#ffc640] transition-colors cursor-pointer"
                  >
                    <strong className="font-bold text-gray-900 dark:text-white">{followersCount}</strong> متابِع
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowModal({ open: true, tab: 'following' })}
                    className="text-gray-600 dark:text-gray-300 hover:text-[#ffc640] transition-colors cursor-pointer"
                  >
                    <strong className="font-bold text-gray-900 dark:text-white">{followingCount}</strong> يتابع
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 flex-wrap justify-center sm:justify-start">
                {isOwnProfile && (profile.role === 'TRADER' || profile.role === 'DEALER' || profile.role === 'ADMIN') && (
                  <Link
                    href="/dealer/dashboard"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" /> لوحة التاجر
                  </Link>
                )}
                {profile.phone && (
                  <a href={`tel:${profile.phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                <Link href={`/messages?userId=${profile.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                  <MessageCircle className="w-4 h-4" /> تواصل
                </Link>
                {!isOwnProfile && (
                  <FollowButton
                    userId={profile.id}
                    initialFollowing={isFollowing}
                    followsViewer={isFollower}
                    onChange={(d) => {
                      setIsFollowing(d.following);
                      setFollowersCount(d.followersCount);
                      setFollowingCount(d.followingCount);
                    }}
                  />
                )}
                <FollowersModal
                  open={followModal.open}
                  userId={profile.id}
                  initialTab={followModal.tab}
                  followersCount={followersCount}
                  followingCount={followingCount}
                  onClose={() => setFollowModal((m) => ({ ...m, open: false }))}
                  onCountsChange={(c) => {
                    setFollowersCount(c.followersCount);
                    setFollowingCount(c.followingCount);
                  }}
                />
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: profile.dealerName || profile.name, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  title="مشاركة المعرض"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Share2 className="w-4 h-4" /> مشاركة
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Contact Bar */}
        <div className="md:hidden card p-4 mt-4">
          <div className="flex items-center gap-3">
            {profile.phone && (
              <a href={`tel:${profile.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium">
                <Phone className="w-4 h-4" />
                اتصل
              </a>
            )}
            <Link href={`/messages?userId=${profile.id}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">
              <MessageCircle className="w-4 h-4" />
              رسالة
            </Link>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: profile.name, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats & Bio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="card p-5 md:col-span-2">
            {profile.bio && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-500 mb-2">نبذة عني</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profile.bio}</p>
              </div>
            )}
            {isDealer && profile.dealerDescription && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-500 mb-2">عن المتجر</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profile.dealerDescription}</p>
              </div>
            )}
            {isDealer && profile.dealerAddress && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" /> {profile.dealerAddress}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
              <Calendar className="w-4 h-4" />
              عضو منذ {new Date(profile.createdAt).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long' })}
            </div>
          </div>

          <div className="card p-5">
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{profile.rating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-gray-500">{profile.ratingCount} تقييم</p>
              </div>
              {accuracy && accuracy.score !== null && (
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{accuracy.score}/100</p>
                  <p className="text-xs text-gray-500">دقة الأسعار: {accuracy.label}</p>
                  <p className="text-[10px] text-gray-400">بناءً على {accuracy.count} إعلان بتقييم AI</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xl font-bold text-blue-500">{profile._count.cars}</p>
                  <p className="text-xs text-gray-500">إعلان</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xl font-bold text-green-500">{profile._count.forumPosts + profile._count.forumTopics}</p>
                  <p className="text-xs text-gray-500">منشور</p>
                </div>
                {isVerifiedTrader && (
                  <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl col-span-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <Eye className="w-4 h-4 text-emerald-500" />
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{profile.dealerViewCount || 0}</p>
                    </div>
                    <p className="text-xs text-gray-500">مشاهدة الملف</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Ratings */}
        {ratings.length > 0 && (
          <div className="card p-5 mt-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">آخر التقييمات</h3>
            <div className="space-y-3">
              {ratings.map((r) => (
                <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {r.rater?.image ? (
                      <img src={r.rater.image} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      r.rater?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.rater?.name}</span>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < r.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User's Cars */}
        {cars.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">إعلانات {profile.name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
