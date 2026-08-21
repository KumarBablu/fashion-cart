import { prisma } from "@/lib/db";
import SellersManager from "@/components/admin/SellersManager";

export const dynamic = "force-dynamic";

export default async function AdminSellersPage() {
  const sellers = await prisma.seller.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { products: true },
      },
      products: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          status: true,
        },
        take: 5,
      },
    },
  });

  const serializedSellers = sellers.map((s) => ({
    id: s.id,
    sellerId: s.sellerId,
    name: s.name,
    phone: s.phone,
    email: s.email,
    url: s.url,
    address: s.address,
    notes: s.notes,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    _count: s._count,
    products: s.products,
  }));

  return <SellersManager initialSellers={serializedSellers} />;
}
