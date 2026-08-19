import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const promos = await prisma.promotion.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  console.log("All DB Promotions:", promos.map(p => ({
    id: p.id,
    title: p.title,
    placement: p.placement,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    imageUrl: p.imageUrl,
    ctaUrl: p.ctaUrl,
  })));
}

main().finally(() => prisma.$disconnect());
