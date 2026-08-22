import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloatingWidget from "@/components/ui/WhatsAppFloatingWidget";
import PromotionBanner from "@/components/promotions/PromotionBanner";
import PromotionModal from "@/components/promotions/PromotionModal";
import FloatingOfferBadge from "@/components/promotions/FloatingOfferBadge";
import CustomerWindowSessionGuard from "@/components/auth/CustomerWindowSessionGuard";
import ScrollToTopOnNavigation from "@/components/navigation/ScrollToTopOnNavigation";
import BackToTopButton from "@/components/navigation/BackToTopButton";
import { getCurrentUser } from "@/lib/auth/session";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <CustomerWindowSessionGuard isLoggedIn={!!user} />
      <Suspense fallback={null}>
        <ScrollToTopOnNavigation />
      </Suspense>
      <PromotionBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloatingWidget />
      <BackToTopButton />
      <PromotionModal />
      <FloatingOfferBadge />
    </>
  );
}
