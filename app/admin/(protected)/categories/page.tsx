"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { products: number };
  children?: Category[];
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminCategoriesPage() {
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e) {
      console.error(e);
      toastError("Error", "Could not load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setSlugTouched(true);
    setParentId(cat.parentId || "");
    setSortOrder(cat.sortOrder || 0);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setParentId("");
    setSortOrder(0);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      slug: slug || slugify(name),
      parentId: parentId || null,
      sortOrder: Number(sortOrder) || 0,
    };

    try {
      const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok) {
        setError(data.error || "Failed to save category");
        return;
      }

      success(editingId ? "Category Updated" : "Category Created 🎉", `"${name}" saved successfully.`);
      resetForm();
      load();
    } catch {
      setSaving(false);
      setError("Network error while saving category");
    }
  }

  async function toggleActive(cat: Category) {
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      success("Status Updated", `"${cat.name}" is now ${!cat.isActive ? "Active" : "Hidden"}`);
      load();
    } catch {
      toastError("Error", "Could not update status.");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete/archive "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      success("Category Removed", `"${name}" archived successfully.`);
      load();
    } catch {
      toastError("Delete Failed", "Could not remove category.");
    }
  }

  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <span>🏷️</span> Categories &amp; Collections
          </h1>
          <p className="text-xs text-dim mt-0.5">
            Organize high-fashion apparel into curated collections, departments, and subcategories
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:brightness-110 cursor-pointer"
          style={{ backgroundColor: "var(--fc-primary)" }}
        >
          <span>+</span> Add New Category
        </button>
      </div>

      {/* Category List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topLevel.map((cat) => (
          <div
            key={cat.id}
            className="rounded-2xl border p-5 space-y-3 transition-all shadow-xs"
            style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm" style={{ color: "var(--fc-text)" }}>
                  {cat.name}
                </h3>
                <p className="text-[11px] font-mono text-primary">/{cat.slug}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(cat)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                    cat.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-neutral-100 text-neutral-500 border-neutral-300"
                  }`}
                >
                  {cat.isActive ? "● Active" : "○ Hidden"}
                </button>

                <button
                  onClick={() => startEdit(cat)}
                  className="p-1.5 rounded-lg border text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Edit category"
                  style={{ borderColor: "var(--fc-border)" }}
                >
                  ✏️
                </button>

                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-1.5 rounded-lg border text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                  title="Delete category"
                  style={{ borderColor: "var(--fc-border)" }}
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Subcategories list */}
            {(cat.children ?? []).length > 0 && (
              <div className="p-3 rounded-xl border space-y-1.5" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
                <p className="text-[10px] uppercase font-bold text-dim">Subcategories ({cat.children!.length}):</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.children!.map((sub) => (
                    <span
                      key={sub.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-white dark:bg-neutral-900 shadow-2xs"
                      style={{ borderColor: "var(--fc-border)" }}
                    >
                      <span>{sub.name}</span>
                      <button
                        onClick={() => startEdit(sub)}
                        className="text-[10px] text-amber-600 hover:underline"
                        title="Edit subcategory"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id, sub.name)}
                        className="text-[10px] text-rose-500 hover:underline"
                        title="Delete subcategory"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {topLevel.length === 0 && !loading && (
          <div className="col-span-2 p-12 text-center text-dim rounded-2xl border" style={{ borderColor: "var(--fc-border)" }}>
            <p className="text-3xl">🏷️</p>
            <p className="font-bold text-sm mt-2">No categories found.</p>
            <p className="text-xs">Create your first category using the form below.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Category Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border p-6 space-y-4 shadow-sm"
        style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--fc-border)" }}>
          <h3 className="font-display text-base font-bold text-primary">
            {editingId ? "✏️ Edit Category" : "✨ Create New Category or Subcategory"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-rose-500 hover:underline cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
              Category Name *
            </label>
            <input
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. Silk Sarees & Drapes"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
              style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
              Slug (URL Identifier) *
            </label>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              placeholder="e.g. silk-sarees"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-none focus:border-primary transition-all"
              style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
              Parent Category (Optional)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
              style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
            >
              <option value="">None (Top-Level Main Department)</option>
              {topLevel
                .filter((c) => c.id !== editingId)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    Under: {cat.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 font-semibold">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl border text-xs font-bold text-dim hover:text-primary transition-colors cursor-pointer"
              style={{ borderColor: "var(--fc-border)" }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            {saving ? "Saving…" : editingId ? "Update Category →" : "Create Category →"}
          </button>
        </div>
      </form>
    </div>
  );
}
