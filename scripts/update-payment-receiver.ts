import { prisma } from "../lib/db";

async function main() {
  const existing = await prisma.paymentSettings.findFirst({ where: { isActive: true } });
  if (existing) {
    const updated = await prisma.paymentSettings.update({
      where: { id: existing.id },
      data: {
        upiId: "9771039201@upi",
        payeeName: "Bablu Kumar",
      },
    });
    console.log("Updated PaymentSettings in DB:", updated);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
