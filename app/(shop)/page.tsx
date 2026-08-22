import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [allProducts, rootCategories, promotions, banners] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        category: {
          isActive: true,
          OR: [
            { parentId: null },
            { parent: { isActive: true } },
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true } },
        category: true,
      },
    }),
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, imageUrl: true },
        },
      },
    }),
    prisma.promotion.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // Find custom hero promotion or admin configured hero banner
  const heroBanner = banners.find((b) => b.position === "HERO");
  const heroPromo = promotions.find(
    (p) =>
      p.placement === "HERO_SPOTLIGHT" ||
      p.placement === "TOP_BANNER" ||
      p.placement === "POPUP_MODAL"
  );

  // Dedicated Admin Configured Occasions
  const adminOccasions = banners.filter((b) => b.position === "OCCASION");

  const dynamicOccasions =
    adminOccasions.length > 0
      ? adminOccasions.map((occ) => ({
          title: occ.title,
          subtitle: occ.subtitle || "Curated Haute Couture Look",
          href: occ.linkUrl || "/shop",
          image: occ.imageUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
          tag: occ.badge || "Artisanal Craft",
          buttonText: occ.buttonText || "Explore Outfits",
        }))
      : [
          {
            title: "Festive & Gala Edit",
            subtitle: "Zari Velvet & Anarkalis",
            href: "/shop?category=women-kurtis",
            image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
            tag: "Artisanal Craft",
            buttonText: "Explore Outfits",
          },
          {
            title: "Wedding & Silk Soirée",
            subtitle: "Mulberry Silk & Gowns",
            href: "/shop?category=women-dresses",
            image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
            tag: "Pure Silk",
            buttonText: "Explore Outfits",
          },
          {
            title: "Sartorial Menswear",
            subtitle: "French Linen & Mandarin Shirts",
            href: "/shop?category=men-shirts",
            image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
            tag: "Tailored Linen",
            buttonText: "Explore Outfits",
          },
          {
            title: "Earth & Sand Co-ords",
            subtitle: "Chanderi Silks & Sets",
            href: "/shop?onSale=true",
            image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
            tag: "Curated Look",
            buttonText: "Explore Outfits",
          },
        ];

  // Dynamic Hero Image: use custom admin banner image, promo image, or catalog photo
  const heroImage =
    heroBanner?.imageUrl ||
    heroPromo?.imageUrl ||
    allProducts[0]?.images[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=85";

  const heroHeadline = heroBanner?.title || "Timeless Elegance. Effortless Style.";
  const heroSubtitle =
    heroBanner?.subtitle ||
    "Discover masterfully tailored garments crafted from certified pure Mulberry silks, breathable French linens, and rich hand-embroidered velvets. Designed for modern poise, uncompromising comfort, and true distinction.";
  const heroBadge = heroBanner?.badge || "✦ The 2026 Signature Luxury Edit · Live Drops";
  const heroCtaText = heroBanner?.buttonText || "Explore New Season →";
  const heroCtaLink = heroBanner?.linkUrl || "/shop";

  const META: Record<string, { icon: string; tagline: string; bannerImage: string; badge: string }> = {
    women: {
      icon: "🥻",
      tagline: "Pure Varanasi Mulberry Silks, Micro-Velvets & Zardozi Anarkalis",
      bannerImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=85",
      badge: "Royal Heritage Atelier",
    },
    men: {
      icon: "👔",
      tagline: "100% Certified French Linen, Mandarin Collars & Italian Chinos",
      bannerImage: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&auto=format&fit=crop&q=85",
      badge: "Master Tailored Sartorial Cuts",
    },
    western: {
      icon: "✨",
      tagline: "Liquid Satin Cocktail Gowns, Structured Linen Blazers & Co-ords",
      bannerImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=85",
      badge: "Haute Contemporary Chic",
    },
    kids: {
      icon: "🧸",
      tagline: "Junior Festive Brocades, Fairy Tulle Frocks & Organic Cotton",
      bannerImage: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1200&auto=format&fit=crop&q=85",
      badge: "Gentle Pure Comfort Edits",
    },
  };

  const departments = rootCategories.map((cat) => {
    const slugKey = cat.slug.toLowerCase();
    const meta = META[slugKey] || {
      icon: slugKey.includes("men") ? "👔" : slugKey.includes("kid") ? "🧸" : "👗",
      tagline: `Curated luxury apparel, tailored cuts & artisanal craft for ${cat.name}`,
      bannerImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=85",
      badge: "Signature Collection",
    };

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      imageUrl: cat.imageUrl,
      icon: meta.icon,
      tagline: meta.tagline,
      bannerImage: meta.bannerImage,
      badge: meta.badge,
      subcategories: cat.children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        imageUrl: child.imageUrl,
      })),
    };
  });

  return (
    <div className="space-y-16 pb-20 overflow-hidden">
      
      {/* 👑 Haute Couture Luxury Announcement Strip */}
      <div className="bg-[#141416] text-[#FAF8F5] py-2.5 px-4 text-center border-b border-[#C59B27]/40 shadow-xs">
        <div className="mx-auto max-w-7xl flex items-center justify-center gap-4 sm:gap-8 text-[11px] sm:text-xs font-semibold tracking-wider uppercase overflow-x-auto no-scrollbar whitespace-nowrap">
          <span className="flex items-center gap-1.5 text-[#C59B27]">
            <span>✦</span> 100% Certified Pure Silk &amp; French Linen
          </span>
          <span className="hidden sm:inline text-white/30">•</span>
          <span className="flex items-center gap-1.5 text-white/90">
            <span>📦</span> Complimentary Express Doorstep Shipping
          </span>
          <span className="hidden sm:inline text-white/30">•</span>
          <span className="flex items-center gap-1.5 text-[#C59B27]">
            <span>⚡</span> Dispatches in 24 Hours
          </span>
          <span className="hidden sm:inline text-white/30">•</span>
          <span className="flex items-center gap-1.5 text-white/90">
            <span>💵</span> Cash on Delivery &amp; Official GST Tax Invoice
          </span>
        </div>
      </div>

      {/* 🌿 Atelier Noir & Tuscan Gold Haute Couture Hero Section */}
      <section className="relative bg-gradient-to-b from-[#FAF8F5] via-[#F4EFEA] to-[#FAF8F5] border-b border-[#E7DFD5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C59B27]/40 bg-white text-xs font-bold uppercase tracking-wider text-[#141416] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#C59B27] pulse-dot" />
              <span>{heroBadge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#141416] leading-[1.08]">
              {heroHeadline}
            </h1>

            <p className="text-sm sm:text-base text-[#4B4E56] max-w-xl leading-relaxed">
              {heroSubtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={heroCtaLink}
                className="px-8 py-3.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#C59B27] text-white hover:bg-[#B0881E] transition-all duration-200 shadow-md hover:scale-102"
              >
                {heroCtaText}
              </Link>
              <Link
                href="/categories"
                className="px-6 py-3.5 rounded-full border border-[#141416] bg-white font-bold text-xs uppercase tracking-wider text-[#141416] hover:bg-[#141416] hover:text-white transition-all duration-200"
              >
                Browse Categories
              </Link>
              <WhatsAppConciergeButton
                className="px-5 py-3.5 rounded-full text-xs font-bold text-[#141416] border border-[#C59B27] bg-[#C59B27]/10 hover:bg-[#C59B27]/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                customMessage="Hi Fashion Cart Stylist, I am exploring the 2026 luxury collection and would like personal outfit recommendations!"
              >
                <span>💬</span> WhatsApp Stylist
              </WhatsAppConciergeButton>
            </div>

            {/* Trust Assurance Strip */}
            <div className="pt-6 border-t border-[#E7DFD5] grid grid-cols-3 gap-4 max-w-lg text-xs">
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#141416]">100%</p>
                <p className="text-[#787C87] text-[11px] mt-0.5">Certified Pure Fabrics</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#141416]">₹0</p>
                <p className="text-[#787C87] text-[11px] mt-0.5">Free Express Shipping</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#141416]">4.9 ★</p>
                <p className="text-[#787C87] text-[11px] mt-0.5">Over 3,500 Reviews</p>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Cinematic Editorial Model Card with VIP Glassmorphism Overlay */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-[#E7DFD5] group">
              {/* High-Fashion Traditional Indian Couture Model Image */}
              <Image
                src={heroImage}
                alt="Traditional Indian Couture Model — Fashion Cart"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                unoptimized
                className="object-cover object-top"
              />

              {/* Luxury Vignette & Contrast Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/40 to-transparent" />

              {/* Top Tag: Live Editorial Drop */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#141416]/80 backdrop-blur-md text-[#C59B27] border border-[#C59B27]/40 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] pulse-dot" />
                  Editorial Lookbook 2026
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#C59B27] text-white shadow-sm">
                  {heroPromo?.discountCode ? `CODE: ${heroPromo.discountCode}` : "CODE: FIRST10"}
                </span>
              </div>

              {/* Bottom Glassmorphic Privilege Card */}
              <div className="absolute bottom-4 left-4 right-4 p-4 sm:p-5 rounded-2xl bg-[#141416]/85 backdrop-blur-xl border border-white/20 text-white space-y-3 shadow-2xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#C59B27]">✨</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C59B27]">
                      {heroPromo?.badgeText || "VIP Welcome Privilege"}
                    </span>
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white leading-snug">
                    {heroPromo?.title || "Flat 10% Off + Free Express Shipping"}
                  </h3>
                  <p className="text-[11px] text-white/75 leading-relaxed">
                    {heroPromo?.subtitle || "Auto-applied on all handcrafted silk sarees, kurtis & tailored menswear."}
                  </p>
                </div>

                {/* 3 Value Pillars */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1 border-t border-white/15">
                  <div className="py-1">
                    <span className="block text-sm">👑</span>
                    <span className="font-semibold text-white">Tailored Fit</span>
                  </div>
                  <div className="py-1">
                    <span className="block text-sm">💵</span>
                    <span className="font-semibold text-white">COD Eligible</span>
                  </div>
                  <div className="py-1">
                    <span className="block text-sm">📄</span>
                    <span className="font-semibold text-white">GST Invoice</span>
                  </div>
                </div>

                <Link
                  href={heroPromo?.ctaUrl || "/shop"}
                  className="block w-full text-center py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#C59B27] text-white hover:bg-[#B0881E] transition-colors shadow-md cursor-pointer"
                >
                  {heroPromo?.ctaText || "Shop Exclusive Edits →"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🌸 Step-by-Step Category & Subcategory Atelier Discovery */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CategoryShowcase departments={departments} />
      </section>

      {/* 👑 Curated Occasions Gallery */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#C59B27]">
              Curated Looks
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#141416]">
              Shop by Occasion
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold uppercase tracking-wider text-[#141416] hover:text-[#C59B27] transition-colors"
          >
            View All Collections →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dynamicOccasions.map((occ) => (
            <Link
              key={occ.title}
              href={occ.href}
              className="group relative rounded-3xl overflow-hidden border border-[#E7DFD5] aspect-[4/5] flex flex-col justify-end p-6 bg-[#141416] shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <Image
                src={occ.image}
                alt={occ.title}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/90 via-[#141416]/30 to-transparent" />

              <div className="relative z-10 space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-[#141416] backdrop-blur-md shadow-xs">
                  {occ.tag}
                </span>
                <h3 className="font-display text-lg font-bold text-white leading-tight group-hover:text-[#C59B27] transition-colors">
                  {occ.title}
                </h3>
                <p className="text-xs text-white/80">{occ.subtitle}</p>
                <div className="pt-2 flex items-center gap-1 text-xs font-bold text-[#C59B27] group-hover:translate-x-1 transition-transform">
                  <span>{occ.buttonText || "Explore Outfits"}</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 🛡️ Clean Assurance & Privilege Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl border border-[#E7DFD5] bg-white shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FBF4E2] text-[#8E6C0C] border border-[#C59B27]/40">
              ✦ Fashion Cart Privilege
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#141416]">
              Experience Everyday Luxury with Complete Peace of Mind
            </h2>
            <p className="text-xs sm:text-sm text-[#4B4E56] leading-relaxed max-w-xl">
              Every garment undergoes a 6-point tailoring inspection. Enjoy free express doorstep delivery, hassle-free size exchanges, Cash on Delivery, and official GST tax invoices on all orders.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/shop"
                className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-colors shadow-sm"
              >
                Join the Royal Edit →
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 rounded-full border border-[#C59B27] text-xs font-bold uppercase tracking-wider text-[#141416] hover:bg-[#F4EFEA] transition-colors"
              >
                Visit Indiranagar Boutique
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1">
              <span className="text-xl">✨</span>
              <p className="font-bold text-[#141416]">100% Genuine</p>
              <p className="text-[10px] text-[#787C87]">Certified fabrics</p>
            </div>
            <div className="p-3.5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1">
              <span className="text-xl">🔄</span>
              <p className="font-bold text-[#141416]">7-Day Return</p>
              <p className="text-[10px] text-[#787C87]">Doorstep pickup</p>
            </div>
            <div className="p-3.5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1">
              <span className="text-xl">🚚</span>
              <p className="font-bold text-[#141416]">Live Tracking</p>
              <p className="text-[10px] text-[#787C87]">Realtime AWB status</p>
            </div>
            <div className="p-3.5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1">
              <span className="text-xl">🧾</span>
              <p className="font-bold text-[#141416]">Tax Invoices</p>
              <p className="text-[10px] text-[#787C87]">Downloadable PDF</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
