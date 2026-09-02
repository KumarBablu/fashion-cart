import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { getLogisticsProvider, getDefaultPickupLocation } from "@/lib/logistics/service";

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    deliveryPincode,
    weightKg = 0.5,
    isCod = false,
    orderTotal = 1000,
    store = "garments",
  } = body;

  if (!deliveryPincode || deliveryPincode.trim().length !== 6) {
    return NextResponse.json({ error: "Please provide a valid 6-digit destination pincode" }, { status: 400 });
  }

  try {
    const pickup = await getDefaultPickupLocation(store);
    const provider = await getLogisticsProvider();

    const rates = await provider.checkServiceability({
      pickupPincode: pickup.pinCode,
      deliveryPincode: deliveryPincode.trim(),
      weightKg: Number(weightKg),
      isCod: Boolean(isCod),
      orderTotal: Number(orderTotal),
    });

    return NextResponse.json({
      success: true,
      pickupPincode: pickup.pinCode,
      deliveryPincode: deliveryPincode.trim(),
      rates,
    });
  } catch (err: any) {
    console.error("[LogisticsCalculator] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to calculate rates" }, { status: 500 });
  }
}
