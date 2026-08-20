import { prisma } from "../lib/db";

async function main() {
  const paymentSettings = await prisma.paymentSettings.findFirst();
  console.log("Current PaymentSettings:", paymentSettings);

  const businessSettings = await prisma.businessSettings.findFirst();
  console.log("Current BusinessSettings:", businessSettings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
