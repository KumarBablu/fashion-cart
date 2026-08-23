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
  imageUrl: string;
  lookbookBadge: string;
  masterpieceCollection: string;
  masterpieceName: string;
  masterpieceDescription: string;
  masterpiecePrice: string;
  masterpieceHref: string;
};

const JEWELLERY_SLIDES: JewelleryBannerSlide[] = [
  {
    id: "bridal-kundan",
    tag: "👑 Imperial Fine & Handcrafted Jewellery",
    title: "Heirloom Royalty in",
    titleHighlight: "24K Micro-Plated Gold.",
    description:
      "Adorn yourself in timeless splendour. Handcrafted Uncut Kundan, Real South-Sea Pearls, and intricate Meenakari chokers curated for grand royal weddings and regal celebrations.",
    pills: [
      { name: "👑 Bridal Chokers", href: "/shop?store=jewellery&category=necklaces-sets" },
      { name: "💎 Kundan Sets", href: "/shop?store=jewellery&q=Kundan" },
      { name: "✨ 24K Bangles", href: "/shop?store=jewellery&category=bangles-kadas" },
      { name: "🌸 Royal Jhumkas", href: "/shop?store=jewellery&category=earrings-jhumkas" },
    ],
    primaryBtnText: "Shop Bridal Catalog →",
    primaryBtnHref: "/shop?store=jewellery&category=necklaces-sets",
    conciergeMsg: "Hi Imperial Jewels Stylist, I would like Kundan & Bridal jewellery recommendations!",
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1400&auto=format&fit=crop&q=85",
    lookbookBadge: "👑 Artisan Handcrafted",
    masterpieceCollection: "✨ Haute Bridal Collection 2026",
    masterpieceName: "Mughal Kundan & Pearl Choker Set",
    masterpieceDescription:
      "Includes Grand Choker, Bahubali Jhumkas & Matching Maang Tikka with 24K Micro-Plated finish.",
    masterpiecePrice: "₹188 · In Stock",
    masterpieceHref: "/shop?store=jewellery",
  },
  {
    id: "temple-heritage",
    tag: "🪔 Sacred South Indian Temple Craft",
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
    primaryBtnText: "Explore Temple Gold →",
    primaryBtnHref: "/shop?store=jewellery&q=Temple",
    conciergeMsg: "Hi Imperial Jewels Stylist, I am interested in Antique Temple Jewellery!",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1400&auto=format&fit=crop&q=85",
    lookbookBadge: "🪔 Temple Heritage",
    masterpieceCollection: "🌟 Sacred Antique Edits",
    masterpieceName: "Lakshmi Kasu Mala & Nakshi Jhumkas",
    masterpieceDescription:
      "24K Antique Matte finish with micro-carved deities and ruby cabochon embellishments.",
    masterpiecePrice: "₹188 · In Stock",
    masterpieceHref: "/shop?store=jewellery&q=Temple",
  },
  {
    id: "american-diamond",
    tag: "💎 Red Carpet Solitaires & Cocktail Edits",
    title: "Flawless Sparkle with",
    titleHighlight: "American Diamond CZ Jewels.",
    description:
      "Ultra-precision 5A Cubic Zirconia cut to perfection with rhodium and platinum plating. Brilliant tennis chokers, cocktail rings, and cascading chandeliers that outshine real diamonds.",
    pills: [
      { name: "💎 Tennis Chokers", href: "/shop?store=jewellery&q=Tennis" },
      { name: "💍 Solitaire CZ Rings", href: "/shop?store=jewellery&category=rings" },
      { name: "✨ Cocktail Chandeliers", href: "/shop?store=jewellery&category=earrings-jhumkas" },
      { name: "🌟 Tennis Bracelets", href: "/shop?store=jewellery&category=bangles-kadas" },
    ],
    primaryBtnText: "Shop Diamond Edits →",
    primaryBtnHref: "/shop?store=jewellery&q=Diamond",
    conciergeMsg: "Hi Imperial Jewels Stylist, please share American Diamond & Solitaire jewellery options!",
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1400&auto=format&fit=crop&q=85",
    lookbookBadge: "💎 5A CZ Diamonds",
    masterpieceCollection: "💫 Gala Solitaire 2026",
    masterpieceName: "Riviera Solitaire CZ Tennis Choker",
    masterpieceDescription:
      "Platinum rhodium finish with heart & arrow faceting, hypoallergenic with security clasp.",
    masterpiecePrice: "₹188 · In Stock",
    masterpieceHref: "/shop?store=jewellery&q=Diamond",
  },
];

