import { prisma } from "../lib/db";

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { payment: true },
  });

  console.log("Recent orders:");
  for (const o of orders) {
    console.log(`Order ${o.orderNumber}: status=${o.status}, paymentStatus=${o.payment?.status}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
