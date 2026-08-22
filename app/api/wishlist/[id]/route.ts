import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Check garments database
  const garmentsDb = getDb("garments");
  const garmentsItem = await garmentsDb.wishlistItem.findUnique({
    where: { id },
    include: { wishlist: true },
  });

  if (garmentsItem && garmentsItem.wishlist.userId === user.id) {
    await garmentsDb.wishlistItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  // Check jewellery database
  const jewelleryDb = getDb("jewellery");
  const jewelleryItem = await jewelleryDb.wishlistItem.findUnique({
    where: { id },
    include: { wishlist: true },
  });

  if (jewelleryItem && jewelleryItem.wishlist.userId === user.id) {
    await jewelleryDb.wishlistItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
}
