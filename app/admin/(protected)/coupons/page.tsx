import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import CouponsManager from "@/components/admin/CouponsManager";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | undefined>;

export default async function AdminCouponsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieStoreVal = cookieStore.get("fc_admin_store")?.value;

  const store = sp.store === "jewellery" || (!sp.store && cookieStoreVal === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  const coupons = await db.coupon.findMany({
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
