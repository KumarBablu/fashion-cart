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
    title: "Timeless Elegance &",
    titleHighlight: "Pure Mulberry Silks.",
    description:
      "Handwoven Varanasi zari weaves, micro-velvet kurtis, and royal Anarkalis tailored for grand celebrations.",
    pills: [
      { name: "🥻 Silk Sarees", href: "/shop?category=women-kurtis" },
      { name: "👗 Velvet Kurtis", href: "/shop?category=women-kurtis" },
      { name: "👑 Anarkali Sets", href: "/shop?category=women-dresses" },
      { name: "✨ Bridal Dupattas", href: "/shop?category=women-kurtis" },
    ],
    primaryBtnText: "Explore Silks →",
    primaryBtnHref: "/shop",
    conciergeMsg: "Hi Fashion Cart Stylist, I would like Mulberry Silk & Couture recommendations!",
    bgImageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1920&auto=format&fit=crop&q=90",
    lookbookBadge: "🥻 Heritage Handloom",
    masterpieceCollection: "✦ Festive Edit 2026",
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
    titleHighlight: "100% French Linen.",
    description:
      "Mandarin collar shirts, structured linen trousers, and bandhgala jackets engineered with breathable luxury.",
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
    masterpieceCollection: "🌟 Menswear Edit 2026",
    masterpieceName: "Bespoke Normandy Linen Shirt",
    masterpieceDescription:
      "100% organic flax with mother-of-pearl buttons & mandarin collar.",
    masterpiecePrice: "₹199 · In Stock",
    masterpieceHref: "/shop?category=men-shirts",
  },
  {
    id: "contemporary-chic",
    tag: "✨ Contemporary Chic",
    title: "Modern Poise &",
    titleHighlight: "Liquid Satin Gowns.",
    description:
      "Fluid drape evening gowns, tailored linen blazers, and monochromatic co-ord sets sculpted for contemporary soirees.",
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
    masterpieceCollection: "💫 Gala Edit 2026",
    masterpieceName: "Liquid Satin Draped Cocktail Gown",
    masterpieceDescription:
      "High-lustre satin with asymmetrical cowl neckline & concealed zip.",
    masterpiecePrice: "₹199 · In Stock",
    masterpieceHref: "/shop?category=women-dresses",
  },
];

