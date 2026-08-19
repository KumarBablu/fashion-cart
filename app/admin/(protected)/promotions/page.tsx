import PromotionsManager from "@/components/admin/PromotionsManager";

export const metadata = {
  title: "Promotions & Banners | Fashion Cart Admin",
};

export const dynamic = "force-dynamic";

export default function AdminPromotionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PromotionsManager />
    </div>
  );
}
