"use client";

import { useEffect, useState } from "react";

export default function ShopTemplate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Immediate mount to trigger smooth page entrance
    setMounted(true);
  }, []);

  return (
    <div
      className="transition-all duration-300 ease-out"
      style={{
        opacity: mounted ? 1 : 0.85,
        transform: mounted ? "translate3d(0, 0, 0)" : "translate3d(0, 8px, 0)",
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}
