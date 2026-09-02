import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { getOrderCourierRates } from "@/lib/logistics/service";

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const store = (searchParams.get("store") as "garments" | "jewellery") || "garments";

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  try {
    const data = await getOrderCourierRates(orderId, store);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[LogisticsRates] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch rates" }, { status: 500 });
  }
}
