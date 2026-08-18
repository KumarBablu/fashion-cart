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
  const [activeDeptHover, setActiveDeptHover] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

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

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target as Node)) {
        setActiveDeptHover(null);
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
      {/* Desktop Main Navigation Links with Luxury Card Menus & Sub-menus */}
      <nav className="hidden md:flex items-center gap-2 text-xs font-semibold">
        
        {/* 1. All Categories Interactive Mega-Menu Card Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setCategoriesOpen((prev) => !prev)}
            onMouseEnter={() => {
              setCategoriesOpen(true);
              setActiveDeptHover(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all duration-200 cursor-pointer ${
              categoriesOpen
                ? "bg-[#141416] text-white border-[#141416] shadow-sm"
                : "text-[#141416] border-[#E7DFD5] bg-[#FAF8F5]/80 hover:bg-white hover:border-[#C59B27] shadow-2xs"
            }`}
            aria-expanded={categoriesOpen}
            aria-haspopup="true"
          >
            <span className="text-sm">🗂️</span>
            <span className="font-bold">All Categories</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform duration-200 ${categoriesOpen ? "rotate-180 text-[#C59B27]" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Interactive Dynamic Category Mega-Menu Card Container */}
          {categoriesOpen && (
            <div
              onMouseLeave={() => setCategoriesOpen(false)}
              className="absolute left-0 top-full mt-2 w-[760px] rounded-3xl bg-white/98 backdrop-blur-2xl border border-[#E7DFD5] shadow-2xl p-6 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 card-theme"
              style={{ borderColor: "var(--fc-border)" }}
            >
              {/* Top Accent Luxury Border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C59B27] via-[#E0BF48] to-[#141416]" />

              {/* Header Label */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E7DFD5]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C59B27]" />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#787C87]">
                    Curated Atelier Catalog &amp; Departments
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#C59B27] font-bold">
                  {activeCategories.length} Departments Active
                </span>
              </div>

              {/* Department Cards Grid */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                {activeCategories.length > 0 ? (
                  activeCategories.map((col) => (
                    <div
                      key={col.id}
                      className="group/card rounded-2xl p-3.5 bg-[#FAF8F5]/70 hover:bg-white border border-[#E7DFD5] hover:border-[#C59B27] transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <Link
                          href={`/shop?category=${col.slug}`}
                          onClick={() => setCategoriesOpen(false)}
                          className="flex items-center justify-between text-xs font-black text-[#141416] group-hover/card:text-[#C59B27] transition-colors pb-2 border-b border-[#E7DFD5]/60"
                        >
                          <span className="flex items-center gap-1.5">
                            <span>✨</span>
                            <span>{col.name}</span>
                          </span>
                          <span className="text-[#C59B27] font-bold text-xs opacity-0 group-hover/card:opacity-100 group-hover/card:translate-x-0.5 transition-all">
                            →
                          </span>
                        </Link>

                        {/* Subcategory Pill Items */}
                        {(col.children ?? []).length > 0 ? (
                          <ul className="space-y-1 pt-2 text-[11px] text-[#4B4E56]">
                            {col.children!.map((item) => (
                              <li key={item.id}>
                                <Link
                                  href={`/shop?category=${item.slug}`}
                                  onClick={() => setCategoriesOpen(false)}
                                  className="px-2 py-1 rounded-lg hover:bg-[#F4EFEA] hover:text-[#C59B27] flex items-center justify-between group/sub transition-all"
                                >
                                  <span className="truncate">{item.name}</span>
                                  <span className="text-[10px] text-[#787C87] group-hover/sub:text-[#C59B27] opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                    ↗
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] text-[#787C87] italic pt-2">Full departmental line</p>
                        )}
                      </div>

                      <div className="pt-2 mt-2 border-t border-[#E7DFD5]/40 text-right">
                        <Link
                          href={`/shop?category=${col.slug}`}
                          onClick={() => setCategoriesOpen(false)}
                          className="text-[10px] font-bold text-[#C59B27] hover:underline"
                        >
                          View All {col.name.split(" ")[0]} →
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-xs text-[#787C87]">
                    No active categories currently available.
                  </div>
                )}
              </div>

              {/* Bottom Privilege & Hub Footer */}
              <div className="mt-4 pt-3.5 border-t border-[#E7DFD5] flex items-center justify-between text-xs bg-[#FAF8F5]/80 -mx-6 -mb-6 p-4 px-6 rounded-b-3xl">
                <div className="flex items-center gap-2 text-[#787C87] text-[11px]">
                  <span>🏷️</span>
                  <span>Flat <strong>10% Off</strong> with coupon <strong className="text-[#141416] font-mono bg-[#E7DFD5] px-1.5 py-0.5 rounded">FIRST10</strong></span>
                </div>
                <Link
                  href="/categories"
                  onClick={() => setCategoriesOpen(false)}
                  className="font-bold text-[#141416] hover:text-[#C59B27] hover:underline flex items-center gap-1 text-xs"
                >
                  <span>Explore Category Hub</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 2. Individual Department Cards & Sub-menus (e.g. Women's, Men's) */}
        <div className="flex items-center gap-1.5" ref={deptDropdownRef}>
          {activeCategories.slice(0, 3).map((cat) => {
            const hasSub = (cat.children ?? []).length > 0;
            const isHovered = activeDeptHover === cat.id;

            return (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => {
                  setActiveDeptHover(cat.id);
                  setCategoriesOpen(false);
                }}
              >
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    isHovered
                      ? "bg-[#141416] text-white border-[#141416] shadow-2xs font-bold"
                      : "text-[#141416] border-transparent hover:border-[#E7DFD5] hover:bg-[#F4EFEA]"
                  }`}
                >
                  <span>{cat.name}</span>
                  {hasSub && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`transition-transform duration-200 ${isHovered ? "rotate-180 text-[#C59B27]" : "text-[#787C87]"}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </Link>

                {/* Sub-menu Dropdown Card */}
                {hasSub && isHovered && (
                  <div
                    onMouseLeave={() => setActiveDeptHover(null)}
                    className="absolute left-0 top-full mt-2 w-64 rounded-2xl bg-white/98 backdrop-blur-2xl border border-[#E7DFD5] shadow-2xl p-3.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50 card-theme"
                  >
                    {/* Header */}
                    <div className="px-2 pb-2 border-b border-[#E7DFD5] flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C59B27]">
                        {cat.name} Collection
                      </span>
                      <span className="text-[9px] font-mono text-[#787C87] font-bold">
                        {cat.children!.length} Styles
                      </span>
                    </div>

                    {/* Subcategories List */}
                    <div className="space-y-0.5 max-h-64 overflow-y-auto">
                      {cat.children!.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/shop?category=${sub.slug}`}
                          onClick={() => setActiveDeptHover(null)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-[#141416] hover:bg-[#F4EFEA] hover:text-[#C59B27] transition-all group"
                        >
                          <span>{sub.name}</span>
                          <span className="text-[11px] text-[#C59B27] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                            →
                          </span>
                        </Link>
                      ))}
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-2 border-t border-[#E7DFD5]">
                      <Link
                        href={`/shop?category=${cat.slug}`}
                        onClick={() => setActiveDeptHover(null)}
                        className="block w-full py-1.5 px-2 rounded-lg bg-[#141416] hover:bg-[#25262B] text-white text-[10px] font-bold uppercase tracking-wider text-center transition-colors"
                      >
                        Explore All {cat.name} →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3. New Arrivals Feature Capsule */}
        <Link
          href="/shop?sort=newest"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E7DFD5] bg-[#FAF8F5] text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-2xs font-semibold"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] pulse-dot" />
          <span>New Arrivals</span>
        </Link>

        {/* 4. Super Deals Luxury Badge Capsule */}
        <Link
          href="/shop?onSale=true"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#873E4C]/30 bg-[#873E4C]/5 text-[#873E4C] hover:bg-[#873E4C] hover:text-white transition-all shadow-2xs font-bold"
        >
          <span>🏷️</span>
          <span>Super Deals</span>
        </Link>
      </nav>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Modal Trigger */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#E7DFD5] bg-[#F4EFEA]/70 hover:bg-[#F4EFEA] text-xs text-[#787C87] hover:text-[#141416] transition-all shadow-2xs cursor-pointer"
          aria-label="Search catalog"
          title="Search products (Ctrl+K)"
        >
          <SearchIcon />
          <span className="hidden sm:inline font-medium">Search apparel…</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white text-[#141416] font-semibold border border-[#E7DFD5]">
            ⌘K
          </kbd>
        </button>

        {/* Wishlist Button with Floating Badge */}
        <Link
          href="/account/wishlist"
          className="relative p-2.5 rounded-full border border-[#E7DFD5] bg-white text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-2xs"
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
          className="relative p-2.5 rounded-full border border-[#E7DFD5] bg-white text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-2xs cursor-pointer"
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E7DFD5] bg-white hover:border-[#141416] text-xs font-bold text-[#141416] transition-all shadow-2xs"
          >
            <UserIcon />
            <span className="max-w-[80px] truncate">{userName || "Account"}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-all shadow-xs"
          >
            Sign In
          </Link>
        )}

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2.5 rounded-full border border-[#E7DFD5] bg-white text-[#141416] hover:bg-[#F4EFEA] transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Drawer Navigation Card */}
      {menuOpen && (
        <div className="fixed inset-0 top-[108px] z-50 bg-[#FAF8F5]/98 backdrop-blur-xl border-b border-[#E7DFD5] p-5 flex flex-col justify-between overflow-y-auto md:hidden animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-4">
            
            {/* Curated Departments Card */}
            <div className="rounded-2xl bg-white border border-[#E7DFD5] p-4 shadow-sm space-y-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#787C87] flex items-center gap-1.5 pb-2 border-b border-[#E7DFD5]">
                <span>✨</span> Curated Atelier Departments
              </p>
              
              <div className="space-y-2">
                {activeCategories.map((c) => {
                  const hasSub = (c.children ?? []).length > 0;
                  const isExpanded = mobileExpandedCat === c.id;

                  return (
                    <div key={c.id} className="rounded-xl border border-[#E7DFD5]/60 bg-[#FAF8F5] overflow-hidden">
                      <div className="flex items-center justify-between p-3">
                        <Link
                          href={`/shop?category=${c.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="text-xs font-bold text-[#141416]"
                        >
                          {c.name}
                        </Link>
                        {hasSub && (
                          <button
                            onClick={() => setMobileExpandedCat(isExpanded ? null : c.id)}
                            className="p-1 text-xs text-[#787C87] font-bold"
                          >
                            {isExpanded ? "▲" : "▼"}
                          </button>
                        )}
                      </div>

                      {hasSub && isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-[#E7DFD5]/60 space-y-1 bg-white">
                          {c.children!.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/shop?category=${sub.slug}`}
                              onClick={() => setMenuOpen(false)}
                              className="block py-1.5 px-2 text-[11px] text-[#4B4E56] hover:text-[#C59B27] font-medium"
                            >
                              • {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/shop?sort=newest"
                onClick={() => setMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-white border border-[#E7DFD5] text-xs font-bold text-[#141416] flex items-center justify-between shadow-2xs"
              >
                <span>✨ New Drops</span>
                <span className="text-[#C59B27]">→</span>
              </Link>
              <Link
                href="/shop?onSale=true"
                onClick={() => setMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-white border border-[#873E4C]/30 text-xs font-bold text-[#873E4C] flex items-center justify-between shadow-2xs"
              >
                <span>🏷️ Super Deals</span>
                <span className="text-[#873E4C]">→</span>
              </Link>
            </div>

          </div>

          <div className="pt-4 border-t border-[#E7DFD5] text-xs text-[#787C87] flex justify-between items-center">
            <span>Fashion Cart Luxury Atelier</span>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="font-bold text-[#141416] hover:underline"
            >
              Contact Concierge →
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

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
