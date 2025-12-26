import { FloatingNavbar } from "@/components/layout/FloatingNavbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/features/hero/Hero";
import { MenuGrid } from "@/components/features/menu/MenuGrid";
import { CartSheet } from "@/components/features/cart/CartSheet";
import { BrandingSection } from "@/components/features/branding/BrandingSection";
import { AuthModal } from "@/components/features/auth/AuthModal";
import { OnboardingWizard } from "@/components/features/auth/OnboardingWizard";
import { OrderTicket } from "@/components/features/cart/OrderTicket";

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
      <AuthModal />
      <OnboardingWizard />
      <div className="z-[60] relative">
        <OrderTicket />
      </div>
      <CartSheet />
    </main>
  );
}
