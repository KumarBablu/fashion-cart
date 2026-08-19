import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloatingWidget from "@/components/ui/WhatsAppFloatingWidget";
import PromotionBanner from "@/components/promotions/PromotionBanner";
import PromotionModal from "@/components/promotions/PromotionModal";

export const dynamic = "force-dynamic";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PromotionBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloatingWidget />
      <PromotionModal />
    </>
  );
}
