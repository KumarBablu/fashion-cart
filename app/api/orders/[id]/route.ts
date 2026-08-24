import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const orderInclude = {
    items: {
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: "asc" as const } },
          },
        },
      },
    },
    payment: true,
    invoice: true,
    address: true,
  };

  const [garmentsOrder, jewelleryOrder] = await Promise.all([
    getDb("garments").order.findFirst({
      where: { id, userId: user.id },
      include: orderInclude,
    }).catch(() => null),
    getDb("jewellery").order.findFirst({
      where: { id, userId: user.id },
      include: orderInclude,
    }).catch(() => null),
  ]);

  let store: "garments" | "jewellery" = "garments";
  let order = garmentsOrder;
  if (!order && jewelleryOrder) {
    order = jewelleryOrder;
    store = "jewellery";
  }

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const db = getDb(store);
  const settings = await db.paymentSettings.findFirst({ where: { isActive: true } }).catch(() => null);

  return NextResponse.json({
    order,
    paymentSettings: settings
      ? { qrCodePath: settings.qrCodePath, upiId: settings.upiId, payeeName: settings.payeeName, instructions: settings.instructions }
      : null,
  });
}
