"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function BrandIntroSplash() {
  const [visible, setVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the luxury splash in this session
    try {
      const hasSeen = sessionStorage.getItem("fashion_cart_splash_seen");
      if (!hasSeen) {
        setVisible(true);
        sessionStorage.setItem("fashion_cart_splash_seen", "true");

        // Auto transition into the storefront after 1.8s
        const fadeTimer = setTimeout(() => {
          setIsFadingOut(true);
        }, 1600);

        const removeTimer = setTimeout(() => {
          setVisible(false);
        }, 2200);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(removeTimer);
        };
      }
    } catch {
      // In case sessionStorage is blocked by privacy mode
    }
  }, []);

  function handleDismiss() {
    setIsFadingOut(true);
    setTimeout(() => {
      setVisible(false);
    }, 450);
  }

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer transition-all duration-700 select-none ${
        isFadingOut
          ? "opacity-0 pointer-events-none scale-105 blur-sm"
          : "opacity-100 backdrop-blur-md"
      }`}
      style={{
        backgroundColor: "#FAF8F5",
        backgroundImage: "radial-gradient(circle at 50% 45%, rgba(197, 155, 39, 0.09) 0%, rgba(250, 248, 245, 0.98) 70%)",
      }}
      aria-label="Welcome to Fashion Cart"
    >
      {/* Decorative Luxury Frame */}
      <div className="absolute inset-4 sm:inset-8 border border-[#E7DFD5]/80 pointer-events-none rounded-2xl sm:rounded-3xl" />
      <div className="absolute inset-5 sm:inset-9 border border-[#C59B27]/25 pointer-events-none rounded-xl sm:rounded-2xl" />

      {/* Central Brand Emblem */}
      <div className="relative flex flex-col items-center text-center px-6 max-w-md space-y-5 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Monogram Emblem with Soft Golden Aura */}
        <div className="relative">
          <div className="absolute -inset-4 bg-[#C59B27]/20 rounded-full blur-xl animate-pulse" />
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 drop-shadow-lg transition-transform duration-700 hover:scale-105">
            <Image
              src="/fashion-cart-logo-transparent.svg"
              alt="Fashion Cart Luxury Monogram"
              fill
              priority
              sizes="112px"
              className="object-contain"
            />
          </div>
        </div>

        {/* Brand Wordmark & Tagline */}
        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[#141416] uppercase">
            Fashion Cart
          </h1>
          
          {/* Gold Filament Divider */}
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent via-[#C59B27] to-transparent" />
            <span className="text-[#C59B27] text-xs">✦</span>
            <span className="h-px w-10 bg-gradient-to-r from-transparent via-[#C59B27] to-transparent" />
          </div>

          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] font-semibold text-[#C59B27]">
            Haute Couture · Bengaluru
          </p>
        </div>

        {/* Subtle Progress Bar */}
        <div className="w-36 h-0.5 bg-[#E7DFD5] rounded-full overflow-hidden mt-4">
          <div className="h-full bg-gradient-to-r from-[#C59B27] to-[#E0BF48] rounded-full animate-[shimmer_1.6s_ease-in-out_infinite]" />
        </div>

        {/* Quick Skip Prompt */}
        <p className="text-[10px] text-[#787C87] uppercase tracking-widest pt-2 opacity-75">
          Entering Boutique… (Click to Skip)
        </p>
      </div>

      {/* Bottom Right Direct Enter Button */}
      <button
        onClick={handleDismiss}
        className="absolute bottom-8 right-8 hidden sm:flex items-center gap-1 text-xs font-bold text-[#141416] hover:text-[#C59B27] uppercase tracking-wider transition-colors z-10"
      >
        <span>Enter Boutique</span>
        <span>→</span>
      </button>
    </div>
  );
}
