"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR, discountPercent } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "next/navigation";

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
  const [adding, setAdding] = useState(false);

  // Initialize selected colour & size when product loads
  if (product && !colour && product.variants.length > 0) {
    const defaultColor = product.variants[0].colour;
    setColour(defaultColor);
    const firstSize = product.variants.find((v) => v.colour === defaultColor)?.size || "";
    setSize(firstSize);
  }

  if (!isOpen || !product) return null;

  const colours = Array.from(new Set(product.variants.map((v) => v.colour)));
  const sizesForColour = product.variants.filter((v) => v.colour === colour);
  const selectedVariant = product.variants.find((v) => v.colour === colour && v.size === size);

  const price = selectedVariant ? Number(selectedVariant.price) : Number(product.variants[0]?.price || 0);
  const compareAt = selectedVariant?.compareAtPrice ? Number(selectedVariant.compareAtPrice) : null;
  const pct = discountPercent(price, compareAt);

  const displayImages = product.images.length > 0 ? product.images : [{ imageUrl: "", altText: "" }];

  async function handleAddToCart(goToCheckout = false) {
    if (!selectedVariant) {
      error("Variant Required", "Please select a color and size first.");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selectedVariant.id, quantity }),
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
          router.push("/checkout");
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-3xl rounded-2xl shadow-2xl border overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-auto"
        style={{
          backgroundColor: "var(--fc-surface)",
          borderColor: "var(--fc-border)",
          color: "var(--fc-text)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-bold transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          {/* Gallery Preview */}
          <div>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-black/5 border" style={{ borderColor: "var(--fc-border)" }}>
              {displayImages[activeImage]?.imageUrl ? (
                <Image
                  src={displayImages[activeImage].imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs text-dim">
                  No image available
                </div>
              )}
            </div>

            {displayImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {displayImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative h-14 w-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      i === activeImage ? "border-primary scale-105" : "border-transparent opacity-70"
                    }`}
                  >
                    <Image src={img.imageUrl} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Options */}
          <div className="flex flex-col justify-between">
            <div>
              {product.brand && (
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  {product.brand}
                </p>
              )}
              <h2 className="font-display text-xl font-bold mt-1 leading-snug">{product.name}</h2>

              {/* Price Row */}
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl font-bold">{formatINR(price)}</span>
                {compareAt && (
                  <>
                    <span className="text-sm text-dim line-through">{formatINR(compareAt)}</span>
                    {pct && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--fc-badge-bg)", color: "var(--fc-badge-fg)" }}>
                        {pct}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Colour Selection */}
              <div className="mt-5">
                <p className="text-xs font-semibold text-dim uppercase tracking-wider">
                  Colour: <span className="font-bold text-primary">{colour}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colours.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setColour(c);
                        const firstAvail = product.variants.find((v) => v.colour === c);
                        setSize(firstAvail?.size || "");
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        c === colour ? "border-primary font-bold shadow-xs scale-105" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: c === colour ? "var(--fc-bg-subtle)" : "transparent",
                        borderColor: c === colour ? "var(--fc-primary)" : "var(--fc-border)",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="mt-4">
                <p className="text-xs font-semibold text-dim uppercase tracking-wider">
                  Size: <span className="font-bold text-primary">{size}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizesForColour.map((v) => (
                    <button
                      key={v.id}
                      disabled={v.stockQuantity === 0}
                      onClick={() => setSize(v.size)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:line-through transition-all ${
                        v.size === size ? "border-primary font-bold shadow-xs scale-105" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: v.size === size ? "var(--fc-bg-subtle)" : "transparent",
                        borderColor: v.size === size ? "var(--fc-primary)" : "var(--fc-border)",
                      }}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Status */}
              <p className="mt-3 text-xs font-medium">
                {selectedVariant ? (
                  selectedVariant.stockQuantity > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ✓ In Stock ({selectedVariant.stockQuantity} available)
                    </span>
                  ) : (
                    <span className="text-red-500 font-semibold">✕ Out of stock</span>
                  )
                ) : (
                  <span className="text-dim">Select colour & size</span>
                )}
              </p>

              {/* Quantity */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-semibold text-dim uppercase">Qty</span>
                <div className="flex items-center border rounded-lg overflow-hidden text-xs" style={{ borderColor: "var(--fc-border)" }}>
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 font-bold"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(selectedVariant?.stockQuantity || 1, q + 1))}
                    className="px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-6 space-y-2">
              <div className="flex gap-2">
                <button
                  disabled={!selectedVariant || selectedVariant.stockQuantity === 0 || adding}
                  onClick={() => handleAddToCart(false)}
                  className="flex-1 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: "var(--fc-border)" }}
                >
                  {adding ? "Adding…" : "Add to Cart"}
                </button>
                <button
                  disabled={!selectedVariant || selectedVariant.stockQuantity === 0 || adding}
                  onClick={() => handleAddToCart(true)}
                  className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-40 hover:brightness-105"
                  style={{
                    backgroundColor: "var(--fc-primary)",
                    color: "var(--fc-primary-fg)",
                  }}
                >
                  Buy Now →
                </button>
              </div>

              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="block text-center text-xs text-dim hover:text-primary transition-colors py-1"
              >
                View Full Product Details & Size Guide →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
