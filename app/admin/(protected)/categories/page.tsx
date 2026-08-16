"use client";

import { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  children?: Category[];
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories);
  }

  useEffect(() => {
    load();
  }, []);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, parentId: parentId || undefined }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setName("");
    setSlug("");
    setSlugTouched(false);
    setParentId("");
    load();
  }

  async function archive(id: string) {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    load();
  }

  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div>
      <h1 className="font-display text-2xl">Categories</h1>

      <div className="mt-6 space-y-4">
        {topLevel.map((cat) => (
          <div key={cat.id} className="rounded-lg border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{cat.name}</span>
              <button onClick={() => archive(cat.id)} className="text-xs text-fc-red hover:underline">Archive</button>
            </div>
            {(cat.children ?? []).length > 0 && (
              <ul className="mt-2 ml-4 space-y-1">
                {cat.children!.map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between text-sm text-ink-soft">
                    <span>— {sub.name}</span>
                    <button onClick={() => archive(sub.id)} className="text-xs text-fc-red hover:underline">Archive</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {topLevel.length === 0 && <p className="text-sm text-ink-soft">No categories yet.</p>}
      </div>

      <form onSubmit={addCategory} className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-4">
        <input
          required
          placeholder="Category name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className="rounded-md border border-line px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Slug"
          value={slug}
          onChange={(e) => {
            setSlug(slugify(e.target.value));
            setSlugTouched(true);
          }}
          className="rounded-md border border-line px-3 py-2 text-sm font-mono"
        />
        <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="rounded-md border border-line px-3 py-2 text-sm">
          <option value="">Top-level category</option>
          {topLevel.map((c) => (
            <option key={c.id} value={c.id}>Subcategory of {c.name}</option>
          ))}
        </select>
        <button disabled={saving} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Adding…" : "+ Add"}
        </button>
        {error && <p className="sm:col-span-4 text-sm text-fc-red">{error}</p>}
      </form>
    </div>
  );
}
