import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getStoresControl } from "@/lib/stores";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";
import ScrollReveal, { ScrollRevealGroup } from "@/components/ui/ScrollReveal";
import JewelleryHeroBanner from "@/components/jewellery/JewelleryHeroBanner";

export const revalidate = 60;

export const metadata = {
  title: "Imperial Fine & Artificial Jewellery | Fashion Cart",
  description: "Explore 24K micro-plated Kundan, Polki bridal sets, antique temple jhumkas, openable kadas, and CZ rings.",
};

export default async function JewelleryHomePage() {
  const storesControl = await getStoresControl();
  if (!storesControl.jewellery.isActive) {
    redirect("/garments");
  }

  const jewelleryDb = getDb("jewellery");

  let allProducts: any[] = [];
  let rootCategories: any[] = [];
  let banners: any[] = [];

  try {
    const [dbProducts, dbCategories, dbBanners] = await Promise.all([
      jewelleryDb.product.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 16,
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: { where: { isActive: true } },
          category: true,
        },
      }),
      jewelleryDb.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          children: {
            where: { isActive: true },
            select: { id: true, name: true, slug: true, imageUrl: true },
          },
        },
      }),
      jewelleryDb.banner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    allProducts = dbProducts;
    rootCategories = dbCategories;
    banners = dbBanners;
  } catch (err) {
    console.warn("[JewelleryHomePage] Database query fallback:", err);
  }

  // Fallback / Preset Categories for Jewellery
  const displayCategories =
    rootCategories.length > 0
      ? rootCategories
      : [
          {
            id: "cat-necklaces",
            name: "Necklaces & Bridal Sets",
            slug: "necklaces-sets",
            imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80",
            children: [
              { id: "sub-kundan", name: "Kundan Chokers", slug: "kundan-chokers" },
              { id: "sub-temple", name: "Temple Haar", slug: "temple-haar" },
              { id: "sub-polki", name: "Polki Bridal Sets", slug: "polki-bridal-sets" },
            ],
          },
          {
            id: "cat-earrings",
            name: "Earrings & Jhumkas",
            slug: "earrings-jhumkas",
            imageUrl: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&auto=format&fit=crop&q=80",
            children: [
              { id: "sub-jhumka", name: "Royal Jhumkas", slug: "royal-jhumkas" },
              { id: "sub-chandbali", name: "Chandbalis", slug: "chandbalis" },
              { id: "sub-czstuds", name: "CZ Diamond Studs", slug: "cz-diamond-studs" },
            ],
          },
          {
            id: "cat-bangles",
            name: "Bangles & Kadas",
            slug: "bangles-kadas",
            imageUrl: "https://images.unsplash.com/photo-1611591475836-4188c035626a?w=600&auto=format&fit=crop&q=80",
            children: [
              { id: "sub-kadas", name: "Openable Kadas", slug: "openable-kadas" },
              { id: "sub-tennis", name: "Tennis Bracelets", slug: "tennis-bracelets" },
              { id: "sub-hathphool", name: "Hathphool Sets", slug: "hathphool-sets" },
            ],
          },
          {
            id: "cat-rings",
            name: "Cocktail & Solitaire Rings",
            slug: "rings",
            imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80",
            children: [
              { id: "sub-cocktail", name: "Adjustable Cocktail Rings", slug: "adjustable-cocktail-rings" },
              { id: "sub-solitaire", name: "Solitaire CZ Rings", slug: "solitaire-cz-rings" },
            ],
          },
          {
            id: "cat-bridal-accents",
            name: "Bridal Accents & Naths",
            slug: "bridal-accents",
            imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80",
            children: [
              { id: "sub-tikka", name: "Maang Tikka & Matha Patti", slug: "maang-tikka" },
              { id: "sub-nath", name: "Traditional Naths", slug: "traditional-naths" },
              { id: "sub-payal", name: "Bridal Payal & Anklets", slug: "bridal-payal" },
            ],
          },
        ];

  const jewelleryOccasions = [
    {
      title: "Royal Bridal Trousseau",
      subtitle: "Uncut Kundan, Real Pearls & Meenakari",
      tag: "24K Gold Polish",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80",
      buttonText: "Explore Bridal Sets",
      href: "/shop?store=jewellery&category=necklaces-sets",
    },
    {
      title: "Sangeet & Festive Glam",
      subtitle: "Bahubali Chandbalis & Pearl Chokers",
      tag: "Festive Sparkle",
      image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80",
      buttonText: "Explore Jhumkas",
      href: "/shop?store=jewellery&category=earrings-jhumkas",
    },
    {
      title: "American Diamond Minimal",
      subtitle: "CZ Tennis Bracelets & Solitaire Rings",
      tag: "Rhodium Polish",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80",
      buttonText: "Explore CZ Edits",
      href: "/shop?store=jewellery&category=rings",
    },
    {
      title: "Heritage Temple Jewellery",
      subtitle: "Antique Matte Gold & Lakshmi Motifs",
      tag: "Handcrafted",
      image: "https://images.unsplash.com/photo-1611591475836-4188c035626a?w=800&auto=format&fit=crop&q=80",
      buttonText: "Explore Temple Haar",
      href: "/shop?store=jewellery&category=bangles-kadas",
    },
  ];

  return (
    <div className="theme-jewellery min-h-screen bg-[#FCFAF6] text-[#061A14] space-y-16 sm:space-y-24 pb-24">
      
      {/* 1. Grand Royal Jewellery Interactive Hero Showcase Banner Suite */}
      <JewelleryHeroBanner products={allProducts} adminBanners={banners} />

      {/* 2. Top Jewellery Categories Row */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <ScrollReveal direction="up" distance={20}>
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF4D8] text-[#8C6B08] text-[11px] font-bold uppercase tracking-[0.2em] border border-[#D4AF37]/30">
              👑 Curated Collections
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#061A14] tracking-tight">
              Explore Jewellery Categories
            </h2>
            <p className="text-xs sm:text-sm text-[#787C87]">
              From magnificent bridal sets to lightweight daily essentials.
            </p>
          </div>
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6" staggerMs={60} distance={40}>
          {displayCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?store=jewellery&category=${cat.slug}`}
              prefetch={true}
              className="group relative rounded-3xl overflow-hidden bg-white border border-[#E7DFD5] hover:border-[#C59B27] shadow-sm hover:shadow-2xl transition-all duration-400 flex flex-col items-center text-center p-4 space-y-3 cursor-pointer active:scale-95 luxury-card-hover block w-full"
            >
              <div className="relative h-32 sm:h-36 w-full rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#E7DFD5]/50">
                <Image
                  src={cat.imageUrl || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80"}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-[#061A14] group-hover:text-[#C59B27] transition-colors leading-snug">
                  {cat.name}
                </h3>
                <span className="text-[10px] font-bold text-[#787C87] group-hover:text-[#C59B27] uppercase tracking-wider block mt-0.5">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </ScrollRevealGroup>
      </section>

      {/* 3. Occasion & Style Showcases */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <ScrollReveal direction="up" distance={20}>
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] text-[#C59B27] text-[11px] font-bold uppercase tracking-[0.2em] border border-[#E7DFD5]">
              ✨ Bespoke Edits
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#061A14] tracking-tight">
              Curated by Occasion
            </h2>
            <p className="text-xs sm:text-sm text-[#787C87]">
              Find the quintessential ornaments for weddings, festivals, and cocktail soirees.
            </p>
          </div>
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerMs={80} distance={44}>
          {jewelleryOccasions.map((occ) => (
            <div
              key={occ.title}
              className="group relative rounded-3xl overflow-hidden bg-white border border-[#E7DFD5] shadow-sm hover:shadow-2xl transition-all duration-400 flex flex-col luxury-card-hover block w-full"
            >
              <div className="relative h-60 w-full overflow-hidden bg-[#FAF8F5]">
                <Image
                  src={occ.image}
                  alt={occ.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#061A14]/85 text-[#F3E5AB] text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-xs border border-[#D4AF37]/40 shadow-xs">
                  {occ.tag}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-[#061A14] leading-snug">
                    {occ.title}
                  </h3>
                  <p className="text-xs text-[#787C87] leading-relaxed">
                    {occ.subtitle}
                  </p>
                </div>
                <Link
                  href={occ.href}
                  prefetch={true}
                  className="w-full py-2.5 rounded-full text-center text-xs font-extrabold uppercase tracking-wider text-[#061A14] bg-[#FAF8F5] group-hover:bg-[#C59B27] group-hover:text-white border border-[#E7DFD5] group-hover:border-[#C59B27] transition-all duration-200 active:scale-95 cursor-pointer block"
                >
                  {occ.buttonText} →
                </Link>
              </div>
            </div>
          ))}
        </ScrollRevealGroup>
      </section>

      {/* 4. Grand Royal Bridal Pavilion Promotional Feature Banner */}
      <ScrollReveal direction="up" distance={30}>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#061A14] via-[#0D2C22] to-[#040E0B] border-2 border-[#D4AF37]/50 shadow-2xl">
            {/* Ambient Lighting & Background Sparkle */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 lg:p-14">
              <div className="lg:col-span-7 space-y-5 text-white">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#061A14]/90 border border-[#D4AF37]/50 text-[10px] font-extrabold uppercase tracking-widest text-[#F3E5AB] shadow-md">
                  <span>✦ 2026 BRIDAL PAVILION</span>
                </div>
                <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                  The Royal Bridal Pavilion <br />
                  <span className="bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#FFF8E7] bg-clip-text text-transparent italic font-serif">
                    Complimentary Velvet Casket
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-[#FAF8F5]/85 max-w-lg leading-relaxed">
                  Every order includes our signature cushioned velvet presentation box, anti-tarnish zip-lock sleeves, and a certificate of 24K micro-gold electroplating.
                </p>

                {/* VIP Coupon Badge */}
                <div className="inline-flex items-center gap-3 p-2.5 rounded-2xl bg-[#061A14]/80 border border-[#D4AF37]/40 text-xs text-[#F3E5AB]">
                  <span className="text-lg">🏷️</span>
                  <span>Use VIP Code <strong className="font-mono font-bold text-white bg-[#D4AF37]/30 px-2 py-0.5 rounded">ROYAL10</strong> for 10% OFF</span>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    href="/shop?store=jewellery&category=necklaces-sets"
                    prefetch={true}
                    className="px-7 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-[#061A14] bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#E5C158] hover:brightness-110 active:scale-95 transition-all shadow-lg cursor-pointer"
                  >
                    Explore Bridal Sets →
                  </Link>
                  <Link
                    href="/shop?store=jewellery"
                    prefetch={true}
                    className="px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-[#F3E5AB] border border-[#D4AF37]/50 hover:bg-[#0D2C22] active:scale-95 transition-all cursor-pointer"
                  >
                    View All Jewellery
                  </Link>
                </div>
              </div>

              {/* Right Showcase Visual */}
              <div className="lg:col-span-5 relative">
                <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-xl group">
                  <Image
                    src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1000&auto=format&fit=crop&q=85"
                    alt="Royal Bridal Pavilion Jewellery"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#061A14]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-[#061A14]/90 backdrop-blur-xs border border-[#D4AF37]/30 text-white text-center">
                    <span className="text-[11px] font-bold text-[#F3E5AB] block">
                      Jaipur Kundan &amp; Polki Artisan Masterpiece
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* 5. Latest Jewellery Arrivals Showcase */}
      {allProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <ScrollReveal direction="up" distance={20}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#C59B27] block">
                  💎 Pure Opulence
                </span>
                <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#061A14] tracking-tight mt-1">
                  New Jewellery Arrivals
                </h2>
              </div>
              <Link
                href="/shop?store=jewellery"
                prefetch={true}
                className="text-xs font-bold text-[#C59B27] hover:underline uppercase tracking-wider flex items-center gap-1 shrink-0"
              >
                <span>Explore Complete Collection</span>
                <span>→</span>
              </Link>
            </div>
          </ScrollReveal>

          <ScrollRevealGroup className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6" staggerMs={60} distance={40}>
            {allProducts.slice(0, 8).map((prod) => {
              const cheapest = prod.variants?.[0];
              const price = cheapest ? Number(cheapest.price) : 0;
              const compareAt = cheapest?.compareAtPrice ? Number(cheapest.compareAtPrice) : null;
              const imgUrl = prod.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80";

              return (
                <Link
                  key={prod.id}
                  href={`/products/${prod.slug}?store=jewellery`}
                  prefetch={true}
                  className="group rounded-3xl overflow-hidden bg-white border border-[#E7DFD5] hover:border-[#C59B27] shadow-2xs hover:shadow-2xl transition-all duration-400 flex flex-col cursor-pointer active:scale-[0.98] luxury-card-hover block w-full"
                >
                  <div className="relative h-56 sm:h-64 w-full bg-[#FAF8F5] overflow-hidden">
                    <Image
                      src={imgUrl}
                      alt={prod.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-[#061A14]/85 text-[#F3E5AB] text-[9px] font-extrabold uppercase tracking-widest border border-[#D4AF37]/30">
                      24K Micro-Plated
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#C59B27] block truncate">
                        {prod.category?.name || "Fine Jewellery"}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-[#061A14] group-hover:text-[#C59B27] transition-colors line-clamp-2 leading-snug">
                        {prod.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#E7DFD5]/50">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-sm sm:text-base font-black text-[#061A14]">
                          ₹{price.toLocaleString("en-IN")}
                        </span>
                        {compareAt && compareAt > price && (
                          <span className="font-mono text-xs text-[#787C87] line-through">
                            ₹{compareAt.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#C59B27] group-hover:translate-x-0.5 transition-transform">
                        View →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </ScrollRevealGroup>
        </section>
      )}

      {/* 5. Jewellery Care & Authenticity Seal */}
      <ScrollReveal direction="up" distance={28}>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#061A14] border border-[#D4AF37]/40 p-8 sm:p-12 text-white grid grid-cols-1 md:grid-cols-3 gap-8 shadow-xl luxury-card-hover">
            <div className="space-y-2 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#0D2C22] border border-[#D4AF37]/40 flex items-center justify-center text-xl text-[#F3E5AB] mx-auto md:mx-0 shadow-inner">
                ✨
              </div>
              <h4 className="font-display text-lg font-bold text-[#F3E5AB]">24K Micro-Plating</h4>
              <p className="text-xs text-[#FAF8F5]/80 leading-relaxed">
                Electrophoretic protective layer ensures vibrant golden lustre resistant to sweat and oxidation.
              </p>
            </div>

            <div className="space-y-2 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#0D2C22] border border-[#D4AF37]/40 flex items-center justify-center text-xl text-[#F3E5AB] mx-auto md:mx-0 shadow-inner">
                🛡️
              </div>
              <h4 className="font-display text-lg font-bold text-[#F3E5AB]">Hypoallergenic Alloy</h4>
              <p className="text-xs text-[#FAF8F5]/80 leading-relaxed">
                100% skin-safe, nickel-free, and lead-free copper-brass base engineered for comfortable all-day wear.
              </p>
            </div>

            <div className="space-y-2 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#0D2C22] border border-[#D4AF37]/40 flex items-center justify-center text-xl text-[#F3E5AB] mx-auto md:mx-0 shadow-inner">
                📦
              </div>
              <h4 className="font-display text-lg font-bold text-[#F3E5AB]">Atelier Gift Box</h4>
              <p className="text-xs text-[#FAF8F5]/80 leading-relaxed">
                Delivered in cushioned velvet casing with zip-lock anti-tarnish storage pouches for eternal care.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

    </div>
  );
}
