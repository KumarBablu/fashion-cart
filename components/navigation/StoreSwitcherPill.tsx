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

  // Synchronize active store based on route, query params, DOM attributes, and custom events
  useEffect(() => {
    function resolveStore(): "garments" | "jewellery" {
      // 1. Explicit URL query parameter takes top priority
      const storeParam = searchParams?.get("store");
      if (storeParam === "jewellery") return "jewellery";
      if (storeParam === "garments") return "garments";

      // 2. Explicit storefront routes
      if (pathname.startsWith("/jewellery")) return "jewellery";
      if (pathname.startsWith("/garments") || pathname === "/") return "garments";

      // 3. Product pages: inspect DOM store marker
      if (pathname.startsWith("/products")) {
        const prodStore = typeof document !== "undefined" ? document.querySelector("[data-product-store]")?.getAttribute("data-product-store") : null;
        if (prodStore === "jewellery") return "jewellery";
        if (prodStore === "garments") return "garments";
        if (typeof document !== "undefined" && document.querySelector(".theme-jewellery")) return "jewellery";
      }

      // 4. Order Details pages: inspect order store marker
      if (pathname.startsWith("/account/orders")) {
        const orderStore = typeof document !== "undefined" ? document.querySelector("[data-order-store]")?.getAttribute("data-order-store") : null;
        if (orderStore === "jewellery") return "jewellery";
        if (orderStore === "garments") return "garments";
      }

      // 5. Cross-store pages (/cart, /checkout, /account, /shop, etc.): respect cookie & sessionStorage
      const cookieMatch = typeof document !== "undefined" ? document.cookie.match(/(?:^|;\s*)fc_store=([^;]+)/) : null;
      if (cookieMatch && cookieMatch[1] === "jewellery") return "jewellery";
      if (cookieMatch && cookieMatch[1] === "garments") return "garments";

      const saved = typeof window !== "undefined" ? sessionStorage.getItem("fc_active_store") : null;
      if (saved === "jewellery") return "jewellery";
      return "garments";
    }

    const currentStore = resolveStore();
    setActiveStore(currentStore);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fc_active_store", currentStore);
      document.cookie = `fc_store=${currentStore}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [pathname, searchParams]);

  // Listen to custom store-switched events from client components
  useEffect(() => {
    const handleStoreSwitched = (e: Event) => {
      const customEvent = e as CustomEvent<{ store: "garments" | "jewellery" }>;
      if (customEvent.detail?.store) {
        setActiveStore(customEvent.detail.store);
      }
    };
    window.addEventListener("store-switched", handleStoreSwitched);
    return () => window.removeEventListener("store-switched", handleStoreSwitched);
  }, []);

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
          prefetch={true}
          onClick={() => {
            setActiveStore("garments");
            if (typeof window !== "undefined") {
              sessionStorage.setItem("fc_active_store", "garments");
              document.cookie = "fc_store=garments; path=/; max-age=31536000; SameSite=Lax";
              window.dispatchEvent(new CustomEvent("store-switched", { detail: { store: "garments" } }));
              window.dispatchEvent(new CustomEvent("cart-updated"));
            }
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
            !isJewellery
              ? "bg-[#141416] text-[#FFFFFF] shadow-sm font-bold scale-[1.02]"
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
          prefetch={true}
          onClick={() => {
            setActiveStore("jewellery");
            if (typeof window !== "undefined") {
              sessionStorage.setItem("fc_active_store", "jewellery");
              document.cookie = "fc_store=jewellery; path=/; max-age=31536000; SameSite=Lax";
              window.dispatchEvent(new CustomEvent("store-switched", { detail: { store: "jewellery" } }));
              window.dispatchEvent(new CustomEvent("cart-updated"));
            }
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
            isJewellery
              ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#061A14] shadow-sm font-extrabold scale-[1.02]"
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
