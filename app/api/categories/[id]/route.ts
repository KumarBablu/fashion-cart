import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validation/schemas";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  // Check duplicate slug on another category
  if (parsed.data.slug) {
    const duplicate = await prisma.category.findFirst({
      where: {
        slug: parsed.data.slug,
        id: { not: id },
      },
    });
    if (duplicate) {
      return NextResponse.json({ error: "Another category with this slug already exists." }, { status: 409 });
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ category });
}

// Delete / Archive category or subcategory
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hardDelete = req.nextUrl.searchParams.get("hard") === "true";

  // Check if any products are assigned to this category
  const productCount = await prisma.product.count({
    where: { categoryId: id },
  });

  if (hardDelete && productCount === 0) {
    // Also delete any subcategories if deleting parent
    await prisma.category.deleteMany({ where: { parentId: id } });
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Category deleted permanently." });
  }

  // Soft archive to protect catalog integrity
  const category = await prisma.category.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ category, archived: true, productsAttached: productCount });
}
