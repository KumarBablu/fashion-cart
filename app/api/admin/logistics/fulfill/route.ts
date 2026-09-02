import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { fulfillOrder, batchFulfillOrders } from "@/lib/logistics/service";

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { orderId, orderIds, preferredCourierId, store = "garments" } = body;

  try {
    // Batch fulfillment
    if (Array.isArray(orderIds) && orderIds.length > 0) {
      const results = await batchFulfillOrders(orderIds, store);
      return NextResponse.json({ success: true, results });
    }

    // Single order 1-click fulfillment
    if (orderId) {
      const result = await fulfillOrder(orderId, preferredCourierId, store);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "orderId or orderIds required" }, { status: 400 });
  } catch (err: any) {
    console.error("[LogisticsFulfill] Error:", err);
    return NextResponse.json({ error: err.message || "Fulfillment failed" }, { status: 500 });
  }
}
