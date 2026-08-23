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

const SUB_EDITORIAL_PRESETS: Record<string, { image: string; tag: string; subtitle: string }> = {
  "women-sarees": {
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
    tag: "Mulberry Silk",
    subtitle: "Zari & Pure Banarasi Weaves",
  },
  "women-kurti": {
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    tag: "Artisanal Kurti",
    subtitle: "Hand-block & Embroidered",
  },
  "women-kurtis": {
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    tag: "Artisanal Kurti",
    subtitle: "Hand-block & Embroidered",
  },
  "women-embroidered-silk-kurtis": {
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
    tag: "Zardozi Craft",
    subtitle: "Intricate Silk Embroidery",
  },
  "women-velvet-silk-kurti-sets": {
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
    tag: "Micro-Velvet",
    subtitle: "Royal Festive Co-ords",
  },
  "women-dresses": {
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
    tag: "Gala Edit",
    subtitle: "Anarkalis & Flowing Gowns",
  },
  "women-anarkali-gala-gowns": {
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
    tag: "Royal Anarkali",
    subtitle: "Flared Floor-Length Cuts",
  },
  "women-kurta-sets": {
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
    tag: "Complete Set",
    subtitle: "Dupatta & Trousers Included",
  },
  "women-kurtas-tunics": {
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
    tag: "Everyday Luxury",
    subtitle: "Breathable Silks & Tunics",
  },

  // Men
  "men-shirts": {
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    tag: "French Linen",
    subtitle: "100% Certified Pure Linen",
  },
  "men-pure-french-linen-shirts": {
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    tag: "French Linen",
    subtitle: "Master Tailored Breathable Linen",
  },
  "men-mandarin": {
    image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80",
    tag: "Bandhgala Cut",
    subtitle: "Mandarin Collar Sartorial Edits",
  },
  "men-mandarin-collar-shirts": {
    image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80",
    tag: "Bandhgala Cut",
    subtitle: "Mandarin Collar Sartorial Edits",
  },
  "men-t-shirts": {
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    tag: "Supima Cotton",
    subtitle: "Luxury Heavyweight Polos & Tees",
  },
  "men-jeans": {
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
    tag: "Tailored Denim",
    subtitle: "Italian Chinos & Stretch Denim",
  },
  "men-stretch-denim-chinos": {
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
    tag: "Tailored Denim",
    subtitle: "Italian Chinos & Stretch Denim",
  },

  // Western
  "western-cocktail": {
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    tag: "Liquid Satin",
    subtitle: "Evening Silhouettes & Cocktail Gowns",
  },
  "western-cocktail-midi-dresses": {
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    tag: "Liquid Satin",
    subtitle: "Evening Silhouettes & Cocktail Gowns",
  },
  "western-tops": {
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
    tag: "Contemporary",
    subtitle: "Party Wear Blouses & Silk Tops",
  },
  "western-party-wear-silk-tops": {
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
    tag: "Contemporary",
    subtitle: "Party Wear Blouses & Silk Tops",
  },

  // Kids
  "kids-wear": {
    image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80",
    tag: "Junior Festive",
    subtitle: "Brocades & Fairy Tulle Sets",
  },
  "kids-cotton": {
    image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80",
    tag: "Organic Cotton",
    subtitle: "Gentle Pure Comfort Apparel",
  },
};

function getSubcategoryMeta(slug: string, customUrl?: string | null, parentName?: string) {
  const lower = slug.toLowerCase();
  for (const [key, meta] of Object.entries(SUB_EDITORIAL_PRESETS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return {
        image: (customUrl && customUrl.trim()) || meta.image,
        tag: meta.tag,
        subtitle: meta.subtitle,
      };
    }
  }
  return {
    image: (customUrl && customUrl.trim()) || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
    tag: parentName || "Haute Couture",
    subtitle: "Curated Luxury Edition",
  };
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
      {/* Header & Department Filter Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E7DFD5] pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#C59B27]">
            ✦ Curated Silhouettes
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
        {filteredSubcategories.map((sub, idx) => {
          const meta = getSubcategoryMeta(sub.slug, sub.imageUrl, sub.parentName);
          return (
            <Link
              key={sub.id}
              href={`/shop?category=${sub.slug}`}
              prefetch={true}
              className="group relative rounded-3xl overflow-hidden border border-[#E7DFD5] aspect-[4/5] flex flex-col justify-end p-6 bg-[#141416] shadow-md transition-all duration-400 hover:shadow-2xl hover:-translate-y-2 luxury-card-hover animate-luxury-up cursor-pointer"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <Image
                src={meta.image}
                alt={sub.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                unoptimized
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/95 via-[#141416]/40 to-transparent" />

              <div className="relative z-10 space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-[#141416] backdrop-blur-md shadow-xs">
                  {meta.tag}
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white leading-tight group-hover:text-[#C59B27] transition-colors">
                  {sub.name}
                </h3>
                <p className="text-xs text-white/80">{meta.subtitle}</p>
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
