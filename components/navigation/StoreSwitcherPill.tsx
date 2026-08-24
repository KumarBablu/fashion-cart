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
      // 1. Explicit jewellery routes
      if (pathname.startsWith("/jewellery") || searchParams?.get("store") === "jewellery") {
        return "jewellery";
      }

      // 2. Explicit garments routes & storefront home
      if (
        pathname.startsWith("/garments") ||
        pathname === "/" ||
        (pathname === "/shop" && searchParams?.get("store") !== "jewellery") ||
        (pathname === "/categories" && searchParams?.get("store") !== "jewellery")
      ) {
        return "garments";
      }

      // 3. Product pages: inspect DOM store marker
      if (pathname.startsWith("/products")) {
        const prodStore = document.querySelector("[data-product-store]")?.getAttribute("data-product-store");
        if (prodStore === "jewellery") return "jewellery";
        if (prodStore === "garments") return "garments";
        if (document.querySelector(".theme-jewellery")) return "jewellery";
        return "garments";
      }

      // 4. Order Details pages: inspect order store marker
      if (pathname.startsWith("/account/orders")) {
        const orderStore = document.querySelector("[data-order-store]")?.getAttribute("data-order-store");
        if (orderStore === "jewellery") return "jewellery";
        if (orderStore === "garments") return "garments";
        return "garments";
      }

      // 5. Checkout pages
      if (pathname.startsWith("/checkout")) {
        const checkoutStore = searchParams?.get("store");
        if (checkoutStore === "jewellery") return "jewellery";
        return "garments";
      }

      // Default fallback
      const saved = typeof window !== "undefined" ? sessionStorage.getItem("fc_active_store") : null;
      return saved === "jewellery" ? "jewellery" : "garments";
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
            sessionStorage.setItem("fc_active_store", "garments");
            document.cookie = "fc_store=garments; path=/; max-age=31536000; SameSite=Lax";
            window.dispatchEvent(new CustomEvent("store-switched", { detail: { store: "garments" } }));
            window.dispatchEvent(new CustomEvent("cart-updated"));
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
            sessionStorage.setItem("fc_active_store", "jewellery");
            document.cookie = "fc_store=jewellery; path=/; max-age=31536000; SameSite=Lax";
            window.dispatchEvent(new CustomEvent("store-switched", { detail: { store: "jewellery" } }));
            window.dispatchEvent(new CustomEvent("cart-updated"));
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
