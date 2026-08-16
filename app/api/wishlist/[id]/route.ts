import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const item = await prisma.wishlistItem.findUnique({ where: { id }, include: { wishlist: true } });
  if (!item || item.wishlist.userId !== user.id) {
    return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
  }

  await prisma.wishlistItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
