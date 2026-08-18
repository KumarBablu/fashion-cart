"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import CartDrawer from "@/components/cart/CartDrawer";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

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
    // If the window/browser was closed, sessionStorage was purged. Require fresh login.
    if (isLoggedIn && typeof window !== "undefined") {
      if (!sessionStorage.getItem("fc_window_session")) {
        fetch("/api/auth/logout", { method: "POST" })
          .then(() => {
            window.location.reload();
          })
          .catch(() => {});
        return;
      }
    }

    refreshCartCount();
    refreshWishlistCount();

    const handleCartUpdate = () => refreshCartCount();
    const handleWishlistUpdate = () => refreshWishlistCount();
    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("wishlist-updated", handleWishlistUpdate);

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("wishlist-updated", handleWishlistUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLoggedIn]);

  const activeCategories = categories;

  return (
    <>
      {/* Desktop Main Navigation Links with Category Dropdown */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
        {/* Interactive Mega Category Menu Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setCategoriesOpen((prev) => !prev)}
            onMouseEnter={() => setCategoriesOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
              categoriesOpen
                ? "bg-[#141416] text-white font-bold"
                : "text-[#141416] hover:bg-[#F4EFEA]"
            }`}
          >
            <span>All Categories</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform duration-200 ${categoriesOpen ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Interactive Dynamic Category Mega Menu Card */}
          {categoriesOpen && (
            <div
              onMouseLeave={() => setCategoriesOpen(false)}
              className="absolute left-0 top-full mt-1.5 min-w-[340px] max-w-[760px] rounded-2xl bg-white border border-[#E7DFD5] shadow-2xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-200 z-50"
            >
              {activeCategories.length > 0 ? (
                activeCategories.map((col) => (
                  <div key={col.id} className="space-y-3">
                    <Link
                      href={`/shop?category=${col.slug}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#141416] hover:text-[#C59B27] transition-colors"
                    >
                      <span>📁</span>
                      <span>{col.name}</span>
                    </Link>
                    {(col.children ?? []).length > 0 && (
                      <ul className="space-y-2 text-[11px] text-[#4B4E56]">
                        {col.children!.map((item) => (
                          <li key={item.id}>
                            <Link
                              href={`/shop?category=${item.slug}`}
                              onClick={() => setCategoriesOpen(false)}
                              className="hover:text-[#C59B27] hover:translate-x-1 inline-block transition-all"
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-4 text-center text-xs text-slate-400">
                  No active categories currently available.
                </div>
              )}

              <div className="col-span-full border-t border-[#F4EFEA] pt-3 flex items-center justify-between text-xs">
                <span className="text-[#787C87]">✨ Flat 10% Off on your first luxury order with code <strong className="text-[#141416]">FIRST10</strong></span>
                <Link
                  href="/categories"
                  onClick={() => setCategoriesOpen(false)}
                  className="font-bold text-[#141416] hover:text-[#C59B27] hover:underline"
                >
                  Explore Category Hub →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Top Bar Category Links (Only Active Ones) */}
        {activeCategories.slice(0, 2).map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="text-[#141416] hover:text-[#C59B27] transition-colors"
          >
            {cat.name.split(" ")[0]}
          </Link>
        ))}

        <Link
          href="/shop?sort=newest"
          className="text-[#141416] hover:text-[#C59B27] transition-colors flex items-center gap-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] pulse-dot" />
          New Arrivals
        </Link>
        <Link
          href="/shop?onSale=true"
          className="text-[#141416] font-bold hover:text-[#C59B27] transition-colors flex items-center gap-1"
        >
          <span>🏷️</span> Super Deals
        </Link>
      </nav>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Modal Trigger */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E7DFD5] bg-[#F4EFEA]/70 hover:bg-[#F4EFEA] text-xs text-[#787C87] hover:text-[#141416] transition-all shadow-xs cursor-pointer"
          aria-label="Search catalog"
          title="Search products (Ctrl+K)"
        >
          <SearchIcon />
          <span className="hidden sm:inline">Search apparel…</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white text-[#141416] font-semibold border border-[#E7DFD5]">
            ⌘K
          </kbd>
        </button>

        {/* Wishlist Button with Floating Badge */}
        <Link
          href="/account/wishlist"
          className="relative p-2 rounded-full border border-[#E7DFD5] bg-white text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-xs"
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
          className="relative p-2 rounded-full border border-[#E7DFD5] bg-white text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-xs cursor-pointer"
          aria-label="Open Shopping Bag"
        >
          <CartIcon />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C59B27] px-1 text-[9px] font-bold text-white shadow-xs">
              {cartCount}
            </span>
          )}
        </button>

        {/* Account Button / Auth Dropdown */}
        {isLoggedIn ? (
          <Link
            href="/account"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E7DFD5] bg-white hover:border-[#141416] text-xs font-bold text-[#141416] transition-all shadow-xs"
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

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-full border border-[#E7DFD5] bg-white text-[#141416] hover:bg-[#F4EFEA] transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="fixed inset-0 top-[108px] z-50 bg-[#FAF8F5]/98 backdrop-blur-xl border-b border-[#E7DFD5] p-6 flex flex-col justify-between overflow-y-auto md:hidden animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#787C87] mb-3">
                Curated Collections
              </p>
              <div className="space-y-2">
                {activeCategories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/shop?category=${c.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between py-2 text-sm font-bold text-[#141416] border-b border-[#E7DFD5]/50"
                  >
                    <span>{c.name}</span>
                    <span className="text-[#C59B27]">→</span>
                  </Link>
                ))}
                <Link
                  href="/shop?sort=newest"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-sm font-bold text-[#141416] border-b border-[#E7DFD5]/50"
                >
                  <span>✨ New Arrivals 2026</span>
                  <span className="text-[#C59B27]">→</span>
                </Link>
                <Link
                  href="/shop?onSale=true"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-sm font-bold text-[#873E4C] border-b border-[#E7DFD5]/50"
                >
                  <span>🏷️ Super Deals (Up to 40% Off)</span>
                  <span className="text-[#873E4C]">→</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E7DFD5] text-xs text-[#787C87] flex justify-between items-center">
            <span>Fashion Cart Atelier</span>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="font-bold text-[#141416] hover:underline"
            >
              Contact Atelier
            </Link>
          </div>
        </div>
      )}

      {/* Slide-over Cart Drawer Component */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* Global Instant Search Modal */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
