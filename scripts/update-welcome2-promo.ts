import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.promotion.updateMany({
    where: { title: "Welcome2" },
    data: {
      imageUrl: "https://www.antarajewellery.com/wp-content/uploads/2023/07/1-1-scaled.jpg",
      isActive: true,
      placement: "POPUP_MODAL",
      delayMinutes: 0,
      showOnLogin: true,
      showOnGuest: true,
    },
  });
  console.log("Welcome2 updated with direct image link and set to active!");
}

main().finally(() => prisma.$disconnect());
