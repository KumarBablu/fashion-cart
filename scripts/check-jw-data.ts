import { getDb } from "../lib/db";

async function main() {
  const jwDb = getDb("jewellery");

  const [addresses, carts, orders, sessions] = await Promise.all([
    jwDb.address.findMany({ select: { id: true, userId: true, fullName: true, addressLine1: true } }),
    jwDb.cart.findMany({ select: { id: true, userId: true } }),
    jwDb.order.findMany({ select: { id: true, userId: true, orderNumber: true } }),
    jwDb.session.findMany({ select: { id: true, userId: true } }),
  ]);

  console.log("=== JEWELLERY DB DATA ===");
  console.log("Addresses:", addresses);
  console.log("Carts:", carts);
  console.log("Orders:", orders);
  console.log("Sessions:", sessions);
}

main().catch(console.error);
