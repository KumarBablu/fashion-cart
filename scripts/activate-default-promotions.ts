import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Activating default promotions in database...");

  // 1. Activate Top Banner
  await prisma.promotion.updateMany({
    where: { placement: "TOP_BANNER" },
    data: { isActive: true },
  });

  // 2. Activate Popup Modal (with 0 min delay or default)
  await prisma.promotion.updateMany({
    where: { placement: "POPUP_MODAL" },
    data: { isActive: true, showOnLogin: true, showOnGuest: true },
  });

  const all = await prisma.promotion.findMany();
  console.log("Promotions status in DB:", all.map(p => ({ title: p.title, placement: p.placement, isActive: p.isActive, delayMinutes: p.delayMinutes })));
}

main().finally(() => prisma.$disconnect());
