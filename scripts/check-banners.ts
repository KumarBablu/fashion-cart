import { prisma } from "../lib/db";

async function main() {
  const banners = await prisma.banner.findMany();
  console.log("Existing Banners count:", banners.length);
  banners.forEach((b) => console.log(b));
}

main().catch(console.error).finally(() => prisma.$disconnect());
