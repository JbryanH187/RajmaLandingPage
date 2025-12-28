import { FloatingNavbar } from "@/components/layout/FloatingNavbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/features/hero/Hero";
import { MenuGrid } from "@/components/features/menu/MenuGrid";
import { BrandingSection } from "@/components/features/branding/BrandingSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <FloatingNavbar />
      <Hero />
      <div id="nosotros">
        <BrandingSection />
      </div>
      <MenuGrid />
      <div id="ubicacion">
        <Footer />
      </div>
    </main>
  );
}
