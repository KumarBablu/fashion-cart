"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const ANNOUNCEMENTS = [
  { text: "✨ USE CODE 'FIRST10' FOR 10% OFF ON YOUR FIRST ORDER!", link: "/shop" },
  { text: "🚚 FREE EXPRESS SHIPPING ON ALL ORDERS ABOVE ₹999", link: "/shop" },
  { text: "🔥 NEW FESTIVE DROP IS LIVE — EXPLORE THE EDIT", link: "/shop?sort=newest" },
  { text: "💳 INSTANT UPI & CASH ON DELIVERY (COD) AVAILABLE", link: "/shop" },
];

export default function AnnouncementBar() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const item = ANNOUNCEMENTS[current];

  return (
    <div
      className="py-2 px-3 sm:px-4 text-center text-xs font-semibold tracking-wider transition-colors duration-300 relative overflow-hidden w-full max-w-full"
      style={{
        backgroundColor: "var(--fc-primary)",
        color: "var(--fc-primary-fg)",
      }}
    >
      <Link
        href={item.link}
        className="inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity max-w-full"
      >
        <span className="truncate max-w-[70vw] sm:max-w-none text-[11px] sm:text-xs">
          {item.text}
        </span>
        <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest bg-black/20 px-2 py-0.5 rounded-full shrink-0">
          Shop Now →
        </span>
      </Link>
    </div>
  );
}
