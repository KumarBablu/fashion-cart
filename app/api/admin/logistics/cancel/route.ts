import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getLogisticsProvider } from "@/lib/logistics/service";

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { orderId, store = "garments" } = body;

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const db = getDb(store);
  const shipment = await db.shipment.findUnique({
    where: { orderId },
  });

  if (!shipment) {
    return NextResponse.json({ error: "No active shipment found for this order" }, { status: 404 });
  }

  try {
    const provider = await getLogisticsProvider();
    await provider.cancelShipment(shipment.awbNumber);

    await db.shipment.update({
      where: { id: shipment.id },
      data: {
        status: "CANCELLED",
        statusDescription: "Shipment cancelled by admin",
      },
    });

    return NextResponse.json({ success: true, message: "Shipment cancelled successfully" });
  } catch (err: any) {
    console.error("[LogisticsCancel] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to cancel shipment" }, { status: 500 });
  }
}
