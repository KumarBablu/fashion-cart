"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

interface DownloadCsvButtonProps {
  type: "products" | "orders" | "customers" | "inventory" | "payments" | "coupons" | "reviews" | "template";
  label?: string;
  className?: string;
  icon?: string;
}

export default function DownloadCsvButton({
  type,
  label = "Export CSV",
  className = "",
  icon = "📥",
}: DownloadCsvButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const { success, error: toastError } = useToast();

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/export?type=${type}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename =
        type === "template"
          ? "fashion-cart-bulk-upload-template.csv"
          : `fashion-cart-${type}-${new Date().toISOString().split("T")[0]}.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      success("Download Complete 🎉", `Downloaded ${type === "template" ? "bulk upload template" : type} CSV successfully.`);
    } catch (err) {
      console.error(err);
      toastError("Download Failed", "Could not download CSV. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      title={type === "template" ? "Download sample CSV template for bulk product upload" : `Download all ${type} data as Excel CSV`}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm border ${
        downloading
          ? "opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-300"
          : "bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 hover:border-amber-500/50 hover:shadow-md"
      } ${className}`}
    >
      {downloading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Downloading…</span>
        </>
      ) : (
        <>
          <span>{icon}</span>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
