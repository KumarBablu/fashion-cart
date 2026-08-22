import { prisma } from "../lib/db";

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      images: true,
    },
    take: 30,
  });

  console.log("Inspecting image records across sample products:");
  for (const p of products) {
    console.log(`[${p.name.slice(0, 30)}] - Images count: ${p.images.length}`);
    p.images.forEach((img, i) => {
      console.log(`  (${i + 1}) ${img.imageUrl.slice(0, 80)}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
