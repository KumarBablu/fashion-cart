import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

export const revalidate = 30;

const DEPARTMENT_METADATA: Record<
  string,
  {
    heroImage: string;
    tagline: string;
    description: string;
    badge: string;
    highlights: string[];
  }
> = {
  women: {
    heroImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=85",
    tagline: "Royal Ethnic Elegance & Haute Couture",
    description: "Hand-embroidered micro-velvet kurta sets, flowing Chanderi silk anarkalis, and pure mulberry silk sarees designed for festive majesty and wedding galas.",
    badge: "Haute Couture",
    highlights: ["Handcrafted Zari Embroidery", "Pure Mulberry & Chanderi Silk", "Custom Fit Tailoring", "Festive & Bridal Specials"],
  },
  men: {
    heroImage: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85",
    tagline: "Sartorial Menswear & Tailored Linen Cuts",
    description: "Breathable French linen shirts, classic mandarin collar button-downs, and premium stretch denim jeans precision-crafted for modern gentleman's comfort.",
    badge: "Master Tailored",
    highlights: ["100% Breathable Pure Linen", "Wrinkle-Resistant Cotton", "Comfort-Flex Stretch Denim", "Mandarin & Spread Collars"],
  },
  kids: {
    heroImage: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1000&auto=format&fit=crop&q=85",
    tagline: "Everyday Comfort & Festive Junior Edits",
    description: "Ultra-soft combed cotton essentials and vibrant festive ethnic wear designed with skin-friendly fabrics for cheerful, active little ones.",
    badge: "Pure Comfort",
    highlights: ["100% Organic Combed Cotton", "Gentle Skin-Safe Dyes", "Easy-Care Machine Wash", "Festive Matching Sets"],
  },
};

