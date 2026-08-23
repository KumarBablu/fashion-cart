"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";

type Promotion = {
  id: string;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  imageUrl?: string | null;
  discountCode?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  delayMinutes?: number;
  theme: "FESTIVE_GOLD" | "ROYAL_RUBY" | "EMERALD_EID" | "SUNSET_ORANGE" | "MODERN_DARK";
};

const THEME_STYLES: Record<string, { bg: string; text: string; badgeBg: string; badgeText: string; btnBg: string }> = {
  FESTIVE_GOLD: {
    bg: "bg-[#141416] border-b border-[#C59B27]/30",
    text: "text-[#FAF8F5]",
    badgeBg: "bg-[#FBF4E2] text-[#8E6C0C] border border-[#C59B27]/40",
    badgeText: "text-[#8E6C0C]",
    btnBg: "bg-[#C59B27] text-white hover:bg-[#B0881E]",
  },
  ROYAL_RUBY: {
    bg: "bg-[#4A0E17] border-b border-rose-400/30",
    text: "text-white",
    badgeBg: "bg-rose-100 text-rose-900 border border-rose-300",
    badgeText: "text-rose-900",
    btnBg: "bg-[#C59B27] text-white hover:bg-[#B0881E]",
  },
  EMERALD_EID: {
    bg: "bg-[#06281E] border-b border-emerald-400/30",
    text: "text-emerald-50",
    badgeBg: "bg-emerald-100 text-emerald-900 border border-emerald-300",
    badgeText: "text-emerald-900",
    btnBg: "bg-[#C59B27] text-white hover:bg-[#B0881E]",
  },
  SUNSET_ORANGE: {
    bg: "bg-[#5C2406] border-b border-amber-400/30",
    text: "text-amber-50",
    badgeBg: "bg-amber-100 text-amber-900 border border-amber-300",
    badgeText: "text-amber-900",
    btnBg: "bg-[#C59B27] text-white hover:bg-[#B0881E]",
  },
  MODERN_DARK: {
    bg: "bg-[#1C1C1E] border-b border-white/10",
    text: "text-white",
    badgeBg: "bg-white/15 text-white border border-white/20",
    badgeText: "text-white",
    btnBg: "bg-white text-black hover:bg-slate-200",
  },
};

export default function PromotionBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const { success } = useToast();
  const bannerTimer = useRef<NodeJS.Timeout | null>(null);

  const loadBanners = useCallback(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("fc_promo_banner_dismissed") === "true") {
      setDismissed(true);
      return;
    }

    fetch("/api/promotions/active?placement=TOP_BANNER")
      .then((res) => res.json())
      .then((data) => {
        if (data?.promotions && data.promotions.length > 0) {
          if (typeof window !== "undefined" && sessionStorage.getItem("fc_promo_banner_dismissed") === "true") {
            setDismissed(true);
            return;
          }

          const promo = data.promotions[0] as Promotion;
          setPromotions(data.promotions);

          if (bannerTimer.current) clearTimeout(bannerTimer.current);

          const delayMinutes = Number(promo.delayMinutes || 0);
          if (delayMinutes > 0) {
            const sessionStartStr = sessionStorage.getItem("fc_session_start_time");
            const sessionStart = sessionStartStr ? parseInt(sessionStartStr, 10) : Date.now();
            const elapsedMs = Date.now() - sessionStart;
            const targetDelayMs = delayMinutes * 60 * 1000;
            const delayMs = Math.max(0, targetDelayMs - elapsedMs);
            bannerTimer.current = setTimeout(() => setIsVisible(true), delayMs);
          } else {
            setIsVisible(true);
          }
        } else {
          setIsVisible(false);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("fc_promo_banner_dismissed") === "true") {
      setDismissed(true);
      return;
    }

    loadBanners();

    // Listen for custom promotion refresh events (e.g. clicking Fashion Cart logo)
    const handleRefresh = () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("fc_promo_banner_dismissed");
      }
      setDismissed(false);
      loadBanners();
    };

    window.addEventListener("fc_refresh_promotions", handleRefresh);
    return () => {
      window.removeEventListener("fc_refresh_promotions", handleRefresh);
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, [loadBanners]);

  if (dismissed || !isVisible || promotions.length === 0) return null;

  const currentPromo = promotions[0];
  const theme = THEME_STYLES[currentPromo.theme] || THEME_STYLES.FESTIVE_GOLD;

  function handleDismiss() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fc_promo_banner_dismissed", "true");
    }
    setDismissed(true);
  }

  function handleCopyCode(e: React.MouseEvent, code: string) {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    success(`Promo code "${code}" copied to clipboard!`);
  }

  return (
    <aside
      aria-label="Promotional announcement"
      className={`relative z-40 px-3 sm:px-4 py-2 sm:py-2.5 ${theme.bg} ${theme.text} transition-all duration-300 text-xs shadow-xs animate-in fade-in`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left / Center: Promotion Message (Clickable to Promoted Product) */}
        <Link
          href={currentPromo.ctaUrl || "/shop"}
          className="flex-1 flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 text-center sm:text-left group cursor-pointer"
        >
          {currentPromo.imageUrl && (
            <div className="relative h-6 w-8 rounded-md overflow-hidden border border-white/20 shrink-0">
              <Image
                src={currentPromo.imageUrl}
                alt={currentPromo.title}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
          )}

          {currentPromo.badgeText && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${theme.badgeBg}`}>
              {currentPromo.badgeText}
            </span>
          )}

          <span className="font-bold text-xs leading-tight group-hover:underline">
            {currentPromo.title}
          </span>
          {currentPromo.subtitle && (
            <span className="text-[11px] opacity-90 hidden sm:inline">
              · {currentPromo.subtitle}
            </span>
          )}

          {currentPromo.discountCode && (
            <button
              type="button"
              onClick={(e) => handleCopyCode(e, currentPromo.discountCode!)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase tracking-wider bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer text-[#C59B27]"
              title="Click to copy promo code"
            >
              <span>🎟️</span>
              <span>{currentPromo.discountCode}</span>
              <span className="text-[8px] opacity-70 underline ml-0.5">Copy</span>
            </button>
          )}

          <span className="hidden md:inline-flex items-center gap-1 font-extrabold text-[11px] text-[#C59B27] group-hover:underline">
            <span>{currentPromo.ctaText || "Shop Now"}</span>
            <span>→</span>
          </span>
        </Link>

        {/* Right: Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss promotion banner"
          title="Dismiss"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
