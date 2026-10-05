'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

function PresencePing() {
  const { token, isAuthenticated, _hydrated, refreshProfile } = useAuth();

  useEffect(() => {
    if (!_hydrated || !token || !isAuthenticated) return;
    // Heartbeat so admins see real online presence (green = seen < 5 min).
    const ping = () => {
      fetch('/api/presence', {
        method: 'POST',
        headers: { Authorization: `Bearer ${useAuth.getState().token}` },
      }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, 3 * 60 * 1000);
    return () => clearInterval(id);
  }, [_hydrated, token, isAuthenticated]);

  // Back/forward cache guard: browsers can resurrect a frozen admin page
  // (pixels + heap) via the Back button AFTER logout/account switch.
  // On bfcache restore, re-sync identity from the server so a stale admin
  // view can never linger under a different account.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refreshProfile();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [refreshProfile]);

  return null;
}

// Chunk-load recovery: after a deploy (or on flaky mobile networks) the
// browser may hold stale HTML referencing deleted JS chunks → full-page
// crash screen. Detect it once per session and hard-reload instead of
// leaving the user stuck.
function ChunkRecovery() {
  useEffect(() => {
    const isChunkError = (msg: string) =>
      /Loading chunk|ChunkLoadError|failed to load|importing a module|dynamically imported module/i.test(msg || '');
    const flag = 'jo-cars-chunk-reloaded';
    const onError = (e: ErrorEvent) => {
      if (!isChunkError(e.message)) return;
      try {
        if (sessionStorage.getItem(flag)) return;
        sessionStorage.setItem(flag, '1');
      } catch { return; }
      window.location.reload();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = String((e.reason && (e.reason.message || e.reason)) || '');
      if (!isChunkError(msg)) return;
      try {
        if (sessionStorage.getItem(flag)) return;
        sessionStorage.setItem(flag, '1');
      } catch { return; }
      window.location.reload();
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}

function ProfileRefresher() {
  const { token, isAuthenticated, refreshProfile, _hydrated } = useAuth();

  useEffect(() => {
    if (_hydrated && token && isAuthenticated) {
      refreshProfile();
    }
  }, [_hydrated, token, isAuthenticated, refreshProfile]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="jo-cars-theme"
    >
      <ProfileRefresher />
      <PresencePing />
      <ChunkRecovery />
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            direction: 'rtl',
            fontFamily: 'Tajawal, sans-serif',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </ThemeProvider>
  );
}
