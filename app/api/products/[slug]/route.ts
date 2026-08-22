import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { productSchema } from "@/lib/validation/schemas";

async function findProductAndStore(slug: string) {
  // Check garments first
  let store: "garments" | "jewellery" = "garments";
  let product = await getDb("garments").product.findFirst({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: [{ colour: "asc" }, { size: "asc" }] },
      category: { include: { parent: true } },
    },
  });

  if (!product) {
    store = "jewellery";
    product = await getDb("jewellery").product.findFirst({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true }, orderBy: [{ colour: "asc" }, { size: "asc" }] },
        category: { include: { parent: true } },
      },
    });
  }

  return { product, store };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { product, store } = await findProductAndStore(slug);

  if (!product || product.status !== "ACTIVE") {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const related = await getDb(store).product.findMany({
    where: { categoryId: product.categoryId, status: "ACTIVE", id: { not: product.id } },
    take: 8,
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { where: { isActive: true } } },
  });

  return NextResponse.json({ product, related, store });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const { store } = await findProductAndStore(slug);

  const body = await req.json().catch(() => null);
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const product = await getDb(store).product.update({ where: { slug }, data: parsed.data });
  return NextResponse.json({ product });
}

// Archive rather than hard-delete when historical orders reference this product.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const { store } = await findProductAndStore(slug);

  const product = await getDb(store).product.update({ where: { slug }, data: { status: "ARCHIVED" } });
  return NextResponse.json({ product });
}
