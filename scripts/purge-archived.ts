import { prisma } from "../lib/db";

async function main() {
  const archived = await prisma.product.findMany({
    where: { status: "ARCHIVED" },
  });

  console.log(`Found ${archived.length} ARCHIVED products to purge.`);

  for (const p of archived) {
    console.log(`Permanently deleting "${p.name}" (ID: ${p.id})...`);
    await prisma.$transaction(async (tx) => {
      // 1. Unlink order items safely so order history stays intact
      await tx.orderItem.updateMany({
        where: { productId: p.id },
        data: { productId: null, variantId: null },
      });
      await tx.orderItem.updateMany({
        where: { variant: { productId: p.id } },
        data: { productId: null, variantId: null },
      });

      // 2. Cascade delete dependent child records
      await tx.inventoryTransaction.deleteMany({ where: { variant: { productId: p.id } } });
      await tx.cartItem.deleteMany({ where: { productId: p.id } });
      await tx.cartItem.deleteMany({ where: { variant: { productId: p.id } } });
      await tx.wishlistItem.deleteMany({ where: { productId: p.id } });
      await tx.review.deleteMany({ where: { productId: p.id } });
      await tx.productImage.deleteMany({ where: { productId: p.id } });
      await tx.productVariant.deleteMany({ where: { productId: p.id } });

      // 3. Delete product
      await tx.product.delete({ where: { id: p.id } });
    });
  }

  console.log("All archived products successfully deleted!");

  const remaining = await prisma.product.findMany();
  console.log(`Total remaining products in catalog: ${remaining.length}`);
  for (const r of remaining) {
    console.log(`- ${r.name} (${r.status})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
