"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";

export type SerializedProduct = {
  id: string;
  slug: string;
  name: string;
  createdAt: string | Date;
  brand?: string | null;
  fabric?: string | null;
  averageRating: number;
  totalReviews: number;
  categoryId: string;
  category?: { id: string; name: string; slug: string } | null;
  images: { imageUrl: string; altText?: string | null }[];
  variants: {
    id: string;
    colour: string;
    size: string;
    stockQuantity: number;
    price: number;
    compareAtPrice: number | null;
  }[];
};

export type CategoryCollection = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  tagline: string;
  bannerImage: string;
  subcategories: { id: string; name: string; slug: string; count: number }[];
  products: SerializedProduct[];
};

export default function HomeClient({
  categoryCollections,
}: {
  categoryCollections: CategoryCollection[];
}) {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>(
    categoryCollections[0]?.slug || "women"
  );
  const [activeSubcategorySlug, setActiveSubcategorySlug] = useState<string>("all");

  const currentCategory =
    categoryCollections.find((c) => c.slug === activeCategorySlug) ||
    categoryCollections[0];

  if (!currentCategory) return null;

  // Filter products by subcategory if selected
  const displayedProducts =
    activeSubcategorySlug === "all"
      ? currentCategory.products
      : currentCategory.products.filter(
          (p) => p.category?.slug === activeSubcategorySlug || p.categoryId === activeSubcategorySlug
        );

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E7DFD5] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#C59B27]/40 bg-[#FBF4E2] text-[11px] font-extrabold uppercase tracking-wider text-[#8E6C0C] mb-2">
            <span>✦ Department Hub</span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#141416]">
            Curated Collections
          </h2>
          <p className="text-xs sm:text-sm text-[#787C87] mt-1 max-w-xl">
            Select a category to explore master-tailored cuts, authentic silks, and seasonal edits.
          </p>
        </div>

        {/* Categories Hub Link */}
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#141416] hover:text-[#C59B27] transition-colors self-start md:self-auto"
        >
          <span>View All Categories Hub</span>
          <span>→</span>
        </Link>
      </div>

      {/* 👑 Category Department Navigation Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-2 pt-1">
        {categoryCollections.map((cat) => {
          const isActive = activeCategorySlug === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategorySlug(cat.slug);
                setActiveSubcategorySlug("all");
              }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 whitespace-nowrap shadow-xs cursor-pointer ${
                isActive
                  ? "bg-[#141416] text-white shadow-md scale-102 border border-[#C59B27]"
                  : "bg-white text-[#141416] border border-[#E7DFD5] hover:bg-[#F4EFEA] hover:border-[#C59B27]/50"
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="font-display tracking-wide">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* 🌟 Active Category Portal Showcase Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-[#E7DFD5] bg-[#141416] text-white p-6 sm:p-8 shadow-xl">
        {/* Background Atmosphere Image */}
        <div className="absolute inset-0 opacity-20 mix-blend-luminosity pointer-events-none">
          <Image
            src={currentCategory.bannerImage}
            alt={currentCategory.name}
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#141416] via-[#141416]/90 to-transparent" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentCategory.icon}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#C59B27]">
                Department Edit · Signature Collection
              </span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {currentCategory.name}
            </h3>
            <p className="text-xs sm:text-sm text-[#E7DFD5]/80 leading-relaxed">
              {currentCategory.tagline}
            </p>

            {/* Subcategory Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => setActiveSubcategorySlug("all")}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  activeSubcategorySlug === "all"
                    ? "bg-[#C59B27] text-white shadow-xs"
                    : "bg-white/10 text-[#E7DFD5] hover:bg-white/20"
                }`}
              >
                All {currentCategory.name}
              </button>
              {currentCategory.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubcategorySlug(sub.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                    activeSubcategorySlug === sub.slug
                      ? "bg-[#C59B27] text-white shadow-xs"
                      : "bg-white/10 text-[#E7DFD5] hover:bg-white/20"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>

          {/* Enter Category Portal Action */}
          <div className="shrink-0 pt-2 lg:pt-0">
            <Link
              href={`/shop?category=${currentCategory.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-[#C59B27] text-white hover:bg-[#B0881E] transition-all shadow-md hover:scale-102"
            >
              <span>Enter {currentCategory.name} Boutique</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 🛍️ Curated Products Grid for Selected Category */}
      {displayedProducts.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl bg-white border border-[#E7DFD5] space-y-3">
          <p className="text-3xl">👗</p>
          <h4 className="font-display text-base font-bold text-[#141416]">No items in this subcategory</h4>
          <p className="text-xs text-[#787C87]">Browse the full department collection above.</p>
          <button
            onClick={() => setActiveSubcategorySlug("all")}
            className="px-5 py-2 rounded-full text-xs font-bold bg-[#141416] text-white hover:bg-[#25262B]"
          >
            Show All {currentCategory.name}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6 animate-fade-in">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* 🚀 Category Footer CTA */}
      <div className="text-center pt-4 border-t border-[#E7DFD5]">
        <Link
          href={`/shop?category=${currentCategory.slug}`}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-extrabold text-xs uppercase tracking-wider text-[#141416] border border-[#C59B27] bg-white hover:bg-[#141416] hover:text-white transition-all duration-300 shadow-xs hover:shadow-md"
        >
          <span>Explore Complete {currentCategory.name} Collection</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
