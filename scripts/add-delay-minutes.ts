import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking and adding delayMinutes column to Promotion table...");
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Promotion" ADD COLUMN IF NOT EXISTS "delayMinutes" INTEGER NOT NULL DEFAULT 0;
    `);
    console.log("Successfully added delayMinutes column to Promotion table!");
  } catch (err) {
    console.error("Error adding column:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
