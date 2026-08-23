"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";

export type GarmentBannerSlide = {
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

const DEFAULT_GARMENT_SLIDES: GarmentBannerSlide[] = [
  {
    id: "silk-sarees",
    tag: "🥻 Heritage Atelier 2026",
    title: "Timeless Elegance in",
    titleHighlight: "Pure Mulberry Silks.",
    description:
      "Handwoven Varanasi zari weaves, micro-velvet kurtis, and royal Anarkalis masterfully tailored for grand celebrations and discerning distinction.",
    pills: [
      { name: "🥻 Silk Sarees", href: "/shop?category=women-kurtis" },
      { name: "👗 Velvet Kurtis", href: "/shop?category=women-kurtis" },
      { name: "👑 Anarkali Sets", href: "/shop?category=women-dresses" },
      { name: "✨ Bridal Dupattas", href: "/shop?category=women-kurtis" },
    ],
    primaryBtnText: "Explore Signature Silks →",
    primaryBtnHref: "/shop",
    conciergeMsg: "Hi Fashion Cart Stylist, I would like Mulberry Silk & Couture recommendations!",
    bgImageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1920&auto=format&fit=crop&q=90",
    lookbookBadge: "🥻 Heritage Handloom",
    masterpieceCollection: "✦ Haute Festive 2026",
    masterpieceName: "Varanasi Mulberry Silk Zari Saree",
    masterpieceDescription:
      "Pure Katan silk with gold electroplated zari motifs & unstitched blouse piece.",
    masterpiecePrice: "₹199 · In Stock",
    masterpieceHref: "/shop",
  },
  {
    id: "mens-linen",
    tag: "👔 Sartorial Linen Atelier",
    title: "Sartorial Poise &",
    titleHighlight: "100% Certified French Linen.",
    description:
      "Crisp mandarin collar shirts, structured linen trousers, and bandhgala jackets engineered with breathable luxury for effortless sophistication.",
    pills: [
      { name: "👔 Linen Shirts", href: "/shop?category=men-shirts" },
      { name: "🧥 Bandhgalas", href: "/shop?category=men-shirts" },
      { name: "👖 Tailored Chinos", href: "/shop?category=men-shirts" },
      { name: "🌟 Mandarin Collars", href: "/shop?category=men-shirts" },
    ],
    primaryBtnText: "Explore Menswear →",
    primaryBtnHref: "/shop?category=men-shirts",
    conciergeMsg: "Hi Fashion Cart Stylist, I am exploring tailored French Linen menswear!",
    bgImageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1920&auto=format&fit=crop&q=90",
    lookbookBadge: "👔 Sartorial Linen",
    masterpieceCollection: "🌟 Menswear Atelier 2026",
    masterpieceName: "Bespoke Normandy French Linen Shirt",
    masterpieceDescription:
      "100% organic European flax, mother-of-pearl buttons with relaxed mandarin collar.",
    masterpiecePrice: "₹199 · In Stock",
    masterpieceHref: "/shop?category=men-shirts",
  },
  {
    id: "contemporary-chic",
    tag: "✨ Contemporary Chic",
    title: "Modern Poise &",
    titleHighlight: "Liquid Satin Cocktail Edits.",
    description:
      "Fluid drape evening gowns, tailored linen blazers, and monochromatic co-ord sets sculpted for cocktail galas and contemporary soirees.",
    pills: [
      { name: "👗 Satin Gowns", href: "/shop?category=women-dresses" },
      { name: "🧥 Linen Blazers", href: "/shop?category=women-dresses" },
      { name: "✨ Monochrome Co-ords", href: "/shop?onSale=true" },
      { name: "🌟 Evening Edits", href: "/shop" },
    ],
    primaryBtnText: "Explore Cocktail Edits →",
    primaryBtnHref: "/shop?category=women-dresses",
    conciergeMsg: "Hi Fashion Cart Stylist, please share contemporary gown & co-ord options!",
    bgImageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&auto=format&fit=crop&q=90",
    lookbookBadge: "✨ Liquid Satin",
    masterpieceCollection: "💫 Gala Edition 2026",
    masterpieceName: "Liquid Satin Draped Cocktail Gown",
    masterpieceDescription:
      "High-lustre satin with asymmetrical cowl neckline and concealed zip closure.",
    masterpiecePrice: "₹199 · In Stock",
    masterpieceHref: "/shop?category=women-dresses",
  },
];

const AUTO_CHANGE_INTERVAL_MS = 6500;

export default function GarmentsHeroBanner({
  products = [],
  adminBanners = [],
}: {
  products?: any[];
  adminBanners?: any[];
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 👑 Multi-Store Slide Engine (Standardized Top 3 Slides across all stores):
  const activeHeroBanners = (adminBanners || []).filter((b) => b.position === "HERO" && b.isActive);

  let dynamicSlides: GarmentBannerSlide[] = [];

  if (activeHeroBanners.length >= 2) {
    dynamicSlides = activeHeroBanners.slice(0, 3).map((b, idx) => ({
      id: b.id || `admin-hero-${idx}`,
      tag: b.badge || "✦ Exclusive Collection",
      title: b.title || "Timeless Elegance in",
      titleHighlight: "Signature Atelier Cuts.",
      description: b.subtitle || "Discover masterfully tailored garments crafted with certified pure fabrics.",
      pills: DEFAULT_GARMENT_SLIDES[idx % DEFAULT_GARMENT_SLIDES.length].pills,
      primaryBtnText: b.buttonText || "Shop Collection →",
      primaryBtnHref: b.linkUrl || "/shop",
      conciergeMsg: "Hi Fashion Cart Stylist, I would like personal outfit recommendations!",
      bgImageUrl: b.imageUrl || DEFAULT_GARMENT_SLIDES[idx % DEFAULT_GARMENT_SLIDES.length].bgImageUrl,
      lookbookBadge: b.badge || "👑 Signature Edit",
      masterpieceCollection: "✦ Collection 2026",
      masterpieceName: b.title,
      masterpieceDescription: b.subtitle || "Certified luxury craftsmanship.",
      masterpiecePrice: "In Stock",
      masterpieceHref: b.linkUrl || "/shop",
    }));
  } else if (products.length > 0) {
    // Generate exactly 3 spotlight slides from the store catalog
    const productPool = products.slice(0, 3);
    dynamicSlides = productPool.map((prod, idx) => {
      const defaultTemplate = DEFAULT_GARMENT_SLIDES[idx % DEFAULT_GARMENT_SLIDES.length];
      const price = prod.variants?.[0]?.price
        ? `₹${Number(prod.variants[0].price).toLocaleString("en-IN")} · In Stock`
        : defaultTemplate.masterpiecePrice;
      const prodUrl = `/products/${prod.slug}`;
      const prodImg = prod.images?.[0]?.imageUrl || defaultTemplate.bgImageUrl;

      const words = (prod.name || "").split(" ");
      const titlePrefix = words.length > 2 ? words.slice(0, 3).join(" ") + " in" : defaultTemplate.title;
      const titleSuffix = words.length > 2 ? words.slice(3).join(" ") : defaultTemplate.titleHighlight;

      return {
        id: prod.id || `garment-prod-${idx}`,
        tag: prod.category?.name ? `🥻 ${prod.category.name}` : defaultTemplate.tag,
        title: titlePrefix,
        titleHighlight: titleSuffix,
        description: prod.description ? prod.description.slice(0, 160) : defaultTemplate.description,
        pills: defaultTemplate.pills,
        primaryBtnText: "Explore Collection →",
        primaryBtnHref: prodUrl,
        conciergeMsg: `Hi Fashion Cart Stylist, I would like to inquire about ${prod.name}!`,
        bgImageUrl: prodImg,
        lookbookBadge: prod.category?.name ? `👗 ${prod.category.name}` : defaultTemplate.lookbookBadge,
        masterpieceCollection: `✦ Spotlight Look #${idx + 1}`,
        masterpieceName: prod.name,
        masterpieceDescription: prod.description ? prod.description.slice(0, 120) : defaultTemplate.masterpieceDescription,
        masterpiecePrice: price,
        masterpieceHref: prodUrl,
      };
    });
  }

  // Ensure exactly 3 rotating slides always exist
  const slides: GarmentBannerSlide[] =
    dynamicSlides.length >= 2 ? dynamicSlides : DEFAULT_GARMENT_SLIDES;

  // Unconditional continuous auto-rotation every 6.5s
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, AUTO_CHANGE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative min-h-[calc(100vh-76px)] lg:min-h-[calc(100vh-80px)] text-white overflow-hidden border-b border-[#E7DFD5] shadow-2xl flex flex-col justify-between">
      {/* 🌟 1. Full-Bleed Background Image with continuous cross-fade */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#141416]">
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
              className="object-cover object-top transform scale-102 transition-transform duration-7000 ease-out"
            />
          </div>
        ))}

        {/* Lighter, Luminous Atmospheric Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141416]/80 via-[#141416]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/70 via-transparent to-[#141416]/20" />
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
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#C59B27]/50 bg-[#141416]/80 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#F3E5AB] backdrop-blur-md shadow-md">
                  <span className="w-2 h-2 rounded-full bg-[#C59B27] animate-pulse" />
                  <span>{s.tag}</span>
                </div>

                <div className="space-y-2 sm:space-y-2.5">
                  <h1 className="font-display text-2xl sm:text-3xl lg:text-[2.35rem] font-bold tracking-tight text-white leading-tight [text-shadow:_0_2px_14px_rgba(0,0,0,0.85)]">
                    {s.title} <br />
                    <span className="italic font-serif font-normal text-[#C59B27] [text-shadow:_0_2px_14px_rgba(0,0,0,0.7)]">
                      {s.titleHighlight}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#FAF8F5]/90 max-w-lg leading-relaxed [text-shadow:_0_1px_8px_rgba(0,0,0,0.75)]">
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
                      className="px-3 py-1 rounded-full border border-[#C59B27]/50 bg-[#141416]/70 backdrop-blur-md hover:bg-[#C59B27] text-[#FAF8F5] hover:text-[#141416] text-[11px] font-semibold transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
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
                    className="px-6 py-2.5 rounded-full font-bold text-[11px] uppercase tracking-wider bg-[#C59B27] text-[#141416] hover:bg-[#F3E5AB] active:scale-95 transition-all duration-200 shadow-[0_4px_24px_rgba(197,155,39,0.45)] cursor-pointer"
                  >
                    Explore Collection →
                  </Link>
                  <WhatsAppConciergeButton
                    className="px-5 py-2.5 rounded-full text-[11px] font-semibold text-[#F3E5AB] border border-[#C59B27]/50 bg-[#141416]/80 backdrop-blur-md hover:bg-[#25262B] active:scale-95 transition-all duration-200 shadow-md flex items-center gap-2 cursor-pointer"
                    customMessage={s.conciergeMsg}
                  >
                    <span>💬</span> WhatsApp Stylist
                  </WhatsAppConciergeButton>
                </div>

                {/* Minimalist Single-Line Luxury Trust Strip */}
                <div className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#FAF8F5]/95 font-medium">
                  <span className="flex items-center gap-1">✦ 100% Pure Silks</span>
                  <span className="flex items-center gap-1">✦ Free Express Dispatch (24h)</span>
                  <span className="flex items-center gap-1">✦ Certified Quality</span>
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
                  className="block w-full rounded-3xl overflow-hidden backdrop-blur-xl bg-[#141416]/55 border-0 shadow-[0_30px_70px_rgba(0,0,0,0.75)] p-5 sm:p-6 space-y-4 transition-all group cursor-pointer"
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-3.5 py-1 rounded-full bg-[#C59B27]/20 text-[10px] font-bold uppercase tracking-wider text-[#F3E5AB]">
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
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/85 via-transparent to-transparent" />
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#C59B27] block">
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
                    <span className="px-4 py-2 rounded-full text-xs font-bold text-[#141416] bg-[#C59B27] group-hover:bg-[#F3E5AB] transition-colors shadow-sm">
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
                    className="absolute inset-0 bg-gradient-to-r from-[#F3E5AB] via-[#C59B27] to-[#FAF8F5]"
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
              className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-md hover:bg-[#C59B27] text-white/80 hover:text-[#141416] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
              aria-label="Previous Slide"
              title="Previous Slide"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-md hover:bg-[#C59B27] text-white/80 hover:text-[#141416] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
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
