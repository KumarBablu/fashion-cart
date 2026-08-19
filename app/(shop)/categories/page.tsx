import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

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
    heroImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=85",
    tagline: "Royal Ethnic Elegance & Luxury Atelier",
    description: "Hand-embroidered micro-velvet kurta sets, flowing Chanderi silk anarkalis, and pure mulberry silk sarees designed for festive majesty and wedding galas.",
    badge: "Artisanal Luxury",
    highlights: ["Handcrafted Zari Embroidery", "Pure Mulberry & Chanderi Silk", "Custom Fit Tailoring", "Festive & Bridal Specials"],
  },
  men: {
    heroImage: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=1200&auto=format&fit=crop&q=85",
    tagline: "Sartorial Menswear & Tailored Linen Cuts",
    description: "Breathable French linen shirts, classic mandarin collar button-downs, and premium stretch denim jeans precision-crafted for modern gentleman's comfort.",
    badge: "Master Tailored",
    highlights: ["100% Breathable Pure Linen", "Wrinkle-Resistant Cotton", "Comfort-Flex Stretch Denim", "Mandarin & Spread Collars"],
  },
  kids: {
    heroImage: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1200&auto=format&fit=crop&q=85",
    tagline: "Everyday Comfort & Festive Junior Edits",
    description: "Ultra-soft combed cotton essentials and vibrant festive ethnic wear designed with skin-friendly fabrics for cheerful, active little ones.",
    badge: "Pure Comfort",
    highlights: ["100% Organic Combed Cotton", "Gentle Skin-Safe Dyes", "Easy-Care Machine Wash", "Festive Matching Sets"],
  },
};

