"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function BrandIntroSplash() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [visible, setVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const isFirstMount = useRef(true);

  // Trigger on initial load / refresh AND on every route / query change
  useEffect(() => {
    // Determine duration: slightly longer for initial page load/refresh, snappier for in-app page transitions
    const isInitial = isFirstMount.current;
    isFirstMount.current = false;

    setVisible(true);
    setIsFadingOut(false);

    const activeDuration = isInitial ? 1100 : 550;
    const totalDuration = isInitial ? 1600 : 900;

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, activeDuration);

    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, totalDuration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [pathname, searchParams]);

  function handleDismiss() {
    setIsFadingOut(true);
    setTimeout(() => {
      setVisible(false);
    }, 300);
  }

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 select-none ${
        isFadingOut
          ? "opacity-0 pointer-events-none scale-105 blur-sm"
          : "opacity-100 backdrop-blur-md"
      }`}
      style={{
        backgroundColor: "#FAF8F5",
        backgroundImage: "radial-gradient(circle at 50% 45%, rgba(197, 155, 39, 0.12) 0%, rgba(250, 248, 245, 0.98) 75%)",
      }}
      aria-label="Fashion Cart Luxury Entrance"
    >
      {/* Subtle Cinematic Runway Silhouette Background */}
      <div className="absolute inset-0 opacity-12 mix-blend-multiply pointer-events-none">
        <Image
          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&auto=format&fit=crop&q=80"
          alt="Traditional Indian Couture Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter grayscale contrast-125"
        />
      </div>

      {/* Decorative Luxury Architectural Frame */}
      <div className="absolute inset-4 sm:inset-8 border border-[#E7DFD5]/90 pointer-events-none rounded-2xl sm:rounded-3xl shadow-xs" />
      <div className="absolute inset-5 sm:inset-9 border border-[#C59B27]/30 pointer-events-none rounded-xl sm:rounded-2xl" />

      {/* Central Brand Emblem */}
      <div className="relative flex flex-col items-center text-center px-6 max-w-md space-y-5 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Monogram Emblem with Soft Golden Aura */}
        <div className="relative">
          <div className="absolute -inset-6 bg-[#C59B27]/25 rounded-full blur-2xl animate-pulse" />
          <div className="relative h-24 w-24 sm:h-32 sm:w-32 drop-shadow-xl transition-transform duration-500 hover:scale-105">
            <Image
              src="/fashion-cart-logo-transparent.svg"
              alt="Fashion Cart Luxury Monogram Emblem"
              fill
              priority
              sizes="128px"
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
            The Premium Outlet · Siwan, Bihar
          </p>
        </div>

        {/* Subtle Progress Bar */}
        <div className="w-36 h-0.5 bg-[#E7DFD5] rounded-full overflow-hidden mt-3">
          <div className="h-full bg-gradient-to-r from-[#C59B27] via-[#E0BF48] to-[#C59B27] rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]" />
        </div>

        {/* Quick Skip Prompt */}
        <p className="text-[9px] text-[#787C87] uppercase tracking-widest pt-1 opacity-70">
          Entering Boutique…
        </p>
      </div>

      {/* Direct Enter Prompt */}
      <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 flex items-center gap-1 text-[11px] font-bold text-[#141416] hover:text-[#C59B27] uppercase tracking-wider transition-colors z-10">
        <span>Enter</span>
        <span>→</span>
      </div>
    </div>
  );
}
