"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/components/providers/ToastProvider";
import { normalizeImageUrl } from "@/lib/utils/imageUrl";

type Promotion = {
  id: string;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  imageUrl?: string | null;
  discountCode?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  showOnLogin?: boolean;
  showOnGuest?: boolean;
  delayMinutes?: number;
  theme: "FESTIVE_GOLD" | "ROYAL_RUBY" | "EMERALD_EID" | "SUNSET_ORANGE" | "MODERN_DARK";
};

export default function PromotionModal() {
  const [activePromo, setActivePromo] = useState<Promotion | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { success } = useToast();

  useEffect(() => {
    // Record or retrieve current window session start time
    if (typeof window !== "undefined") {
      if (!sessionStorage.getItem("fc_session_start_time")) {
        sessionStorage.setItem("fc_session_start_time", Date.now().toString());
      }
    }

    fetch("/api/promotions/active?placement=POPUP_MODAL")
      .then((res) => res.json())
      .then((data) => {
        if (data?.promotions && data.promotions.length > 0) {
          const promo = data.promotions[0] as Promotion;
          
          // Check frequency cap in localStorage (24-hour dismissal memory)
          const closedAt = localStorage.getItem(`fc_promo_modal_closed_${promo.id}`);
          if (closedAt) {
            const lastClosed = parseInt(closedAt, 10);
            const hoursPassed = (Date.now() - lastClosed) / (1000 * 60 * 60);
            if (hoursPassed < 24) {
              return;
            }
          }

          setActivePromo(promo);

          // Calculate time delay based on admin configured delayMinutes
          const delayMinutes = Number(promo.delayMinutes || 0);
          let delayMs = 1200; // default smooth 1.2s entrance

          if (delayMinutes > 0) {
            const sessionStartStr = sessionStorage.getItem("fc_session_start_time");
            const sessionStart = sessionStartStr ? parseInt(sessionStartStr, 10) : Date.now();
            const elapsedMs = Date.now() - sessionStart;
            const targetDelayMs = delayMinutes * 60 * 1000;
            delayMs = Math.max(1000, targetDelayMs - elapsedMs);
          }

          const timer = setTimeout(() => {
            setIsOpen(true);
          }, delayMs);

          return () => clearTimeout(timer);
        }
      })
      .catch(() => {});
  }, []);

  if (!isOpen || !activePromo) return null;

  function handleClose() {
    setIsOpen(false);
    if (activePromo) {
      localStorage.setItem(`fc_promo_modal_closed_${activePromo.id}`, Date.now().toString());
    }
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    success(`Promo code "${code}" copied to clipboard!`);
  }

  const normalizedImage = normalizeImageUrl(activePromo.imageUrl);
  const showImage = Boolean(normalizedImage && !imageError);

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto bg-black/70 backdrop-blur-xs animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#E7DFD5] bg-[#FAF8F5] text-[#141416] shadow-2xl animate-in zoom-in-95 duration-300 my-auto"
      >
        {/* Close Icon Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
          aria-label="Close promotion dialog"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Visual Promotional Poster Image */}
        {showImage && (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#141416]">
            <Image
              src={normalizedImage}
              alt={activePromo.title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-transparent to-black/30" />
            {activePromo.badgeText && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#C59B27] text-white shadow-md">
                ✨ {activePromo.badgeText}
              </span>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-4 text-center">
          {(!showImage || !activePromo.imageUrl) && activePromo.badgeText && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FBF4E2] border border-[#C59B27]/40 text-xs font-bold uppercase tracking-widest text-[#8E6C0C]">
              <span>✦ {activePromo.badgeText}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <h3
              id="promo-modal-title"
              className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#141416]"
            >
              {activePromo.title}
            </h3>
            {activePromo.subtitle && (
              <p className="text-xs sm:text-sm text-[#4B4E56] max-w-sm mx-auto leading-relaxed">
                {activePromo.subtitle}
              </p>
            )}
          </div>

          {/* Discount Coupon Box with 1-Click Copy */}
          {activePromo.discountCode && (
            <div className="p-3.5 rounded-2xl bg-white border border-dashed border-[#C59B27] flex items-center justify-between gap-3 shadow-2xs">
              <div className="text-left pl-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#787C87]">Use Coupon Code:</p>
                <p className="font-mono text-base font-black text-[#141416] tracking-widest">{activePromo.discountCode}</p>
              </div>
              <button
                onClick={() => handleCopy(activePromo.discountCode!)}
                className="px-4 py-2 rounded-xl text-xs font-extrabold uppercase bg-[#141416] text-[#C59B27] hover:bg-[#25262B] transition-all cursor-pointer shadow-xs"
              >
                Copy Code
              </button>
            </div>
          )}

          {/* CTA Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href={activePromo.ctaUrl || "/shop"}
              onClick={handleClose}
              className="w-full py-3.5 px-6 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-all shadow-md text-center block"
            >
              {activePromo.ctaText || "Explore Boutique Collection →"}
            </Link>

            <button
              onClick={handleClose}
              className="text-[11px] font-semibold text-[#787C87] hover:text-[#141416] transition-colors py-1 cursor-pointer"
            >
              Maybe later · Don&apos;t show again today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
