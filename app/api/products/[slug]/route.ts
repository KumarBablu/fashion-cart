import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { productSchema } from "@/lib/validation/schemas";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: [{ colour: "asc" }, { size: "asc" }] },
      category: { include: { parent: true } },
    },
  });

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, status: "ACTIVE", id: { not: product.id } },
    take: 8,
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { where: { isActive: true } } },
  });

  return NextResponse.json({ product, related });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const product = await prisma.product.update({ where: { slug }, data: parsed.data });
  return NextResponse.json({ product });
}

// Archive rather than hard-delete when historical orders reference this product.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const product = await prisma.product.update({ where: { slug }, data: { status: "ARCHIVED" } });
  return NextResponse.json({ product });
}
