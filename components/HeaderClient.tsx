"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import CartDrawer from "@/components/cart/CartDrawer";
import SearchModal from "@/components/search/SearchModal";

const CATEGORIES_MENU = [
  {
    name: "Women's Ethnic & Couture",
    slug: "women-kurtis",
    icon: "👗",
    items: [
      { name: "Velvet Kurti Sets", slug: "women-kurtis" },
      { name: "Mulberry Silk Sarees", slug: "women-kurtis" },
      { name: "Anarkali & Gowns", slug: "women-dresses" },
      { name: "Festive Co-ords", slug: "women-kurtis" },
    ],
  },
  {
    name: "Men's Apparel & Tailoring",
    slug: "men-shirts",
    icon: "👔",
    items: [
      { name: "Pure Linen Shirts", slug: "men-shirts" },
      { name: "Mandarin Collar Shirts", slug: "men-shirts" },
      { name: "Stretch Denim Jeans", slug: "men-jeans" },
      { name: "Chinos & Trousers", slug: "men-jeans" },
    ],
  },
  {
    name: "Western & Contemporary",
    slug: "women-dresses",
    icon: "✨",
    items: [
      { name: "Cocktail Dresses", slug: "women-dresses" },
      { name: "Summer Midi Dresses", slug: "women-dresses" },
      { name: "Party Wear Tops", slug: "women-dresses" },
      { name: "Casual Essentials", slug: "women-dresses" },
    ],
  },
  {
    name: "Kids & Special Edits",
    slug: "kids-wear",
    icon: "🧸",
    items: [
      { name: "Kids Ethnic Wear", slug: "kids-wear" },
      { name: "Everyday Comfort Cotton", slug: "kids-wear" },
      { name: "Under ₹999 Budget Store", slug: "under-999" },
      { name: "Flash Super Deals (40% Off)", slug: "deals" },
    ],
  },
];

