import { getDb } from "../lib/db";

async function main() {
  for (const store of ["garments", "jewellery"] as const) {
    const db = getDb(store);
    console.log(`\n=== Store: ${store} ===`);
    const business = await db.businessSettings.findFirst();
    console.log("BusinessSettings:", business);

    const counters = await db.counter.findMany({
      where: {
        id: { in: ["store-control-garments", "store-control-jewellery"] },
      },
    });
    console.log("Store Control Counters:", counters);
  }
}

main().catch(console.error);
