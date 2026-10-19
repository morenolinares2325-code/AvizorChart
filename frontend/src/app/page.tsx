import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { StorySections } from "@/components/home/StorySections";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StorySections />
      <Footer />
    </>
  );
}
