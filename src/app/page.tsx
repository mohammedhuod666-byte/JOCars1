import { HeroSection } from '@/components/home/HeroSection';
import { StoriesStrip } from '@/components/stories/StoriesStrip';
import { ServicesGrid } from '@/components/home/ServicesGrid';
import { EmergencyBanner } from '@/components/home/EmergencyBanner';
import { FeaturedCars } from '@/components/home/FeaturedCars';
import { LatestCars } from '@/components/home/LatestCars';
import { BrandsSection } from '@/components/home/BrandsSection';
import { CitiesSection } from '@/components/home/CitiesSection';
import { PriceRanges } from '@/components/home/PriceRanges';

export default function HomePage() {
  return (
    <main className="bg-[#080a0f] text-slate-100 min-h-screen selection:bg-amber-400 selection:text-slate-950">
      <HeroSection />
      <StoriesStrip />
      <ServicesGrid />
      <EmergencyBanner />
      <FeaturedCars />
      <LatestCars />
      <BrandsSection />
      <CitiesSection />
      <PriceRanges />
    </main>
  );
}
