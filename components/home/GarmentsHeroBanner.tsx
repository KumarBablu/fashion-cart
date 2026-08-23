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

  // If admin has created HERO banners, use them; otherwise use rich default slides linked to real products
  const heroBanners = adminBanners.filter((b) => b.position === "HERO" && b.isActive);

  const slides: GarmentBannerSlide[] =
    heroBanners.length > 0
      ? heroBanners.map((b, idx) => ({
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
        }))
      : DEFAULT_GARMENT_SLIDES.map((slide, idx) => {
          const prod = products[idx] || products[0];
          if (!prod) return slide;

          const price = prod.variants?.[0]?.price
            ? `₹${Number(prod.variants[0].price).toLocaleString("en-IN")} · In Stock`
            : slide.masterpiecePrice;
          const prodUrl = `/products/${prod.slug}`;
          const prodImg = prod.images?.[0]?.imageUrl || slide.bgImageUrl;

          return {
            ...slide,
            masterpieceName: prod.name || slide.masterpieceName,
            masterpiecePrice: price,
            masterpieceHref: prodUrl,
            primaryBtnHref: prodUrl,
            bgImageUrl: prodImg,
          };
        });

  // Continuous reliable auto-advance frequency
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, AUTO_CHANGE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length, currentSlide]);

  return (
    <section className="relative min-h-[500px] sm:min-h-[560px] lg:min-h-[620px] text-white overflow-hidden border-b border-[#E7DFD5] shadow-2xl flex flex-col justify-between">
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

      {/* 👑 2. Foreground Content Overlay with Silky Smooth Cross-Fade */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Headline & Masterpiece Summary (Stacked Layer Cross-Fade Animation) */}
        <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[300px] flex items-center">
          {slides.map((s, idx) => {
            const isActive = currentSlide === idx;
            return (
              <div
                key={s.id}
                className={`w-full space-y-4 sm:space-y-5 transition-all duration-700 ease-in-out ${
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
                  <h1 className="font-display text-2xl sm:text-4xl lg:text-[3.15rem] font-bold tracking-tight text-white leading-[1.1] [text-shadow:_0_2px_14px_rgba(0,0,0,0.85)]">
                    {s.title} <br />
                    <span className="italic font-serif font-normal text-[#C59B27] [text-shadow:_0_2px_14px_rgba(0,0,0,0.7)]">
                      {s.titleHighlight}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-[#FAF8F5]/90 max-w-xl leading-relaxed [text-shadow:_0_1px_8px_rgba(0,0,0,0.75)]">
                    {s.description}
                  </p>
                </div>

                {/* Quick Category Pills with Glow */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {s.pills.map((pill) => (
                    <Link
                      key={pill.name}
                      href={pill.href}
                      prefetch={true}
                      className="px-3 py-1 rounded-full border border-[#C59B27]/50 bg-[#141416]/70 backdrop-blur-md hover:bg-[#C59B27] text-[#FAF8F5] hover:text-[#141416] text-xs font-semibold transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
                    >
                      {pill.name}
                    </Link>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href={s.primaryBtnHref}
                    prefetch={true}
                    className="px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-[#C59B27] text-[#141416] hover:bg-[#F3E5AB] active:scale-95 transition-all duration-200 shadow-[0_4px_24px_rgba(197,155,39,0.45)] cursor-pointer"
                  >
                    Explore Collection →
                  </Link>
                  <WhatsAppConciergeButton
                    className="px-5 py-3 rounded-full text-xs font-semibold text-[#F3E5AB] border border-[#C59B27]/50 bg-[#141416]/80 backdrop-blur-md hover:bg-[#25262B] active:scale-95 transition-all duration-200 shadow-md flex items-center gap-2 cursor-pointer"
                    customMessage={s.conciergeMsg}
                  >
                    <span>💬</span> WhatsApp Stylist
                  </WhatsAppConciergeButton>
                </div>

                {/* Minimalist Single-Line Luxury Trust Strip */}
                <div className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#FAF8F5]/95 font-medium">
                  <span className="flex items-center gap-1.5">✦ 100% Pure Silks</span>
                  <span className="flex items-center gap-1.5">✦ Free Express Dispatch (24h)</span>
                  <span className="flex items-center gap-1.5">✦ Certified Quality</span>
                  <span className="flex items-center gap-1.5 text-white font-semibold">✦ 4.9 ★ (3,500+ Reviews)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Glassmorphic Floating Masterpiece Spotlight Card (Lavish, Borderless & Prominently Sized) */}
        <div className="lg:col-span-5 relative hidden lg:flex justify-end items-center min-h-[340px]">
          {slides.map((s, idx) => {
            const isActive = currentSlide === idx;
            return (
              <div
                key={s.id}
                className={`w-full max-w-[390px] transition-all duration-700 ease-in-out ${
                  isActive
                    ? "opacity-100 scale-100 relative z-10 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none absolute right-0 z-0"
                }`}
              >
                <Link
                  href={s.masterpieceHref}
                  prefetch={true}
                  className="block w-full rounded-3xl overflow-hidden backdrop-blur-xl bg-[#141416]/55 border-0 shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-5 space-y-3.5 transition-all group cursor-pointer"
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#C59B27]/20 text-[10px] font-bold uppercase tracking-wider text-[#F3E5AB]">
                      {s.lookbookBadge}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-[#F3E5AB]/85">
                      ✦ {idx + 1} / {slides.length}
                    </span>
                  </div>

                  {/* Thumbnail Preview (Prominent, High-Res Borderless Viewport) */}
                  <div className="relative h-52 sm:h-56 w-full rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={s.bgImageUrl}
                      alt={s.masterpieceName}
                      fill
                      sizes="420px"
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/85 via-transparent to-transparent" />
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#C59B27] block">
                      {s.masterpieceCollection}
                    </span>
                    <h3 className="font-display text-base sm:text-lg font-semibold text-[#F3E5AB] group-hover:text-white transition-colors line-clamp-1">
                      {s.masterpieceName}
                    </h3>
                    <p className="text-xs text-[#FAF8F5]/85 leading-snug line-clamp-2">
                      {s.masterpieceDescription}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-2.5 flex items-center justify-between border-t border-white/10">
                    <span className="font-mono font-bold text-sm text-[#F3E5AB]">
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

      {/* 👑 3. Slide Navigation Controls & Frequency Progress Indicators (Grouped, Non-Overlapping) */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-5 flex items-center justify-between w-full">
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

        {/* Right side has zero elements, guaranteeing NO overlap with the floating WhatsApp button! */}
        <div className="hidden sm:block text-[11px] text-white/40 tracking-widest uppercase font-mono pr-16">
          Fashion Cart Atelier
        </div>
      </div>

    </section>
  );
}
