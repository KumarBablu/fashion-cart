import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const promos = await prisma.promotion.findMany();
  for (const promo of promos) {
    if (promo.imageUrl && promo.imageUrl.includes("share.google")) {
      try {
        const res = await fetch(promo.imageUrl, { redirect: "follow" });
        const finalUrl = res.url;
        const match = finalUrl.match(/[?&]imgurl=([^&]+)/);
        if (match && match[1]) {
          const resolved = decodeURIComponent(match[1]);
          console.log(`Resolved promo "${promo.title}" from ${promo.imageUrl} -> ${resolved}`);
          await prisma.promotion.update({
            where: { id: promo.id },
            data: { imageUrl: resolved, isActive: true },
          });
        }
      } catch (err) {
        console.error("Error resolving:", err);
      }
    }
  }

  const updated = await prisma.promotion.findMany();
  console.log("Updated Promotions in DB:", updated.map(p => ({ title: p.title, imageUrl: p.imageUrl, isActive: p.isActive })));
}

main().finally(() => prisma.$disconnect());
