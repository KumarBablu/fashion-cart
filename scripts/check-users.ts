import { getDb } from "../lib/db";

async function main() {
  const garmentsDb = getDb("garments");
  const jewelleryDb = getDb("jewellery");

  const [garmentsUsers, jewelleryUsers] = await Promise.all([
    garmentsDb.user.findMany({ select: { id: true, email: true, name: true, role: true } }),
    jewelleryDb.user.findMany({ select: { id: true, email: true, name: true, role: true } }),
  ]);

  console.log("=== GARMENTS USERS ===");
  console.log(JSON.stringify(garmentsUsers, null, 2));

  console.log("\n=== JEWELLERY USERS ===");
  console.log(JSON.stringify(jewelleryUsers, null, 2));
}

main().catch(console.error);
