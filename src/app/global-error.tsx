'use client';

// Last-resort error boundary for the whole app (App Router global-error).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ background: '#12100c', color: '#ece5d3', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 480, margin: '10vh auto', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>حدث خطأ غير متوقع</h1>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>
            نعتذر — حدث خلل أثناء تحميل الصفحة. حاول مرة أخرى.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#ffc640', color: '#1a1712', border: 'none',
              borderRadius: 12, padding: '12px 28px', fontWeight: 800, cursor: 'pointer',
            }}
          >
            إعادة المحاولة
          </button>
          {error?.digest && (
            <p style={{ fontSize: 11, opacity: 0.5, marginTop: 16 }}>رمز الخطأ: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
