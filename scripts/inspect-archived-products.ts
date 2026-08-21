import { prisma } from "../lib/db";

async function main() {
  const archived = await prisma.product.findMany({
    where: { status: "ARCHIVED" },
    include: {
      orderItems: { include: { order: true } },
      variants: { include: { orderItems: true } },
    },
  });

  console.log(`Found ${archived.length} ARCHIVED products:`);
  for (const p of archived) {
    console.log(`- Product: "${p.name}" (ID: ${p.id})`);
    console.log(`  Direct orderItems: ${p.orderItems.length}`);
    const variantOrderItems = p.variants.reduce((acc, v) => acc + v.orderItems.length, 0);
    console.log(`  Variant orderItems: ${variantOrderItems}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
