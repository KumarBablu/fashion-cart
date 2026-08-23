import { Suspense } from "react";
import PromotionsManager from "@/components/admin/PromotionsManager";

export const metadata = {
  title: "Promotions & Banners | Fashion Cart Admin",
};

export const dynamic = "force-dynamic";

export default function AdminPromotionsPage() {
  return (
    <div className="h-full overflow-y-auto min-h-0 p-2 sm:p-4 max-w-7xl mx-auto w-full pb-10">
      <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-[#787C87]">Loading store marketing settings...</div>}>
        <PromotionsManager />
      </Suspense>
    </div>
  );
}
