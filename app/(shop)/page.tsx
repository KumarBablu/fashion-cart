import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import HomeClient from "@/components/home/HomeClient";

export const revalidate = 30;

type RailProduct = Prisma.ProductGetPayload<{
  include: {
    images: { take: 2; orderBy: { sortOrder: "asc" } };
    variants: { where: { isActive: true } };
  };
}>;

async function getRail(where: Prisma.ProductWhereInput, take = 8): Promise<RailProduct[]> {
  const items = await prisma.product.findMany({
    where: { status: "ACTIVE", ...where },
    take,
    orderBy: { createdAt: "desc" },
    include: {
      images: { take: 2, orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true } },
    },
  });

  if (items.length === 0) {
    return prisma.product.findMany({
      where: { status: "ACTIVE" },
      take,
      orderBy: { createdAt: "desc" },
      include: {
        images: { take: 2, orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true } },
      },
    });
  }

  return items;
}

function serialize(items: RailProduct[]) {
  return items.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    createdAt: p.createdAt,
    brand: p.brand,
    averageRating: Number(p.averageRating || 4.85),
    totalReviews: Number(p.totalReviews || 48),
    images: p.images,
    variants: p.variants.map((v) => ({
      id: v.id,
      colour: v.colour,
      size: v.size,
      stockQuantity: v.stockQuantity,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
    })),
  }));
}

const OCCASIONS = [
  {
    title: "Festive & Gala Edit",
    subtitle: "Zari Velvet & Anarkalis",
    href: "/shop?category=women-kurtis",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
    tag: "Artisanal Craft",
  },
  {
    title: "Wedding & Silk Soirée",
    subtitle: "Mulberry Silk & Gowns",
    href: "/shop?category=women-dresses",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
    tag: "Pure Silk",
  },
  {
    title: "Sartorial Menswear",
    subtitle: "French Linen & Mandarin Shirts",
    href: "/shop?category=men-shirts",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    tag: "Tailored Linen",
  },
  {
    title: "Earth & Sand Co-ords",
    subtitle: "Chanderi Silks & Sets",
    href: "/shop?onSale=true",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
    tag: "Flat 40% Off",
  },
];

