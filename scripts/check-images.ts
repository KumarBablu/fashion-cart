import { prisma } from "../lib/db";

async function main() {
  const images = await prisma.productImage.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });

  console.log(`Recent product images in DB:`);
  for (const img of images) {
    console.log(`Product: ${img.product.name} | ImageURL: ${img.imageUrl}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
