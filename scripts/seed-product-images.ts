import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCT_IMAGES_MAP: Record<string, { images: string[]; compareAtPriceMultiplier: number; brand: string }> = {
  "classic-cotton-formal-shirt": {
    brand: "Luxe Atelier",
    compareAtPriceMultiplier: 1.45,
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "slim-fit-casual-shirt": {
    brand: "Urban Thread",
    compareAtPriceMultiplier: 1.5,
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "straight-fit-denim-jeans": {
    brand: "Denim Co.",
    compareAtPriceMultiplier: 1.6,
    images: [
      "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "printed-straight-kurti": {
    brand: "Ananya Trends",
    compareAtPriceMultiplier: 1.4,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "floral-a-line-dress": {
    brand: "Aura Couture",
    compareAtPriceMultiplier: 1.5,
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "kids-cotton-tshirt": {
    brand: "Junior Club",
    compareAtPriceMultiplier: 1.35,
    images: [
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "relaxed-fit-trousers": {
    brand: "Sartorial Men",
    compareAtPriceMultiplier: 1.5,
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "embroidered-anarkali-kurti": {
    brand: "Royal Heritage",
    compareAtPriceMultiplier: 1.65,
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
    ],
  },
};

async function main() {
  console.log("Seeding HD images, brands, ratings, and discounts to all products...");

  const products = await prisma.product.findMany({
    include: { images: true, variants: true },
  });

  for (const p of products) {
    const config = PRODUCT_IMAGES_MAP[p.slug];
    const brand = config?.brand || p.brand || "Fashion Cart Signature";

    // 1. Update product metadata (brand, ratings, flags)
    await prisma.product.update({
      where: { id: p.id },
      data: {
        brand,
        averageRating: 4.6 + Math.random() * 0.3,
        totalReviews: Math.floor(25 + Math.random() * 150),
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: true,
      },
    });

    // 2. Attach images if missing
    if (config?.images && (p.images.length === 0 || p.images[0]?.imageUrl.startsWith("/uploads/products/1786688788117"))) {
      if (p.images.length === 0) {
        for (let i = 0; i < config.images.length; i++) {
          await prisma.productImage.create({
            data: {
              productId: p.id,
              imageUrl: config.images[i],
              sortOrder: i,
              altText: `${p.name} - View ${i + 1}`,
            },
          });
        }
        console.log(`Attached ${config.images.length} images to ${p.name}`);
      }
    }

    // 3. Update compareAtPrice for Flipkart-style discount tags
    if (config?.compareAtPriceMultiplier) {
      for (const v of p.variants) {
        const compareAtPrice = Math.round(Number(v.price) * config.compareAtPriceMultiplier);
        await prisma.productVariant.update({
          where: { id: v.id },
          data: { compareAtPrice },
        });
      }
    }
  }

  console.log("✅ Finished enriching all product images and discounts!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
