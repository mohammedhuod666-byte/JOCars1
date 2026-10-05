'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: { client_id: string; callback: (res: { credential?: string }) => void }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export function GoogleLoginButton() {
  const router = useRouter();
  const { login } = useAuth();
  const btnRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    if (document.getElementById('google-gsi-script')) {
      setReady(true);
      return;
    }
    const s = document.createElement('script');
    s.id = 'google-gsi-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!ready || !btnRef.current || !CLIENT_ID) return;
    if (!window.google?.accounts?.id) return;
    if (btnRef.current.dataset.rendered === '1') return;
    btnRef.current.dataset.rendered = '1';

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (res) => {
        if (!res.credential) {
          toast.error('فشل تسجيل الدخول عبر Google');
          return;
        }
        setLoading(true);
        try {
          const r = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: res.credential }),
          });
          const data = await r.json().catch(() => null);
          if (data?.success && data?.data) {
            login(data.data.user, data.data.token);
            toast.success('تم تسجيل الدخول عبر Google بنجاح');
            router.push('/');
          } else {
            toast.error(data?.error || `فشل تسجيل الدخول عبر Google (${r.status})`, { duration: 6000 });
          }
        } catch {
          toast.error('حدث خطأ في الاتصال — تحقق من الإنترنت وحاول مجددا');
        } finally {
          setLoading(false);
        }
      },
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: 'filled_black',
      size: 'large',
      width: 320,
      text: 'continue_with',
      locale: 'ar',
    });
  }, [ready, login, router]);

  if (!CLIENT_ID) return null;

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div ref={btnRef} className="w-full flex justify-center" />
      {loading && <p className="text-xs text-[#909096]">جاري تسجيل الدخول عبر Google...</p>}
    </div>
  );
}
