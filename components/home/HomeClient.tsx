"use client";

import { useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";

type SerializedProduct = {
  id: string;
  slug: string;
  name: string;
  createdAt: string | Date;
  brand?: string | null;
  averageRating: number;
  totalReviews: number;
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

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
};

export default function HomeClient({
  featured,
  newArrivals,
  bestSellers,
  onSale,
  categories,
}: {
  featured: SerializedProduct[];
  newArrivals: SerializedProduct[];
  bestSellers: SerializedProduct[];
  onSale: SerializedProduct[];
  categories: CategoryItem[];
}) {
  const [activeTab, setActiveTab] = useState<"featured" | "bestsellers" | "new" | "sale">("featured");

  const TABS = [
    { id: "featured", label: "✦ Atelier Highlights", count: featured.length, icon: "🌿" },
    { id: "bestsellers", label: "👑 Best Sellers", count: bestSellers.length, icon: "⭐" },
    { id: "new", label: "✨ New Season Drop", count: newArrivals.length, icon: "⚡" },
    { id: "sale", label: "🏷️ Super Deals", count: onSale.length, icon: "🎯" },
  ] as const;

  const currentProducts =
    activeTab === "featured"
      ? featured
      : activeTab === "bestsellers"
      ? bestSellers
      : activeTab === "new"
      ? newArrivals
      : onSale;

  return (
    <div className="space-y-8">
      {/* Interactive Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E3D8] pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#BB8A52]">Explore Catalog</span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0C3B2E] mt-0.5">
            Curated Collections
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#F2EFE8] border border-[#E8E3D8] overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-[#0C3B2E] text-white shadow-md font-extrabold"
                    : "text-[#0C3B2E] hover:bg-white/60"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? "bg-[#FFBA00] text-[#0C3B2E]" : "bg-white/80 text-[#5B7A6F]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div key={activeTab} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 animate-fade-in animate-slide-up">
        {currentProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center pt-4">
        <Link
          href={
            activeTab === "sale"
              ? "/shop?sort=discount"
              : activeTab === "new"
              ? "/shop?sort=newest"
              : activeTab === "bestsellers"
              ? "/shop?sort=rating"
              : "/shop"
          }
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-[#0C3B2E] border border-[#BB8A52] hover:bg-[#0C3B2E] hover:text-white transition-all duration-200 shadow-xs"
        >
          <span>Explore All {activeTab.toUpperCase()} Items ({currentProducts.length})</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
