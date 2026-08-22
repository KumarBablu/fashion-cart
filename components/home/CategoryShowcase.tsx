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

  // Flatten all subcategories across all departments for the Quick Access Ribbon
  const allSubcategories = departments.flatMap((dept) =>
    dept.subcategories.map((sub) => ({
      ...sub,
      departmentName: dept.name,
      departmentSlug: dept.slug,
      departmentIcon: dept.icon,
    }))
  );

  return (
    <div className="space-y-16">
      
      {/* 🏷️ 1. Section Header: Step-by-Step Discovery Journey */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C59B27]/40 bg-[#FBF4E2] text-xs font-extrabold uppercase tracking-widest text-[#8E6C0C] shadow-2xs">
          <span>✦ Curated Haute Couture Atelier</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#141416] leading-tight">
          Explore by Department &amp; Silhouette
        </h2>
        <p className="text-xs sm:text-base text-[#4B4E56] leading-relaxed">
          Select a luxury department, choose your preferred silhouette or textile, and explore masterfully tailored collections.
        </p>
      </div>

      {/* 👑 2. Interactive Department Hero Showcase */}
      <div className="space-y-6">
        {/* Department Switcher Tabs */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          {departments.map((dept) => {
            const isActive = activeSlug === dept.slug;
            return (
              <button
                key={dept.id}
                onClick={() => setActiveSlug(dept.slug)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 shadow-xs cursor-pointer ${
                  isActive
                    ? "bg-[#141416] text-[#C59B27] border-2 border-[#C59B27] shadow-lg scale-105"
                    : "bg-white text-[#141416] border border-[#E7DFD5] hover:bg-[#FAF8F5] hover:border-[#C59B27]"
                }`}
              >
                <span className="text-lg">{dept.icon}</span>
                <span className="font-display tracking-wide">{dept.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    isActive ? "bg-[#C59B27] text-[#141416]" : "bg-[#F4EFEA] text-[#787C87]"
                  }`}
                >
                  {dept.subcategories.length} Silhouettes
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Department Spotlight Banner & Interactive Subcategory Grid */}
        {activeDepartment && (
          <div className="relative rounded-3xl overflow-hidden border-2 border-[#C59B27]/40 bg-[#141416] text-white shadow-2xl p-6 sm:p-10 lg:p-12 transition-all">
            {/* Background Editorial Lookbook Image with Vignette */}
            <div className="absolute inset-0 opacity-30 mix-blend-luminosity pointer-events-none">
              <Image
                src={activeDepartment.bannerImage}
                alt={activeDepartment.name}
                fill
                unoptimized
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#141416] via-[#141416]/95 to-[#141416]/70 pointer-events-none" />

            <div className="relative z-10 space-y-8">
              {/* Department Header Details */}
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeDepartment.icon}</span>
                  <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-[#C59B27] text-[#141416] shadow-sm">
                    {activeDepartment.badge}
                  </span>
                </div>

                <h3 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                  {activeDepartment.name} Atelier
                </h3>

                <p className="text-xs sm:text-base text-[#E7DFD5]/90 leading-relaxed max-w-2xl">
                  {activeDepartment.tagline}
                </p>
              </div>

              {/* Subcategories Visual Grid */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-white/15 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#C59B27]">
                    ✦ Step 2: Choose Your Silhouette / Category
                  </h4>
                  <span className="text-[11px] text-white/70">
                    Click any card to open curated collection
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Primary Department Entry Card */}
                  <Link
                    href={`/shop?category=${activeDepartment.slug}`}
                    className="group p-5 rounded-2xl border-2 border-[#C59B27] bg-[#C59B27] text-[#141416] hover:bg-white hover:text-[#141416] hover:border-white transition-all duration-300 shadow-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-75">
                        Complete Department
                      </span>
                      <p className="text-base font-extrabold leading-tight mt-1">
                        All {activeDepartment.name} Outfits
                      </p>
                    </div>
                    <span className="text-xl font-bold group-hover:translate-x-1.5 transition-transform">
                      →
                    </span>
                  </Link>

                  {/* Individual Subcategory Cards */}
                  {activeDepartment.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/shop?category=${sub.slug}`}
                      className="group p-5 rounded-2xl border border-white/20 bg-white/10 hover:bg-white hover:text-[#141416] hover:border-white transition-all duration-300 shadow-md flex items-center justify-between backdrop-blur-md"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C59B27] group-hover:text-[#8E6C0C] block">
                          Silhouette
                        </span>
                        <p className="text-sm font-bold leading-snug truncate mt-1 text-white group-hover:text-[#141416]">
                          {sub.name}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-[#C59B27] group-hover:text-[#141416] group-hover:translate-x-1.5 transition-transform shrink-0">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-[#E7DFD5]/80">
                  <span>✓ 100% Certified Pure Fabrics</span>
                  <span>•</span>
                  <span>Free Express Doorstep Delivery</span>
                  <span>•</span>
                  <span>COD Available</span>
                </div>

                <Link
                  href={`/shop?category=${activeDepartment.slug}`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#C59B27] text-[#141416] hover:bg-white transition-all shadow-lg hover:scale-105"
                >
                  <span>Enter {activeDepartment.name} Boutique</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🥻 3. Full Visual Grid of All 4 Core Departments */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E7DFD5] pb-4">
          <div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#141416]">
              All Curated Fashion Departments
            </h3>
            <p className="text-xs text-[#787C87] mt-0.5">
              Instant access to every collection, silk weave, and tailored cut
            </p>
          </div>
          <Link
            href="/categories"
            className="text-xs font-bold uppercase tracking-wider text-[#C59B27] hover:underline"
          >
            Categories Directory →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="rounded-3xl border border-[#E7DFD5] bg-white overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Department Image & Badge */}
              <div className="relative aspect-[4/3] w-full bg-[#141416] overflow-hidden">
                <Image
                  src={dept.bannerImage}
                  alt={dept.name}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/90 via-[#141416]/30 to-transparent" />
                
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 text-[#141416] backdrop-blur-md shadow-xs">
                    {dept.icon} {dept.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#C59B27] text-white">
                    {dept.subcategories.length} Edits
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="font-display text-lg font-bold leading-tight">
                    {dept.name}
                  </h4>
                  <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                    {dept.tagline}
                  </p>
                </div>
              </div>

              {/* Subcategories List */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#787C87] block mb-2">
                    Popular Silhouettes:
                  </span>
                  {dept.subcategories.slice(0, 5).map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/shop?category=${sub.slug}`}
                      className="block p-2 rounded-xl text-xs font-semibold text-[#141416] hover:bg-[#FAF8F5] hover:text-[#C59B27] transition-colors border border-transparent hover:border-[#E7DFD5] flex items-center justify-between"
                    >
                      <span className="truncate">{sub.name}</span>
                      <span className="text-[#C59B27] font-bold">→</span>
                    </Link>
                  ))}
                  {dept.subcategories.length > 5 && (
                    <Link
                      href={`/shop?category=${dept.slug}`}
                      className="block text-center text-xs font-bold text-[#C59B27] hover:underline pt-1"
                    >
                      +{dept.subcategories.length - 5} more silhouettes
                    </Link>
                  )}
                </div>

                <Link
                  href={`/shop?category=${dept.slug}`}
                  className="w-full py-2.5 rounded-xl bg-[#141416] text-white text-center text-xs font-bold uppercase tracking-wider hover:bg-[#C59B27] hover:text-[#141416] transition-all shadow-xs block"
                >
                  Explore {dept.name} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🚀 4. Trending Silhouettes Quick Access Ribbon */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h3 className="font-display text-base sm:text-lg font-bold text-[#141416]">
              All Trending Silhouettes &amp; Categories
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#787C87]">
            Direct 1-Click Access
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {allSubcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/shop?category=${sub.slug}`}
              className="group px-3.5 py-2 rounded-xl border border-[#E7DFD5] bg-white hover:bg-[#141416] hover:text-white hover:border-[#141416] transition-all duration-200 shadow-2xs flex items-center gap-2 text-xs font-bold text-[#141416]"
            >
              <span>{sub.departmentIcon}</span>
              <span>{sub.name}</span>
              <span className="text-[10px] text-[#C59B27] group-hover:text-[#C59B27]">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
