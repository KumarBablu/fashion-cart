import { prisma } from "@/lib/db";
import ReviewsManager from "@/components/admin/ReviewsManager";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  });

  return <ReviewsManager initialReviews={reviews} />;
}
