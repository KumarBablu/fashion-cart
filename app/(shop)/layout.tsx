import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BrandIntroSplash from "@/components/ui/BrandIntroSplash";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <BrandIntroSplash />
      </Suspense>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
