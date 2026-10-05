'use client';

import { useEffect } from 'react';

// Reports uncaught browser errors to /api/client-errors (rate-limited,
// log-only). Mount once in the root layout.
export function ClientErrorReporter() {
  useEffect(() => {
    const report = (message: string, stack?: string) => {
      try {
        fetch('/api/client-errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, stack, url: window.location.href }),
        }).catch(() => {});
      } catch {}
    };
    const onError = (e: ErrorEvent) => report(e.message || 'window.onerror', e.error?.stack);
    const onRejection = (e: PromiseRejectionEvent) =>
      report(`unhandledrejection: ${String((e.reason as Error)?.message || e.reason)}`, (e.reason as Error)?.stack);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
