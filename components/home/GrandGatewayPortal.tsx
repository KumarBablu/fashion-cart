"use client";

import Link from "next/link";
import Image from "next/image";

export default function GrandGatewayPortal() {
  return (
    <div className="w-full bg-[#FAF8F5] border-b border-[#E7DFD5] py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Brand Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF4E2] text-[#8E6C0C] text-[11px] font-bold uppercase tracking-[0.2em] mb-3 border border-[#E7DFD5]">
            ✨ The Fashion Cart Experience
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#141416] tracking-tight">
            Choose Your Luxury House
          </h2>
          <p className="text-xs sm:text-sm text-[#787C87] mt-2">
            Explore curated haute couture garments or royal handcrafted artificial jewellery.
          </p>
        </div>

        {/* The Two Portals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* 1. House of Garments */}
          <div className="group relative rounded-3xl overflow-hidden border border-[#E7DFD5] bg-white shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
            <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-[#141416]">
              <Image
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=85"
                alt="House of Couture — Haute Garments"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/40 to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#141416] text-[10px] font-extrabold uppercase tracking-widest border border-white/40 shadow-xs">
                  👗 Atelier Couture
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Garments & Apparel
                </h3>
                <p className="text-xs text-[#FAF8F5]/80 mt-1 line-clamp-2">
                  Mulberry Silks, Banarasi Weaves, Tailored Linen, Velvet Anarkalis & Sartorial Menswear.
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-white flex items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#787C87]">
                <span className="bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E7DFD5]">Sarees & Kurtis</span>
                <span className="bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E7DFD5]">Menswear</span>
                <span className="bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E7DFD5]">Silk Gowns</span>
              </div>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141416] hover:bg-[#25262B] text-white text-xs font-bold tracking-wide transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 shrink-0"
              >
                <span>Enter Atelier</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* 2. House of Jewellery */}
          <div className="group relative rounded-3xl overflow-hidden border border-[#D4AF37]/40 bg-[#FCFAF6] shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
            <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-[#061A14]">
              <Image
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1000&auto=format&fit=crop&q=85"
                alt="Imperial Fine Jewellery"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061A14] via-[#061A14]/50 to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-[#D4AF37] text-[#061A14] text-[10px] font-black uppercase tracking-widest border border-[#F3E5AB]/40 shadow-xs">
                  💍 Imperial Jewels
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F3E5AB] tracking-tight">
                  Artificial Fine Jewellery
                </h3>
                <p className="text-xs text-[#FAF8F5]/80 mt-1 line-clamp-2">
                  24K Micro-Plated Kundan Chokers, Polki Jhumkas, Antique Kadas, CZ Solitaires & Bridal Sets.
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-[#FCFAF6] flex items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#8C6B08]">
                <span className="bg-[#FDF4D8] px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">Kundan Sets</span>
                <span className="bg-[#FDF4D8] px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">Jhumkas</span>
                <span className="bg-[#FDF4D8] px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">Bangles & Rings</span>
              </div>

              <Link
                href="/jewellery"
                className="gold-jewellery-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black tracking-wide transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 shrink-0"
              >
                <span>Enter Jewels</span>
                <span>→</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Global Value Promises */}
        <div className="mt-8 sm:mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
          <div className="p-3 rounded-2xl bg-white border border-[#E7DFD5] shadow-2xs">
            <span className="text-lg">💎</span>
            <p className="text-xs font-bold text-[#141416] mt-1">24K Micron Gold Plating</p>
            <p className="text-[10px] text-[#787C87]">Anti-Tarnish & Skin Friendly</p>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#E7DFD5] shadow-2xs">
            <span className="text-lg">🚚</span>
            <p className="text-xs font-bold text-[#141416] mt-1">Free Express Shipping</p>
            <p className="text-[10px] text-[#787C87]">Across All India Pin Codes</p>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#E7DFD5] shadow-2xs">
            <span className="text-lg">✨</span>
            <p className="text-xs font-bold text-[#141416] mt-1">Velvet Gift Box Packaging</p>
            <p className="text-[10px] text-[#787C87]">Trousseau Ready Presentation</p>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#E7DFD5] shadow-2xs">
            <span className="text-lg">🔒</span>
            <p className="text-xs font-bold text-[#141416] mt-1">Single Unified Account</p>
            <p className="text-[10px] text-[#787C87]">Seamless Access Everywhere</p>
          </div>
        </div>

      </div>
    </div>
  );
}
