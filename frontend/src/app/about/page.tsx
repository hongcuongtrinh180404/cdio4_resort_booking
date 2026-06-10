import { AboutHero } from "@/components/about/AboutHero";
import { BrandExperience } from "@/components/about/BrandExperience";
import { GallerySection } from "@/components/about/GallerySection";
import { JourneySection } from "@/components/about/JourneySection";
import { FinalCTA } from "@/components/about/FinalCTA";

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <BrandExperience />
      <GallerySection />
      <JourneySection />
      <FinalCTA />
    </>
  );
}
