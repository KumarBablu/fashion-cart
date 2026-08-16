"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatINR } from "@/lib/format";

type ViewedItem = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
};

export default function RecentlyViewed({ currentSlug }: { currentSlug?: string }) {
  const [items, setItems] = useState<ViewedItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fashion_cart_recent");
      if (stored) {
        const list: ViewedItem[] = JSON.parse(stored);
        setItems(list.filter((i) => i.slug !== currentSlug).slice(0, 6));
      }
    } catch {
      // ignore
    }
  }, [currentSlug]);

  if (items.length === 0) return null;

  return (
    <div className="border-t border-slate-200 pt-8 mt-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <span>🕒</span> Recently Viewed By You
        </h3>
        <span className="text-[11px] text-slate-400">Personalized for you</span>
      </div>

      {/* Small Compact Mini Cards Rail */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="group flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
          >
            {/* Small Compact Thumbnail */}
            <div className="relative w-12 h-14 shrink-0 rounded-lg overflow-hidden bg-slate-100">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="60px"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[8px] text-slate-400">
                  Photo
                </div>
              )}
            </div>

            {/* Compact Details */}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-900 truncate group-hover:text-amber-700 transition-colors">
                {item.name}
              </p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{formatINR(item.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
