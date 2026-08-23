"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";

export type JewelleryBannerSlide = {
  id: string;
  tag: string;
  title: string;
  titleHighlight: string;
  description: string;
  pills: { name: string; href: string }[];
  primaryBtnText: string;
  primaryBtnHref: string;
  conciergeMsg: string;
  bgImageUrl: string;
  lookbookBadge: string;
  masterpieceCollection: string;
  masterpieceName: string;
  masterpieceDescription: string;
  masterpiecePrice: string;
  masterpieceHref: string;
};

const DEFAULT_JEWELLERY_SLIDES: JewelleryBannerSlide[] = [
  {
    id: "bridal-kundan",
    tag: "👑 Imperial Fine Jewellery",
    title: "Heirloom Royalty in",
    titleHighlight: "24K Micro-Plated Gold.",
    description:
      "Adorn yourself in timeless splendour. Handcrafted Uncut Kundan, Real South-Sea Pearls, and intricate Meenakari chokers curated for grand royal celebrations.",
    pills: [
      { name: "👑 Bridal Chokers", href: "/shop?store=jewellery&category=necklaces-sets" },
      { name: "💎 Kundan Sets", href: "/shop?store=jewellery&q=Kundan" },
      { name: "✨ 24K Bangles", href: "/shop?store=jewellery&category=bangles-kadas" },
      { name: "🌸 Royal Jhumkas", href: "/shop?store=jewellery&category=earrings-jhumkas" },
    ],
    primaryBtnText: "View Featured Jewellery →",
    primaryBtnHref: "/shop?store=jewellery",
    conciergeMsg: "Hi Imperial Jewels Stylist, I would like Kundan & Bridal jewellery recommendations!",
    bgImageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1920&auto=format&fit=crop&q=90",
    lookbookBadge: "👑 Artisan Handcrafted",
    masterpieceCollection: "✨ Haute Bridal Collection 2026",
    masterpieceName: "Mughal Kundan & Pearl Choker Set",
    masterpieceDescription:
      "Grand Choker, Bahubali Jhumkas & Matching Maang Tikka with 24K Micro-Plated finish.",
    masterpiecePrice: "₹188 · In Stock",
    masterpieceHref: "/shop?store=jewellery",
  },
  {
    id: "temple-heritage",
    tag: "🪔 Sacred Temple Heritage",
    title: "Divine Heritage &",
    titleHighlight: "Antique Nakshi Masterpieces.",
    description:
      "Sculpted by master goldsmiths in antique matte gold. Sacred Lakshmi motifs, peacock Nakshi carving, and auspicious long temple haars designed for authentic tradition.",
    pills: [
      { name: "🪔 Temple Haars", href: "/shop?store=jewellery&q=Temple" },
      { name: "🦚 Nakshi Kadas", href: "/shop?store=jewellery&category=bangles-kadas" },
      { name: "✨ Matte Gold Jhumkas", href: "/shop?store=jewellery&category=earrings-jhumkas" },
      { name: "👑 Kasu Malas", href: "/shop?store=jewellery&q=Kasu" },
    ],
    primaryBtnText: "View Featured Jewellery →",
    primaryBtnHref: "/shop?store=jewellery",
    conciergeMsg: "Hi Imperial Jewels Stylist, I am interested in Antique Temple Jewellery!",
    bgImageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1920&auto=format&fit=crop&q=90",
    lookbookBadge: "🪔 Temple Heritage",
    masterpieceCollection: "🌟 Sacred Antique Edits",
    masterpieceName: "Lakshmi Kasu Mala & Nakshi Jhumkas",
    masterpieceDescription:
      "24K Antique Matte finish with micro-carved deities and ruby cabochon embellishments.",
    masterpiecePrice: "₹188 · In Stock",
    masterpieceHref: "/shop?store=jewellery",
  },
  {
    id: "american-diamond",
    tag: "💎 Red Carpet Solitaires",
    title: "Flawless Sparkle with",
    titleHighlight: "American Diamond CZ Jewels.",
    description:
      "Ultra-precision 5A Cubic Zirconia cut to perfection with rhodium and platinum plating. Brilliant tennis chokers, cocktail rings, and cascading chandeliers.",
    pills: [
      { name: "💎 Tennis Chokers", href: "/shop?store=jewellery&q=Tennis" },
      { name: "💍 Solitaire CZ Rings", href: "/shop?store=jewellery&category=rings" },
      { name: "✨ Cocktail Chandeliers", href: "/shop?store=jewellery&category=earrings-jhumkas" },
      { name: "🌟 Tennis Bracelets", href: "/shop?store=jewellery&category=bangles-kadas" },
    ],
    primaryBtnText: "View Featured Jewellery →",
    primaryBtnHref: "/shop?store=jewellery",
    conciergeMsg: "Hi Imperial Jewels Stylist, please share American Diamond & Solitaire jewellery options!",
    bgImageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&auto=format&fit=crop&q=90",
    lookbookBadge: "💎 5A CZ Diamonds",
    masterpieceCollection: "💫 Gala Solitaire 2026",
    masterpieceName: "Riviera Solitaire CZ Tennis Choker",
    masterpieceDescription:
      "Platinum rhodium finish with heart & arrow faceting, hypoallergenic with security clasp.",
    masterpiecePrice: "₹188 · In Stock",
    masterpieceHref: "/shop?store=jewellery",
  },
];

