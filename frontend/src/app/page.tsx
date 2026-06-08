import { HeroSection } from "@/components/home/HeroSection";
import { SearchSection } from "@/components/home/SearchSection";
import { StatsSection } from "@/components/home/StatsSection";
import { FeaturedRooms } from "@/components/home/FeaturedRooms";
import { ServicesSection } from "@/components/home/ServicesSection";
import { ReviewCarousel } from "@/components/home/ReviewCarousel";
import { CTASection } from "@/components/home/CTASection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <SearchSection />
      <StatsSection />
      <FeaturedRooms />
      <ServicesSection />
      <ReviewCarousel />
      <CTASection />
    </>
  );
}
