"use client";

import { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";

export default function AdminStoreSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeStore, setActiveStore] = useState<string>("garments");

  useEffect(() => {
    // 1. Read from URL query param
    const fromUrl = searchParams.get("store");
    if (fromUrl) {
      setActiveStore(fromUrl);
      document.cookie = `fc_admin_store=${fromUrl}; path=/; max-age=31536000; SameSite=Lax`;
      sessionStorage.setItem("fc_admin_active_store", fromUrl);
      return;
    }

    // 2. Read from Cookie
    const match = document.cookie.match(/(?:^|;\s*)fc_admin_store=([^;]+)/);
    if (match && match[1]) {
      setActiveStore(match[1]);
      sessionStorage.setItem("fc_admin_active_store", match[1]);
    } else {
      const saved = sessionStorage.getItem("fc_admin_active_store") || "garments";
      setActiveStore(saved);
      document.cookie = `fc_admin_store=${saved}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [searchParams]);

  function handleStoreChange(newStore: string) {
    setActiveStore(newStore);
    document.cookie = `fc_admin_store=${newStore}; path=/; max-age=31536000; SameSite=Lax`;
    sessionStorage.setItem("fc_admin_active_store", newStore);
    
    // Hard navigate with query param so all Server Components and API routes immediately load from selected DB
    const params = new URLSearchParams(searchParams.toString());
    params.set("store", newStore);
    window.location.href = `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#787C87] hidden lg:inline">
        Active Store:
      </span>
      <div className="relative inline-flex items-center rounded-xl border border-[#E8E3D8] bg-[#FAF8F5] p-0.5 shadow-2xs">
        <button
          type="button"
          onClick={() => handleStoreChange("garments")}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeStore === "garments"
              ? "bg-[#141416] text-white shadow-xs"
              : "text-[#4B4E56] hover:text-[#141416] hover:bg-[#F2EFE8]"
          }`}
          title="Switch to Garments Database (Mumbai)"
        >
          <span>👗</span>
          <span>Garments</span>
        </button>

        <button
          type="button"
          onClick={() => handleStoreChange("jewellery")}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeStore === "jewellery"
              ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#061A14] shadow-xs font-extrabold"
              : "text-[#4B4E56] hover:text-[#061A14] hover:bg-[#F2EFE8]"
          }`}
          title="Switch to Jewellery Database (Sydney)"
        >
          <span>💍</span>
          <span>Jewellery</span>
        </button>
      </div>
    </div>
  );
}