const DEFAULT_METADATA = {
  heroImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=85",
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
      <section className="bg-gradient-to-b from-[#F4EFEA] via-[#FAF8F5] to-[#F4EFEA] border-b border-[#E7DFD5] py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4 text-center sm:text-left">
          
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/shop" },
              { label: "Department Hub" },
            ]}
            className="mb-3"
          />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBF4E2] border border-[#C59B27]/40 text-xs font-bold uppercase tracking-wider text-[#8E6C0C]">
            <span>✦ Department Directory</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#141416] leading-tight">
            Curated Fashion Departments
          </h1>

          <p className="text-sm sm:text-base text-[#4B4E56] max-w-2xl leading-relaxed">
            Browse through our complete apparel catalog organized by department. From luxury ethnic kurtis and silk sarees to tailored French linen shirts and everyday essentials.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-[#787C87]">
            <span className="px-3 py-1 rounded-lg bg-white border border-[#E7DFD5] shadow-xs text-[#141416]">
              📂 {categories.length} Core Departments
            </span>
            <span className="px-3 py-1 rounded-lg bg-white border border-[#E7DFD5] shadow-xs text-[#141416]">
              🏷️ {totalCategories} Specialized Categories
            </span>
            <span className="px-3 py-1 rounded-lg bg-white border border-[#C59B27]/50 shadow-xs text-[#141416]">
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
              className="rounded-3xl border border-[#E7DFD5] bg-white overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Department Header Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 lg:p-10 items-center bg-gradient-to-r from-[#FAF8F5] via-white to-[#F4EFEA] border-b border-[#E7DFD5]">
                
                {/* Visual Editorial Image */}
                <div className="lg:col-span-4 relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-[#E7DFD5]">
                  <Image
                    src={meta.heroImage}
                    alt={cat.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/70 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white text-[#141416] backdrop-blur-md shadow-xs">
                    {meta.badge}
                  </span>
                </div>

                {/* Department Info & Narrative */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#C59B27]">
                      Department 0{idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#F4EFEA] text-[#141416]">
                      {cat.children.length} Sub-Collections
                    </span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#141416] leading-tight">
                    {cat.name} Collection
                  </h2>

                  <p className="text-xs sm:text-sm font-semibold text-[#C59B27]">
                    {meta.tagline}
                  </p>

                  <p className="text-xs sm:text-sm text-[#4B4E56] leading-relaxed max-w-2xl">
                    {meta.description}
                  </p>

                  {/* Department Highlights Tags */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {meta.highlights.map((h) => (
                      <span
                        key={h}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-[#F4EFEA] border border-[#E7DFD5] text-[#141416]"
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-colors shadow-xs"
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
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#787C87]">
                      Featured Subcategories in {cat.name}:
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/shop?category=${sub.slug}`}
                          className="group p-3.5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] hover:bg-white hover:border-[#141416] hover:shadow-md transition-all flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-[#141416] group-hover:text-[#C59B27] transition-colors">
                              {sub.name}
                            </p>
                            <p className="text-[10px] text-[#787C87] mt-0.5">
                              {sub.products.length > 0 ? `${sub.products.length} Items` : "Curated Styles"}
                            </p>
                          </div>
                          <span className="text-[#787C87] group-hover:text-[#141416] group-hover:translate-x-0.5 transition-transform text-xs font-bold">
                            →
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Live Products in this Department */}
                {sampleProducts.length > 0 && (
                  <div className="pt-4 border-t border-[#E7DFD5] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#787C87]">
                        Top Rated in {cat.name}:
                      </h4>
                      <Link
                        href={`/shop?category=${cat.slug}`}
                        className="text-xs font-semibold text-[#C59B27] hover:underline"
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
                            className="group flex items-center gap-3 p-2.5 rounded-2xl border border-[#E7DFD5] bg-white hover:border-[#C59B27] hover:shadow-sm transition-all"
                          >
                            <div className="relative w-14 h-16 shrink-0 rounded-xl overflow-hidden bg-[#F4EFEA]">
                              <Image
                                src={img}
                                alt={prod.name}
                                fill
                                sizes="80px"
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#141416] truncate group-hover:text-[#C59B27] transition-colors">
                                {prod.name}
                              </p>
                              {variant && (
                                <p className="text-xs font-bold text-[#141416] mt-0.5">
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

      {/* 🏷️ Curated Boutique Edits with High-Fashion Models */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-[#E7DFD5] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C59B27]">Special Curations</span>
          <h2 className="font-display text-2xl font-bold text-[#141416] mt-0.5">
            Boutique &amp; Occasion Edits
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/shop?maxPrice=999"
            className="group relative rounded-3xl overflow-hidden border border-[#E7DFD5] aspect-[3/4] flex flex-col justify-end p-5 bg-[#141416] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <Image
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80"
              alt="Under 999 Daily Essentials"
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-108"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/40 to-transparent" />
            <div className="relative z-10 space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C59B27] text-white">
                Under ₹999 Store
              </span>
              <h3 className="font-display text-base font-bold text-white group-hover:text-[#C59B27] transition-colors">
                Everyday Cottons &amp; Linens
              </h3>
              <p className="text-xs text-white/80">Breathable essentials at honest prices.</p>
              <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[#C59B27]">
                <span>Shop Store</span>
                <span>→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/shop?onSale=true"
            className="group relative rounded-3xl overflow-hidden border border-[#C59B27]/40 aspect-[3/4] flex flex-col justify-end p-5 bg-[#141416] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <Image
              src="https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80"
              alt="Flash Deals 40% Off"
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-108"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/40 to-transparent" />
            <div className="relative z-10 space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white">
                🔥 Flash 40% Off
              </span>
              <h3 className="font-display text-base font-bold text-white group-hover:text-[#C59B27] transition-colors">
                Handcrafted Silk Drops
              </h3>
              <p className="text-xs text-white/80">Limited-quantity master weaver editions.</p>
              <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[#C59B27]">
                <span>Shop Deals</span>
                <span>→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/shop?sort=newest"
            className="group relative rounded-3xl overflow-hidden border border-[#E7DFD5] aspect-[3/4] flex flex-col justify-end p-5 bg-[#141416] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <Image
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
              alt="New Season 2026 Drops"
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-108"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/40 to-transparent" />
            <div className="relative z-10 space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-[#141416]">
                ✨ New Season 2026
              </span>
              <h3 className="font-display text-base font-bold text-white group-hover:text-[#C59B27] transition-colors">
                Haute Runway Arrivals
              </h3>
              <p className="text-xs text-white/80">Fresh off the loom artisanal silhouettes.</p>
              <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[#C59B27]">
                <span>Explore Drops</span>
                <span>→</span>
              </div>
            </div>
          </Link>

          <Link
            href="/shop?category=women-kurtis"
            className="group relative rounded-3xl overflow-hidden border border-[#E7DFD5] aspect-[3/4] flex flex-col justify-end p-5 bg-[#141416] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <Image
              src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80"
              alt="Festive Gala & Wedding"
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-108"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/40 to-transparent" />
            <div className="relative z-10 space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C59B27] text-white">
                👑 Royal Gala &amp; Wedding
              </span>
              <h3 className="font-display text-base font-bold text-white group-hover:text-[#C59B27] transition-colors">
                Zardozi &amp; Velvet Sets
              </h3>
              <p className="text-xs text-white/80">Regal grandeur for life&apos;s finest moments.</p>
              <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[#C59B27]">
                <span>Explore Gala</span>
                <span>→</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 🛡️ Trust Assurance Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl border border-[#E7DFD5] bg-[#F4EFEA] text-center space-y-4">
          <h3 className="font-display text-xl font-bold text-[#141416]">
            Can&apos;t find what you&apos;re looking for?
          </h3>
          <p className="text-xs text-[#4B4E56] max-w-md mx-auto">
            Our master stylists are available on WhatsApp for custom size consultations, styling guidance, and wedding wardrobe curation.
          </p>
          <div className="pt-1 flex justify-center gap-3">
            <Link
              href="/shop"
              className="px-6 py-3 rounded-full text-xs font-bold uppercase bg-[#141416] text-white hover:bg-[#25262B] transition-colors shadow-sm"
            >
              Browse Complete Catalog
            </Link>
            <a
              href="https://wa.me/919771039201?text=Hi%20Fashion%20Cart%2C%20I%20am%20looking%20for%20a%20specific%20outfit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full text-xs font-bold uppercase text-[#141416] bg-[#C59B27]/20 border border-[#C59B27] hover:bg-[#C59B27]/30 transition-colors"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
