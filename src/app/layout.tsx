import type { Metadata } from 'next';
import { Providers } from '@/components/layout/Providers';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { NetworkBanner } from '@/components/ui/NetworkBanner';
import { ClientErrorReporter } from '@/components/layout/ClientErrorReporter';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'JO Cars | أفضل منصة أردنية لبيع وشراء السيارات',
    template: '%s | JO Cars',
  },
  description: 'أفضل منصة أردنية متخصصة في بيع وشراء السيارات. ابحث عن سيارتك المثالية وتواصل مباشرة مع البائعين في الأردن.',
  keywords: ['سيارات', 'بيع سيارات', 'شراء سيارات', 'الأردن', 'سوق السيارات', 'JO Cars'],
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_JO',
    siteName: 'JO Cars',
    title: 'JO Cars | أفضل منصة أردنية لبيع وشراء السيارات',
    description: 'أفضل منصة أردنية متخصصة في بيع وشراء السيارات',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JO Cars',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
        <link rel="apple-touch-icon" href="/shield-logo.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <ClientErrorReporter />
        <Providers>
          <NetworkBanner />
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