const AUTO_CHANGE_INTERVAL_MS = 6500;

export default function JewelleryHeroBanner({
  products = [],
  adminBanners = [],
}: {
  products?: any[];
  adminBanners?: any[];
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 👑 Multi-Store Slide Engine:
  // Dynamically generate slides based on store products and admin banners
  const activeHeroBanners = (adminBanners || []).filter((b) => b.position === "HERO" && b.isActive);

  let dynamicSlides: JewelleryBannerSlide[] = [];

  if (activeHeroBanners.length >= 2) {
    dynamicSlides = activeHeroBanners.map((b, idx) => ({
      id: b.id || `admin-hero-${idx}`,
      tag: b.badge || "👑 Signature Collection",
      title: b.title || "Imperial Heritage in",
      titleHighlight: "Fine Handcrafted Jewels.",
      description: b.subtitle || "Discover masterfully crafted fine jewellery designed for royal celebrations.",
      pills: DEFAULT_JEWELLERY_SLIDES[idx % DEFAULT_JEWELLERY_SLIDES.length].pills,
      primaryBtnText: b.buttonText || "Shop Collection →",
      primaryBtnHref: b.linkUrl || "/shop?store=jewellery",
      conciergeMsg: "Hi Imperial Jewels Stylist, I would like personal jewellery recommendations!",
      bgImageUrl: b.imageUrl || DEFAULT_JEWELLERY_SLIDES[idx % DEFAULT_JEWELLERY_SLIDES.length].bgImageUrl,
      lookbookBadge: b.badge || "👑 Masterpiece",
      masterpieceCollection: "✨ Imperial Edit 2026",
      masterpieceName: b.title,
      masterpieceDescription: b.subtitle || "24K Micro-Plated craftsmanship.",
      masterpiecePrice: "In Stock",
      masterpieceHref: b.linkUrl || "/shop?store=jewellery",
    }));
  } else if (products.length > 0) {
    // Generate 1 slide per product from the store catalog (up to 6 products)
    const productPool = products.slice(0, 6);
    dynamicSlides = productPool.map((prod, idx) => {
      const defaultTemplate = DEFAULT_JEWELLERY_SLIDES[idx % DEFAULT_JEWELLERY_SLIDES.length];
      const price = prod.variants?.[0]?.price
        ? `₹${Number(prod.variants[0].price).toLocaleString("en-IN")} · In Stock`
        : defaultTemplate.masterpiecePrice;
      const prodUrl = `/products/${prod.slug}?store=jewellery`;
      const prodImg = prod.images?.[0]?.imageUrl || defaultTemplate.bgImageUrl;

      const words = (prod.name || "").split(" ");
      const titlePrefix = words.length > 2 ? words.slice(0, 3).join(" ") + " in" : defaultTemplate.title;
      const titleSuffix = words.length > 2 ? words.slice(3).join(" ") : defaultTemplate.titleHighlight;

      return {
        id: prod.id || `jewellery-prod-${idx}`,
        tag: prod.category?.name ? `👑 ${prod.category.name}` : defaultTemplate.tag,
        title: titlePrefix,
        titleHighlight: titleSuffix,
        description: prod.description ? prod.description.slice(0, 160) : defaultTemplate.description,
        pills: defaultTemplate.pills,
        primaryBtnText: "View Featured Jewellery →",
        primaryBtnHref: prodUrl,
        conciergeMsg: `Hi Imperial Jewels Stylist, I would like to inquire about ${prod.name}!`,
        bgImageUrl: prodImg,
        lookbookBadge: prod.category?.name ? `👑 ${prod.category.name}` : defaultTemplate.lookbookBadge,
        masterpieceCollection: `✦ Spotlight Piece #${idx + 1}`,
        masterpieceName: prod.name,
        masterpieceDescription: prod.description ? prod.description.slice(0, 120) : defaultTemplate.masterpieceDescription,
        masterpiecePrice: price,
        masterpieceHref: prodUrl,
      };
    });
  }

  // Ensure at least 3 rotating slides always exist
  const slides: JewelleryBannerSlide[] =
    dynamicSlides.length >= 2 ? dynamicSlides : DEFAULT_JEWELLERY_SLIDES;

  // Continuous reliable auto-advance frequency
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, AUTO_CHANGE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative min-h-[calc(100vh-76px)] lg:min-h-[calc(100vh-80px)] text-white overflow-hidden border-b border-[#D4AF37]/30 shadow-2xl flex flex-col justify-between"
    >
      {/* 🌟 1. Full-Bleed Background Image with continuous cross-fade */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#040E0B]">
        {slides.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentSlide === idx ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
            }`}
            style={{ transitionProperty: "opacity, transform", transitionDuration: "1200ms" }}
          >
            <Image
              src={s.bgImageUrl}
              alt={s.masterpieceName}
              fill
              priority={idx === 0}
              sizes="100vw"
              className="object-cover object-center transform scale-102 transition-transform duration-7000 ease-out"
            />
          </div>
        ))}

        {/* Lighter, Luminous Atmospheric Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#040E0B]/80 via-[#061A14]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040E0B]/70 via-transparent to-[#040E0B]/20" />
      </div>

      {/* 👑 2. Foreground Content Overlay (Full Viewport Centered) */}
      <div className="relative z-10 my-auto mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        
        {/* Left Headline & Masterpiece Summary (Stacked Layer Cross-Fade Animation) */}
        <div className="lg:col-span-7 relative min-h-[320px] sm:min-h-[350px] flex items-center">
          {slides.map((s, idx) => {
            const isActive = currentSlide === idx;
            return (
              <div
                key={s.id}
                className={`w-full space-y-4 sm:space-y-6 transition-all duration-700 ease-in-out ${
                  isActive
                    ? "opacity-100 translate-y-0 relative z-10"
                    : "opacity-0 translate-y-2 pointer-events-none absolute inset-0 z-0"
                }`}
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#D4AF37]/50 bg-[#061A14]/80 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#F3E5AB] backdrop-blur-md shadow-md">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span>{s.tag}</span>
                </div>

                <div className="space-y-2 sm:space-y-2.5">
                  <h1 className="font-display text-2xl sm:text-3xl lg:text-[2.35rem] font-bold tracking-tight text-white leading-tight [text-shadow:_0_2px_14px_rgba(0,0,0,0.85)]">
                    {s.title} <br />
                    <span className="bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#FFF8E7] bg-clip-text text-transparent italic font-serif font-normal [text-shadow:_0_2px_14px_rgba(0,0,0,0.7)]">
                      {s.titleHighlight}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#FDFBF7]/90 max-w-lg leading-relaxed [text-shadow:_0_1px_8px_rgba(0,0,0,0.75)]">
                    {s.description}
                  </p>
                </div>

                {/* Quick Category Pills with Glow */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {s.pills.map((pill) => (
                    <Link
                      key={pill.name}
                      href={pill.href}
                      prefetch={true}
                      className="px-3 py-1 rounded-full border border-[#D4AF37]/50 bg-[#061A14]/70 backdrop-blur-md hover:bg-[#D4AF37] text-[#F3E5AB] hover:text-[#061A14] text-[11px] font-semibold transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
                    >
                      {pill.name}
                    </Link>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1.5">
                  <Link
                    href={s.primaryBtnHref}
                    prefetch={true}
                    className="px-6 py-2.5 rounded-full font-bold text-[11px] uppercase tracking-wider text-[#061A14] bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#E5C158] hover:brightness-110 active:scale-95 transition-all duration-200 shadow-[0_4px_24px_rgba(212,175,55,0.45)] cursor-pointer"
                  >
                    View Featured Jewellery →
                  </Link>
                  <WhatsAppConciergeButton
                    className="px-5 py-2.5 rounded-full text-[11px] font-semibold text-[#F3E5AB] border border-[#D4AF37]/50 bg-[#061A14]/80 backdrop-blur-md hover:bg-[#0D2C22] active:scale-95 transition-all duration-200 shadow-md flex items-center gap-2 cursor-pointer"
                    customMessage={s.conciergeMsg}
                  >
                    <span>💬</span> Bridal Concierge
                  </WhatsAppConciergeButton>
                </div>

                {/* Minimalist Single-Line Luxury Trust Strip */}
                <div className="pt-3 border-t border-[#D4AF37]/25 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#F3E5AB]/95 font-medium">
                  <span className="flex items-center gap-1">✦ 24K Micro-Polish</span>
                  <span className="flex items-center gap-1">✦ 100% Anti-Tarnish</span>
                  <span className="flex items-center gap-1">✦ Velvet Gift Packaging</span>
                  <span className="flex items-center gap-1 text-white font-semibold">✦ 4.9 ★ (3,500+ Reviews)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Glassmorphic Floating Masterpiece Spotlight Card (Lavish, Borderless & Full Proportions) */}
        <div className="lg:col-span-5 relative hidden lg:flex justify-end items-center min-h-[420px]">
          {slides.map((s, idx) => {
            const isActive = currentSlide === idx;
            return (
              <div
                key={s.id}
                className={`w-full max-w-[440px] sm:max-w-[470px] lg:max-w-[490px] transition-all duration-700 ease-in-out ${
                  isActive
                    ? "opacity-100 scale-100 relative z-10 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none absolute right-0 z-0"
                }`}
              >
                <Link
                  href={s.masterpieceHref}
                  prefetch={true}
                  className="block w-full rounded-3xl overflow-hidden backdrop-blur-xl bg-[#061A14]/55 border-0 shadow-[0_30px_70px_rgba(0,0,0,0.75)] p-5 sm:p-6 space-y-4 transition-all group cursor-pointer"
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-3.5 py-1 rounded-full bg-[#D4AF37]/20 text-[10px] font-bold uppercase tracking-wider text-[#F3E5AB]">
                      {s.lookbookBadge}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#F3E5AB]/85">
                      ✦ {idx + 1} / {slides.length}
                    </span>
                  </div>

                  {/* Thumbnail Preview (Grand High-Definition Borderless Image) */}
                  <div className="relative h-64 sm:h-72 lg:h-80 w-full rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src={s.bgImageUrl}
                      alt={s.masterpieceName}
                      fill
                      sizes="500px"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061A14]/85 via-transparent to-transparent" />
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block">
                      {s.masterpieceCollection}
                    </span>
                    <h3 className="font-display text-base sm:text-lg lg:text-xl font-semibold text-[#F3E5AB] group-hover:text-white transition-colors line-clamp-1">
                      {s.masterpieceName}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#FAF8F5]/85 leading-snug line-clamp-2">
                      {s.masterpieceDescription}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 flex items-center justify-between border-t border-white/10">
                    <span className="font-mono font-bold text-sm sm:text-base text-[#F3E5AB]">
                      {s.masterpiecePrice}
                    </span>
                    <span className="px-4 py-2 rounded-full text-xs font-bold text-[#061A14] bg-[#F3E5AB] group-hover:bg-[#D4AF37] transition-colors shadow-sm">
                      View Details →
                    </span>
                  </div>

                </Link>
              </div>
            );
          })}
        </div>

      </div>

      {/* 👑 3. Slide Navigation Controls & Frequency Progress Indicators */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-5 flex items-center justify-start w-full">
        {/* Left Side: Animated Progress Bar + Mini Arrow Buttons Grouped Cleanly */}
        <div className="flex items-center gap-3.5">
          {/* Progress Indicators */}
          <div className="flex items-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${
                  currentSlide === idx
                    ? "w-10 bg-white/20"
                    : "w-3 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              >
                {currentSlide === idx && (
                  <div
                    key={`progress-${currentSlide}-${idx}`}
                    className="absolute inset-0 bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#FFF8E7]"
                    style={{
                      animation: `carouselProgress ${AUTO_CHANGE_INTERVAL_MS}ms linear forwards`,
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Mini Chevron Controls (Safely positioned away from bottom-right floating widget) */}
          <div className="flex items-center gap-1.5 pl-1">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-md hover:bg-[#D4AF37] text-white/80 hover:text-[#061A14] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
              aria-label="Previous Slide"
              title="Previous Slide"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-md hover:bg-[#D4AF37] text-white/80 hover:text-[#061A14] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
              aria-label="Next Slide"
              title="Next Slide"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

    </section>
  );
}
