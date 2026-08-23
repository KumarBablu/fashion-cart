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
      "Handcrafted Uncut Kundan, Real South-Sea Pearls, and intricate Meenakari chokers curated for grand celebrations.",
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
    masterpieceCollection: "✨ Bridal Collection 2026",
    masterpieceName: "Mughal Kundan & Pearl Choker Set",
    masterpieceDescription:
      "Grand Choker & Bahubali Jhumkas with 24K Micro-Plated gold finish.",
    masterpiecePrice: "₹188 · In Stock",
    masterpieceHref: "/shop?store=jewellery",
  },
  {
    id: "temple-heritage",
    tag: "🪔 Sacred Temple Heritage",
    title: "Divine Heritage &",
    titleHighlight: "Antique Nakshi Masterpieces.",
    description:
      "Sculpted by master goldsmiths in antique matte gold. Sacred Lakshmi motifs and long temple haars designed for authentic tradition.",
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
      "24K Antique Matte finish with micro-carved deities & ruby cabochon.",
    masterpiecePrice: "₹188 · In Stock",
    masterpieceHref: "/shop?store=jewellery",
  },
  {
    id: "american-diamond",
    tag: "💎 Red Carpet Solitaires",
    title: "Flawless Sparkle with",
    titleHighlight: "American Diamond CZ Jewels.",
    description:
      "Ultra-precision 5A Cubic Zirconia cut to perfection with rhodium finish. Brilliant tennis chokers, cocktail rings, and chandeliers.",
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
      "Platinum rhodium finish with heart & arrow faceting, hypoallergenic.",
    masterpiecePrice: "₹188 · In Stock",
    masterpieceHref: "/shop?store=jewellery",
  },
];

const AUTO_CHANGE_INTERVAL_MS = 4500;

export default function JewelleryHeroBanner({ products = [] }: { products?: any[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Dynamically link slides to real jewellery products if available
  const slides: JewelleryBannerSlide[] = DEFAULT_JEWELLERY_SLIDES.map((slide, idx) => {
    const prod = products[idx] || products[0];
    if (!prod) return slide;

    const price = prod.variants?.[0]?.price ? `₹${Number(prod.variants[0].price).toLocaleString("en-IN")} · In Stock` : slide.masterpiecePrice;
    const prodUrl = `/products/${prod.slug}?store=jewellery`;
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
    <section className="relative min-h-[360px] sm:min-h-[400px] lg:min-h-[440px] text-white overflow-hidden border-b border-[#D4AF37]/30 shadow-lg flex flex-col justify-between">
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
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/40 bg-[#061A14]/75 text-[9px] font-bold uppercase tracking-widest text-[#F3E5AB] backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span>{s.tag}</span>
                </div>

                <div className="space-y-1.5">
                  <h1 className="font-display text-xl sm:text-2xl lg:text-[1.85rem] font-semibold tracking-tight text-white leading-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.8)]">
                    {s.title}{" "}
                    <span className="bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#FFF8E7] bg-clip-text text-transparent italic font-serif font-normal">
                      {s.titleHighlight}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-[13px] text-[#FDFBF7]/85 max-w-lg leading-relaxed line-clamp-2 [text-shadow:_0_1px_6px_rgba(0,0,0,0.7)]">
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
                      className="px-2.5 py-0.5 rounded-full border border-[#D4AF37]/40 bg-[#061A14]/65 backdrop-blur-md hover:bg-[#D4AF37] text-[#F3E5AB] hover:text-[#061A14] text-[10px] font-semibold transition-all duration-200 shadow-2xs active:scale-95 cursor-pointer"
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
                    className="px-5 py-2 rounded-full font-bold text-[11px] uppercase tracking-wider text-[#061A14] bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#E5C158] hover:brightness-110 active:scale-95 transition-all duration-200 shadow-[0_2px_14px_rgba(212,175,55,0.35)] cursor-pointer"
                  >
                    View Featured Jewellery →
                  </Link>
                  <WhatsAppConciergeButton
                    className="px-3.5 py-2 rounded-full text-[11px] font-medium text-[#F3E5AB] border border-[#D4AF37]/40 bg-[#061A14]/75 backdrop-blur-md hover:bg-[#0D2C22] active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                    customMessage={s.conciergeMsg}
                  >
                    <span>💬</span> Bridal Concierge
                  </WhatsAppConciergeButton>
                </div>

                {/* Minimalist Single-Line Luxury Trust Strip */}
                <div className="pt-2.5 border-t border-[#D4AF37]/20 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#F3E5AB]/90 font-medium">
                  <span className="flex items-center gap-1">✦ 24K Micro-Polish</span>
                  <span className="flex items-center gap-1">✦ 100% Anti-Tarnish</span>
                  <span className="flex items-center gap-1">✦ Velvet Gift Packaging</span>
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
                  className="block w-full rounded-2xl overflow-hidden backdrop-blur-xl bg-[#061A14]/50 border-0 shadow-[0_20px_50px_rgba(0,0,0,0.65)] p-4 space-y-3 transition-all group cursor-pointer"
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[9px] font-bold uppercase tracking-wider text-[#F3E5AB]">
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
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061A14]/85 via-transparent to-transparent" />
                  </div>

                  {/* Details */}
                  <div className="space-y-0.5 text-white">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#D4AF37] block">
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
                    <span className="px-3 py-1.5 rounded-full text-[10.5px] font-semibold text-[#061A14] bg-[#F3E5AB] group-hover:bg-[#D4AF37] transition-colors shadow-2xs">
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
                  className="absolute inset-0 bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#FFF8E7]"
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
            className="w-7 h-7 rounded-full bg-[#061A14]/75 backdrop-blur-md hover:bg-[#D4AF37] text-[#F3E5AB] hover:text-[#061A14] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90 text-[10px]"
            aria-label="Previous Slide"
          >
            ←
          </button>
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % slides.length)
            }
            className="w-7 h-7 rounded-full bg-[#061A14]/75 backdrop-blur-md hover:bg-[#D4AF37] text-[#F3E5AB] hover:text-[#061A14] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90 text-[10px]"
            aria-label="Next Slide"
          >
            →
          </button>
        </div>
      </div>

    </section>
  );
}
