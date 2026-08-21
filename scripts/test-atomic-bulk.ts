import { prisma } from "../lib/db";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function testBatchUpload(rowCount: number = 20) {
  console.log(`Starting test atomic upload of ${rowCount} products...`);
  const t0 = Date.now();

  let category = await prisma.category.findFirst({ where: { isActive: true } });
  if (!category) {
    category = await prisma.category.create({ data: { name: "Ethnic Wear", slug: "ethnic-wear" } });
  }

  const createdIds: string[] = [];

  for (let i = 1; i <= rowCount; i++) {
    const title = `Luxury Silk Anarkali Suit Sample ${i} ${Date.now()}`;
    const entropy = Math.random().toString(36).substring(2, 7);
    const slug = `${slugify(title)}-${entropy}`;
    const sku = `FC-SKU-TEST-${entropy.toUpperCase()}`;

    const prod = await prisma.product.create({
      data: {
        name: title,
        slug,
        categoryId: category.id,
        status: "ACTIVE",
        brand: "Fashion Cart Atelier",
        fabric: "Pure Silk Blend",
        variants: {
          create: {
            sku,
            colour: "Royal Maroon",
            size: "XL",
            price: 1499,
            stockQuantity: 25,
            isActive: true,
          },
        },
        images: {
          createMany: {
            data: [
              { imageUrl: "https://rukmini1.flixcart.com/image/1500/1500/sample1.jpg", sortOrder: 0 },
              { imageUrl: "https://rukmini1.flixcart.com/image/1500/1500/sample2.jpg", sortOrder: 1 },
              { imageUrl: "https://rukmini1.flixcart.com/image/1500/1500/sample3.jpg", sortOrder: 2 },
            ],
          },
        },
      },
    });

    createdIds.push(prod.id);
  }

  const duration = Date.now() - t0;
  console.log(`✅ Successfully created ${createdIds.length} products with variants and 3 images each in ${duration}ms (${(duration / rowCount).toFixed(0)}ms per product)!`);

  // Clean up benchmark data
  await prisma.productImage.deleteMany({ where: { productId: { in: createdIds } } });
  await prisma.productVariant.deleteMany({ where: { productId: { in: createdIds } } });
  await prisma.product.deleteMany({ where: { id: { in: createdIds } } });
  console.log("Cleaned up benchmark test rows.");
}

testBatchUpload(20)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
