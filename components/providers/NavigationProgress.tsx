"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Finish progress smoothly when navigation completes
    setProgress(100);
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    function startLoading() {
      setLoading(true);
      setProgress(30);
      const t1 = setTimeout(() => setProgress(70), 120);
      const t2 = setTimeout(() => setProgress(90), 300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a, button[data-instant-nav]");
      if (!target) return;

      if (target.tagName.toLowerCase() === "a") {
        const href = target.getAttribute("href");
        if (
          !href ||
          href.startsWith("#") ||
          href.startsWith("http") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          (target as HTMLAnchorElement).target === "_blank"
        ) {
          return;
        }

        // If clicking the current exact page, don't trigger
        if (href === window.location.pathname + window.location.search) {
          return;
        }
      }

      startLoading();
    }

    const handleCustomStart = () => startLoading();
    const handleCustomComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    };

    window.addEventListener("start-navigation-progress", handleCustomStart);
    window.addEventListener("complete-navigation-progress", handleCustomComplete);
    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      window.removeEventListener("start-navigation-progress", handleCustomStart);
      window.removeEventListener("complete-navigation-progress", handleCustomComplete);
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[3.5px] bg-transparent overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-[#C59B27] via-[#F3E5AB] to-[#D4AF37] relative transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          boxShadow: "0 0 16px rgba(212, 175, 55, 0.9), 0 0 6px rgba(243, 229, 171, 0.8)",
        }}
      >
        {/* Leading Sparkling Light Dot */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white blur-[1px] opacity-90 shadow-[0_0_8px_#FFFFFF]" />
      </div>
    </div>
  );
}
