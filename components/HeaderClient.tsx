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

  function getCleanCategoryName(name: string) {
    if (name.toLowerCase().includes("women")) return "Women";
    if (name.toLowerCase().includes("men")) return "Men";
    if (name.toLowerCase().includes("kid")) return "Kids";
    return name.split(" ")[0];
  }

  return (
    <div className="flex flex-1 items-center justify-between gap-4 lg:gap-8">
      
      {/* 1. Center Luxury Navigation Links */}
      <nav className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-[0.14em]">
        
        {/* All Categories Slide-Over Menu Trigger */}
        <button
          type="button"
          onClick={() => setMenuDrawerOpen(true)}
          className="group relative flex items-center gap-2 py-2 text-[#141416] hover:text-[#C59B27] transition-colors cursor-pointer"
          aria-label="Open full department catalog"
        >
          <span className="text-[#C59B27] text-sm leading-none font-bold group-hover:scale-110 transition-transform">☰</span>
          <span className="whitespace-nowrap font-extrabold">All Categories</span>
          <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#C59B27] transition-all duration-300 group-hover:w-full" />
        </button>

        {/* Top Department Links (Women, Men, etc.) */}
        {activeCategories.slice(0, 3).map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group relative py-2 text-[#141416] hover:text-[#C59B27] transition-colors whitespace-nowrap"
          >
            <span>{getCleanCategoryName(cat.name)}</span>
            <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#C59B27] transition-all duration-300 group-hover:w-full" />
          </Link>
        ))}

        {/* New Arrivals */}
        <Link
          href="/shop?sort=newest"
          className="group relative py-2 text-[#141416] hover:text-[#C59B27] transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] pulse-dot" />
          <span>New Arrivals</span>
          <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#C59B27] transition-all duration-300 group-hover:w-full" />
        </Link>

        {/* Super Deals */}
        <Link
          href="/shop?onSale=true"
          className="group relative py-2 text-[#873E4C] hover:text-[#C59B27] transition-colors whitespace-nowrap flex items-center gap-1 font-extrabold"
        >
          <span>Super Deals</span>
          <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#873E4C] transition-all duration-300 group-hover:w-full" />
        </Link>
      </nav>

      {/* 2. Right-Side Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        
        {/* Luxury Search Pill Trigger */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#E7DFD5] bg-[#FAF8F5] hover:bg-white hover:border-[#C59B27] text-xs text-[#787C87] hover:text-[#141416] transition-all shadow-2xs cursor-pointer group"
          aria-label="Search fine apparel"
          title="Quick search (Ctrl+K)"
        >
          <SearchIcon />
          <span className="hidden sm:inline font-medium text-xs text-[#787C87] group-hover:text-[#141416] transition-colors">
            Search fine apparel…
          </span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-white text-[#141416] font-bold border border-[#E7DFD5] shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Wishlist Button */}
        <Link
          href="/account/wishlist"
          className="relative p-2.5 rounded-full border border-[#E7DFD5] bg-white text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-2xs group"
          aria-label="View Wishlist"
        >
          <WishlistIcon />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#873E4C] px-1 text-[9px] font-bold text-white shadow-xs">
              {wishlistCount}
            </span>
          )}
        </Link>

        {/* Shopping Bag Button */}
        <button
          onClick={() => setCartDrawerOpen(true)}
          className="relative p-2.5 rounded-full border border-[#E7DFD5] bg-white text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-2xs cursor-pointer group"
          aria-label="Open Shopping Bag"
        >
          <CartIcon />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C59B27] px-1 text-[9px] font-bold text-white shadow-xs font-mono">
              {cartCount}
            </span>
          )}
        </button>

        {/* User Account / Sign In */}
        {isLoggedIn ? (
          <Link
            href="/account"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E7DFD5] bg-white hover:border-[#141416] text-xs font-bold text-[#141416] transition-all shadow-2xs"
          >
            <UserIcon />
            <span className="max-w-[85px] truncate">{userName || "Account"}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-all shadow-xs"
          >
            Sign In
          </Link>
        )}

        {/* Mobile Navigation Toggle */}
        <button
          onClick={() => setMenuDrawerOpen(true)}
          className="lg:hidden p-2.5 rounded-full border border-[#E7DFD5] bg-white text-[#141416] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          aria-label="Open Mobile Menu"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Full-Height Slide-Over Category & Navigation Drawer */}
      <MenuDrawer
        isOpen={menuDrawerOpen}
        onClose={() => setMenuDrawerOpen(false)}
        categories={activeCategories}
      />

      {/* Full-Height Slide-Over Shopping Cart Review Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
