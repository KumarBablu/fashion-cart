"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type SubcategoryCardItem = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  parentName: string;
  parentSlug: string;
  parentIcon?: string;
};

const SUB_EDITORIAL_PRESETS: Record<string, string> = {
  "women-sarees": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
  "women-kurtis": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
  "women-kurti": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
  "women-embroidered-silk-kurtis": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
  "women-dresses": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
  "women-kurta-sets": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
  "women-kurtas-tunics": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",

  "men-shirts": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
  "men-mandarin": "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80",
  "men-t-shirts": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
  "men-jeans": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",

  "western-cocktail": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
  "western-tops": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",

  "kids-wear": "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80",
  "kids-cotton": "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80",
};

function getSubcategoryImage(slug: string, customUrl?: string | null) {
  if (customUrl && customUrl.trim()) return customUrl.trim();
  const lower = slug.toLowerCase();
  for (const [key, url] of Object.entries(SUB_EDITORIAL_PRESETS)) {
    if (lower.includes(key) || key.includes(lower)) return url;
  }
  return "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80";
}

export default function SubcategoriesGrid({
  subcategories,
  departments,
}: {
  subcategories: SubcategoryCardItem[];
  departments: { id: string; name: string; slug: string; icon: string }[];
}) {
  const [selectedDeptSlug, setSelectedDeptSlug] = useState<string>("ALL");

  const filteredSubcategories =
    selectedDeptSlug === "ALL"
      ? subcategories
      : subcategories.filter((s) => s.parentSlug === selectedDeptSlug);

  return (
    <div className="space-y-6">
      {/* Header & Department Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#C59B27]">
            Curated Silhouettes
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#141416]">
            Explore Subcategories
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedDeptSlug("ALL")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap shadow-2xs ${
              selectedDeptSlug === "ALL"
                ? "bg-[#141416] text-white border border-[#141416]"
                : "bg-white text-[#141416] border border-[#E7DFD5] hover:bg-[#FAF8F5]"
            }`}
          >
            All Silhouettes
          </button>

          {departments.map((dept) => {
            const isActive = selectedDeptSlug === dept.slug;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptSlug(dept.slug)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap shadow-2xs flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#141416] text-white border border-[#141416]"
                    : "bg-white text-[#141416] border border-[#E7DFD5] hover:bg-[#FAF8F5]"
                }`}
              >
                <span>{dept.icon}</span>
                <span>{dept.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Subcategories Cards Grid (Matching Shop by Occasion layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredSubcategories.map((sub) => {
          const imgUrl = getSubcategoryImage(sub.slug, sub.imageUrl);
          return (
            <Link
              key={sub.id}
              href={`/shop?category=${sub.slug}`}
              className="group relative rounded-3xl overflow-hidden border border-[#E7DFD5] aspect-[4/5] flex flex-col justify-end p-6 bg-[#141416] shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            >
              <Image
                src={imgUrl}
                alt={sub.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                unoptimized
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/95 via-[#141416]/40 to-transparent" />

              <div className="relative z-10 space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-[#141416] backdrop-blur-md shadow-xs">
                  {sub.parentName}
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white leading-tight group-hover:text-[#C59B27] transition-colors">
                  {sub.name}
                </h3>
                <p className="text-xs text-white/80">Curated Haute Couture Look</p>
                <div className="pt-2 flex items-center gap-1 text-xs font-bold text-[#C59B27] group-hover:translate-x-1 transition-transform">
                  <span>Shop Collection</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
