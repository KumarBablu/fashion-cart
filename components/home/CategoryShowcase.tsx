"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type DepartmentCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  tagline: string;
  bannerImage: string;
  badge: string;
  subcategories: {
    id: string;
    name: string;
    slug: string;
  }[];
};

export default function CategoryShowcase({
  departments,
}: {
  departments: DepartmentCategory[];
}) {
  const [activeSlug, setActiveSlug] = useState<string>(
    departments[0]?.slug || "women"
  );

  const activeDepartment =
    departments.find((d) => d.slug === activeSlug) || departments[0];

  if (!departments || departments.length === 0) return null;

  return (
    <div className="space-y-10">
      {/* 🏷️ Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7DFD5] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#C59B27]/40 bg-[#FBF4E2] text-[11px] font-extrabold uppercase tracking-wider text-[#8E6C0C] mb-2">
            <span>✦ Signature Fashion Departments</span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#141416]">
            Explore by Category &amp; Silhouette
          </h2>
          <p className="text-xs sm:text-sm text-[#787C87] mt-1 max-w-2xl">
            Discover masterfully curated departments. Select any collection below to browse tailored edits, certified pure fabrics, and latest seasonal arrivals.
          </p>
        </div>

        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#141416] hover:text-[#C59B27] transition-colors self-start sm:self-auto"
        >
          <span>All Departments Hub</span>
          <span>→</span>
        </Link>
      </div>

      {/* 👑 1. Department Switcher Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
        {departments.map((dept) => {
          const isActive = activeSlug === dept.slug;
          return (
            <button
              key={dept.id}
              onClick={() => setActiveSlug(dept.slug)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 whitespace-nowrap shadow-xs cursor-pointer ${
                isActive
                  ? "bg-[#141416] text-white shadow-md border border-[#C59B27]"
                  : "bg-white text-[#141416] border border-[#E7DFD5] hover:bg-[#F4EFEA] hover:border-[#C59B27]/50"
              }`}
            >
              <span className="text-base">{dept.icon}</span>
              <span className="font-display tracking-wide">{dept.name}</span>
            </button>
          );
        })}
      </div>

      {/* 🌟 2. Interactive Active Department Showcase Hero Card */}
      {activeDepartment && (
        <div className="relative rounded-3xl overflow-hidden border border-[#E7DFD5] bg-[#141416] text-white shadow-2xl p-6 sm:p-10 lg:p-12">
          {/* Editorial Background Image with Smooth Dark Vignette Overlay */}
          <div className="absolute inset-0 opacity-25 mix-blend-luminosity pointer-events-none">
            <Image
              src={activeDepartment.bannerImage}
              alt={activeDepartment.name}
              fill
              unoptimized
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#141416] via-[#141416]/95 to-[#141416]/60 pointer-events-none" />

          <div className="relative z-10 space-y-8">
            {/* Department Header Details */}
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeDepartment.icon}</span>
                <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#C59B27]/20 border border-[#C59B27]/40 text-[#C59B27]">
                  {activeDepartment.badge}
                </span>
              </div>

              <h3 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white">
                {activeDepartment.name} Collection
              </h3>

              <p className="text-xs sm:text-sm text-[#E7DFD5]/85 leading-relaxed max-w-2xl">
                {activeDepartment.tagline}
              </p>
            </div>

            {/* Subcategories Visual Discovery Grid */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#C59B27]">
                  Curated Subcategories in {activeDepartment.name}:
                </h4>
                <span className="text-[11px] text-[#E7DFD5]/60">
                  Click to explore curated listings
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* 1. All Department Styles Card */}
                <Link
                  href={`/shop?category=${activeDepartment.slug}`}
                  className="group p-4 rounded-2xl border border-[#C59B27]/60 bg-[#C59B27]/15 hover:bg-[#C59B27] text-white hover:text-[#141416] transition-all duration-300 shadow-md flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-80">
                      Full Department
                    </span>
                    <p className="text-sm font-bold leading-tight mt-0.5">
                      All {activeDepartment.name} Outfits
                    </p>
                  </div>
                  <span className="text-base font-bold group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </Link>

                {/* 2. Individual Subcategory Cards */}
                {activeDepartment.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/shop?category=${sub.slug}`}
                    className="group p-4 rounded-2xl border border-white/15 bg-white/10 hover:bg-white hover:text-[#141416] hover:border-white transition-all duration-300 shadow-sm flex items-center justify-between backdrop-blur-md"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#C59B27] group-hover:text-[#8E6C0C] block">
                        Subcategory
                      </span>
                      <p className="text-xs font-bold leading-snug truncate mt-0.5 text-white group-hover:text-[#141416]">
                        {sub.name}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#C59B27] group-hover:text-[#141416] group-hover:translate-x-1 transition-transform shrink-0">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#E7DFD5]/70">
                <span>✦ Guaranteed 100% Certified Pure Fabrics</span>
                <span>•</span>
                <span>Express Doorstep Delivery</span>
              </div>

              <Link
                href={`/shop?category=${activeDepartment.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-[#C59B27] text-white hover:bg-[#B0881E] transition-all shadow-md hover:scale-102"
              >
                <span>Enter Complete {activeDepartment.name} Boutique</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 📁 3. Visual Grid of All Other Departments */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#141416]">
            All Curated Departments &amp; Collections
          </h3>
          <span className="text-xs text-[#787C87]">
            Step-by-step apparel discovery
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="rounded-3xl border border-[#E7DFD5] bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{dept.icon}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F4EFEA] text-[#141416]">
                    {dept.subcategories.length} Silhouettes
                  </span>
                </div>

                <div>
                  <h4 className="font-display text-xl font-bold text-[#141416]">
                    {dept.name}
                  </h4>
                  <p className="text-xs text-[#787C87] mt-1 line-clamp-2">
                    {dept.tagline}
                  </p>
                </div>

                {/* Subcategory Pill Links */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {dept.subcategories.slice(0, 6).map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/shop?category=${sub.slug}`}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#FAF8F5] hover:bg-[#141416] hover:text-white border border-[#E7DFD5] text-[#4B4E56] transition-colors"
                    >
                      {sub.name}
                    </Link>
                  ))}
                  {dept.subcategories.length > 6 && (
                    <Link
                      href={`/shop?category=${dept.slug}`}
                      className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#C59B27] hover:underline"
                    >
                      +{dept.subcategories.length - 6} more
                    </Link>
                  )}
                </div>
              </div>

              <Link
                href={`/shop?category=${dept.slug}`}
                className="w-full py-2.5 rounded-xl border border-[#C59B27] text-center text-xs font-bold uppercase tracking-wider text-[#141416] hover:bg-[#141416] hover:text-white transition-all shadow-2xs block"
              >
                Browse {dept.name} Catalog →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
