import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import ProductsManager from "@/components/admin/ProductsManager";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | undefined>;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieStoreVal = cookieStore.get("fc_admin_store")?.value;

  const store = sp.store === "jewellery" || (!sp.store && cookieStoreVal === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  const [products, categories] = await Promise.all([
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            colour: true,
            size: true,
            price: true,
            compareAtPrice: true,
            stockQuantity: true,
            isActive: true,
          },
        },
        images: {
          select: { id: true, imageUrl: true, altText: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    db.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    fabric: p.fabric,
    status: p.status,
    category: p.category,
    variants: p.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
    })),
    images: p.images,
    createdAt: p.createdAt.toISOString(),
  }));

  return <ProductsManager initialProducts={serializedProducts as any} categories={categories} store={store} />;
}
