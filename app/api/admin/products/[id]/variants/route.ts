import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { variantSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = variantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const existingSku = await prisma.productVariant.findUnique({ where: { sku: parsed.data.sku } });
  if (existingSku) {
    return NextResponse.json({ error: "A variant with this SKU already exists." }, { status: 409 });
  }

  const variant = await prisma.productVariant.create({
    data: { ...parsed.data, productId: id },
  });

  if (parsed.data.stockQuantity > 0) {
    await prisma.inventoryTransaction.create({
      data: {
        variantId: variant.id,
        type: "STOCK_IN",
        quantity: parsed.data.stockQuantity,
        notes: "Initial stock on variant creation",
      },
    });
  }

  return NextResponse.json({ variant }, { status: 201 });
}
