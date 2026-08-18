import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { productSchema } from "@/lib/validation/schemas";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const q = sp.get("q")?.trim();
  const category = sp.get("category");
  const subcategory = sp.get("subcategory");
  const minPrice = sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined;
  const maxPrice = sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined;
  const size = sp.get("size");
  const colour = sp.get("colour");
  const inStock = sp.get("inStock") === "true";
  const onSale = sp.get("onSale") === "true";
  const brand = sp.get("brand");
  const sort = sp.get("sort") ?? "newest";
  const page = Math.max(1, Number(sp.get("page") ?? 1));

  const categorySlug = subcategory ?? category;

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    category: {
      isActive: true,
      OR: [
        { parentId: null },
        { parent: { isActive: true } },
      ],
      ...(categorySlug
        ? {
            OR: [
              { slug: categorySlug },
              { parent: { slug: categorySlug, isActive: true } },
            ],
          }
        : {}),
    },
    ...(brand ? { brand: { equals: brand, mode: "insensitive" } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
            { category: { parent: { name: { contains: q, mode: "insensitive" } } } },
            { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
            { variants: { some: { colour: { contains: q, mode: "insensitive" } } } },
            { variants: { some: { size: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
    variants: {
      some: {
        isActive: true,
        ...(minPrice !== undefined ? { price: { gte: minPrice } } : {}),
        ...(maxPrice !== undefined ? { price: { lte: maxPrice } } : {}),
        ...(size ? { size: { equals: size, mode: "insensitive" } } : {}),
        ...(colour ? { colour: { equals: colour, mode: "insensitive" } } : {}),
        ...(inStock ? { stockQuantity: { gt: 0 } } : {}),
        ...(onSale ? { compareAtPrice: { not: null } } : {}),
      },
    },
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "popular"
      ? { createdAt: "desc" } // Placeholder until order-count based popularity is added
      : sort === "newest"
      ? { createdAt: "desc" }
      : { createdAt: "desc" };

  const limit = sp.get("take") ? Math.min(50, Number(sp.get("take"))) : PAGE_SIZE;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { where: { isActive: true }, orderBy: { price: "asc" } },
        category: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Price sort applied post-fetch on the cheapest active variant, since
  // price lives on variants rather than the product itself.
  let sorted = items;
  if (sort === "price_asc" || sort === "price_desc") {
    sorted = [...items].sort((a, b) => {
      const pa = Math.min(...a.variants.map((v) => v.price.toNumber()));
      const pb = Math.min(...b.variants.map((v) => v.price.toNumber()));
      return sort === "price_asc" ? pa - pb : pb - pa;
    });
  } else if (sort === "discount") {
    sorted = [...items].sort((a, b) => {
      const discA = Math.max(
        0,
        ...a.variants.map((v) =>
          v.compareAtPrice ? v.compareAtPrice.toNumber() - v.price.toNumber() : 0
        )
      );
      const discB = Math.max(
        0,
        ...b.variants.map((v) =>
          v.compareAtPrice ? v.compareAtPrice.toNumber() - v.price.toNumber() : 0
        )
      );
      return discB - discA;
    });
  }

  return NextResponse.json({
    products: sorted,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

// Admin only: create a product (variants/images added via separate calls).
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });
  }

  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json({ product }, { status: 201 });
}
