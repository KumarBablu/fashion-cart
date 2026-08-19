import { prisma } from "../lib/db";

async function main() {
  console.log("Ensuring Promotion table and enums exist in PostgreSQL...");

  // 1. Create Enums if they don't exist
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "PromotionPlacement" AS ENUM ('TOP_BANNER', 'POPUP_MODAL', 'HERO_SPOTLIGHT', 'FLOAT_SNACKBAR');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "PromotionTheme" AS ENUM ('FESTIVE_GOLD', 'ROYAL_RUBY', 'EMERALD_EID', 'SUNSET_ORANGE', 'MODERN_DARK');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // 2. Create Promotion table if not exists
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Promotion" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "subtitle" TEXT,
      "badgeText" TEXT,
      "imageUrl" TEXT,
      "ctaText" TEXT DEFAULT 'Shop Now',
      "ctaUrl" TEXT DEFAULT '/shop',
      "discountCode" TEXT,
      "placement" "PromotionPlacement" NOT NULL DEFAULT 'TOP_BANNER',
      "theme" "PromotionTheme" NOT NULL DEFAULT 'FESTIVE_GOLD',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "showOnLogin" BOOLEAN NOT NULL DEFAULT false,
      "showOnGuest" BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "startDate" TIMESTAMP(3),
      "endDate" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Promotion_placement_isActive_idx" ON "Promotion"("placement", "isActive");
  `);

  console.log("Promotion table ready!");

  // 3. Seed default active sample promotion if none exists
  const count = await prisma.promotion.count();
  if (count === 0) {
    await prisma.promotion.createMany({
      data: [
        {
          title: "Grand Festive Gala Offer — Flat 20% OFF",
          subtitle: "Explore handcrafted pure mulberry silk sarees, bespoke linen shirts, and royal wedding kurtis.",
          badgeText: "FESTIVE DROP",
          discountCode: "FESTIVE20",
          ctaText: "Explore Collection",
          ctaUrl: "/shop",
          placement: "TOP_BANNER",
          theme: "FESTIVE_GOLD",
          isActive: true,
          showOnGuest: true,
          showOnLogin: false,
          sortOrder: 1,
        },
        {
          title: "Welcome to Fashion Cart Premium Outlet",
          subtitle: "Unlock exclusive member privileges and enjoy 10% OFF your maiden artisanal order with complimentary express delivery.",
          badgeText: "VIP WELCOME",
          imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
          discountCode: "FIRST10",
          ctaText: "Claim VIP Offer",
          ctaUrl: "/shop?sort=newest",
          placement: "POPUP_MODAL",
          theme: "FESTIVE_GOLD",
          isActive: true,
          showOnGuest: true,
          showOnLogin: true,
          sortOrder: 1,
        },
      ],
    });
    console.log("Seeded 2 default luxury promotions!");
  } else {
    console.log(`Found ${count} existing promotions in database.`);
  }
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
