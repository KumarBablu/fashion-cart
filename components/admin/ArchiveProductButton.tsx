"use client";

import { useRouter } from "next/navigation";

export default function ArchiveProductButton({ slug, archived }: { slug: string; archived: boolean }) {
  const router = useRouter();

  async function toggle() {
    if (archived) {
      await fetch(`/api/products/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
    } else {
      await fetch(`/api/products/${slug}`, { method: "DELETE" });
    }
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
        archived ? "bg-ink text-white" : "border border-fc-red text-fc-red hover:bg-fc-red hover:text-white"
      } transition-colors`}
    >
      {archived ? "Unarchive" : "Archive"}
    </button>
  );
}
