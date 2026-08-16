"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };

type ExistingProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  brand: string | null;
  fabric: string | null;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({
  categories,
  existing,
}: {
  categories: Category[];
  existing?: ExistingProduct;
}) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!existing);
  const [description, setDescription] = useState(existing?.description ?? "");
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? categories[0]?.id ?? "");
  const [brand, setBrand] = useState(existing?.brand ?? "");
  const [fabric, setFabric] = useState(existing?.fabric ?? "");
  const [status, setStatus] = useState(existing?.status ?? "ACTIVE");
  const [isFeatured, setIsFeatured] = useState(existing?.isFeatured ?? false);
  const [isNewArrival, setIsNewArrival] = useState(existing?.isNewArrival ?? false);
  const [isBestSeller, setIsBestSeller] = useState(existing?.isBestSeller ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { name, slug, description, categoryId, brand, fabric, status, isFeatured, isNewArrival, isBestSeller };

    const res = existing
      ? await fetch(`/api/products/${existing.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save product.");
      return;
    }

    if (existing) {
      router.refresh();
    } else {
      router.push(`/admin/products/${data.product.id}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-line bg-white p-5">
      <Field label="Product name">
        <input
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className="w-full rounded-md border border-line px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Slug (URL)">
        <input
          required
          value={slug}
          onChange={(e) => {
            setSlug(slugify(e.target.value));
            setSlugTouched(true);
          }}
          className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono"
        />
      </Field>
      <Field label="Category">
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-md border border-line px-3 py-2 text-sm">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
        </Field>
        <Field label="Fabric">
          <input value={fabric} onChange={(e) => setFabric(e.target.value)} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
        </Field>
      </div>
      <Field label="Description">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
      </Field>
      <Field label="Status">
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-full rounded-md border border-line px-3 py-2 text-sm">
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </Field>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Featured</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} /> New arrival</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} /> Best seller</label>
      </div>

      {error && <p className="text-sm text-fc-red">{error}</p>}

      <button disabled={saving} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {saving ? "Saving…" : existing ? "Save changes" : "Save & continue"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
