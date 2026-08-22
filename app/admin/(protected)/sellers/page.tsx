import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import SellersManager, { MappedProductItem, SellerDirectoryItem } from "@/components/admin/SellersManager";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | undefined>;

export default async function AdminSellersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieStoreVal = cookieStore.get("fc_admin_store")?.value;

  const store = sp.store === "jewellery" || (!sp.store && cookieStoreVal === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  const [products, sellers] = await Promise.all([
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
        },
        variants: {
          where: { isActive: true },
          orderBy: [{ colour: "asc" }, { size: "asc" }],
        },
        category: {
          include: { parent: true },
        },
        seller: true,
      },
    }),
    db.seller.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    }),
  ]);

  const serializedProducts: MappedProductItem[] = products.map((p) => ({
    id: p.id,
    productId: p.productId,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    department: p.department,
    subcategory: p.subcategory,
    categoryPath: p.categoryPath,
    productUrl: p.productUrl,
    sellerId: p.sellerId,
    sellerName: p.sellerName,
    sellerIdentifier: p.sellerIdentifier,
    sellerPhone: p.sellerPhone,
    sellerEmail: p.sellerEmail,
    sellerUrl: p.sellerUrl,
    categoryName: p.category?.name,
    primaryImage: p.images[0]?.imageUrl || "",
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      colour: v.colour || "Standard",
      size: v.size || "Free Size",
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      stockQuantity: v.stockQuantity,
    })),
    seller: p.seller
      ? {
          id: p.seller.id,
          sellerId: p.seller.sellerId,
          name: p.seller.name,
          phone: p.seller.phone,
          email: p.seller.email,
          url: p.seller.url,
        }
      : null,
  }));

  const serializedSellers: SellerDirectoryItem[] = sellers.map((s) => ({
    id: s.id,
    sellerId: s.sellerId,
    name: s.name,
    phone: s.phone,
    email: s.email,
    url: s.url,
    address: s.address,
    notes: s.notes,
    isActive: s.isActive,
    productCount: s._count.products,
  }));

  return (
    <SellersManager
      initialProducts={serializedProducts}
      initialSellers={serializedSellers}
    />
  );
}
