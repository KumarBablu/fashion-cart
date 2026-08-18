import { prisma } from "../lib/db";

async function checkProduct() {
  const slug = "kids-unisex-combed-cotton-nightwear-set";
  const p = await prisma.product.findFirst({
    where: { slug },
    include: {
      category: {
        include: {
          parent: true,
        },
      },
    },
  });

  console.log("Product found:", p?.name, "status:", p?.status);
  console.log("Category:", p?.category?.name, "isActive:", p?.category?.isActive);
  console.log("Parent Category:", p?.category?.parent?.name, "isActive:", p?.category?.parent?.isActive);
}

checkProduct()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
