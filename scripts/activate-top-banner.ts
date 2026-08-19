import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.promotion.updateMany({
    where: { placement: "TOP_BANNER" },
    data: { isActive: true },
  });
  console.log("Top banner activated successfully!");
}

main().finally(() => prisma.$disconnect());
