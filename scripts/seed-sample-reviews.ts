import { prisma } from "../lib/db";

async function seedSampleReviews() {
  console.log("=== SEEDING SAMPLE VERIFIED CUSTOMER REVIEWS WITH SURVEY METRICS ===");

  const products = await prisma.product.findMany({ take: 3 });
  const users = await prisma.user.findMany({ take: 3 });

  if (products.length === 0 || users.length === 0) {
    console.log("No products or users found to attach reviews.");
    return;
  }

  const sampleData = [
    {
      productId: products[0].id,
      userId: users[0].id,
      rating: 5,
      title: "Exquisite Mulberry Silk Drape!",
      comment: "The gold zari work is breathtaking. Wore it to my cousin's wedding reception and everyone asked where I got it. The fabric is pure luxury and comfortable all evening.",
      fitRating: "TRUE_TO_SIZE",
      qualityRating: 5,
      colorAccuracy: "EXACT_MATCH",
      comfortRating: 5,
      valueRating: 5,
      sizePurchased: "Free Size",
      occasionWorn: "Festive & Wedding Ceremonies",
      recommend: true,
      isVerifiedBuyer: true,
      status: "APPROVED",
    },
    {
      productId: products[0].id,
      userId: users[users.length > 1 ? 1 : 0].id,
      rating: 5,
      title: "Pure Royal Elegance",
      comment: "The weave density and royal sheen exceeded my expectations. True to the pictures and arrived in premium boutique packaging.",
      fitRating: "TRUE_TO_SIZE",
      qualityRating: 5,
      colorAccuracy: "EXACT_MATCH",
      comfortRating: 5,
      valueRating: 5,
      sizePurchased: "Free Size",
      occasionWorn: "Cocktail & Evening Soirée",
      recommend: true,
      isVerifiedBuyer: true,
      status: "APPROVED",
    },
    {
      productId: products[products.length > 1 ? 1 : 0].id,
      userId: users[0].id,
      rating: 5,
      title: "Perfect Tailoring & Crisp Linen",
      comment: "Super breathable linen fabric for summer. Stitching is immaculate and collar stays sharp. Highly recommend sizing up if you like a relaxed fit.",
      fitRating: "RUNS_SMALL",
      qualityRating: 5,
      colorAccuracy: "EXACT_MATCH",
      comfortRating: 4,
      valueRating: 5,
      sizePurchased: "L",
      occasionWorn: "Office & Executive Formal",
      recommend: true,
      isVerifiedBuyer: true,
      status: "APPROVED",
    },
  ];

  for (const item of sampleData) {
    const created = await prisma.review.create({ data: item });
    console.log("Created review:", created.title, "with survey metrics.");
  }

  // Update product review averages
  for (const prod of products) {
    const allReviews = await prisma.review.findMany({
      where: { productId: prod.id, status: "APPROVED" },
      select: { rating: true },
    });

    if (allReviews.length > 0) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await prisma.product.update({
        where: { id: prod.id },
        data: { averageRating: avg, totalReviews: allReviews.length },
      });
    }
  }

  console.log("✅ Successfully seeded rich customer survey reviews in database!");
}

seedSampleReviews()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
