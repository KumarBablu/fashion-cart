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

async function findStoreForCategory(categoryId: string): Promise<"garments" | "jewellery"> {
  const inGarments = await getDb("garments").category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (inGarments) return "garments";
  return "jewellery";
}

async function getFallbackCategory(store: "garments" | "jewellery", excludeId: string): Promise<string> {
  const db = getDb(store);
  let fallback = await db.category.findFirst({
    where: {
      id: { not: excludeId },
      parentId: null,
      isActive: true,
    },
  });

  if (!fallback) {
    fallback = await db.category.create({
      data: {
        name: store === "jewellery" ? "Fine Jewellery" : "Apparel & Couture",
        slug: `${store === "jewellery" ? "fine-jewellery" : "apparel-couture"}-${Date.now().toString().slice(-4)}`,
        isActive: true,
      },
    });
  }

  return fallback.id;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });

  const { id } = await params;
  const store = await findStoreForCategory(id);
  const db = getDb(store);

  try {
    const body = await req.json().catch(() => null);
    const parsed = categorySchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    let finalSlug = parsed.data.slug;
    if (finalSlug) {
      finalSlug = slugify(finalSlug);
      // Check duplicate slug on another category
      const duplicate = await db.category.findFirst({
        where: {
          slug: finalSlug,
          id: { not: id },
        },
      });

      if (duplicate) {
        let counter = 1;
        while (
          await db.category.findFirst({
            where: { slug: `${finalSlug}-${counter}`, id: { not: id } },
          })
        ) {
          counter++;
        }
        finalSlug = `${finalSlug}-${counter}`;
      }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(finalSlug ? { slug: finalSlug } : {}),
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// Delete category or subcategory with safe foreign key resolution
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });

  const { id } = await params;
  const store = await findStoreForCategory(id);
  const db = getDb(store);

  try {
    const target = await db.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
      },
    });

    if (!target) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const isSubcategory = !!target.parentId;

    if (isSubcategory) {
      // Reassign all products from this subcategory to the parent category (or fallback)
      const targetParentId = target.parentId || (await getFallbackCategory(store, id));
      await db.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: targetParentId },
      });

      // Now safely delete the subcategory
      await db.category.delete({ where: { id } });

      return NextResponse.json({
        success: true,
        message: `Subcategory "${target.name}" removed successfully.`,
      });
    }

    // It's a parent department category:
    const fallbackId = await getFallbackCategory(store, id);
    const childIds = target.children.map((c) => c.id);

    // 1. Reassign products in child subcategories and parent category to fallback
    if (childIds.length > 0) {
      await db.product.updateMany({
        where: { categoryId: { in: childIds } },
        data: { categoryId: fallbackId },
      });

      // Delete all child subcategories
      await db.category.deleteMany({
        where: { id: { in: childIds } },
      });
    }

    // Reassign products attached directly to parent category
    await db.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: fallbackId },
    });

    // Delete the parent category
    await db.category.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Department "${target.name}" and subcategories deleted cleanly.`,
    });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to remove category" },
      { status: 500 }
    );
  }
}
