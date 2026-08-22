"use client";

import { useEffect, useState } from "react";

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top of page"
      className="fixed bottom-5 left-5 z-40 h-10 w-10 rounded-full bg-[#141416]/90 hover:bg-[#141416] text-[#C59B27] border border-[#C59B27]/40 shadow-xl backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer animate-in fade-in"
      title="Back to Top"
    >
      <span className="text-base font-black leading-none">↑</span>
    </button>
  );
}
