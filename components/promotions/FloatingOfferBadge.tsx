"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  delayMinutes?: number;
  theme: "FESTIVE_GOLD" | "ROYAL_RUBY" | "EMERALD_EID" | "SUNSET_ORANGE" | "MODERN_DARK";
};

const THEME_STYLES: Record<string, { bg: string; text: string; badgeBg: string; border: string; btnBg: string }> = {
  FESTIVE_GOLD: {
    bg: "bg-[#141416]",
    text: "text-[#FAF8F5]",
    badgeBg: "bg-[#FBF4E2] text-[#8E6C0C]",
    border: "border-[#C59B27]/40",
    btnBg: "bg-[#C59B27] text-white hover:bg-[#B0881E]",
  },
  ROYAL_RUBY: {
    bg: "bg-[#4A0E17]",
    text: "text-white",
    badgeBg: "bg-rose-100 text-rose-900",
    border: "border-rose-400/40",
    btnBg: "bg-[#C59B27] text-white hover:bg-[#B0881E]",
  },
  EMERALD_EID: {
    bg: "bg-[#06281E]",
    text: "text-emerald-50",
    badgeBg: "bg-emerald-100 text-emerald-900",
    border: "border-emerald-400/40",
    btnBg: "bg-[#C59B27] text-white hover:bg-[#B0881E]",
  },
  SUNSET_ORANGE: {
    bg: "bg-[#5C2406]",
    text: "text-amber-50",
    badgeBg: "bg-amber-100 text-amber-900",
    border: "border-amber-400/40",
    btnBg: "bg-[#C59B27] text-white hover:bg-[#B0881E]",
  },
  MODERN_DARK: {
    bg: "bg-[#1C1C1E]",
    text: "text-white",
    badgeBg: "bg-white/20 text-white",
    border: "border-white/20",
    btnBg: "bg-white text-black hover:bg-slate-200",
  },
};

export default function FloatingOfferBadge() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const { success } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isExcludedPage = Boolean(
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/invoices") ||
    pathname?.startsWith("/admin")
  );

  const loadSnackbar = useCallback(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("fc_promo_snackbar_dismissed") === "true") {
      setDismissed(true);
      return;
    }

    fetch("/api/promotions/active?placement=FLOAT_SNACKBAR")
      .then((res) => res.json())
      .then((data) => {
        if (data?.promotions && data.promotions.length > 0) {
          if (typeof window !== "undefined" && sessionStorage.getItem("fc_promo_snackbar_dismissed") === "true") {
            setDismissed(true);
            return;
          }

          const promo = data.promotions[0] as Promotion;
          setPromotions(data.promotions);

          if (timerRef.current) clearTimeout(timerRef.current);

          const delayMinutes = Number(promo.delayMinutes || 0);
          if (delayMinutes > 0) {
            const sessionStartStr = sessionStorage.getItem("fc_session_start_time");
            const sessionStart = sessionStartStr ? parseInt(sessionStartStr, 10) : Date.now();
            const elapsedMs = Date.now() - sessionStart;
            const targetDelayMs = delayMinutes * 60 * 1000;
            const delayMs = Math.max(0, targetDelayMs - elapsedMs);
            timerRef.current = setTimeout(() => setIsVisible(true), delayMs);
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
    if (typeof window !== "undefined" && sessionStorage.getItem("fc_promo_snackbar_dismissed") === "true") {
      setDismissed(true);
      return;
    }

    if (!isExcludedPage) {
      loadSnackbar();
    }

    const handleRefresh = () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("fc_promo_snackbar_dismissed");
      }
      setDismissed(false);
      if (!isExcludedPage) {
        loadSnackbar();
      }
    };

    window.addEventListener("fc_refresh_promotions", handleRefresh);
    return () => {
      window.removeEventListener("fc_refresh_promotions", handleRefresh);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loadSnackbar, isExcludedPage]);

  if (dismissed || !isVisible || isExcludedPage || promotions.length === 0) return null;

  const currentPromo = promotions[0];
  const theme = THEME_STYLES[currentPromo.theme] || THEME_STYLES.FESTIVE_GOLD;
  const normalizedImg = normalizeImageUrl(currentPromo.imageUrl);

  function handleCopy(e: React.MouseEvent, code: string) {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    success(`Promo code "${code}" copied!`);
  }

  function handleDismiss() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fc_promo_snackbar_dismissed", "true");
    }
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-3xl ${theme.bg} ${theme.text} border ${theme.border} shadow-2xl flex items-center gap-3.5 relative overflow-hidden`}>
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center text-xs transition-colors cursor-pointer"
          aria-label="Dismiss offer"
        >
          ✕
        </button>

        {normalizedImg && (
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/20 bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={normalizedImg}
              alt={currentPromo.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 pr-5 space-y-1">
          {currentPromo.badgeText && (
            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${theme.badgeBg}`}>
              {currentPromo.badgeText}
            </span>
          )}
          <h4 className="font-bold text-xs leading-snug line-clamp-1">{currentPromo.title}</h4>
          
          <div className="flex items-center gap-2 pt-0.5">
            {currentPromo.discountCode && (
              <button
                type="button"
                onClick={(e) => handleCopy(e, currentPromo.discountCode!)}
                className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase bg-white text-[#141416] tracking-wider cursor-pointer"
                title="Copy Coupon"
              >
                🎟️ {currentPromo.discountCode}
              </button>
            )}

            <Link
              href={currentPromo.ctaUrl || "/shop"}
              className="text-[11px] font-bold text-[#C59B27] hover:underline inline-flex items-center gap-0.5"
            >
              <span>{currentPromo.ctaText || "Claim"}</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
