import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "orders";

  if (type === "orders") {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, payment: true, items: true },
    });

    const headers = "Order Number,Customer Name,Customer Email,Status,Payment Method,Payment Status,Items Count,Subtotal,Discount,Delivery,Total,Date\n";
    const rows = orders.map((o) => {
      return `"${o.orderNumber}","${o.user.name}","${o.user.email}","${o.status}","${o.paymentMethod}","${o.payment?.status || "N/A"}",${o.items.length},${o.subtotal},${o.discount},${o.deliveryCharge},${o.total},"${o.createdAt.toISOString()}"`;
    }).join("\n");

    return new NextResponse(headers + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } else if (type === "customers") {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    });

    const headers = "Customer Name,Email,Phone,Orders Count,Active,Registered Date\n";
    const rows = customers.map((c) => {
      return `"${c.name}","${c.email}","${c.phone || ""}","${c._count.orders}","${c.isActive}","${c.createdAt.toISOString()}"`;
    }).join("\n");

    return new NextResponse(headers + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } else {
    const products = await prisma.product.findMany({
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
    });

    const headers = "Product Name,Slug,Category,Brand,Fabric,Variants Count,Total Stock,Status\n";
    const rows = products.map((p) => {
      const stock = p.variants.reduce((s, v) => s + v.stockQuantity, 0);
      return `"${p.name}","${p.slug}","${p.category.name}","${p.brand || ""}","${p.fabric || ""}",${p.variants.length},${stock},"${p.status}"`;
    }).join("\n");

    return new NextResponse(headers + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }
}
