"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type ProductImage = { id: string; imageUrl: string; sortOrder: number };

export default function ImageManager({ productId, images }: { productId: string; images: ProductImage[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sortOrder", String(images.length));

    const res = await fetch(`/api/admin/products/${productId}/images`, { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {images.map((img) => (
          <div key={img.id} className="relative aspect-square overflow-hidden rounded-md border border-line bg-ivory-deep">
            <Image src={img.imageUrl} alt="" fill className="object-cover" />
          </div>
        ))}
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-line text-xs text-ink-soft hover:border-marigold">
          {uploading ? "Uploading…" : "+ Add image"}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-fc-red">{error}</p>}
    </div>
  );
}
