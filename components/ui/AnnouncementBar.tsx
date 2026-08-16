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
      className="py-2 px-4 text-center text-xs font-semibold tracking-wider transition-colors duration-300 relative overflow-hidden"
      style={{
        backgroundColor: "var(--fc-primary)",
        color: "var(--fc-primary-fg)",
      }}
    >
      <Link
        href={item.link}
        className="inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        <span className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          {item.text}
        </span>
        <span className="text-[10px] uppercase font-bold tracking-widest bg-black/20 px-2 py-0.5 rounded-full ml-1">
          Shop Now →
        </span>
      </Link>
    </div>
  );
}
