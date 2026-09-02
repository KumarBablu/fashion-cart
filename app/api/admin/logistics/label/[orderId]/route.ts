import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { getOrderShippingLabelPdf } from "@/lib/logistics/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const { searchParams } = new URL(req.url);
  const store = (searchParams.get("store") as "garments" | "jewellery") || "garments";

  try {
    const pdfBuffer = await getOrderShippingLabelPdf(orderId, store);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="shipping-label-${orderId}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("[ShippingLabel] Error generating PDF:", err);
    return NextResponse.json({ error: err.message || "Failed to generate label" }, { status: 500 });
  }
}
