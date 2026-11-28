'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { UserMenuSheet } from './UserMenuSheet';
import { SiteOnboarding } from '@/components/onboarding/SiteOnboarding';

const FULLSCREEN_ROUTES = ['/messages'];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));

  if (isFullscreen) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      {/* 
        Header has:
        - Top Ticker bar: ~28px
        - Navigation bar: 56px (mobile) / 68px (desktop)
        Total header height: ~84px mobile, ~96px desktop.
        pt-[5.25rem] (84px) on mobile and pt-[6rem] (96px) on sm/lg ensures NO page content ever slips under the fixed header!
        pb-28 on mobile ensures page content and action bars never get overlapped by the floating MobileBottomNav.
      */}
      <main className="pt-[5.25rem] sm:pt-[6rem] min-h-screen pb-28 lg:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <UserMenuSheet />
      <SiteOnboarding />
    </>
  );
}
