import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloatingWidget from "@/components/ui/WhatsAppFloatingWidget";
import PromotionModal from "@/components/promotions/PromotionModal";
import FloatingOfferBadge from "@/components/promotions/FloatingOfferBadge";
import ScrollToTopOnNavigation from "@/components/navigation/ScrollToTopOnNavigation";
import BackToTopButton from "@/components/navigation/BackToTopButton";
import { Suspense } from "react";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <ScrollToTopOnNavigation />
      </Suspense>
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