export default async function HomePage() {
  const [categories, featured, newArrivals, bestSellers, onSale] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 6,
    }),
    getRail({ isFeatured: true }),
    getRail({ isNewArrival: true }),
    getRail({ isBestSeller: true }),
    getRail({ variants: { some: { compareAtPrice: { not: null } } } }),
  ]);

  return (
    <div className="space-y-16 pb-20 overflow-hidden">
      
      {/* 🌿 Architectural Forest & Saffron Hero Section */}
      <section className="relative bg-gradient-to-b from-[#FAF8F5] via-[#F2EFE8] to-[#FAF8F5] border-b border-[#E8E3D8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#BB8A52]/40 bg-white text-xs font-bold uppercase tracking-wider text-[#0C3B2E] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#FFBA00] pulse-dot" />
              <span>Haute Couture 2026 Collection · Live Drops</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#0C3B2E] leading-[1.08]">
              Natural Craft.<br />
              <span className="text-[#BB8A52]">
                Architectural Fit.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#2C483F] max-w-xl leading-relaxed">
              Step into high-craft apparel woven with nature&apos;s purest textures. Hand-embroidered micro-velvet kurta sets, flowing mulberry silk sarees, and breathable French linen shirts.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/shop"
                className="px-8 py-3.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#FFBA00] text-[#0C3B2E] hover:bg-[#EAA800] transition-all duration-200 shadow-md hover:scale-102"
              >
                Shop Collection →
              </Link>
              <Link
                href="/categories"
                className="px-6 py-3.5 rounded-full border border-[#0C3B2E] bg-white font-bold text-xs uppercase tracking-wider text-[#0C3B2E] hover:bg-[#0C3B2E] hover:text-white transition-all duration-200"
              >
                Explore Categories
              </Link>
              <a
                href="https://wa.me/919876543210?text=Hi%20Fashion%20Cart%20Stylist%2C%20I%20need%20outfit%20recommendations"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 rounded-full text-xs font-bold text-[#0C3B2E] border border-[#6D9773] bg-[#6D9773]/15 hover:bg-[#6D9773]/25 transition-colors flex items-center gap-1.5"
              >
                <span>💬</span> WhatsApp Stylist
              </a>
            </div>

            {/* Trust Assurance Strip */}
            <div className="pt-6 border-t border-[#E8E3D8] grid grid-cols-3 gap-4 max-w-lg text-xs">
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#0C3B2E]">100%</p>
                <p className="text-[#5B7A6F] text-[11px] mt-0.5">Certified Pure Fabrics</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#0C3B2E]">₹0</p>
                <p className="text-[#5B7A6F] text-[11px] mt-0.5">Free Express Shipping</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#0C3B2E]">4.9 ★</p>
                <p className="text-[#5B7A6F] text-[11px] mt-0.5">Over 3,500 Reviews</p>
              </div>
            </div>
          </div>

          {/* Right Hero Promo Card with Forest Green container */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-7 rounded-3xl border border-[#0C3B2E] bg-[#0C3B2E] text-white shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FFBA00] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FFBA00] pulse-dot" />
                  Festive Special Offer
                </span>
                <span className="text-xs px-3 py-1 rounded-full font-mono font-bold border border-[#FFBA00]/40 bg-[#FFBA00]/15 text-[#FFBA00]">
                  Code: FIRST10
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#FFBA00]">✨ VIP Welcome Privilege</p>
                <h3 className="font-display text-lg font-bold text-white">
                  Flat 10% Instant Discount + Free Express Shipping
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Applies automatically on all ethnic kurtis, silk sarees, and tailored menswear at checkout.
                </p>
              </div>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-3 rounded-xl border border-white/15 bg-white/5">
                  <span className="text-lg">👑</span>
                  <p className="font-bold text-[11px] mt-1 text-white">Tailored Fit</p>
                  <p className="text-[9px] text-[#FFBA00]">Master craft</p>
                </div>
                <div className="p-3 rounded-xl border border-white/15 bg-white/5">
                  <span className="text-lg">💵</span>
                  <p className="font-bold text-[11px] mt-1 text-white">COD Eligible</p>
                  <p className="text-[9px] text-[#FFBA00]">Pay at door</p>
                </div>
                <div className="p-3 rounded-xl border border-white/15 bg-white/5">
                  <span className="text-lg">🧾</span>
                  <p className="font-bold text-[11px] mt-1 text-white">GST Invoice</p>
                  <p className="text-[9px] text-[#FFBA00]">Instant PDF</p>
                </div>
              </div>

              <Link
                href="/shop?sort=discount"
                className="w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider text-center block bg-[#FFBA00] text-[#0C3B2E] hover:bg-[#EAA800] transition-colors shadow-lg"
              >
                Shop Special Deals →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 🌸 Interactive Tabbed Curated Collections */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HomeClient
          featured={serialize(featured)}
          newArrivals={serialize(newArrivals)}
          bestSellers={serialize(bestSellers)}
          onSale={serialize(onSale)}
          categories={categories}
        />
      </section>

      {/* 👑 Shop by Occasion Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-baseline justify-between border-b border-[#E8E3D8] pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#BB8A52]">Curated Looks</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0C3B2E] mt-0.5">
              Shop by Occasion
            </h2>
          </div>
          <Link href="/shop" className="text-xs font-bold text-[#0C3B2E] hover:text-[#BB8A52] hover:underline">
            View All Collections →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {OCCASIONS.map((occ) => (
            <Link
              key={occ.title}
              href={occ.href}
              className="group relative rounded-3xl overflow-hidden border border-[#E8E3D8] aspect-[4/5] flex flex-col justify-end p-6 bg-[#0C3B2E] shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <Image
                src={occ.image}
                alt={occ.title}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C3B2E]/90 via-[#0C3B2E]/30 to-transparent" />

              <div className="relative z-10 space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-[#0C3B2E] backdrop-blur-md shadow-xs">
                  {occ.tag}
                </span>
                <h3 className="font-display text-lg font-bold text-white leading-tight group-hover:text-[#FFBA00] transition-colors">
                  {occ.title}
                </h3>
                <p className="text-xs text-white/80">{occ.subtitle}</p>
                <div className="pt-2 flex items-center gap-1 text-xs font-bold text-[#FFBA00] group-hover:translate-x-1 transition-transform">
                  <span>Explore Outfits</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 🛡️ Clean Assurance & Privilege Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl border border-[#E8E3D8] bg-white shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFF7E0] text-[#0C3B2E] border border-[#FFBA00]/40">
              ✦ Fashion Cart Privilege
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0C3B2E]">
              Experience Everyday Luxury with Complete Peace of Mind
            </h2>
            <p className="text-xs sm:text-sm text-[#2C483F] leading-relaxed max-w-xl">
              Every garment undergoes a 6-point tailoring inspection. Enjoy free express doorstep delivery, hassle-free size exchanges, Cash on Delivery, and official GST tax invoices on all orders.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/shop"
                className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0C3B2E] text-white hover:bg-[#144E3E] transition-colors shadow-sm"
              >
                Join the Royal Edit →
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 rounded-full border border-[#BB8A52] text-xs font-bold uppercase tracking-wider text-[#0C3B2E] hover:bg-[#F2EFE8] transition-colors"
              >
                Visit Indiranagar Boutique
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl border border-[#E8E3D8] bg-[#FAF8F5] space-y-1">
              <span className="text-xl">✨</span>
              <p className="font-bold text-[#0C3B2E]">100% Genuine</p>
              <p className="text-[10px] text-[#5B7A6F]">Certified fabrics</p>
            </div>
            <div className="p-3.5 rounded-2xl border border-[#E8E3D8] bg-[#FAF8F5] space-y-1">
              <span className="text-xl">🔄</span>
              <p className="font-bold text-[#0C3B2E]">7-Day Return</p>
              <p className="text-[10px] text-[#5B7A6F]">Doorstep pickup</p>
            </div>
            <div className="p-3.5 rounded-2xl border border-[#E8E3D8] bg-[#FAF8F5] space-y-1">
              <span className="text-xl">🚚</span>
              <p className="font-bold text-[#0C3B2E]">Live Tracking</p>
              <p className="text-[10px] text-[#5B7A6F]">Realtime AWB status</p>
            </div>
            <div className="p-3.5 rounded-2xl border border-[#E8E3D8] bg-[#FAF8F5] space-y-1">
              <span className="text-xl">🧾</span>
              <p className="font-bold text-[#0C3B2E]">Tax Invoices</p>
              <p className="text-[10px] text-[#5B7A6F]">Downloadable PDF</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
