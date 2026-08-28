import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getStoresControl } from "@/lib/stores";
import {
  getCachedHomeProducts,
  getCachedCategories,
  getCachedPromotions,
  getCachedBanners,
} from "@/lib/data/cache";
import SubcategoriesGrid from "@/components/home/SubcategoriesGrid";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";
import ScrollReveal, { ScrollRevealGroup } from "@/components/ui/ScrollReveal";
import GarmentsHeroBanner from "@/components/home/GarmentsHeroBanner";

export const revalidate = 120;

export default async function HomePage() {
  const storesControl = await getStoresControl();
  if (!storesControl.garments.isActive) {
    redirect("/jewellery");
  }
  const [allProducts, rootCategories, promotions, banners] = await Promise.all([
    getCachedHomeProducts("garments"),
    getCachedCategories("garments"),
    getCachedPromotions("garments"),
    getCachedBanners("garments"),
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

  // Dynamic Hero Image
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
      subcategories: (cat.children || []).map((child: any) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        imageUrl: child.imageUrl,
      })),
    };
  });

  // Flat list of all subcategories with parent details for the Subcategories Row
  const allSubcategories = rootCategories.flatMap((cat: any) => {
    const slugKey = cat.slug.toLowerCase();
    const meta = META[slugKey] || { icon: "👗" };
    return (cat.children || []).map((child: any) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      imageUrl: child.imageUrl,
      parentName: cat.name,
      parentSlug: cat.slug,
      parentIcon: meta.icon,
    }));
  });

  return (
    <div className="space-y-20 pb-24 overflow-hidden">
      
      {/* 👑 ROW 1: Cinematic Full-Bleed Interactive Hero Showcase Banner Suite */}
      <GarmentsHeroBanner products={allProducts} adminBanners={banners} />

      {/* 👑 ROW 2: Categories Row ("Top Categories" - Styled like Shop by Occasion) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <ScrollReveal direction="up" distance={20}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#E7DFD5] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C59B27]">
                ✦ Curated Departments
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#141416]">
                Top Categories
              </h2>
            </div>
            <Link
              href="/categories"
              prefetch={true}
              className="text-xs font-bold uppercase tracking-wider text-[#141416] hover:text-[#C59B27] transition-colors cursor-pointer"
            >
              View All Categories →
            </Link>
          </div>
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerMs={80} distance={44}>
          {departments.map((dept) => {
            const catImage = dept.imageUrl || dept.bannerImage;
            return (
              <Link
                key={dept.id}
                href={`/shop?category=${dept.slug}`}
                prefetch={true}
                className="group relative rounded-3xl overflow-hidden border border-[#E7DFD5] aspect-[4/5] flex flex-col justify-end p-6 bg-[#141416] shadow-md transition-all duration-500 hover:shadow-2xl hover:-translate-y-2.5 luxury-card-hover cursor-pointer block w-full"
              >
                <Image
                  src={catImage}
                  alt={dept.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/95 via-[#141416]/40 to-transparent" />

                <div className="relative z-10 space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-[#141416] backdrop-blur-md shadow-xs">
                    {dept.icon} {dept.badge}
                  </span>
                  <h3 className="font-display text-xl font-bold text-white leading-tight group-hover:text-[#C59B27] transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-1">{dept.tagline}</p>
                  <div className="pt-2 flex items-center gap-1 text-xs font-bold text-[#C59B27] group-hover:translate-x-1 transition-transform">
                    <span>Explore Department</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </ScrollRevealGroup>
      </section>

      {/* 👗 ROW 3: Sub Categories Rows ("Explore Subcategories" - Styled like Shop by Occasion) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SubcategoriesGrid
          subcategories={allSubcategories}
          departments={departments.map((d) => ({
            id: d.id,
            name: d.name,
            slug: d.slug,
            icon: d.icon,
          }))}
        />
      </section>

      {/* 👑 ROW 4: Shop by Occasion Row */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <ScrollReveal direction="up" distance={20}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#E7DFD5] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C59B27]">
                ✦ Curated Looks
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#141416]">
                Shop by Occasion
              </h2>
            </div>
            <Link
              href="/shop"
              prefetch={true}
              className="text-xs font-bold uppercase tracking-wider text-[#141416] hover:text-[#C59B27] transition-colors cursor-pointer"
            >
              View All Collections →
            </Link>
          </div>
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerMs={80} distance={44}>
          {dynamicOccasions.map((occ) => (
            <Link
              key={occ.title}
              href={occ.href}
              prefetch={true}
              className="group relative rounded-3xl overflow-hidden border border-[#E7DFD5] aspect-[4/5] flex flex-col justify-end p-6 bg-[#141416] shadow-md transition-all duration-500 hover:shadow-2xl hover:-translate-y-2.5 luxury-card-hover cursor-pointer block w-full"
            >
              <Image
                src={occ.image}
                alt={occ.title}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/90 via-[#141416]/30 to-transparent" />

              <div className="relative z-10 space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-[#141416] backdrop-blur-md shadow-xs">
                  {occ.tag}
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white leading-tight group-hover:text-[#C59B27] transition-colors">
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
        </ScrollRevealGroup>
      </section>

      {/* 🛡️ ROW 5: Clean Assurance & Privilege Banner */}
      <ScrollReveal direction="up" distance={28}>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl border border-[#E7DFD5] bg-white shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center luxury-card-hover">
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
                  prefetch={true}
                  className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-colors shadow-sm cursor-pointer active:scale-95"
                >
                  Join the Royal Edit →
                </Link>
                <Link
                  href="/contact"
                  prefetch={true}
                  className="px-6 py-3 rounded-full border border-[#C59B27] text-xs font-bold uppercase tracking-wider text-[#141416] hover:bg-[#F4EFEA] transition-colors cursor-pointer active:scale-95"
                >
                  Visit Indiranagar Boutique
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1 transition-transform duration-300 hover:scale-105">
                <span className="text-xl">✨</span>
                <p className="font-bold text-[#141416]">100% Genuine</p>
                <p className="text-[10px] text-[#787C87]">Certified fabrics</p>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1 transition-transform duration-300 hover:scale-105">
                <span className="text-xl">🔄</span>
                <p className="font-bold text-[#141416]">7-Day Return</p>
                <p className="text-[10px] text-[#787C87]">Doorstep pickup</p>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1 transition-transform duration-300 hover:scale-105">
                <span className="text-xl">🚚</span>
                <p className="font-bold text-[#141416]">Live Tracking</p>
                <p className="text-[10px] text-[#787C87]">Realtime AWB status</p>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1 transition-transform duration-300 hover:scale-105">
                <span className="text-xl">🧾</span>
                <p className="font-bold text-[#141416]">Tax Invoices</p>
                <p className="text-[10px] text-[#787C87]">Downloadable PDF</p>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}

