import { prisma } from "../lib/db";

async function main() {
  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      categoryId: true,
      variants: {
        select: { id: true, sku: true, size: true, colour: true, price: true, stockQuantity: true },
      },
      images: {
        select: { id: true, imageUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Total products in database: ${allProducts.length}`);
  allProducts.slice(0, 15).forEach((p, idx) => {
    console.log(`[${idx + 1}] ${p.name} | Status: ${p.status} | Slug: ${p.slug} | Variants: ${p.variants.length} | Images: ${p.images.length}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
