import { PrismaClient } from "@prisma/client";
import { normalizeImageUrl } from "../lib/utils/imageUrl";

const prisma = new PrismaClient();

async function main() {
  const promos = await prisma.promotion.findMany();
  console.log("Current Promotions in DB:", JSON.stringify(promos, null, 2));

  // If any promo has a google share link, let's normalize it
  for (const p of promos) {
    if (p.imageUrl) {
      const normalized = normalizeImageUrl(p.imageUrl);
      console.log(`Promo "${p.title}" image normalized from: ${p.imageUrl} -> ${normalized}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
