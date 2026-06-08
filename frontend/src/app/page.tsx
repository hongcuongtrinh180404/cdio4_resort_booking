import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";
import { FeaturedRooms } from "@/components/home/FeaturedRooms";
import { ServicesSection } from "@/components/home/ServicesSection";
import { ReviewCarousel } from "@/components/home/ReviewCarousel";
import { CTASection } from "@/components/home/CTASection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturedRooms />
      <ServicesSection />
      <ReviewCarousel />
      <CTASection />
    </>
  );
}
