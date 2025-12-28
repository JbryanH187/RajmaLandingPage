import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ActiveOrderButton } from "@/components/features/cart/ActiveOrderButton";
import { Toaster } from "sonner";
import { CartSheet } from "@/components/features/cart/CartSheet";
import { OrderTicket } from "@/components/features/cart/OrderTicket";
import { AuthModal } from "@/components/features/auth/AuthModal";
import { OnboardingWizard } from "@/components/features/auth/OnboardingWizard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rajma Sushi | Arte y Fusión",
  description: "Una experiencia culinaria que fusiona la tradición japonesa con el alma de Sinaloa. Menú digital premium.",
  openGraph: {
    title: "Rajma Sushi | Arte y Fusión",
    description: "Descubre el equilibrio perfecto entre Japón y Sinaloa.",
    url: "https://rajmasushi.com",
    siteName: "Rajma Sushi",
    images: ["/hero-image.jpg"],
    locale: "es_MX",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#cc0000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} antialiased bg-background text-foreground min-h-screen font-sans`}>
        {children}
        <ActiveOrderButton />
        <Toaster position="top-center" richColors />
        <div className="z-[60] relative">
          <OrderTicket />
        </div>
        <CartSheet />
        <AuthModal />
        <OnboardingWizard />
      </body>
    </html>
  );
}
