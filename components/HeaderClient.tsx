"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CartDrawer from "@/components/cart/CartDrawer";
import MenuDrawer from "@/components/navigation/MenuDrawer";
import SearchModal from "@/components/search/SearchModal";

type SubCat = {
  id: string;
  name: string;
  slug: string;
};

type HeaderCategory = {
  id: string;
  name: string;
  slug: string;
  children?: SubCat[];
};

export default function HeaderClient({
  isLoggedIn,
  userName,
  categories = [],
}: {
  isLoggedIn: boolean;
  userName?: string;
  categories?: HeaderCategory[];
}) {
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  function refreshCartCount() {
    if (!isLoggedIn) return;
    fetch("/api/cart")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.cart?.items) {
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
    if (isLoggedIn && typeof window !== "undefined") {
      sessionStorage.setItem("fc_window_session", "active");
    }

    refreshCartCount();
    refreshWishlistCount();

    const handleCartUpdate = () => refreshCartCount();
    const handleWishlistUpdate = () => refreshWishlistCount();
    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("wishlist-updated", handleWishlistUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("wishlist-updated", handleWishlistUpdate);
    };
  }, [isLoggedIn]);

  const activeCategories = categories;

  function getShortCategoryName(name: string) {
    if (name.toLowerCase().includes("women")) return "Women's";
    if (name.toLowerCase().includes("men")) return "Men's";
    if (name.toLowerCase().includes("kid")) return "Kids";
    return name.split(" ")[0];
  }

  return (
    <>
      {/* Desktop Main Navigation Bar */}
      <nav className="hidden md:flex items-center gap-2 text-xs font-semibold">
        
        {/* 1. All Categories Slide-Over Menu Button */}
        <button
          onClick={() => setMenuDrawerOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E7DFD5] bg-[#FAF8F5] hover:bg-white hover:border-[#C59B27] text-[#141416] transition-all shadow-2xs cursor-pointer group"
          aria-label="Open Category & Department Directory"
        >
          <span className="text-[#C59B27] font-bold text-sm leading-none">☰</span>
          <span className="font-bold">All Categories</span>
          <span className="text-[10px] font-mono font-bold text-[#787C87] bg-white border border-[#E7DFD5] px-1.5 py-0.2 rounded-full">
            {activeCategories.length}
          </span>
        </button>

        {/* 2. Top Bar Department Links */}
        {activeCategories.slice(0, 3).map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="px-3 py-1.5 rounded-full border border-transparent hover:border-[#E7DFD5] hover:bg-[#FAF8F5] text-[#141416] transition-all whitespace-nowrap"
          >
            {getShortCategoryName(cat.name)}
          </Link>
        ))}

        {/* 3. New Arrivals Feature Capsule */}
        <Link
          href="/shop?sort=newest"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E7DFD5] bg-[#FAF8F5] text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-2xs whitespace-nowrap"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] pulse-dot" />
          <span>New Arrivals</span>
        </Link>

        {/* 4. Super Deals Luxury Badge Capsule */}
        <Link
          href="/shop?onSale=true"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#873E4C]/30 bg-[#873E4C]/5 text-[#873E4C] hover:bg-[#873E4C] hover:text-white transition-all shadow-2xs font-bold whitespace-nowrap"
        >
          <span>🏷️</span>
          <span>Super Deals</span>
        </Link>
      </nav>

      {/* Right-Side Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Modal Trigger */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E7DFD5] bg-[#F4EFEA]/70 hover:bg-[#F4EFEA] text-xs text-[#787C87] hover:text-[#141416] transition-all shadow-2xs cursor-pointer"
          aria-label="Search catalog"
          title="Search products (Ctrl+K)"
        >
          <SearchIcon />
          <span className="hidden sm:inline font-medium">Search apparel…</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white text-[#141416] font-semibold border border-[#E7DFD5]">
            ⌘K
          </kbd>
        </button>

        {/* Wishlist Button */}
        <Link
          href="/account/wishlist"
          className="relative p-2 rounded-full border border-[#E7DFD5] bg-white text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-2xs"
          aria-label="View Wishlist"
        >
          <WishlistIcon />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#873E4C] px-1 text-[9px] font-bold text-white shadow-xs">
              {wishlistCount}
            </span>
          )}
        </Link>

        {/* Shopping Cart Drawer Trigger Button */}
        <button
          onClick={() => setCartDrawerOpen(true)}
          className="relative p-2 rounded-full border border-[#E7DFD5] bg-white text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-2xs cursor-pointer"
          aria-label="Open Shopping Bag"
        >
          <CartIcon />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C59B27] px-1 text-[9px] font-bold text-white shadow-xs font-mono">
              {cartCount}
            </span>
          )}
        </button>

        {/* Account Button / Auth Dropdown */}
        {isLoggedIn ? (
          <Link
            href="/account"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E7DFD5] bg-white hover:border-[#141416] text-xs font-bold text-[#141416] transition-all shadow-2xs"
          >
            <UserIcon />
            <span className="max-w-[80px] truncate">{userName || "Account"}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-all shadow-xs"
          >
            Sign In
          </Link>
        )}

        {/* Mobile Hamburger Toggle Button (Opens Slide-Over Menu Drawer) */}
        <button
          onClick={() => setMenuDrawerOpen(true)}
          className="md:hidden p-2 rounded-full border border-[#E7DFD5] bg-white text-[#141416] hover:bg-[#F4EFEA] transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Slide-over Luxury Category & Department Menu Drawer (Side Menu like Cart) */}
      <MenuDrawer
        isOpen={menuDrawerOpen}
        onClose={() => setMenuDrawerOpen(false)}
        categories={activeCategories}
      />

      {/* Slide-over Cart Review Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
      />

      {/* Global Instant Search Command Palette */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
