import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validation/schemas";

// Public & Admin: list categories (with subcategories and product counts).
export async function GET(req: NextRequest) {
  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "true";
  const whereClause = includeInactive ? {} : { isActive: true };

  const categories = await prisma.category.findMany({
    where: whereClause,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      children: {
        where: whereClause,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          _count: {
            select: { products: true },
          },
        },
      },
      _count: {
        select: { products: true },
      },
    },
  });

  const topLevel = categories.filter((c) => !c.parentId);
  return NextResponse.json({ categories: topLevel });
}

// Admin only: create a category or subcategory.
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });
  }

  const category = await prisma.category.create({ data: parsed.data });
  return NextResponse.json({ category }, { status: 201 });
}
