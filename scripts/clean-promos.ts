import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Set Welcome2 (the jewelry promotion) as sortOrder 0 and active
  await prisma.promotion.updateMany({
    where: { title: "Welcome2" },
    data: { sortOrder: 0, isActive: true, placement: "POPUP_MODAL" },
  });

  // Deactivate old test duplicate modal
  await prisma.promotion.updateMany({
    where: { title: "Welcome" },
    data: { isActive: false },
  });

  // Ensure top announcement bar is active
  await prisma.promotion.updateMany({
    where: { placement: "TOP_BANNER" },
    data: { isActive: true },
  });

  const promos = await prisma.promotion.findMany({
    where: { isActive: true },
    select: { title: true, placement: true, isActive: true, sortOrder: true },
  });
  console.log("Active Live Promotions:", promos);
}

main().finally(() => prisma.$disconnect());
