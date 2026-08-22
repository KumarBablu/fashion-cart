import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validation/schemas";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Public & Admin: list categories (with subcategories and product counts).
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  const storeParam = req.nextUrl.searchParams.get("store");
  const cookieStore = req.cookies.get("fc_admin_store")?.value;
  const store = storeParam === "jewellery" || (!storeParam && cookieStore === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "true" || !!admin;
  const whereClause = includeInactive
    ? {}
    : {
        isActive: true,
        OR: [
          { products: { some: { status: "ACTIVE" as const } } },
          { children: { some: { isActive: true, products: { some: { status: "ACTIVE" as const } } } } },
        ],
      };

  const childrenWhereClause = includeInactive
    ? {}
    : {
        isActive: true,
        products: { some: { status: "ACTIVE" as const } },
      };

  try {
    const categories = await db.category.findMany({
      where: whereClause,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        children: {
          where: childrenWhereClause,
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
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// Admin only: create a category or subcategory with safe slug deduplication.
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });

  const storeParam = req.nextUrl.searchParams.get("store");
  const cookieStore = req.cookies.get("fc_admin_store")?.value;
  const store = storeParam === "jewellery" || (!storeParam && cookieStore === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  try {
    const body = await req.json().catch(() => null);
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    let targetSlug = parsed.data.slug || slugify(parsed.data.name);
    if (!targetSlug || targetSlug.length < 2) {
      targetSlug = slugify(parsed.data.name) || `cat-${Date.now().toString().slice(-4)}`;
    }

    // If subcategory, prefix parent slug if collision occurs
    if (parsed.data.parentId) {
      const parent = await db.category.findUnique({ where: { id: parsed.data.parentId } });
      if (parent && !targetSlug.startsWith(parent.slug)) {
        const directMatch = await db.category.findUnique({ where: { slug: targetSlug } });
        if (directMatch) {
          targetSlug = `${parent.slug}-${targetSlug}`;
        }
      }
    }

    // Deduplicate slug if already taken
    let finalSlug = targetSlug;
    let counter = 1;
    while (await db.category.findUnique({ where: { slug: finalSlug } })) {
      counter++;
      finalSlug = `${targetSlug}-${counter}`;
    }

    const category = await db.category.create({
      data: {
        name: parsed.data.name.trim(),
        slug: finalSlug,
        imageUrl: parsed.data.imageUrl || null,
        parentId: parsed.data.parentId || null,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
