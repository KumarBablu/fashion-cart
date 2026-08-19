"use client";

import { useEffect, useState } from "react";
import { createWhatsAppUrl, getCustomerInquiryWhatsAppMessage, BOUTIQUE_PHONE } from "@/lib/notifications/whatsapp";

type Props = {
  productName?: string;
  productPrice?: number;
  productSku?: string;
  orderNumber?: string;
  customMessage?: string;
  className?: string;
  children?: React.ReactNode;
};

export default function WhatsAppConciergeButton({
  productName,
  productPrice,
  productSku,
  orderNumber,
  customMessage,
  className = "px-5 py-3 rounded-full text-xs font-bold border border-[#25D366] bg-[#25D366]/10 text-[#141416] hover:bg-[#25D366] hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs",
  children,
}: Props) {
  const [user, setUser] = useState<{ name?: string; email?: string; phone?: string } | null>(null);

  useEffect(() => {
    // Try reading active user info if available
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
  }, []);

  function handleOpenWhatsApp() {
    const pageUrl = typeof window !== "undefined" ? window.location.href : undefined;
    const pageTitle = typeof document !== "undefined" ? document.title : undefined;

    const message = getCustomerInquiryWhatsAppMessage({
      userName: user?.name,
      userPhone: user?.phone,
      userEmail: user?.email,
      pageTitle,
      pageUrl,
      productName,
      productPrice,
      productSku,
      orderNumber,
      customMessage,
    });

    const url = createWhatsAppUrl(BOUTIQUE_PHONE, message);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleOpenWhatsApp}
      className={className}
      aria-label="Connect with Atelier on WhatsApp"
    >
      {children || (
        <>
          <span className="text-base leading-none">💬</span>
          <span>WhatsApp Stylist</span>
        </>
      )}
    </button>
  );
}
