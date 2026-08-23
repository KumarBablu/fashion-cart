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
    titleHighlight: "Certified Pure Mulberry Silks.",
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
      "Pure Katan silk with gold electroplated zari motifs and unstitched blouse piece.",
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
      { name: "👔 French Linen Shirts", href: "/shop?category=men-shirts" },
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
      { name: "👗 Liquid Satin Gowns", href: "/shop?category=women-dresses" },
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
      "Silky high-lustre satin with asymmetrical cowl neckline and concealed zip closure.",
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

  const slide = slides[currentSlide] || slides[0];

  return (
    <section
      className="relative min-h-[440px] sm:min-h-[480px] lg:min-h-[520px] text-white overflow-hidden border-b border-[#E7DFD5] shadow-xl flex flex-col justify-between"
    >
      {/* 🌟 1. Full-Bleed Cinematic Background Image with continuous cross-fade */}
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
        <div className="absolute inset-0 bg-gradient-to-r from-[#141416]/75 via-[#141416]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/70 via-transparent to-[#141416]/25" />
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-[#C59B27]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-[#C59B27]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 👑 2. Foreground Content Overlay (Refined Standard Luxury Proportions) */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        
        {/* Left Headline & Masterpiece Summary */}
        <div key={`left-${slide.id}`} className="lg:col-span-7 space-y-4 sm:space-y-5 animate-fade-in-up">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C59B27]/50 bg-[#141416]/75 text-[10px] font-extrabold uppercase tracking-widest text-[#F3E5AB] shadow-md backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] animate-pulse" />
            <span>{slide.tag}</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2.6rem] font-bold tracking-tight text-white leading-[1.12] [text-shadow:_0_2px_12px_rgba(0,0,0,0.85)]">
              {slide.title} <br />
              <span className="italic font-serif font-normal text-[#C59B27] [text-shadow:_0_2px_12px_rgba(0,0,0,0.7)]">
                {slide.titleHighlight}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#FAF8F5]/90 max-w-lg leading-relaxed [text-shadow:_0_1px_8px_rgba(0,0,0,0.8)]">
              {slide.description}
            </p>
          </div>

          {/* Quick Category Pills with Glow */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {slide.pills.map((pill) => (
              <Link
                key={pill.name}
                href={pill.href}
                prefetch={true}
                className="px-2.5 py-1 rounded-full border border-[#C59B27]/40 bg-[#141416]/65 backdrop-blur-md hover:bg-[#C59B27] text-[#FAF8F5] hover:text-[#141416] text-[11px] font-semibold transition-all duration-200 shadow-2xs active:scale-95 cursor-pointer"
              >
                {pill.name}
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={slide.primaryBtnHref}
              prefetch={true}
              className="px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#C59B27] text-[#141416] hover:bg-[#F3E5AB] active:scale-95 transition-all duration-200 shadow-[0_2px_20px_rgba(197,155,39,0.4)] cursor-pointer"
            >
              View Featured Outfit →
            </Link>
            <WhatsAppConciergeButton
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#F3E5AB] border border-[#C59B27]/50 bg-[#141416]/80 backdrop-blur-md hover:bg-[#25262B] active:scale-95 transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer"
              customMessage={slide.conciergeMsg}
            >
              <span>💬</span> WhatsApp Stylist
            </WhatsAppConciergeButton>
          </div>

          {/* Trust Highlights */}
          <div className="pt-3 border-t border-white/20 grid grid-cols-3 gap-2.5 text-xs text-[#FAF8F5]/90">
            <div className="p-2.5 rounded-xl bg-[#141416]/70 backdrop-blur-md border border-white/15 space-y-0.5 shadow-2xs">
              <p className="text-xs font-bold text-white">100% Pure Silks</p>
              <p className="text-[9px] text-white/70">Handloom Quality</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#141416]/70 backdrop-blur-md border border-white/15 space-y-0.5 shadow-2xs">
              <p className="text-xs font-bold text-white">Free Express</p>
              <p className="text-[9px] text-white/70">Dispatches in 24h</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#141416]/70 backdrop-blur-md border border-white/15 space-y-0.5 shadow-2xs">
              <p className="text-xs font-bold text-white">4.9 ★ Rating</p>
              <p className="text-[9px] text-white/70">Over 3,500 Reviews</p>
            </div>
          </div>

        </div>

        {/* Right Glassmorphic Floating Masterpiece Spotlight Card */}
        <div key={`right-${slide.id}`} className="lg:col-span-5 relative animate-fade-in hidden lg:block">
          <Link
            href={slide.masterpieceHref}
            prefetch={true}
            className="block relative rounded-2xl overflow-hidden backdrop-blur-md bg-[#141416]/60 border border-[#C59B27]/50 shadow-[0_15px_40px_rgba(0,0,0,0.6)] p-4 sm:p-5 space-y-3 hover:border-[#C59B27] transition-all group cursor-pointer"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C59B27]/20 border border-[#C59B27]/50 text-[9px] font-extrabold uppercase tracking-widest text-[#F3E5AB]">
                {slide.lookbookBadge}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#F3E5AB]">
                ✦ {currentSlide + 1} / {slides.length}
              </span>
            </div>

            {/* Thumbnail Preview */}
            <div className="relative h-44 sm:h-48 w-full rounded-xl overflow-hidden border border-[#C59B27]/35 shadow-inner">
              <Image
                src={slide.bgImageUrl}
                alt={slide.masterpieceName}
                fill
                sizes="360px"
                className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/85 via-transparent to-transparent" />
            </div>

            {/* Details */}
            <div className="space-y-1 text-white">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#C59B27] block">
                {slide.masterpieceCollection}
              </span>
              <h3 className="font-display text-sm sm:text-base font-bold text-[#F3E5AB] group-hover:text-white transition-colors line-clamp-1">
                {slide.masterpieceName}
              </h3>
              <p className="text-[11px] text-[#FAF8F5]/85 leading-relaxed line-clamp-2">
                {slide.masterpieceDescription}
              </p>
            </div>

            {/* Price & Action */}
            <div className="pt-2 flex items-center justify-between border-t border-white/20">
              <span className="font-mono font-bold text-xs text-[#F3E5AB]">
                {slide.masterpiecePrice}
              </span>
              <span className="px-3 py-1.5 rounded-full text-[11px] font-bold text-[#141416] bg-[#C59B27] group-hover:bg-[#F3E5AB] transition-colors shadow-xs">
                View Details →
              </span>
            </div>

          </Link>
        </div>

      </div>

      {/* 👑 3. Slide Navigation Controls & Frequency Progress Indicators */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4 flex items-center justify-between w-full">
        {/* Animated Slide Progress Indicators */}
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

        {/* Next / Prev Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
            }
            className="w-8 h-8 rounded-full border border-white/20 bg-[#141416]/80 backdrop-blur-md hover:bg-[#C59B27] text-[#FAF8F5] hover:text-[#141416] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-90 text-xs"
            aria-label="Previous Slide"
          >
            ←
          </button>
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % slides.length)
            }
            className="w-8 h-8 rounded-full border border-white/20 bg-[#141416]/80 backdrop-blur-md hover:bg-[#C59B27] text-[#FAF8F5] hover:text-[#141416] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-90 text-xs"
            aria-label="Next Slide"
          >
            →
          </button>
        </div>
      </div>

    </section>
  );
}
