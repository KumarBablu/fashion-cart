"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createWhatsAppUrl, getCustomerInquiryWhatsAppMessage, BOUTIQUE_PHONE } from "@/lib/notifications/whatsapp";

export default function WhatsAppFloatingWidget() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string; phone?: string } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Hide on admin routes
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser({
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
          });
        }
      })
      .catch(() => {});
  }, [isAdmin]);

  if (isAdmin) return null;

  function handleOpenWhatsApp() {
    const pageUrl = typeof window !== "undefined" ? window.location.href : undefined;
    const pageTitle = typeof document !== "undefined" ? document.title : undefined;

    const message = getCustomerInquiryWhatsAppMessage({
      userName: user?.name,
      userPhone: user?.phone,
      userEmail: user?.email,
      pageTitle,
      pageUrl,
    });

    const url = createWhatsAppUrl(BOUTIQUE_PHONE, message);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex items-center gap-2 group animate-in fade-in duration-300">
      {/* Interactive Tooltip */}
      <div
        className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141416]/90 backdrop-blur-md text-white text-[11px] font-semibold shadow-lg border border-white/10 transition-all duration-200 pointer-events-none ${
          showTooltip ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
        <span>Chat with Stylist</span>
      </div>

      {/* Floating Action Button (Sleek Compact Size) */}
      <button
        type="button"
        onClick={handleOpenWhatsApp}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
        aria-label="Connect directly with Fashion Cart on WhatsApp"
        title="Chat with Stylist on WhatsApp"
      >
        {/* Pulsating background ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none" />

        {/* WhatsApp Official SVG Icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-xs">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.53c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.99.68.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.3" />
        </svg>
      </button>
    </div>
  );
}
