import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { sellerSchema } from "@/lib/validation/schemas";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = sellerSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const seller = await prisma.seller.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, seller });
  } catch (error) {
    console.error("Error updating seller:", error);
    return NextResponse.json({ error: "Failed to update seller" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Unlink products first then delete seller
    await prisma.product.updateMany({
      where: { sellerId: id },
      data: { sellerId: null },
    });

    await prisma.seller.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Seller deleted successfully" });
  } catch (error) {
    console.error("Error deleting seller:", error);
    return NextResponse.json({ error: "Failed to delete seller" }, { status: 500 });
  }
}
