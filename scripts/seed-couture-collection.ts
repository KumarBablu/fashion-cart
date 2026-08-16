import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COUTURE_PRODUCTS = [
  {
    name: "Royal Purple Embroidered Velvet Kurta Set",
    slug: "royal-purple-embroidered-velvet-kurta-set",
    description: "Inspired by royal Rajputana courts and contemporary Leella luxury aesthetics. Tailored from premium micro-velvet with intricate Zardozi thread embroidery, paired with silk straight trousers and an organza Dupatta with scalloped borders.",
    fabric: "Micro Velvet & Pure Organza Silk (Dry Clean Only)",
    brand: "Leella Couture",
    categorySlug: "women-kurtis",
    basePrice: 2499,
    compareAtPrice: 4999,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1000&auto=format&fit=crop&q=85",
    ],
    variants: [
      { colour: "Royal Violet", size: "S", stock: 12, price: 2499, compareAtPrice: 4999 },
      { colour: "Royal Violet", size: "M", stock: 18, price: 2499, compareAtPrice: 4999 },
      { colour: "Royal Violet", size: "L", stock: 10, price: 2499, compareAtPrice: 4999 },
      { colour: "Royal Violet", size: "XL", stock: 8, price: 2499, compareAtPrice: 4999 },
      { colour: "Amethyst Purple", size: "M", stock: 15, price: 2499, compareAtPrice: 4999 },
      { colour: "Amethyst Purple", size: "L", stock: 11, price: 2499, compareAtPrice: 4999 },
    ],
  },
  {
    name: "Lavender Mist Chanderi Silk Anarkali Gown",
    slug: "lavender-mist-chanderi-silk-anarkali-gown",
    description: "Flowing floor-length festive anarkali crafted in lightweight Chanderi silk with hand-woven Gota Patti motifs and mirror-work neckline. Features a 5-meter flare for magical festive spins.",
    fabric: "Chanderi Silk with Mulmul Cotton Lining",
    brand: "Grathika Festive",
    categorySlug: "women-dresses",
    basePrice: 3299,
    compareAtPrice: 6599,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1000&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1000&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1000&auto=format&fit=crop&q=85",
    ],
    variants: [
      { colour: "Lilac Violet", size: "S", stock: 8, price: 3299, compareAtPrice: 6599 },
      { colour: "Lilac Violet", size: "M", stock: 14, price: 3299, compareAtPrice: 6599 },
      { colour: "Lilac Violet", size: "L", stock: 9, price: 3299, compareAtPrice: 6599 },
      { colour: "Blush Orchid", size: "M", stock: 12, price: 3299, compareAtPrice: 6599 },
      { colour: "Blush Orchid", size: "L", stock: 6, price: 3299, compareAtPrice: 6599 },
    ],
  },
  {
    name: "Deep Orchid Handloom Silk Festive Saree",
    slug: "deep-orchid-handloom-silk-festive-saree",
    description: "A showstopping saree woven in pure mulberry silk with rich golden zari borders and antique brocade Pallu. Comes with an unstitched brocade blouse piece.",
    fabric: "100% Pure Mulberry Silk with Silk Mark Assurance",
    brand: "Leella Heritage",
    categorySlug: "women-kurtis",
    basePrice: 3999,
    compareAtPrice: 7999,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&auto=format&fit=crop&q=85",
    ],
    variants: [
      { colour: "Royal Purple", size: "Free Size (6.3m with Blouse)", stock: 15, price: 3999, compareAtPrice: 7999 },
      { colour: "Deep Violet", size: "Free Size (6.3m with Blouse)", stock: 10, price: 3999, compareAtPrice: 7999 },
    ],
  },
  {
    name: "Violet Luxe Linen Festive Shirt",
    slug: "violet-luxe-linen-festive-shirt",
    description: "Breathable European flax linen tailored with a modern mandarin collar and mother-of-pearl buttons. Perfect for cocktail soirees and festive celebrations.",
    fabric: "100% Pure French Linen",
    brand: "Sartorial Atelier",
    categorySlug: "men-shirts",
    basePrice: 1299,
    compareAtPrice: 2499,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
    ],
    variants: [
      { colour: "Electric Violet", size: "38 (S)", stock: 10, price: 1299, compareAtPrice: 2499 },
      { colour: "Electric Violet", size: "40 (M)", stock: 16, price: 1299, compareAtPrice: 2499 },
      { colour: "Electric Violet", size: "42 (L)", stock: 12, price: 1299, compareAtPrice: 2499 },
      { colour: "Electric Violet", size: "44 (XL)", stock: 6, price: 1299, compareAtPrice: 2499 },
    ],
  },
];

async function main() {
  console.log("Seeding Leella & Grathika Luxury Couture drops...");

  for (const item of COUTURE_PRODUCTS) {
    const category = await prisma.category.findFirst({
      where: { slug: item.categorySlug },
    });

    if (!category) {
      console.log(`Category not found for ${item.categorySlug}, skipping.`);
      continue;
    }

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        fabric: item.fabric,
        brand: item.brand,
        categoryId: category.id,
        isFeatured: item.isFeatured,
        isNewArrival: item.isNewArrival,
        isBestSeller: item.isBestSeller,
        averageRating: 4.85,
        totalReviews: 64,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        fabric: item.fabric,
        brand: item.brand,
        categoryId: category.id,
        status: "ACTIVE",
        isFeatured: item.isFeatured,
        isNewArrival: item.isNewArrival,
        isBestSeller: item.isBestSeller,
        averageRating: 4.85,
        totalReviews: 64,
      },
    });

    // Replace product images with HD couture gallery
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    for (let i = 0; i < item.images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: item.images[i],
          sortOrder: i,
          altText: `${item.name} - View ${i + 1}`,
        },
      });
    }

    // Replace variants
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    for (let i = 0; i < item.variants.length; i++) {
      const v = item.variants[i];
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `${item.slug.slice(0, 8).toUpperCase()}-${v.colour.slice(0, 3).toUpperCase()}-${v.size.replace(/\s+/g, "")}`,
          colour: v.colour,
          size: v.size,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stockQuantity: v.stock,
          isActive: true,
        },
      });
    }

    console.log(`✅ Seeded couture product: ${item.name}`);
  }

  console.log("Done seeding luxury collections!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
