"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

type Category = { id: string; name: string; slug: string; parentId: string | null };

export default function ShopFilters({
  categories,
  sizes,
  colours,
}: {
  categories: Category[];
  sizes: string[];
  colours: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const topLevel = categories.filter((c) => !c.parentId);
  const activeCategory = searchParams.get("category");
  const activeSize = searchParams.get("size");
  const activeColour = searchParams.get("colour");
  const activeSort = searchParams.get("sort") ?? "newest";

  return (
    <aside>
      <button
        className="lg:hidden mb-4 w-full rounded-full border border-line bg-white py-2 text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide filters" : "Filters & sort"}
      </button>

      <div className={`${open ? "block" : "hidden"} lg:block space-y-8`}>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Sort by</label>
          <select
            value={activeSort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popular">Popular</option>
            <option value="discount">Discount</option>
          </select>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Category</div>
          <div className="mt-2 space-y-1.5">
            <button
              onClick={() => updateParam("category", null)}
              className={`block text-sm ${!activeCategory ? "font-semibold text-marigold-deep" : "text-ink-soft"}`}
            >
              All
            </button>
            {topLevel.map((c) => (
              <button
                key={c.id}
                onClick={() => updateParam("category", c.slug)}
                className={`block text-sm ${activeCategory === c.slug ? "font-semibold text-marigold-deep" : "text-ink-soft"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {sizes.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Size</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => updateParam("size", activeSize === s ? null : s)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    activeSize === s ? "border-ink bg-ink text-white" : "border-line text-ink-soft"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {colours.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Colour</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {colours.map((c) => (
                <button
                  key={c}
                  onClick={() => updateParam("colour", activeColour === c ? null : c)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    activeColour === c ? "border-ink bg-ink text-white" : "border-line text-ink-soft"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={searchParams.get("inStock") === "true"}
              onChange={(e) => updateParam("inStock", e.target.checked ? "true" : null)}
            />
            In stock only
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={searchParams.get("onSale") === "true"}
              onChange={(e) => updateParam("onSale", e.target.checked ? "true" : null)}
            />
            On sale
          </label>
        </div>
      </div>
    </aside>
  );
}