export default function JewelleryHeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % JEWELLERY_SLIDES.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const slide = JEWELLERY_SLIDES[currentSlide];

  return (
    <section
      className="relative bg-[#061A14] text-white overflow-hidden border-b border-[#D4AF37]/40 shadow-2xl transition-all duration-700"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Radial Gold & Emerald Ambiance */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0D2C22] via-[#061A14] to-[#040E0B] opacity-95" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#0D2C22]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Slide Transition Wrapper */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        
        {/* Left Headline & Masterpiece Summary */}
        <div key={`left-${slide.id}`} className="lg:col-span-7 space-y-6 sm:space-y-7 animate-fade-in-up">
          
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#D4AF37]/60 bg-[#061A14]/90 text-[11px] font-extrabold uppercase tracking-widest text-[#F3E5AB] shadow-xl backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>{slide.tag}</span>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-4xl sm:text-6xl lg:text-[4.2rem] font-bold tracking-tight text-white leading-[1.08]">
              {slide.title} <br />
              <span className="bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#FFF8E7] bg-clip-text text-transparent italic font-serif font-normal">
                {slide.titleHighlight}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#FDFBF7]/85 max-w-xl leading-relaxed">
              {slide.description}
            </p>
          </div>

          {/* Quick Category Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {slide.pills.map((pill) => (
              <Link
                key={pill.name}
                href={pill.href}
                prefetch={true}
                className="px-3.5 py-1.5 rounded-full border border-[#D4AF37]/40 bg-[#0D2C22]/80 hover:bg-[#D4AF37] text-[#F3E5AB] hover:text-[#061A14] text-xs font-bold transition-all duration-200 shadow-xs active:scale-95 cursor-pointer"
              >
                {pill.name}
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link
              href={slide.primaryBtnHref}
              prefetch={true}
              className="px-8 py-4 rounded-full font-extrabold text-xs uppercase tracking-widest text-[#061A14] bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#E5C158] hover:brightness-110 active:scale-95 transition-all duration-200 shadow-[0_4px_25px_rgba(212,175,55,0.4)] cursor-pointer"
            >
              {slide.primaryBtnText}
            </Link>
            <WhatsAppConciergeButton
              className="px-6 py-4 rounded-full text-xs font-bold text-[#F3E5AB] border border-[#D4AF37]/50 bg-[#061A14] hover:bg-[#0D2C22] active:scale-95 transition-all duration-200 shadow-md flex items-center gap-2 cursor-pointer"
              customMessage={slide.conciergeMsg}
            >
              <span>💬</span> Bridal Concierge
            </WhatsAppConciergeButton>
          </div>

          {/* Trust Highlights */}
          <div className="pt-5 border-t border-[#D4AF37]/20 grid grid-cols-3 gap-3 text-xs text-[#F3E5AB]/90">
            <div className="p-3.5 rounded-2xl bg-[#0D2C22]/70 border border-[#D4AF37]/25 space-y-0.5 shadow-sm">
              <p className="text-sm sm:text-base font-bold text-white">24K Micro-Polish</p>
              <p className="text-[10px] text-[#F3E5AB]/75">Long-Lasting Golden Shield</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0D2C22]/70 border border-[#D4AF37]/25 space-y-0.5 shadow-sm">
              <p className="text-sm sm:text-base font-bold text-white">Anti-Tarnish</p>
              <p className="text-[10px] text-[#F3E5AB]/75">100% Skin Safe &amp; Lead-Free</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0D2C22]/70 border border-[#D4AF37]/25 space-y-0.5 shadow-sm">
              <p className="text-sm sm:text-base font-bold text-white">Velvet Box</p>
              <p className="text-[10px] text-[#F3E5AB]/75">Luxury Gift Packaging</p>
            </div>
          </div>

        </div>

        {/* Right Hero Editorial Lookbook Card */}
        <div key={`right-${slide.id}`} className="lg:col-span-5 relative animate-fade-in">
          <div className="relative rounded-3xl overflow-hidden border-2 border-[#D4AF37]/60 shadow-[0_25px_70px_rgba(0,0,0,0.7)] group">
            <div className="relative h-96 sm:h-[490px] w-full">
              <Image
                src={slide.imageUrl}
                alt={slide.masterpieceName}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061A14] via-[#061A14]/35 to-transparent" />
            </div>

            {/* Floating Luxury Tag Badge */}
            <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-[#061A14]/85 backdrop-blur-md border border-[#D4AF37]/50 text-[10px] font-extrabold uppercase tracking-widest text-[#F3E5AB] shadow-lg">
              {slide.lookbookBadge}
            </div>

            <div className="absolute bottom-4 left-4 right-4 p-4.5 rounded-2xl bg-[#061A14]/90 backdrop-blur-md border border-[#D4AF37]/40 text-white space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] block">
                {slide.masterpieceCollection}
              </span>
              <h3 className="font-display text-lg font-bold text-[#F3E5AB]">
                {slide.masterpieceName}
              </h3>
              <p className="text-xs text-[#FAF8F5]/85 leading-relaxed">
                {slide.masterpieceDescription}
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-[#F3E5AB]">
                  {slide.masterpiecePrice}
                </span>
                <Link
                  href={slide.masterpieceHref}
                  prefetch={true}
                  className="text-xs font-bold text-[#D4AF37] hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Slide Navigation Controls & Indicators */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 flex items-center justify-between">
        {/* Slide Indicators */}
        <div className="flex items-center gap-2">
          {JEWELLERY_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === idx
                  ? "w-8 bg-gradient-to-r from-[#F3E5AB] to-[#D4AF37]"
                  : "w-2.5 bg-white/25 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Next / Prev Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev - 1 + JEWELLERY_SLIDES.length) % JEWELLERY_SLIDES.length)
            }
            className="w-9 h-9 rounded-full border border-[#D4AF37]/40 bg-[#061A14]/80 hover:bg-[#D4AF37] text-[#F3E5AB] hover:text-[#061A14] flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90"
            aria-label="Previous Slide"
          >
            ←
          </button>
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % JEWELLERY_SLIDES.length)
            }
            className="w-9 h-9 rounded-full border border-[#D4AF37]/40 bg-[#061A14]/80 hover:bg-[#D4AF37] text-[#F3E5AB] hover:text-[#061A14] flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90"
            aria-label="Next Slide"
          >
            →
          </button>
        </div>
      </div>

    </section>
  );
}
