import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, slug: true, brand: true },
  });
  console.log("Active Products in DB:", products);
}

main().finally(() => prisma.$disconnect());
