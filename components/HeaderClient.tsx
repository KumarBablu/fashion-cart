"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import StoreSwitcherPill from "@/components/navigation/StoreSwitcherPill";

// Dynamically import heavy drawers/modals so initial page load bundle is lean
const MenuDrawer = dynamic(() => import("@/components/navigation/MenuDrawer"), { ssr: false });
const CartDrawer = dynamic(() => import("@/components/cart/CartDrawer"), { ssr: false });
const SearchModal = dynamic(() => import("@/components/search/SearchModal"), { ssr: false });

interface HeaderCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  children?: { id: string; name: string; slug: string }[];
}

export default function HeaderClient({
  isLoggedIn,
  userName,
  categories,
}: {
  isLoggedIn: boolean;
  userName?: string | null;
  categories?: HeaderCategory[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isJewellery = pathname.startsWith("/jewellery") || searchParams?.get("store") === "jewellery";

  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [hasActiveSession, setHasActiveSession] = useState<boolean>(isLoggedIn);

  useEffect(() => {
    setHasActiveSession(isLoggedIn);
  }, [isLoggedIn]);

  function getActiveStore(): "garments" | "jewellery" {
    if (typeof window === "undefined") return "garments";
    const path = window.location.pathname;
    const search = window.location.search;

    if (search.includes("store=jewellery") || path.startsWith("/jewellery")) return "jewellery";
    if (search.includes("store=garments") || path.startsWith("/garments") || path === "/") return "garments";

    const orderStore = document.querySelector("[data-order-store]")?.getAttribute("data-order-store");
    if (orderStore === "jewellery") return "jewellery";
    if (orderStore === "garments") return "garments";

    const prodStore = document.querySelector("[data-product-store]")?.getAttribute("data-product-store");
    if (prodStore === "jewellery") return "jewellery";
    if (prodStore === "garments") return "garments";

    const cookieMatch = document.cookie.match(/(?:^|;\s*)fc_store=([^;]+)/);
    if (cookieMatch && cookieMatch[1] === "jewellery") return "jewellery";
    if (cookieMatch && cookieMatch[1] === "garments") return "garments";

    const saved = sessionStorage.getItem("fc_active_store");
    if (saved === "jewellery") return "jewellery";
    return "garments";
  }

  function refreshCartCount() {
    if (!isLoggedIn) return;
    fetch(`/api/cart?all=true`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.totalCount !== undefined) {
          setCartCount(data.totalCount);
        } else if (data?.cart?.items) {
          setCartCount(data.cart.items.reduce((n: number, i: { quantity: number }) => n + i.quantity, 0));
        }
      })
      .catch(() => {});
  }

  function refreshWishlistCount() {
    if (!isLoggedIn) return;
    fetch("/api/wishlist")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.wishlist?.items) {
          setWishlistCount(data.wishlist.items.length);
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    if (hasActiveSession) {
      refreshCartCount();
      refreshWishlistCount();
    }

    const handleCartUpdate = () => refreshCartCount();
    const handleWishlistUpdate = () => refreshWishlistCount();
    const handleStoreSwitched = () => {
      refreshCartCount();
      refreshWishlistCount();
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("wishlist-updated", handleWishlistUpdate);
    window.addEventListener("store-switched", handleStoreSwitched);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("wishlist-updated", handleWishlistUpdate);
      window.removeEventListener("store-switched", handleStoreSwitched);
    };
  }, [hasActiveSession]);

  const activeCategories = categories;

  return (
    <div className="flex h-16 sm:h-18 items-center justify-between gap-2 sm:gap-4 w-full max-w-full">
      
      {/* 1. Left Group: Luxury Menu Button + Official Brand Logo */}
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
        
        {/* Menu Drawer Trigger Button */}
        <button
          type="button"
          onClick={() => setMenuDrawerOpen(true)}
          className="flex items-center justify-center gap-2 h-10 w-10 sm:w-auto sm:px-3.5 rounded-full border border-[#E7DFD5] bg-[#FAF8F5] hover:bg-white hover:border-[#C59B27] text-[#141416] active:scale-95 transition-all cursor-pointer shadow-2xs group shrink-0"
          aria-label="Open Navigation Menu"
        >
          <div className="flex flex-col gap-1 w-4 sm:w-4.5 justify-center items-center">
            <span className="w-full h-0.5 bg-[#141416] rounded-full transition-transform duration-200 group-hover:bg-[#C59B27]" />
            <span className="w-full h-0.5 bg-[#141416] rounded-full transition-transform duration-200 group-hover:bg-[#C59B27]" />
            <span className="w-3/4 h-0.5 bg-[#141416] rounded-full self-start transition-all duration-200 group-hover:w-full group-hover:bg-[#C59B27]" />
          </div>
          <span className="hidden sm:inline text-xs font-extrabold uppercase tracking-wider text-[#141416]">
            Menu
          </span>
        </button>

        {/* Official Brand Logo & Monogram */}
        <Link
          href="/"
          prefetch={true}
          className="flex items-center gap-2 sm:gap-2.5 group shrink-0"
          aria-label="Fashion Cart Homepage"
        >
          <div className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden transition-transform duration-200 group-hover:scale-105 shrink-0">
            <Image
              src="/fashion-cart-logo-transparent.svg"
              alt="Fashion Cart Luxury Monogram Logo"
              fill
              sizes="40px"
              priority
              className="object-contain"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-display font-black text-base sm:text-lg lg:text-xl tracking-tight text-[#141416] leading-none">
              Fashion CART
            </span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.24em] font-bold text-[#C59B27] leading-none mt-0.5 sm:mt-1">
              Premium Outlet
            </span>
          </div>
        </Link>
      </div>

      {/* Center Group: Store Switcher Pill (Garments vs Jewellery) */}
      <div className="hidden sm:flex items-center justify-center">
        <StoreSwitcherPill />
      </div>

      {/* 2. Right Group: Search, Wishlist, and Shopping Bag */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        
        {/* Search Trigger Button */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center justify-center gap-2 h-10 w-10 md:w-auto md:px-4 rounded-full border border-[#E7DFD5] bg-[#FAF8F5] hover:bg-white hover:border-[#C59B27] text-[#787C87] hover:text-[#141416] active:scale-95 transition-all shadow-2xs cursor-pointer group shrink-0"
          aria-label="Search fine apparel"
          title="Quick search (Ctrl+K)"
        >
          <SearchIcon />
          <span className="hidden md:inline font-medium text-xs text-[#787C87] group-hover:text-[#141416] transition-colors">
            {isJewellery ? "Search jewellery, chokers…" : "Search apparel & styles…"}
          </span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-white text-[#141416] font-bold border border-[#E7DFD5] shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Wishlist Button */}
        <Link
          href="/account/wishlist"
          prefetch={true}
          className="relative w-10 h-10 rounded-full border border-[#E7DFD5] bg-white hover:border-[#C59B27] text-[#141416] hover:text-[#C59B27] active:scale-95 transition-all shadow-2xs flex items-center justify-center group shrink-0 cursor-pointer"
          aria-label="View Wishlist"
        >
          <WishlistIcon />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#873E4C] text-[9px] font-bold text-white shadow-xs">
              {wishlistCount}
            </span>
          )}
        </Link>

        {/* Shopping Bag Button */}
        <button
          onClick={() => setCartDrawerOpen(true)}
          className="relative w-10 h-10 rounded-full border border-[#E7DFD5] bg-white hover:border-[#C59B27] text-[#141416] hover:text-[#C59B27] active:scale-95 transition-all shadow-2xs flex items-center justify-center cursor-pointer group shrink-0"
          aria-label="Open Shopping Bag"
        >
          <CartIcon />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#C59B27] text-[9px] font-bold text-white shadow-xs font-mono">
              {cartCount}
            </span>
          )}
        </button>

        {/* User Account Portal / Sign In Button */}
        {hasActiveSession ? (
          <Link
            href="/account"
            prefetch={true}
            className="flex items-center gap-1.5 h-10 px-2.5 sm:px-3.5 rounded-full border border-[#C59B27]/40 bg-[#FBF4E2] hover:bg-[#F4EFEA] text-[#141416] active:scale-95 transition-all shadow-2xs group shrink-0 cursor-pointer"
            title="My Account & Orders"
          >
            <span className="w-5 h-5 rounded-full bg-[#141416] text-[#C59B27] flex items-center justify-center text-[10px] font-bold font-mono">
              {userName ? userName.charAt(0).toUpperCase() : "👤"}
            </span>
            <span className="hidden sm:inline font-bold text-xs text-[#141416] max-w-[90px] truncate">
              {userName ? userName.split(" ")[0] : "Account"}
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            prefetch={true}
            className="hidden sm:flex items-center gap-1.5 h-10 px-3.5 rounded-full border border-[#E7DFD5] bg-white hover:border-[#C59B27] hover:text-[#C59B27] text-[#141416] font-bold text-xs active:scale-95 transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            <span>Sign In</span>
          </Link>
        )}
      </div>

      {/* Full-Height Slide-Over Navigation & Category Drawer */}
      <MenuDrawer
        isOpen={menuDrawerOpen}
        onClose={() => setMenuDrawerOpen(false)}
        isLoggedIn={hasActiveSession}
        userName={hasActiveSession ? (userName ?? undefined) : undefined}
        categories={activeCategories}
      />

      {/* Full-Height Slide-Over Shopping Cart Review Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        isLoggedIn={hasActiveSession}
      />

      {/* Universal Luxury Search Command Palette */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