const AUTO_CHANGE_INTERVAL_MS = 4500;

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
          title: b.title || "Timeless Elegance &",
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
    <section className="relative min-h-[360px] sm:min-h-[400px] lg:min-h-[440px] text-white overflow-hidden border-b border-[#E7DFD5] shadow-lg flex flex-col justify-between">
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
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-9 w-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
        
        {/* Left Headline & Masterpiece Summary (Stacked Layer Cross-Fade Animation) */}
        <div className="lg:col-span-7 relative min-h-[220px] sm:min-h-[230px] flex items-center">
          {slides.map((s, idx) => {
            const isActive = currentSlide === idx;
            return (
              <div
                key={s.id}
                className={`w-full space-y-3 sm:space-y-3.5 transition-all duration-700 ease-in-out ${
                  isActive
                    ? "opacity-100 translate-y-0 relative z-10"
                    : "opacity-0 translate-y-2 pointer-events-none absolute inset-0 z-0"
                }`}
              >
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#C59B27]/40 bg-[#141416]/75 text-[9px] font-bold uppercase tracking-widest text-[#F3E5AB] backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] animate-pulse" />
                  <span>{s.tag}</span>
                </div>

                <div className="space-y-1.5">
                  <h1 className="font-display text-xl sm:text-2xl lg:text-[1.85rem] font-semibold tracking-tight text-white leading-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.8)]">
                    {s.title}{" "}
                    <span className="italic font-serif font-normal text-[#C59B27]">
                      {s.titleHighlight}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-[13px] text-[#FAF8F5]/85 max-w-lg leading-relaxed line-clamp-2 [text-shadow:_0_1px_6px_rgba(0,0,0,0.7)]">
                    {s.description}
                  </p>
                </div>

                {/* Compact Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {s.pills.map((pill) => (
                    <Link
                      key={pill.name}
                      href={pill.href}
                      prefetch={true}
                      className="px-2.5 py-0.5 rounded-full border border-[#C59B27]/40 bg-[#141416]/65 backdrop-blur-md hover:bg-[#C59B27] text-[#FAF8F5] hover:text-[#141416] text-[10px] font-semibold transition-all duration-200 shadow-2xs active:scale-95 cursor-pointer"
                    >
                      {pill.name}
                    </Link>
                  ))}
                </div>

                {/* Compact Standard Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Link
                    href={s.primaryBtnHref}
                    prefetch={true}
                    className="px-5 py-2 rounded-full font-bold text-[11px] uppercase tracking-wider bg-[#C59B27] text-[#141416] hover:bg-[#F3E5AB] active:scale-95 transition-all duration-200 shadow-[0_2px_14px_rgba(197,155,39,0.35)] cursor-pointer"
                  >
                    Explore Collection →
                  </Link>
                  <WhatsAppConciergeButton
                    className="px-3.5 py-2 rounded-full text-[11px] font-medium text-[#F3E5AB] border border-[#C59B27]/40 bg-[#141416]/75 backdrop-blur-md hover:bg-[#25262B] active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                    customMessage={s.conciergeMsg}
                  >
                    <span>💬</span> WhatsApp Stylist
                  </WhatsAppConciergeButton>
                </div>

                {/* Minimalist Single-Line Luxury Trust Strip */}
                <div className="pt-2.5 border-t border-white/15 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#FAF8F5]/90 font-medium">
                  <span className="flex items-center gap-1">✦ 100% Pure Silks</span>
                  <span className="flex items-center gap-1">✦ Free Express Dispatch (24h)</span>
                  <span className="flex items-center gap-1">✦ Certified Quality</span>
                  <span className="flex items-center gap-1 text-white font-semibold">✦ 4.9 ★ (3,500+ Reviews)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Glassmorphic Floating Masterpiece Spotlight Card (Borderless & Slightly Larger Size) */}
        <div className="lg:col-span-5 relative hidden lg:flex justify-end items-center min-h-[260px]">
          {slides.map((s, idx) => {
            const isActive = currentSlide === idx;
            return (
              <div
                key={s.id}
                className={`w-full max-w-[340px] transition-all duration-700 ease-in-out ${
                  isActive
                    ? "opacity-100 scale-100 relative z-10 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none absolute right-0 z-0"
                }`}
              >
                <Link
                  href={s.masterpieceHref}
                  prefetch={true}
                  className="block w-full rounded-2xl overflow-hidden backdrop-blur-xl bg-[#141416]/50 border-0 shadow-[0_20px_50px_rgba(0,0,0,0.65)] p-4 space-y-3 transition-all group cursor-pointer"
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#C59B27]/20 text-[9px] font-bold uppercase tracking-wider text-[#F3E5AB]">
                      {s.lookbookBadge}
                    </span>
                    <span className="text-[9.5px] font-mono font-semibold text-[#F3E5AB]/80">
                      ✦ {idx + 1} / {slides.length}
                    </span>
                  </div>

                  {/* Thumbnail Preview (Clean Borderless Image) */}
                  <div className="relative h-44 sm:h-48 w-full rounded-xl overflow-hidden shadow-md">
                    <Image
                      src={s.bgImageUrl}
                      alt={s.masterpieceName}
                      fill
                      sizes="340px"
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/85 via-transparent to-transparent" />
                  </div>

                  {/* Details */}
                  <div className="space-y-0.5 text-white">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#C59B27] block">
                      {s.masterpieceCollection}
                    </span>
                    <h3 className="font-display text-sm font-semibold text-[#F3E5AB] group-hover:text-white transition-colors line-clamp-1">
                      {s.masterpieceName}
                    </h3>
                    <p className="text-[11px] text-[#FAF8F5]/80 leading-snug line-clamp-1">
                      {s.masterpieceDescription}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-2 flex items-center justify-between border-t border-white/10">
                    <span className="font-mono font-bold text-xs text-[#F3E5AB]">
                      {s.masterpiecePrice}
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-[10.5px] font-semibold text-[#141416] bg-[#C59B27] group-hover:bg-[#F3E5AB] transition-colors shadow-2xs">
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
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-3 flex items-center justify-between w-full">
        {/* Animated Slide Progress Indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`relative h-1 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${
                currentSlide === idx
                  ? "w-8 bg-white/20"
                  : "w-2.5 bg-white/30 hover:bg-white/60"
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

        {/* Next / Prev Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
            }
            className="w-7 h-7 rounded-full bg-[#141416]/75 backdrop-blur-md hover:bg-[#C59B27] text-[#FAF8F5] hover:text-[#141416] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90 text-[10px]"
            aria-label="Previous Slide"
          >
            ←
          </button>
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % slides.length)
            }
            className="w-7 h-7 rounded-full bg-[#141416]/75 backdrop-blur-md hover:bg-[#C59B27] text-[#FAF8F5] hover:text-[#141416] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90 text-[10px]"
            aria-label="Next Slide"
          >
            →
          </button>
        </div>
      </div>

    </section>
  );
}
