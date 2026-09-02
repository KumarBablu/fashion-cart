import { getDb } from "../lib/db";

async function main() {
  console.log("Checking and syncing cancelled orders...");

  for (const store of ["garments", "jewellery"] as const) {
    const db = getDb(store);
    const cancelledOrders = await db.order.findMany({
      where: {
        OR: [
          { cancelReason: { not: null } },
          { cancelledAt: { not: null } },
          { cancellationStatus: { not: null } },
        ],
      },
      include: { shipment: true },
    });

    console.log(`Found ${cancelledOrders.length} cancelled order(s) in ${store} DB.`);
    for (const ord of cancelledOrders) {
      console.log(`- Syncing #${ord.orderNumber} (Reason: ${ord.cancelReason || "Cancelled"})`);
      // Update status to CANCELLED if it was changed to PACKED
      await db.order.update({
        where: { id: ord.id },
        data: {
          status: "CANCELLED",
          cancellationStatus: "COMPLETED",
        },
      });

      // If a shipment was assigned to this cancelled order, delete the shipment record
      if (ord.shipment) {
        await db.shipmentActivity.deleteMany({ where: { shipmentId: ord.shipment.id } }).catch(() => {});
        await db.shipment.delete({ where: { id: ord.shipment.id } }).catch(() => {});
        console.log(`  ✓ Voided and removed shipment/AWB ${ord.shipment.awbNumber} for cancelled order.`);
      }
    }
  }

  console.log("Done syncing cancelled orders!");
}

main().catch(console.error);