const DEFAULT_METADATA = {
  heroImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1000&auto=format&fit=crop&q=85",
  tagline: "Contemporary Everyday & Evening Fashion",
  description: "Curated styles crafted with premium fabrics, modern silhouettes, and meticulous stitching for timeless everyday appeal.",
  badge: "Signature Collection",
  highlights: ["Quality Assured Fabrics", "Easy Returns & Exchanges", "Fast Express Shipping", "GST Tax Invoiced"],
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            where: { status: "ACTIVE" },
            take: 3,
            orderBy: { createdAt: "desc" },
            include: {
              images: { take: 1, orderBy: { sortOrder: "asc" } },
              variants: { where: { isActive: true }, take: 1, orderBy: { price: "asc" } },
            },
          },
        },
      },
      products: {
        where: { status: "ACTIVE" },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          images: { take: 1, orderBy: { sortOrder: "asc" } },
          variants: { where: { isActive: true }, take: 1, orderBy: { price: "asc" } },
        },
      },
    },
  });

  const totalCategories = categories.reduce((acc, cat) => acc + 1 + cat.children.length, 0);

  return (
    <div className="space-y-16 pb-20">
      
      {/* 🌟 Directory Hero Banner */}
      <section className="bg-gradient-to-b from-[#F2EFE8] via-[#FAF8F5] to-[#F2EFE8] border-b border-[#E8E3D8] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4 text-center sm:text-left">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF7E0] border border-[#FFBA00]/40 text-xs font-bold uppercase tracking-wider text-[#0C3B2E]">
            <span>✦ Department Directory</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0C3B2E] leading-tight">
            Curated Fashion Departments
          </h1>

          <p className="text-sm sm:text-base text-[#2C483F] max-w-2xl leading-relaxed">
            Browse through our complete apparel catalog organized by department. From luxury ethnic kurtis and silk sarees to tailored French linen shirts and everyday essentials.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-[#5B7A6F]">
            <span className="px-3 py-1 rounded-lg bg-white border border-[#E8E3D8] shadow-xs text-[#0C3B2E]">
              📂 {categories.length} Core Departments
            </span>
            <span className="px-3 py-1 rounded-lg bg-white border border-[#E8E3D8] shadow-xs text-[#0C3B2E]">
              🏷️ {totalCategories} Specialized Categories
            </span>
            <span className="px-3 py-1 rounded-lg bg-white border border-[#6D9773] shadow-xs text-[#0C3B2E]">
              ✓ 100% Certified Pure Fabrics
            </span>
          </div>
        </div>
      </section>

      {/* 👑 Detailed Department Showcase Sections */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
        {categories.map((cat, idx) => {
          const meta = DEPARTMENT_METADATA[cat.slug.toLowerCase()] || DEFAULT_METADATA;
          const allSubProducts = cat.children.flatMap((sub) => sub.products);
          const sampleProducts = cat.products.length > 0 ? cat.products : allSubProducts;

          return (
            <div
              key={cat.id}
              className="rounded-3xl border border-[#E8E3D8] bg-white overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Department Header Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 lg:p-10 items-center bg-gradient-to-r from-[#FAF8F5] via-white to-[#F2EFE8] border-b border-[#E8E3D8]">
                
                {/* Visual Editorial Image */}
                <div className="lg:col-span-4 relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-[#E8E3D8]">
                  <Image
                    src={meta.heroImage}
                    alt={cat.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C3B2E]/70 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white text-[#0C3B2E] backdrop-blur-md shadow-xs">
                    {meta.badge}
                  </span>
                </div>

                {/* Department Info & Narrative */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#BB8A52]">
                      Department 0{idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#F2EFE8] text-[#0C3B2E]">
                      {cat.children.length} Sub-Collections
                    </span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#0C3B2E] leading-tight">
                    {cat.name} Collection
                  </h2>

                  <p className="text-xs sm:text-sm font-semibold text-[#BB8A52]">
                    {meta.tagline}
                  </p>

                  <p className="text-xs sm:text-sm text-[#2C483F] leading-relaxed max-w-2xl">
                    {meta.description}
                  </p>

                  {/* Department Highlights Tags */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {meta.highlights.map((h) => (
                      <span
                        key={h}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-[#F2EFE8] border border-[#E8E3D8] text-[#0C3B2E]"
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0C3B2E] text-white hover:bg-[#144E3E] transition-colors shadow-xs"
                    >
                      <span>Explore All {cat.name} Styles</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Subcategories Grid & Product Previews */}
              <div className="p-6 sm:p-8 lg:p-10 space-y-6">
                
                {/* Subcategories Chip List */}
                {cat.children.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B7A6F]">
                      Featured Subcategories in {cat.name}:
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/shop?category=${sub.slug}`}
                          className="group p-3.5 rounded-2xl border border-[#E8E3D8] bg-[#FAF8F5] hover:bg-white hover:border-[#0C3B2E] hover:shadow-md transition-all flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-[#0C3B2E] group-hover:text-[#BB8A52] transition-colors">
                              {sub.name}
                            </p>
                            <p className="text-[10px] text-[#5B7A6F] mt-0.5">
                              {sub.products.length > 0 ? `${sub.products.length} Items` : "Curated Styles"}
                            </p>
                          </div>
                          <span className="text-[#5B7A6F] group-hover:text-[#0C3B2E] group-hover:translate-x-0.5 transition-transform text-xs font-bold">
                            →
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Live Products in this Department */}
                {sampleProducts.length > 0 && (
                  <div className="pt-4 border-t border-[#E8E3D8] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B7A6F]">
                        Top Rated in {cat.name}:
                      </h4>
                      <Link
                        href={`/shop?category=${cat.slug}`}
                        className="text-xs font-semibold text-[#BB8A52] hover:underline"
                      >
                        View More →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {sampleProducts.slice(0, 3).map((prod) => {
                        const variant = prod.variants[0];
                        const img = prod.images[0]?.imageUrl || "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&auto=format&fit=crop&q=80";

                        return (
                          <Link
                            key={prod.id}
                            href={`/products/${prod.slug}`}
                            className="group flex items-center gap-3 p-2.5 rounded-2xl border border-[#E8E3D8] bg-white hover:border-[#BB8A52] hover:shadow-sm transition-all"
                          >
                            <div className="relative w-14 h-16 shrink-0 rounded-xl overflow-hidden bg-[#F2EFE8]">
                              <Image
                                src={img}
                                alt={prod.name}
                                fill
                                sizes="80px"
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#0C3B2E] truncate group-hover:text-[#BB8A52] transition-colors">
                                {prod.name}
                              </p>
                              {variant && (
                                <p className="text-xs font-bold text-[#0C3B2E] mt-0.5">
                                  {formatINR(Number(variant.price))}
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </section>

      {/* 🏷️ Curated Boutique Edits */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-[#E8E3D8] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#BB8A52]">Special Curations</span>
          <h2 className="font-display text-2xl font-bold text-[#0C3B2E] mt-0.5">
            Boutique &amp; Occasion Edits
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/shop?maxPrice=999"
            className="group p-5 rounded-3xl border border-[#E8E3D8] bg-white hover:border-[#0C3B2E] hover:shadow-md transition-all space-y-2"
          >
            <span className="text-2xl">🏷️</span>
            <h3 className="font-bold text-sm text-[#0C3B2E] group-hover:text-[#BB8A52] transition-colors">
              Under ₹999 Store
            </h3>
            <p className="text-xs text-[#2C483F] leading-relaxed">
              Everyday breathable cotton shirts and comfortable kurtis at unbeatable prices.
            </p>
            <span className="text-xs font-bold text-[#0C3B2E] inline-block pt-1">
              Shop Budget Store →
            </span>
          </Link>

          <Link
            href="/shop?onSale=true"
            className="group p-5 rounded-3xl border border-[#FFBA00]/40 bg-[#FFF7E0]/60 hover:border-[#FFBA00] hover:shadow-md transition-all space-y-2"
          >
            <span className="text-2xl">🔥</span>
            <h3 className="font-bold text-sm text-[#0C3B2E] group-hover:text-[#BB8A52] transition-colors">
              Flash Deals (40% Off)
            </h3>
            <p className="text-xs text-[#2C483F] leading-relaxed">
              Limited-quantity handcrafted silk anarkalis and luxury velvet kurta drops.
            </p>
            <span className="text-xs font-bold text-[#0C3B2E] inline-block pt-1">
              Shop Super Deals →
            </span>
          </Link>

          <Link
            href="/shop?sort=newest"
            className="group p-5 rounded-3xl border border-[#E8E3D8] bg-white hover:border-[#0C3B2E] hover:shadow-md transition-all space-y-2"
          >
            <span className="text-2xl">✨</span>
            <h3 className="font-bold text-sm text-[#0C3B2E] group-hover:text-[#BB8A52] transition-colors">
              New Season 2026
            </h3>
            <p className="text-xs text-[#2C483F] leading-relaxed">
              The latest fashion arrivals fresh off our master atelier looms.
            </p>
            <span className="text-xs font-bold text-[#0C3B2E] inline-block pt-1">
              Explore New Drops →
            </span>
          </Link>

          <Link
            href="/shop?category=women-kurtis"
            className="group p-5 rounded-3xl border border-[#E8E3D8] bg-white hover:border-[#0C3B2E] hover:shadow-md transition-all space-y-2"
          >
            <span className="text-2xl">👑</span>
            <h3 className="font-bold text-sm text-[#0C3B2E] group-hover:text-[#BB8A52] transition-colors">
              Festive Gala &amp; Wedding
            </h3>
            <p className="text-xs text-[#2C483F] leading-relaxed">
              Mulberry silk, Chanderi, and royal zari embroidery designed for special occasions.
            </p>
            <span className="text-xs font-bold text-[#0C3B2E] inline-block pt-1">
              Explore Festive Edit →
            </span>
          </Link>
        </div>
      </section>

      {/* 🛡️ Trust Assurance Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl border border-[#E8E3D8] bg-[#F2EFE8] text-center space-y-4">
          <h3 className="font-display text-xl font-bold text-[#0C3B2E]">
            Can&apos;t find what you&apos;re looking for?
          </h3>
          <p className="text-xs text-[#2C483F] max-w-md mx-auto">
            Our master stylists are available on WhatsApp for custom size consultations, styling guidance, and wedding wardrobe curation.
          </p>
          <div className="pt-1 flex justify-center gap-3">
            <Link
              href="/shop"
              className="px-6 py-3 rounded-full text-xs font-bold uppercase bg-[#0C3B2E] text-white hover:bg-[#144E3E] transition-colors shadow-sm"
            >
              Browse Complete Catalog
            </Link>
            <a
              href="https://wa.me/919876543210?text=Hi%20Fashion%20Cart%2C%20I%20am%20looking%20for%20a%20specific%20outfit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full text-xs font-bold uppercase text-[#0C3B2E] bg-[#6D9773]/20 border border-[#6D9773] hover:bg-[#6D9773]/30 transition-colors"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
