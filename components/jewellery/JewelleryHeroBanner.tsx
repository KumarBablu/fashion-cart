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

  const slide = slides[currentSlide] || slides[0];

  return (
    <section
      className="relative min-h-[440px] sm:min-h-[480px] lg:min-h-[520px] text-white overflow-hidden border-b border-[#D4AF37]/40 shadow-xl flex flex-col justify-between"
    >
      {/* 🌟 1. Full-Bleed Cinematic Background Image with continuous cross-fade */}
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
        <div className="absolute inset-0 bg-gradient-to-r from-[#040E0B]/75 via-[#061A14]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040E0B]/70 via-transparent to-[#040E0B]/25" />
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-[#0D2C22]/30 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 👑 2. Foreground Content Overlay (Refined Standard Luxury Proportions) */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        
        {/* Left Headline & Masterpiece Summary */}
        <div key={`left-${slide.id}`} className="lg:col-span-7 space-y-4 sm:space-y-5 animate-fade-in-up">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/50 bg-[#061A14]/75 text-[10px] font-extrabold uppercase tracking-widest text-[#F3E5AB] shadow-md backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>{slide.tag}</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2.6rem] font-bold tracking-tight text-white leading-[1.12] [text-shadow:_0_2px_12px_rgba(0,0,0,0.85)]">
              {slide.title} <br />
              <span className="bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#FFF8E7] bg-clip-text text-transparent italic font-serif font-normal [text-shadow:_0_2px_12px_rgba(0,0,0,0.7)]">
                {slide.titleHighlight}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#FDFBF7]/90 max-w-lg leading-relaxed [text-shadow:_0_1px_8px_rgba(0,0,0,0.8)]">
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
                className="px-2.5 py-1 rounded-full border border-[#D4AF37]/50 bg-[#061A14]/65 backdrop-blur-md hover:bg-[#D4AF37] text-[#F3E5AB] hover:text-[#061A14] text-[11px] font-semibold transition-all duration-200 shadow-2xs active:scale-95 cursor-pointer"
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
              className="px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-[#061A14] bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#E5C158] hover:brightness-110 active:scale-95 transition-all duration-200 shadow-[0_2px_20px_rgba(212,175,55,0.4)] cursor-pointer"
            >
              View Featured Jewellery →
            </Link>
            <WhatsAppConciergeButton
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#F3E5AB] border border-[#D4AF37]/50 bg-[#061A14]/80 backdrop-blur-md hover:bg-[#0D2C22] active:scale-95 transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer"
              customMessage={slide.conciergeMsg}
            >
              <span>💬</span> Bridal Concierge
            </WhatsAppConciergeButton>
          </div>

          {/* Trust Highlights */}
          <div className="pt-3 border-t border-[#D4AF37]/25 grid grid-cols-3 gap-2.5 text-xs text-[#F3E5AB]/90">
            <div className="p-2.5 rounded-xl bg-[#061A14]/70 backdrop-blur-md border border-[#D4AF37]/25 space-y-0.5 shadow-2xs">
              <p className="text-xs font-bold text-white">24K Micro-Polish</p>
              <p className="text-[9px] text-[#F3E5AB]/75">Long-Lasting Shield</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#061A14]/70 backdrop-blur-md border border-[#D4AF37]/25 space-y-0.5 shadow-2xs">
              <p className="text-xs font-bold text-white">Anti-Tarnish</p>
              <p className="text-[9px] text-[#F3E5AB]/75">100% Skin Safe</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#061A14]/70 backdrop-blur-md border border-[#D4AF37]/25 space-y-0.5 shadow-2xs">
              <p className="text-xs font-bold text-white">Velvet Box</p>
              <p className="text-[9px] text-[#F3E5AB]/75">Gift Packaging</p>
            </div>
          </div>

        </div>

        {/* Right Glassmorphic Floating Masterpiece Spotlight Card */}
        <div key={`right-${slide.id}`} className="lg:col-span-5 relative animate-fade-in hidden lg:block">
          <Link
            href={slide.masterpieceHref}
            prefetch={true}
            className="block relative rounded-2xl overflow-hidden backdrop-blur-md bg-[#061A14]/60 border border-[#D4AF37]/50 shadow-[0_15px_40px_rgba(0,0,0,0.6)] p-4 sm:p-5 space-y-3 hover:border-[#D4AF37] transition-all group cursor-pointer"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[9px] font-extrabold uppercase tracking-widest text-[#F3E5AB]">
                {slide.lookbookBadge}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#F3E5AB]">
                ✦ {currentSlide + 1} / {slides.length}
              </span>
            </div>

            {/* Thumbnail Preview */}
            <div className="relative h-44 sm:h-48 w-full rounded-xl overflow-hidden border border-[#D4AF37]/35 shadow-inner">
              <Image
                src={slide.bgImageUrl}
                alt={slide.masterpieceName}
                fill
                sizes="360px"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061A14]/85 via-transparent to-transparent" />
            </div>

            {/* Details */}
            <div className="space-y-1 text-white">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#D4AF37] block">
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
            <div className="pt-2 flex items-center justify-between border-t border-[#D4AF37]/25">
              <span className="font-mono font-bold text-xs text-[#F3E5AB]">
                {slide.masterpiecePrice}
              </span>
              <span className="px-3 py-1.5 rounded-full text-[11px] font-bold text-[#061A14] bg-[#F3E5AB] group-hover:bg-[#D4AF37] transition-colors shadow-xs">
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
            }
            className="w-8 h-8 rounded-full border border-[#D4AF37]/50 bg-[#061A14]/80 backdrop-blur-md hover:bg-[#D4AF37] text-[#F3E5AB] hover:text-[#061A14] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-90 text-xs"
            aria-label="Previous Slide"
          >
            ←
          </button>
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % slides.length)
            }
            className="w-8 h-8 rounded-full border border-[#D4AF37]/50 bg-[#061A14]/80 backdrop-blur-md hover:bg-[#D4AF37] text-[#F3E5AB] hover:text-[#061A14] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-90 text-xs"
            aria-label="Next Slide"
          >
            →
          </button>
        </div>
      </div>

    </section>
  );
}