export default function HeaderClient({
  isLoggedIn,
  userName,
}: {
  isLoggedIn: boolean;
  userName?: string;
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

  return (
    <>
      {/* Desktop Main Navigation Links with Category Dropdown */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
        {/* Interactive Mega Category Menu Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setCategoriesOpen((prev) => !prev)}
            onMouseEnter={() => setCategoriesOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 ${
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

          {/* Interactive Category Mega Menu Card */}
          {categoriesOpen && (
            <div
              onMouseLeave={() => setCategoriesOpen(false)}
              className="absolute left-0 top-full mt-1.5 w-[680px] rounded-2xl bg-white border border-[#E7DFD5] shadow-2xl p-6 grid grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2 duration-200 z-50"
            >
              {CATEGORIES_MENU.map((col) => (
                <div key={col.name} className="space-y-3">
                  <Link
                    href={`/shop?category=${col.slug}`}
                    onClick={() => setCategoriesOpen(false)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#141416] hover:text-[#C59B27] transition-colors"
                  >
                    <span>{col.icon}</span>
                    <span>{col.name}</span>
                  </Link>
                  <ul className="space-y-2 text-[11px] text-[#4B4E56]">
                    {col.items.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={
                            item.slug === "deals"
                              ? "/shop?onSale=true"
                              : item.slug === "under-999"
                              ? "/shop?maxPrice=999"
                              : `/shop?category=${item.slug}`
                          }
                          onClick={() => setCategoriesOpen(false)}
                          className="hover:text-[#C59B27] hover:translate-x-1 inline-block transition-all"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="col-span-4 border-t border-[#F4EFEA] pt-3 flex items-center justify-between text-xs">
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

        <Link
          href="/shop?category=women-kurtis"
          className="text-[#141416] hover:text-[#C59B27] transition-colors"
        >
          Women
        </Link>
        <Link
          href="/shop?category=men-shirts"
          className="text-[#141416] hover:text-[#C59B27] transition-colors"
        >
          Men
        </Link>
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E7DFD5] bg-[#F4EFEA]/70 hover:bg-[#F4EFEA] text-xs text-[#787C87] hover:text-[#141416] transition-all shadow-xs"
          aria-label="Search catalog"
          title="Search products (Ctrl+K)"
        >
          <SearchIcon />
          <span className="hidden sm:inline">Search apparel…</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white text-[#141416] font-semibold border border-[#E7DFD5]">
            ⌘K
          </kbd>
        </button>

        {/* Wishlist Link */}
        <Link
          href={isLoggedIn ? "/account/wishlist" : "/login?next=/account/wishlist"}
          className="relative p-2 rounded-full text-[#141416] hover:bg-[#F4EFEA] transition-colors"
          aria-label="Wishlist"
          title="My Wishlist"
        >
          <WishlistIcon />
          {wishlistCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold bg-[#C59B27] text-white shadow-xs">
              {wishlistCount}
            </span>
          )}
        </Link>

        {/* Cart Drawer Trigger */}
        <button
          onClick={() => setCartDrawerOpen(true)}
          className="relative p-2 rounded-full text-[#141416] hover:bg-[#F4EFEA] transition-colors"
          aria-label="Cart"
          title="Shopping Bag"
        >
          <CartIcon />
          {cartCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold bg-[#141416] text-white shadow-xs">
              {cartCount}
            </span>
          )}
        </button>

        {/* Account Link */}
        <Link
          href={isLoggedIn ? "/account" : "/login"}
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#E7DFD5] bg-white hover:bg-[#F4EFEA] text-[#141416] transition-all shadow-xs"
        >
          <UserIcon />
          <span>{isLoggedIn ? userName?.split(" ")[0] ?? "Account" : "Sign In"}</span>
        </Link>

        {/* Mobile Hamburger Toggle */}
        <button
          aria-label="Toggle Menu"
          className="md:hidden p-2 rounded-xl text-[#141416] hover:bg-[#F4EFEA] transition-colors"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <MenuIcon />
        </button>
      </div>

      {/* Mobile Slide-Over Navigation */}
      {menuOpen && (
        <div className="absolute left-0 right-0 top-full md:hidden border-b border-[#E7DFD5] bg-white shadow-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200 z-50">
          <nav className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-[#F4EFEA] text-[#141416]"
            >
              Home
            </Link>
            <Link
              href="/categories"
              onClick={() => setMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-[#F4EFEA] text-[#141416] font-semibold"
            >
              📂 Categories Hub
            </Link>
            <Link
              href="/shop"
              onClick={() => setMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-[#F4EFEA] text-[#141416]"
            >
              All Catalog Products
            </Link>
            <Link
              href="/shop?category=women-kurtis"
              onClick={() => setMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-[#F4EFEA] text-[#141416]"
            >
              👗 Women&apos;s Ethnic &amp; Sarees
            </Link>
            <Link
              href="/shop?category=men-shirts"
              onClick={() => setMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-[#F4EFEA] text-[#141416]"
            >
              👔 Men&apos;s Shirts &amp; Jeans
            </Link>
            <Link
              href="/shop?category=women-dresses"
              onClick={() => setMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-[#F4EFEA] text-[#141416]"
            >
              ✨ Cocktail Dresses
            </Link>
            <Link
              href="/shop?onSale=true"
              onClick={() => setMenuOpen(false)}
              className="py-2 px-3 rounded-xl bg-[#FBF4E2] text-[#8E6C0C] font-bold"
            >
              🏷️ Super Deals (Flat 40% Off)
            </Link>
            <div className="pt-2 border-t border-[#F4EFEA]">
              <Link
                href={isLoggedIn ? "/account" : "/login"}
                onClick={() => setMenuOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-[#F4EFEA] font-bold text-[#141416] block"
              >
                {isLoggedIn ? `My Account (${userName})` : "Sign In / Register"}
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Slide-Over Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onCartChange={refreshCartCount}
      />

      {/* Live Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
