import { prisma } from "@/lib/db";
import ProductsManager from "@/components/admin/ProductsManager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
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
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
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

  return <ProductsManager initialProducts={serializedProducts} categories={categories} />;
}
