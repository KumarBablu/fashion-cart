"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type StoreStatusMap = {
  garments: { isActive: boolean };
  jewellery: { isActive: boolean };
};

export default function StoreSwitcherPill({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeStore, setActiveStore] = useState<"garments" | "jewellery">("garments");
  const [storeStatuses, setStoreStatuses] = useState<StoreStatusMap>({
    garments: { isActive: true },
    jewellery: { isActive: true },
  });

  useEffect(() => {
    // Check public store availability
    fetch("/api/stores/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.stores) {
          setStoreStatuses({
            garments: { isActive: data.stores.garments?.isActive ?? true },
            jewellery: { isActive: data.stores.jewellery?.isActive ?? true },
          });
        }
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/jewellery") || searchParams?.get("store") === "jewellery") {
      setActiveStore("jewellery");
      sessionStorage.setItem("fc_active_store", "jewellery");
    } else if (pathname.startsWith("/garments") || (pathname === "/shop" && !searchParams?.get("store"))) {
      setActiveStore("garments");
      sessionStorage.setItem("fc_active_store", "garments");
    } else if (pathname.startsWith("/products")) {
      const isThemeJewellery = document.querySelector(".theme-jewellery") !== null;
      if (isThemeJewellery) {
        setActiveStore("jewellery");
        sessionStorage.setItem("fc_active_store", "jewellery");
      } else {
        const saved = sessionStorage.getItem("fc_active_store");
        if (saved === "jewellery") setActiveStore("jewellery");
        else setActiveStore("garments");
      }
    } else {
      const saved = sessionStorage.getItem("fc_active_store");
      if (saved === "jewellery") setActiveStore("jewellery");
      else setActiveStore("garments");
    }
  }, [pathname, searchParams]);

  const isJewellery = activeStore === "jewellery";
  const isGarmentsActive = storeStatuses.garments.isActive;
  const isJewelleryActive = storeStatuses.jewellery.isActive;

  // If only one store is active or both are inactive, hide the switcher entirely for a seamless single-store experience
  if (!isGarmentsActive && !isJewelleryActive) return null;
  if (!isGarmentsActive || !isJewelleryActive) return null;

  return (
    <div
      className={`inline-flex items-center p-1 rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 ${
        isJewellery
          ? "bg-[#061A14]/90 border-[#D4AF37]/50 shadow-[0_2px_12px_rgba(212,175,55,0.2)]"
          : "bg-white/90 border-[#E7DFD5] shadow-[0_2px_12px_rgba(20,20,22,0.06)]"
      } ${className}`}
      role="group"
      aria-label="Select Store"
    >
      {isGarmentsActive && (
        <Link
          href="/garments"
          onClick={() => {
            setActiveStore("garments");
            sessionStorage.setItem("fc_active_store", "garments");
            document.cookie = "fc_store=garments; path=/; max-age=31536000; SameSite=Lax";
            window.dispatchEvent(new CustomEvent("cart-updated"));
          }}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 ${
            !isJewellery
              ? "bg-[#141416] text-[#FFFFFF] shadow-sm font-bold"
              : "text-[#D4AF37] hover:text-[#FFFFFF] hover:bg-[#0D2C22]"
          }`}
        >
          <span>👗</span>
          <span className="tracking-wide">Garments</span>
        </Link>
      )}

      {isJewelleryActive && (
        <Link
          href="/jewellery"
          onClick={() => {
            setActiveStore("jewellery");
            sessionStorage.setItem("fc_active_store", "jewellery");
            document.cookie = "fc_store=jewellery; path=/; max-age=31536000; SameSite=Lax";
            window.dispatchEvent(new CustomEvent("cart-updated"));
          }}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 ${
            isJewellery
              ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#061A14] shadow-sm font-extrabold"
              : "text-[#4B4E56] hover:text-[#141416] hover:bg-[#F4EFEA]"
          }`}
        >
          <span>💍</span>
          <span className="tracking-wide">Jewellery</span>
        </Link>
      )}
    </div>
  );
}
