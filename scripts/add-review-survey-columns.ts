import { prisma } from "../lib/db";

async function addSurveyColumns() {
  console.log("=== ADDING STRUCTURED SURVEY COLUMNS TO REVIEW TABLE ===");

  const columns = [
    `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "fitRating" TEXT;`,
    `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "qualityRating" INTEGER;`,
    `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "colorAccuracy" TEXT;`,
    `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "comfortRating" INTEGER;`,
    `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "valueRating" INTEGER;`,
    `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "sizePurchased" TEXT;`,
    `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "occasionWorn" TEXT;`,
    `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "recommend" BOOLEAN DEFAULT TRUE;`,
  ];

  for (const sql of columns) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log("Executed:", sql);
    } catch (e) {
      console.error("Error executing SQL:", sql, e);
    }
  }

  console.log("✅ All survey columns added to PostgreSQL Review table successfully!");
}

addSurveyColumns()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
