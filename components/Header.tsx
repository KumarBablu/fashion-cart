import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { getCachedCategories } from "@/lib/data/cache";
import HeaderClient from "./HeaderClient";
import PromotionBanner from "@/components/promotions/PromotionBanner";

export default async function Header() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    getCachedCategories("garments"),
  ]);

  return (
    <div className="sticky top-0 z-40 w-full overflow-hidden">
      <PromotionBanner />
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E8E3D8] shadow-xs transition-colors duration-200 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="h-16 sm:h-18 flex items-center justify-between" />}>
            <HeaderClient
              isLoggedIn={!!user}
              userName={user?.name}
              categories={categories as any}
            />
          </Suspense>
        </div>
      </header>
    </div>
  );
}
