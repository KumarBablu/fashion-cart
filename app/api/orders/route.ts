import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { checkoutSchema } from "@/lib/validation/schemas";
import { createOrder, createOrderFromCart, CheckoutError } from "@/lib/orders/create-order";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [garmentsOrders, jewelleryOrders] = await Promise.all([
    getDb("garments").order.findMany({
      where: { user: { email: user.email } },
      orderBy: { createdAt: "desc" },
      include: { items: true, payment: true, invoice: true },
    }).catch(() => []),
    getDb("jewellery").order.findMany({
      where: { user: { email: user.email } },
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
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const sp = req.nextUrl.searchParams;
  const cookieStore = req.cookies.get("fc_store")?.value;
  const explicitStore = (body?.store || sp.get("store") || cookieStore) as "garments" | "jewellery" | undefined;
  const store = explicitStore === "jewellery" ? "jewellery" : "garments";

  try {
    const order = await createOrder(user.id, parsed.data.addressId, {
      couponCode: parsed.data.couponCode,
      paymentMethod: parsed.data.paymentMethod,
      customerNotes: parsed.data.customerNotes,
      store,
      variantId: parsed.data.variantId,
      quantity: parsed.data.quantity,
    });

    const settings = await getDb(store).paymentSettings.findFirst({ where: { isActive: true } }).catch(() => null);

    return NextResponse.json(
      {
        order,
        store,
        paymentSettings: settings
          ? {
              qrCodePath: settings.qrCodePath,
              upiId: settings.upiId,
              instructions: settings.instructions,
              manualUpiEnabled: settings.manualUpiEnabled ?? true,
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
