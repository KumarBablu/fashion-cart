"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatINR, discountPercent } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";
import SizeGuideModal from "./SizeGuideModal";
import ProductReviews from "./ProductReviews";
import RecentlyViewed from "./RecentlyViewed";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";
import ProductImageLightbox from "./ProductImageLightbox";

type Variant = {
  id: string;
  colour: string;
  size: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fabric: string | null;
  material?: string | null;
  pattern?: string | null;
  fit?: string | null;
  occasion?: string | null;
  department?: string | null;
  subcategory?: string | null;
  categoryPath?: string | null;
  productType?: string | null;
  brand: string | null;
  availability?: string | null;
  currency?: string | null;
  averageRating?: number | null;
  totalReviews?: number | null;
  specifications: unknown;
  sizeChart: unknown;
  images: { id: string; imageUrl: string; altText: string | null; variantId: string | null }[];
  variants: Variant[];
};

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { success, error } = useToast();

  const colours = useMemo(() => Array.from(new Set(product.variants.map((v) => v.colour))), [product]);
  const [colour, setColour] = useState(colours[0] || "");
  const sizesForColour = useMemo(
    () => product.variants.filter((v) => v.colour === colour),
    [product, colour]
  );
  const [size, setSize] = useState(sizesForColour[0]?.size || "");
  const selected = product.variants.find((v) => v.colour === colour && v.size === size);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [cartVariantIds, setCartVariantIds] = useState<string[]>([]);
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });

  function handleImageHoverMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomCoords({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }

  function refreshCartState() {
    fetch("/api/cart")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.cart?.items) {
          setCartVariantIds(data.cart.items.map((item: { variantId: string }) => item.variantId));
        } else {
          setCartVariantIds([]);
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    refreshCartState();
    const handleCartUpdate = () => refreshCartState();
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, []);

  // Pincode Delivery Estimator state
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<string | null>("specs");

  // Save product to recently viewed
  useEffect(() => {
    try {
      const stored = localStorage.getItem("fashion_cart_recent");
      const list = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((i: { id: string }) => i.id !== product.id);
      filtered.unshift({
        id: product.id,
        name: product.name,
        slug: product.slug,
        imageUrl: product.images[0]?.imageUrl || "",
        price: selected ? selected.price : product.variants[0]?.price || 0,
      });
      localStorage.setItem("fashion_cart_recent", JSON.stringify(filtered.slice(0, 10)));
    } catch {
      // ignore
    }
  }, [product, selected]);

  const displayImages =
    product.images && product.images.length > 0
      ? product.images
      : [{ id: "0", imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80", altText: product.name, variantId: null }];
  const pct = selected ? discountPercent(selected.price, selected.compareAtPrice) : null;

  // Dynamic Image Switching when customer selects a colour variant
  function handleColourChange(newColour: string) {
    setColour(newColour);
    const newSizes = product.variants.filter((v) => v.colour === newColour);
    const firstAvailable = newSizes.find((s) => s.stockQuantity > 0)?.size || newSizes[0]?.size || "";
    setSize(firstAvailable);

    // Find image that corresponds to this colour variant
    const matchingVariant = product.variants.find((v) => v.colour === newColour);
    let matchedIndex = -1;

    if (matchingVariant) {
      matchedIndex = displayImages.findIndex((img) => img.variantId === matchingVariant.id);
    }

    if (matchedIndex === -1) {
      matchedIndex = displayImages.findIndex((img) =>
        img.altText?.toLowerCase().includes(newColour.toLowerCase())
      );
    }

    if (matchedIndex === -1 && colours.length > 1 && displayImages.length > 1) {
      const colourIdx = colours.indexOf(newColour);
      if (colourIdx >= 0 && colourIdx < displayImages.length) {
        matchedIndex = colourIdx;
      }
    }

    if (matchedIndex !== -1) {
      setActiveImage(matchedIndex);
    }
  }

  async function addToCart(redirectToCheckout = false) {
    if (!selected) {
      error("Selection required", "Please select a colour and size.");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selected.id, quantity }),
      });

      if (res.status === 401) {
        router.push(`/login?next=/products/${product.slug}`);
        return;
      }

      if (res.ok) {
        success("Added to Bag! 🛍️", `${product.name} (${colour}/${size})`);
        window.dispatchEvent(new CustomEvent("cart-updated"));
        if (redirectToCheckout) {
          router.push("/checkout");
        }
      } else {
        const data = await res.json();
        error("Error", data.error || "Could not add to cart.");
      }
    } catch {
      error("Network error", "Unable to reach server.");
    } finally {
      setAdding(false);
    }
  }

  async function addToWishlist() {
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: selected?.id }),
      });

      if (res.status === 401) {
        router.push(`/login?next=/products/${product.slug}`);
        return;
      }

      if (res.ok) {
        success("Saved to Wishlist! ❤️", product.name);
        window.dispatchEvent(new CustomEvent("wishlist-updated"));
      }
    } catch {
      error("Error", "Could not save to wishlist.");
    }
  }

  function handleCheckPincode(e: React.FormEvent) {
    e.preventDefault();
    if (/^\d{6}$/.test(pincode.trim())) {
      setPincodeStatus("✓ Express Delivery in 2-3 business days. Cash on Delivery eligible!");
    } else {
      setPincodeStatus("Please enter a valid 6-digit Indian PIN code.");
    }
  }

  // Social Share Handlers
  function copyShareLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      success("Link Copied!", "Product link copied to your clipboard.");
    }
  }

  function shareWhatsApp() {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(`Take a look at this ${product.name} on Fashion Cart: ${window.location.href}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  }

  function shareTelegram() {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(`Look at this ${product.name} on Fashion Cart`);
      window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, "_blank");
    }
  }

  function shareTwitter() {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(`Just found this ${product.name} on Fashion Cart!`);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, "_blank");
    }
  }

  function shareFacebook() {
    if (typeof window !== "undefined") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
    }
  }

  return (
    <div className="space-y-12">
      {/* 2-Column Product Layout */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
        
        {/* Left Column: Image Gallery + Trust Badges (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <div
            onClick={() => setLightboxOpen(true)}
            onMouseEnter={() => setIsHoverZooming(true)}
            onMouseLeave={() => setIsHoverZooming(false)}
            onMouseMove={handleImageHoverMove}
            className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-[#E7DFD5] bg-[#F4EFEA] group shadow-sm cursor-zoom-in transition-all duration-300 hover:shadow-2xl"
            title="Click or tap to open Fullscreen HD Studio View"
          >
            {displayImages[activeImage] ? (
              <div
                key={activeImage}
                className="relative h-full w-full animate-in fade-in zoom-in-98 duration-200"
              >
                <Image
                  src={displayImages[activeImage].imageUrl}
                  alt={displayImages[activeImage].altText ?? product.name}
                  fill
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  style={{
                    transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                    transform: isHoverZooming ? "scale(2)" : "scale(1)",
                    transition: isHoverZooming ? "transform 0.08s ease-out" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No image available
              </div>
            )}

            {/* In-Gallery Left Navigation Paddle */}
            {displayImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage((prev) => (prev - 1 + displayImages.length) % displayImages.length);
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/85 hover:bg-black hover:text-white text-slate-800 border border-slate-200 shadow-md flex items-center justify-center text-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer"
                title="Previous look"
              >
                ‹
              </button>
            )}

            {/* In-Gallery Right Navigation Paddle */}
            {displayImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage((prev) => (prev + 1) % displayImages.length);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/85 hover:bg-black hover:text-white text-slate-800 border border-slate-200 shadow-md flex items-center justify-center text-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer"
                title="Next look"
              >
                ›
              </button>
            )}

            {/* Floating High-Definition Zoom Indicator Badge */}
            <div className="absolute bottom-3 right-3 z-10 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#141416]/85 backdrop-blur-md text-white border border-white/20 shadow-md">
                <span>✨</span> Fullscreen HD Lookbook
              </span>
            </div>

            {pct && (
              <div className="absolute top-3 left-3 z-10">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-[#C59B27] text-white shadow-md">
                  {pct}% OFF
                </span>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                addToWishlist();
              }}
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/90 border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:text-rose-600 hover:scale-110 transition-all cursor-pointer"
              title="Save to Wishlist"
            >
              ❤️
            </button>
          </div>

          {/* Thumbnails row */}
          {displayImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar pt-1">
              {displayImages.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={() => setActiveImage(i)}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                    i === activeImage
                      ? "border-[#C59B27] ring-4 ring-[#C59B27]/30 scale-105 shadow-md opacity-100"
                      : "border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400 hover:scale-102"
                  }`}
                  aria-label={`View look ${i + 1}`}
                >
                  <Image src={img.imageUrl} alt="" fill className="object-cover" />
                  {i === activeImage && (
                    <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-[#C59B27] ring-1 ring-white" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Value Assurance Badges under image */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-base">🚚</span>
              <p className="font-bold text-[11px] text-slate-800 mt-0.5">Free Express</p>
              <p className="text-[9px] text-slate-500">Above ₹499</p>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-base">🔄</span>
              <p className="font-bold text-[11px] text-slate-800 mt-0.5">7-Day Return</p>
              <p className="text-[9px] text-slate-500">Doorstep pickup</p>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-base">🛡️</span>
              <p className="font-bold text-[11px] text-slate-800 mt-0.5">100% Genuine</p>
              <p className="text-[9px] text-slate-500">Quality certified</p>
            </div>
          </div>
        </div>

        {/* Right Column: Complete Specifications, Options & Actions (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Header Info */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                {product.brand || "Fashion Cart Studio"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                ✦ FC Assured
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-snug text-slate-900 mt-1">
              {product.name}
            </h1>

            {/* Rating and Social Proof */}
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span>{Number(product.averageRating || 4.8).toFixed(1)}</span>
                <span>★</span>
              </span>
              <span className="text-slate-500">· {product.totalReviews || 28} Customer Reviews</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-semibold">96% Recommend this</span>
            </div>

            {/* Price & Discounts */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900">
                {formatINR(selected?.price ?? 0)}
              </span>
              {selected?.compareAtPrice && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    {formatINR(selected.compareAtPrice)}
                  </span>
                  {pct && (
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {pct}% OFF
                    </span>
                  )}
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Inclusive of all taxes · Free shipping on this item</p>
          </div>

          {/* Social Proof Live Viewers */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-medium">
            <span className="text-sm pulse-dot">🔥</span>
            <span>
              <strong>Popular Choice:</strong> 14 shoppers are viewing this outfit right now
            </span>
          </div>

          {/* Colour Selection */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Colour: <span className="font-bold text-slate-900">{colour}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {colours.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColourChange(c)}
                  className={`rounded-2xl border px-4 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    c === colour
                      ? "border-[#141416] bg-[#141416] text-white shadow-md scale-105"
                      : "border-[#E7DFD5] bg-white text-[#141416] hover:border-[#C59B27]"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${c === colour ? "bg-[#C59B27]" : "bg-[#C59B27]/60"}`} />
                  <span>{c}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection & Size Guide */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
              <span>Size: <span className="font-bold text-slate-900">{size}</span></span>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="text-amber-700 hover:underline font-bold flex items-center gap-1 normal-case text-xs"
              >
                📏 Size Chart &amp; Fit Guide
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizesForColour.map((v) => (
                <button
                  key={v.id}
                  disabled={v.stockQuantity === 0}
                  onClick={() => setSize(v.size)}
                  className={`rounded-xl border px-4 py-2 text-xs font-semibold disabled:opacity-30 disabled:line-through transition-all ${
                    v.size === size
                      ? "border-slate-900 bg-slate-900 text-white font-bold shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Availability */}
          <div className="text-xs font-medium">
            {selected ? (
              selected.stockQuantity > 0 ? (
                <span className="text-emerald-700 flex items-center gap-1.5 font-bold">
                  <span>✓</span> In Stock {selected.stockQuantity <= 5 ? `— Only ${selected.stockQuantity} pieces left!` : "(Ready to dispatch)"}
                </span>
              ) : (
                <span className="text-rose-600 font-bold">✕ Sold Out in this combination</span>
              )
            ) : (
              <span className="text-slate-400">Please select colour and size</span>
            )}
          </div>

          {/* Quantity & CTA Buttons */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase text-slate-500">Quantity</span>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden text-sm bg-white">
                <button
                  className="px-3 py-1 font-bold hover:bg-slate-100 text-slate-700"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-slate-900">{quantity}</span>
                <button
                  className="px-3 py-1 font-bold hover:bg-slate-100 text-slate-700"
                  onClick={() => setQuantity((q) => Math.min(selected?.stockQuantity ?? 1, q + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {selected && cartVariantIds.includes(selected.id) ? (
                <button
                  type="button"
                  onClick={() => router.push("/cart")}
                  className="flex-1 rounded-full border border-[#0C3B2E] bg-[#0C3B2E] hover:bg-[#145241] text-white py-3.5 text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group animate-in fade-in"
                >
                  <span className="text-sm">🛍️</span>
                  <span>Go to Bag →</span>
                </button>
              ) : (
                <button
                  disabled={!selected || selected.stockQuantity === 0 || adding}
                  onClick={() => addToCart(false)}
                  className="flex-1 rounded-full border border-slate-300 bg-white text-slate-900 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all disabled:opacity-40 shadow-xs cursor-pointer"
                >
                  {adding ? "Adding to Bag…" : "Add to Bag"}
                </button>
              )}

              <button
                disabled={!selected || selected.stockQuantity === 0 || adding}
                onClick={() => addToCart(true)}
                className="flex-1 rounded-full py-3.5 text-xs font-bold uppercase tracking-wider shadow-md bg-slate-900 hover:bg-[#C59B27] text-white transition-colors disabled:opacity-40 cursor-pointer"
              >
                Buy Now →
              </button>
            </div>

            {/* Direct WhatsApp Concierge & Custom Sizing Inquiry */}
            <div className="pt-1">
              <WhatsAppConciergeButton
                productName={product.name}
                productPrice={Number(selected?.price || product.variants[0]?.price)}
                productSku={product.slug}
                customMessage={`Hi Fashion Cart Stylist, I am looking at "${product.name}" (${colour}/${size}) and would like assistance with sizing, fabric details, or custom order styling.`}
                className="w-full py-3 rounded-full border border-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366] text-[#141416] hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>💬</span>
                <span>Inquire &amp; Order on WhatsApp</span>
              </WhatsAppConciergeButton>
            </div>
          </div>

          {/* Social Share Bar with Dedicated Icons */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1.5">
              <span>↗</span> Share with Friends:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={shareWhatsApp}
                className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                title="Share on WhatsApp"
                aria-label="Share on WhatsApp"
              >
                <WhatsAppIcon />
              </button>
              <button
                onClick={shareTelegram}
                className="p-2 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                title="Share on Telegram"
                aria-label="Share on Telegram"
              >
                <TelegramIcon />
              </button>
              <button
                onClick={shareTwitter}
                className="p-2 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
                title="Share on X / Twitter"
                aria-label="Share on Twitter"
              >
                <XIcon />
              </button>
              <button
                onClick={shareFacebook}
                className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                title="Share on Facebook"
                aria-label="Share on Facebook"
              >
                <FacebookIcon />
              </button>
              <button
                onClick={copyShareLink}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-xs"
                title="Copy Direct Link"
              >
                <CopyIcon />
                <span>Copy Link</span>
              </button>
            </div>
          </div>

          {/* Delivery & Pincode Checker */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">🚚 Check Delivery Speed &amp; COD</p>
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter 6-digit PIN code"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-slate-900 text-slate-900"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Check
              </button>
            </form>
            {pincodeStatus && (
              <p className="text-xs font-medium text-emerald-700">
                {pincodeStatus}
              </p>
            )}
          </div>

          {/* Rich Product Specifications & Details Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                📋 Product Specifications &amp; Details
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">100% Quality Checked</span>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Brand / Line</span>
                <span className="font-semibold text-slate-800">{product.brand || "Fashion Cart Atelier"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Category</span>
                <span className="font-semibold text-slate-800">{product.categoryPath || product.department || "Women's Ethnic Wear"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Fabric</span>
                <span className="font-semibold text-slate-800">{product.fabric || "Premium Handloom Fabric"}</span>
              </div>
              {product.material && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Material</span>
                  <span className="font-semibold text-slate-800">{product.material}</span>
                </div>
              )}
              {product.pattern && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Pattern / Print</span>
                  <span className="font-semibold text-slate-800">{product.pattern}</span>
                </div>
              )}
              {product.fit && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Fit Type</span>
                  <span className="font-semibold text-slate-800">{product.fit}</span>
                </div>
              )}
              {product.occasion && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Occasion</span>
                  <span className="font-semibold text-slate-800">{product.occasion}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Colour Shade</span>
                <span className="font-semibold text-slate-800">{colour || "Classic"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Wash &amp; Care</span>
                <span className="font-semibold text-slate-800">Gentle Wash / Dry Clean</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Stock Status</span>
                <span className="font-semibold text-emerald-700">
                  {selected && selected.stockQuantity > 0 ? `In Stock (${selected.stockQuantity} Left)` : "Available in Stock"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Country of Origin</span>
                <span className="font-semibold text-slate-800">Crafted in India 🇮🇳</span>
              </div>
            </div>

            {/* Description Text */}
            {product.description && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-600 leading-relaxed space-y-1">
                <p className="font-bold text-slate-800">About the Garment:</p>
                <p className="whitespace-pre-line text-slate-700 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>

          {/* Collapsible Accordions for Policies */}
          <div className="border border-slate-200 rounded-2xl bg-white divide-y divide-slate-100 overflow-hidden shadow-xs">
            <button
              onClick={() => setOpenAccordion(openAccordion === "shipping" ? null : "shipping")}
              className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors text-left"
            >
              <span>🚚 Free Express Shipping &amp; Doorstep Delivery</span>
              <span>{openAccordion === "shipping" ? "−" : "+"}</span>
            </button>
            {openAccordion === "shipping" && (
              <div className="p-4 bg-slate-50/50 text-xs text-slate-600 space-y-1 leading-relaxed">
                <p>• Dispatched within 24 hours from our centralized fulfillment center.</p>
                <p>• Standard delivery timeframe: 2 to 4 business days across India.</p>
                <p>• Realtime SMS and WhatsApp tracking links provided upon courier dispatch.</p>
              </div>
            )}

            <button
              onClick={() => setOpenAccordion(openAccordion === "returns" ? null : "returns")}
              className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors text-left"
            >
              <span>🔄 7-Day Hassle-Free Exchange &amp; Returns</span>
              <span>{openAccordion === "returns" ? "−" : "+"}</span>
            </button>
            {openAccordion === "returns" && (
              <div className="p-4 bg-slate-50/50 text-xs text-slate-600 space-y-1 leading-relaxed">
                <p>• Unopened or undamaged garments are eligible for a 1-click doorstep exchange.</p>
                <p>• No questions asked refund to your original payment method or instant UPI.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Customer Reviews Section */}
      <ProductReviews
        productId={product.id}
        productName={product.name}
        initialAverage={product.averageRating || 4.8}
        initialCount={product.totalReviews || 24}
      />

      {/* Small Compact Mini Recently Viewed Rail */}
      <RecentlyViewed currentSlug={product.slug} />

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        category={product.brand || "Apparel"}
      />

      {/* High-Definition Image Lightbox Preview Modal */}
      <ProductImageLightbox
        isOpen={lightboxOpen}
        images={displayImages}
        initialIndex={activeImage}
        productName={product.name}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.45 0-2.87-.38-4.12-1.1l-.3-.17-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.44c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.18-.47-.3" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.99-1.74 6.66-2.88 8.01-3.44 3.81-1.58 4.6-1.86 5.12-1.87.11 0 .37.03.54.17.14.12.18.28.2.45-.01.07-.01.19-.04.37z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
