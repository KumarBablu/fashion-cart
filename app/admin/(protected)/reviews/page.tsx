import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import ReviewsManager from "@/components/admin/ReviewsManager";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | undefined>;

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieStoreVal = cookieStore.get("fc_admin_store")?.value;

  const store = sp.store === "jewellery" || (!sp.store && cookieStoreVal === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  });

  return <ReviewsManager initialReviews={reviews} />;
}
