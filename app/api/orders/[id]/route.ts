import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let store: "garments" | "jewellery" = "garments";
  let order = await getDb("garments").order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
      payment: true,
      invoice: true,
      address: true,
    },
  });

  if (!order) {
    order = await getDb("jewellery").order.findFirst({
      where: { id, userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
        payment: true,
        invoice: true,
        address: true,
      },
    });
    if (order) {
      store = "jewellery";
    }
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
