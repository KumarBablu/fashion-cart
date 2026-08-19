import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.promotion.updateMany({
    where: { title: "Welcome to Fashion Cart Premium Outlet" },
    data: { placement: "HERO_SPOTLIGHT" },
  });
  console.log("Welcome to Fashion Cart Premium Outlet converted to HERO_SPOTLIGHT!");
}

main().finally(() => prisma.$disconnect());
