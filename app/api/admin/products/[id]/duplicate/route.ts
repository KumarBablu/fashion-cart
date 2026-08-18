import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const original = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true,
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
    const newName = `${original.name} (Copy)`;

    const duplicated = await prisma.product.create({
      data: {
        name: newName,
        slug: newSlug,
        description: original.description,
        categoryId: original.categoryId,
        brand: original.brand,
        fabric: original.fabric,
        status: "DRAFT", // Duplicated items start as DRAFT for safe editing
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false,
        tags: original.tags,
        specifications: original.specifications as object,
        sizeChart: original.sizeChart as object,
        images: {
          create: original.images.map((img) => ({
            imageUrl: img.imageUrl,
            altText: img.altText,
            sortOrder: img.sortOrder,
          })),
        },
        variants: {
          create: original.variants.map((v, i) => ({
            sku: `${v.sku}-COPY-${Date.now().toString().slice(-4)}-${i + 1}`,
            colour: v.colour,
            size: v.size,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stockQuantity: v.stockQuantity,
            isActive: true,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, product: duplicated }, { status: 201 });
  } catch (err: unknown) {
    console.error("Duplicate product error:", err);
    return NextResponse.json({ error: "Failed to duplicate product" }, { status: 500 });
  }
}
