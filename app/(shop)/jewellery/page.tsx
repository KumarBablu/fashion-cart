import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/lib/db";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Imperial Fine & Artificial Jewellery | Fashion Cart",
  description: "Explore 24K micro-plated Kundan, Polki bridal sets, antique temple jhumkas, openable kadas, and CZ rings.",
};

export default async function JewelleryHomePage() {
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
      
      {/* 1. Opulent Hero Banner */}
      <section className="relative bg-[#061A14] text-white overflow-hidden border-b border-[#D4AF37]/30">
        {/* Background Subtle Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0D2C22] via-[#061A14] to-[#040E0B] opacity-95" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Headline */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/50 bg-[#061A14]/90 text-[11px] font-extrabold uppercase tracking-widest text-[#F3E5AB] shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] pulse-dot" />
              <span>Imperial Fine &amp; Artificial Jewellery</span>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-4xl sm:text-6xl lg:text-[4rem] font-bold tracking-tight text-white leading-[1.08]">
                Royalty Woven in <br />
                <span className="gold-text-shimmer italic font-serif font-normal">24K Micron Gold.</span>
              </h1>
              <p className="text-sm sm:text-base text-[#FDFBF7]/80 max-w-xl leading-relaxed pt-1">
                Handcrafted Uncut Kundan, Meenakari, Polki Bridal Chokers, Antique Temple Jhumkas, and American Diamond Solitaires designed for timeless splendour.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/shop?store=jewellery"
                className="gold-jewellery-btn px-8 py-4 rounded-full font-extrabold text-xs uppercase tracking-widest transition-all duration-300 shadow-xl cursor-pointer"
              >
                Shop Jewellery Catalog →
              </Link>
              <WhatsAppConciergeButton
                className="px-6 py-4 rounded-full text-xs font-bold text-[#F3E5AB] border border-[#D4AF37]/50 bg-[#061A14] hover:bg-[#0D2C22] transition-all duration-300 shadow-md flex items-center gap-2 cursor-pointer"
                customMessage="Hi Imperial Jewels Stylist, I would like bridal/festive jewellery recommendations!"
              >
                <span>💬</span> Bridal Concierge
              </WhatsAppConciergeButton>
            </div>

            {/* Trust Highlights */}
            <div className="pt-6 border-t border-[#D4AF37]/20 grid grid-cols-3 gap-3 text-xs text-[#F3E5AB]/90">
              <div className="p-3 rounded-2xl bg-[#0D2C22]/60 border border-[#D4AF37]/20 space-y-0.5">
                <p className="text-base font-bold text-white">24K Polish</p>
                <p className="text-[10px] text-[#F3E5AB]/75">Micro-Plated Shield</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0D2C22]/60 border border-[#D4AF37]/20 space-y-0.5">
                <p className="text-base font-bold text-white">Anti-Tarnish</p>
                <p className="text-[10px] text-[#F3E5AB]/75">Skin Safe &amp; Lead-Free</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0D2C22]/60 border border-[#D4AF37]/20 space-y-0.5">
                <p className="text-base font-bold text-white">Velvet Box</p>
                <p className="text-[10px] text-[#F3E5AB]/75">Luxury Gift Packaging</p>
              </div>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border-2 border-[#D4AF37]/60 shadow-[0_20px_60px_rgba(0,0,0,0.6)] group">
              <div className="relative h-96 sm:h-[480px] w-full">
                <Image
                  src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1000&auto=format&fit=crop&q=85"
                  alt="Imperial Royal Kundan Bridal Set"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061A14] via-[#061A14]/30 to-transparent" />
              </div>

              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-[#061A14]/90 backdrop-blur-md border border-[#D4AF37]/40 text-white space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]">
                  ✨ Haute Bridal Collection 2026
                </span>
                <h3 className="font-display text-base font-bold text-[#F3E5AB]">
                  Mughal Kundan &amp; Pearl Choker Set
                </h3>
                <p className="text-[11px] text-[#FAF8F5]/80">
                  Includes Choker, Bahubali Jhumkas &amp; Matching Maang Tikka.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Top Jewellery Categories Row */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {displayCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?store=jewellery&category=${cat.slug}`}
              className="jewellery-card group p-4 sm:p-5 flex flex-col items-center text-center space-y-3 cursor-pointer"
            >
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#D4AF37]/40 shadow-sm group-hover:scale-105 transition-transform duration-300 bg-[#FAF8F5]">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    💍
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xs sm:text-sm font-bold text-[#061A14] group-hover:text-[#8C6B08] transition-colors line-clamp-2">
                  {cat.name}
                </h3>
                {cat.children && cat.children.length > 0 && (
                  <p className="text-[10px] text-[#787C87] line-clamp-1">
                    {cat.children.map((c: any) => c.name).join(", ")}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Occasion Edits Showcase */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E8DECE] pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#D4AF37]">
              Royal Stylist Edits
            </span>
            <h2 className="font-display text-xl sm:text-3xl font-bold text-[#061A14]">
              Jewellery by Occasion
            </h2>
          </div>
          <Link
            href="/shop?store=jewellery"
            className="text-xs font-bold text-[#8C6B08] hover:underline flex items-center gap-1"
          >
            <span>View All Occasions</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {jewelleryOccasions.map((occ, idx) => (
            <div
              key={idx}
              className="jewellery-card group rounded-3xl overflow-hidden flex flex-col justify-between"
            >
              <div className="relative h-64 w-full overflow-hidden bg-[#061A14]">
                <Image
                  src={occ.image}
                  alt={occ.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061A14] via-[#061A14]/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-[#061A14]/80 backdrop-blur-md text-[#F3E5AB] text-[9px] font-extrabold uppercase tracking-wider border border-[#D4AF37]/40">
                    {occ.tag}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display text-lg font-bold text-[#F3E5AB]">
                    {occ.title}
                  </h3>
                  <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                    {occ.subtitle}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white">
                <Link
                  href={occ.href}
                  className="block w-full text-center py-2 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-[#FDF4D8] text-[#061A14] border border-[#E8DECE] hover:border-[#D4AF37] transition-all"
                >
                  {occ.buttonText} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Quality & Craftsmanship Assurance */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#061A14] border border-[#D4AF37]/40 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37] text-[#061A14] text-[10px] font-black uppercase tracking-widest">
              ✨ The Imperial Promise
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F3E5AB] leading-tight">
              Artisanal Artificial Jewellery Built to Last.
            </h2>
            <p className="text-xs sm:text-sm text-[#FDFBF7]/85 leading-relaxed">
              Every choker, jhumka, and kada is crafted with high-purity brass and copper alloys, coated with 24K micro-micron gold polish, and sealed with anti-tarnish lacquer so you sparkle with confidence on every occasion.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/shop?store=jewellery"
                className="gold-jewellery-btn px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider"
              >
                Explore All Jewellery
              </Link>
              <Link
                href="/garments"
                className="px-6 py-3 rounded-full text-xs font-bold text-[#F3E5AB] border border-[#D4AF37]/50 hover:bg-[#0D2C22] transition-colors"
              >
                👗 Switch to Garments House
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
