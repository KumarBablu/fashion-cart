import { prisma } from "@/lib/db";
import CouponsManager from "@/components/admin/CouponsManager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = coupons.map((c) => ({
    ...c,
    discountValue: Number(c.discountValue),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
  }));

  return <CouponsManager initialCoupons={serialized} />;
}
