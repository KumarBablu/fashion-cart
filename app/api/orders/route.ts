import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { checkoutSchema } from "@/lib/validation/schemas";
import { createOrderFromCart, CheckoutError } from "@/lib/orders/create-order";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [garmentsOrders, jewelleryOrders] = await Promise.all([
    getDb("garments").order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true, payment: true, invoice: true },
    }).catch(() => []),
    getDb("jewellery").order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true, payment: true, invoice: true },
    }).catch(() => []),
  ]);

  const allOrders = [...garmentsOrders, ...jewelleryOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ orders: allOrders });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const order = await createOrderFromCart({
      userId: user.id,
      addressId: parsed.data.addressId,
      couponCode: parsed.data.couponCode,
      paymentMethod: parsed.data.paymentMethod,
      customerNotes: parsed.data.customerNotes,
    });

    const settings = await getDb("garments").paymentSettings.findFirst({ where: { isActive: true } });

    return NextResponse.json(
      {
        order,
        paymentSettings: settings
          ? {
              qrCodePath: settings.qrCodePath,
              upiId: settings.upiId,
              instructions: settings.instructions,
              codEnabled: settings.codEnabled,
              codFee: Number(settings.codFee),
            }
          : null,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal order error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
