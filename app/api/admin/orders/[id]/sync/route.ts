import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { syncOrderPaymentWithGateway } from "@/lib/payments/sync";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const store = (body?.store === "jewellery" ? "jewellery" : "garments") as "garments" | "jewellery";

    const result = await syncOrderPaymentWithGateway(id, store);

    return NextResponse.json({
      success: true,
      result,
      message: result.isRefunded
        ? `Live status synced: Refund is ${result.refundStatus} (${result.refundId})`
        : "Live payment status verified with gateway.",
    });
  } catch (err: any) {
    console.error("[GatewaySyncRoute] Error:", err);
    return NextResponse.json({ error: err.message || "Sync failed" }, { status: 500 });
  }
}
