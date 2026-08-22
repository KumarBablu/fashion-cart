"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type ProductImage = { id: string; imageUrl: string; sortOrder: number };

export default function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Link mode state
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [addingLink, setAddingLink] = useState(false);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sortOrder", String(images.length));

    try {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploading(false);

      if (!res.ok) {
        setError(data.error ?? "Failed to upload image file.");
        return;
      }

      setSuccessMsg("Image uploaded successfully!");
      router.refresh();
    } catch (err: any) {
      setUploading(false);
      setError(err.message || "Network error while uploading image.");
    }
  }

  async function handleAddUrlLink(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;

    setAddingLink(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageUrlInput.trim(),
          sortOrder: images.length,
        }),
      });

      const data = await res.json();
      setAddingLink(false);

      if (!res.ok) {
        setError(data.error ?? "Failed to add image link.");
        return;
      }

      setImageUrlInput("");
      setShowUrlInput(false);
      setSuccessMsg("Image link added successfully!");
      router.refresh();
    } catch (err: any) {
      setAddingLink(false);
      setError(err.message || "Network error while adding image link.");
    }
  }

  async function deleteImage(imageId: string) {
    if (!confirm("Are you sure you want to remove this photo?")) return;

    setDeletingId(imageId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/products/${productId}/images?imageId=${imageId}`, {
        method: "DELETE",
      });

      setDeletingId(null);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete image.");
        return;
      }

      setSuccessMsg("Image removed.");
      router.refresh();
    } catch (err: any) {
      setDeletingId(null);
      setError(err.message || "Network error while deleting image.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Existing Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
        {images.map((img, idx) => (
          <div
            key={img.id}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xs flex items-center justify-center"
          >
            <Image
              src={img.imageUrl}
              alt=""
              fill
              unoptimized
              className="object-cover transition-transform group-hover:scale-105"
            />

            {/* Primary Image Label */}
            {idx === 0 && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs">
                Primary
              </span>
            )}

            {/* Delete Overlay Button */}
            <button
              type="button"
              onClick={() => deleteImage(img.id)}
              disabled={deletingId === img.id}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-700 cursor-pointer"
              title="Delete photo"
            >
              {deletingId === img.id ? "…" : "✕"}
            </button>
          </div>
        ))}

        {/* 1. Upload File Button */}
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-400 transition-all p-3 text-center text-xs font-semibold text-slate-600">
          <span className="text-xl mb-1">📁</span>
          <span>{uploading ? "Uploading…" : "Upload File"}</span>
          <span className="text-[10px] font-normal text-slate-400 mt-0.5">JPG, PNG, WebP</span>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            disabled={uploading}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
            }}
          />
        </label>

        {/* 2. Add URL Link Button */}
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C59B27]/40 bg-[#FBF4E2]/40 hover:bg-[#FBF4E2] hover:border-[#C59B27] transition-all p-3 text-center text-xs font-semibold text-[#8E6C0C]"
        >
          <span className="text-xl mb-1">🔗</span>
          <span>Paste Link</span>
          <span className="text-[10px] font-normal text-[#8E6C0C]/70 mt-0.5">Web URL</span>
        </button>
      </div>

      {/* Direct URL Input Accordion */}
      {showUrlInput && (
        <form onSubmit={handleAddUrlLink} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>🔗</span>
              <span>Direct Image URL / Web Link:</span>
            </label>
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/... or https://your-cdn.com/image.jpg"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#C59B27] bg-white shadow-2xs"
            />
            <button
              type="submit"
              disabled={addingLink || !imageUrlInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#141416] hover:bg-[#25262B] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-xs cursor-pointer shrink-0"
            >
              {addingLink ? "Adding…" : "Add Image Link"}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Supports direct image links from Unsplash, Imgur, Supabase, Cloudinary, Dropbox, and Google Drive.
          </p>
        </form>
      )}

      {/* Status Messages */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
          ✅ {successMsg}
        </div>
      )}
    </div>
  );
}
