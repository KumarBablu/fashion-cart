"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { formatINR, discountPercent } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "next/navigation";
import ProductImageLightbox from "./ProductImageLightbox";
import { normalizeImageUrl } from "@/lib/utils/imageUrl";

type Variant = {
  id: string;
  colour: string;
  size: string;
  price: number | string;
  compareAtPrice: number | string | null;
  stockQuantity: number;
};

type QuickViewProduct = {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  fabric?: string | null;
  description?: string | null;
  images: { id?: string; imageUrl: string; altText?: string | null; variantId?: string | null }[];
  variants: Variant[];
};

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
}: {
  product: QuickViewProduct | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { success, error } = useToast();

  const [colour, setColour] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImage, setActiveImage] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [cartVariantIds, setCartVariantIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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

  // Initialize selected colour & size when product loads
  if (product && !colour && product.variants.length > 0) {
    const defaultColor = product.variants[0].colour;
    setColour(defaultColor);
    const firstSize = product.variants.find((v) => v.colour === defaultColor)?.size || "";
    setSize(firstSize);
  }

  if (!isOpen || !mounted || !product) return null;

  const colours = Array.from(new Set(product.variants.map((v) => v.colour)));
  const sizesForColour = product.variants.filter((v) => v.colour === colour);
  const selectedVariant = product.variants.find((v) => v.colour === colour && v.size === size);

  const price = selectedVariant ? Number(selectedVariant.price) : Number(product.variants[0]?.price || 0);
  const compareAt = selectedVariant?.compareAtPrice ? Number(selectedVariant.compareAtPrice) : null;
  const pct = discountPercent(price, compareAt);

  const displayImages =
    product.images.length > 0
      ? product.images.map((img) => ({ ...img, imageUrl: normalizeImageUrl(img.imageUrl) }))
      : [{ imageUrl: "", altText: "" }];

  // Dynamic Image Switching on Colour selection
  function handleColourChange(c: string) {
    setColour(c);
    const matchingSizes = product?.variants.filter((v) => v.colour === c) || [];
    const firstAvailable = matchingSizes.find((s) => s.stockQuantity > 0)?.size || matchingSizes[0]?.size || "";
    setSize(firstAvailable);

    const matchingVariant = product?.variants.find((v) => v.colour === c);
    let matchedIndex = -1;

    if (matchingVariant && displayImages) {
      matchedIndex = displayImages.findIndex((img) => img.variantId === matchingVariant.id);
    }

    if (matchedIndex === -1 && displayImages) {
      matchedIndex = displayImages.findIndex((img) =>
        img.altText?.toLowerCase().includes(c.toLowerCase())
      );
    }

    if (matchedIndex === -1 && colours.length > 1 && displayImages.length > 1) {
      const colourIdx = colours.indexOf(c);
      if (colourIdx >= 0 && colourIdx < displayImages.length) {
        matchedIndex = colourIdx;
      }
    }

    if (matchedIndex !== -1) {
      setActiveImage(matchedIndex);
    }
  }

  async function handleAddToCart(goToCheckout = false) {
    if (!selectedVariant) {
      error("Variant Required", "Please select a color and size first.");
      return;
    }

    setAdding(true);
    const isJewel = (product as any)?.productId?.startsWith("FC-JW") || (product as any)?.department === "Jewellery" || (typeof window !== "undefined" && (window.location.pathname.startsWith("/jewellery") || window.location.search.includes("store=jewellery")));
    const currentStore = isJewel ? "jewellery" : "garments";
    try {
      const res = await fetch(`/api/cart?store=${currentStore}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selectedVariant.id, quantity, store: currentStore }),
      });

      if (res.status === 401) {
        router.push(`/login?next=/products/${product?.slug}`);
        return;
      }

      if (res.ok) {
        success("Added to Cart! 🛍️", `${product?.name} (${colour}/${size})`);
        window.dispatchEvent(new CustomEvent("cart-updated"));
        onClose();
        if (goToCheckout) {
          router.push(`/checkout${currentStore === "jewellery" ? "?store=jewellery" : ""}`);
        }
      } else {
        const data = await res.json();
        error("Could not add", data.error || "Please try again.");
      }
    } catch {
      error("Network Error", "Unable to connect to server.");
    } finally {
      setAdding(false);
    }
  }

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[99999] overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-transparent cursor-pointer"
        />

        {/* Modal Dialog */}
        <div
          className="relative w-full max-w-3xl rounded-3xl shadow-2xl border overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-auto bg-white text-[#141416] border-[#E7DFD5]"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-[#141416] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
            {/* Gallery Preview Canvas (Clickable to open HD preview) */}
            <div>
              <div
                onClick={() => setLightboxOpen(true)}
                className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#E7DFD5] group cursor-zoom-in shadow-xs"
                title="Click for full-screen High Definition Detail Preview"
              >
                {displayImages[activeImage] ? (
                  <Image
                    src={displayImages[activeImage].imageUrl}
                    alt={displayImages[activeImage].altText || product.name}
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[#787C87]">
                    No image
                  </div>
                )}
                {/* HD Zoom Badge Indicator */}
                <div className="absolute bottom-2.5 right-2.5 z-10">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#141416]/85 backdrop-blur-md text-white border border-white/20 shadow-md">
                    <span>✨</span> Lookbook View
                  </span>
                </div>
              </div>

              {/* Thumbnails if multiple images */}
              {displayImages.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {displayImages.map((img, i) => (
                    <button
                      key={img.id || i}
                      onClick={() => setActiveImage(i)}
                      className={`relative h-14 w-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        i === activeImage ? "border-[#141416] scale-105 shadow-xs" : "border-[#E7DFD5] opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image src={img.imageUrl} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info & Options */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                {product.brand && (
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C59B27]">
                    {product.brand}
                  </p>
                )}
                <h2 className="font-display text-xl font-bold mt-0.5 leading-snug text-[#141416]">{product.name}</h2>

                {/* Price Row */}
                <div className="mt-2.5 flex items-baseline gap-2.5">
                  <span className="text-2xl font-black text-[#141416]">{formatINR(price)}</span>
                  {compareAt && compareAt > price && (
                    <>
                      <span className="text-xs text-[#787C87] line-through">{formatINR(compareAt)}</span>
                      {pct && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FBF4E2] text-[#8E6C0C] border border-[#C59B27]/40">
                          {pct}% OFF
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Colour Selection with Dynamic Image Switch */}
                <div className="mt-4">
                  <p className="text-xs font-bold text-[#787C87] uppercase tracking-wider">
                    Colour: <span className="font-bold text-[#141416]">{colour}</span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {colours.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleColourChange(c)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          c === colour
                            ? "border-[#141416] bg-[#141416] text-white shadow-xs scale-105"
                            : "border-[#E7DFD5] bg-white text-[#141416] hover:border-[#C59B27]"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${c === colour ? "bg-[#C59B27]" : "bg-[#C59B27]/60"}`} />
                        <span>{c}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mt-3.5">
                  <p className="text-xs font-bold text-[#787C87] uppercase tracking-wider">
                    Size: <span className="font-bold text-[#141416]">{size}</span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {sizesForColour.map((v) => (
                      <button
                        key={v.id}
                        disabled={v.stockQuantity === 0}
                        onClick={() => setSize(v.size)}
                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:line-through transition-all cursor-pointer ${
                          v.size === size
                            ? "border-[#141416] bg-[#141416] text-white shadow-xs scale-105"
                            : "border-[#E7DFD5] bg-white text-[#141416] hover:border-[#C59B27]"
                        }`}
                      >
                        {v.size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Status */}
                <p className="mt-2.5 text-xs font-semibold">
                  {selectedVariant ? (
                    selectedVariant.stockQuantity > 0 ? (
                      <span className="text-emerald-700">
                        ✓ In Stock ({selectedVariant.stockQuantity} available)
                      </span>
                    ) : (
                      <span className="text-rose-600">✗ Sold Out in this size</span>
                    )
                  ) : null}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-[#E7DFD5]">
                <div className="flex gap-2">
                  {selectedVariant && cartVariantIds.includes(selectedVariant.id) ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push("/cart");
                      }}
                      className="flex-1 py-3 px-4 rounded-full text-xs font-black uppercase tracking-wider bg-[#0C3B2E] text-white hover:bg-[#145241] transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 animate-in fade-in"
                    >
                      <span>🛍️</span>
                      <span>Go to Bag →</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(false)}
                      disabled={adding || !selectedVariant || selectedVariant.stockQuantity === 0}
                      className="flex-1 py-3 px-4 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {adding ? "Adding…" : "Add to Bag 🛍️"}
                    </button>
                  )}

                  <button
                    onClick={() => handleAddToCart(true)}
                    disabled={adding || !selectedVariant || selectedVariant.stockQuantity === 0}
                    className="flex-1 py-3 px-4 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#C59B27] text-white hover:bg-[#B0881E] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    Buy Now ⚡
                  </button>
                </div>

                <Link
                  href={`/products/${product.slug}`}
                  onClick={onClose}
                  className="block text-center text-xs font-bold text-[#141416] hover:text-[#C59B27] hover:underline pt-1"
                >
                  View Full Product Details &amp; Size Guide →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox for Quick View Modal */}
      <ProductImageLightbox
        isOpen={lightboxOpen}
        images={displayImages}
        initialIndex={activeImage}
        productName={product.name}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );

  return createPortal(modalContent, document.body);
}
