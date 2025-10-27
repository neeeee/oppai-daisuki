"use client";
import logger from "@/lib/utils/logger";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { UploadDropzone } from "@/lib/uploadthing";
import TagInput from "../../components/admin/TagInput";

type Genre = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  coverImage?: string;
  parentGenre?: { _id: string; name: string; slug: string } | null;
  subGenres?: { _id: string; name: string; slug: string }[];
  tags?: string[];
  isPublic: boolean;
  isAdult: boolean;
  sortOrder: number;
  contentCounts?: {
    photos?: number;
    videos?: number;
    galleries?: number;
    idols?: number;
    news?: number;
  };
  metadata?: {
    featured?: boolean;
    featuredUntil?: string;
    trending?: boolean;
    popularityScore?: number;
  };
  createdAt: string;
  updatedAt: string;
};

type GenreOption = { _id: string; name: string; slug: string; color?: string };

export default function AdminGenresPage() {
  useSession(); // layout controls access; keep to re-render on auth changes

  // Lists
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Pagination and sorting
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [sortBy, setSortBy] = useState<"sortOrder" | "createdAt" | "name">(
    "sortOrder",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filters
  const [search, setSearch] = useState("");
  const [parentFilter, setParentFilter] = useState<string>("all"); // "all" | "root" | parentId

  // Parent options for form and filtering
  const [parentOptions, setParentOptions] = useState<GenreOption[]>([]);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form state
  type FormShape = {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    coverImage?: string;
    parentGenre?: string | null;
    tags: string[];
    isPublic: boolean;
    isAdult: boolean;
    sortOrder: number;
    metadata: {
      featured: boolean;
      featuredUntil?: string;
      trending: boolean;
      popularityScore: number;
    };
  };
  type GenrePayload = {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    coverImage?: string;
    parentGenre?: string;
    tags: string[];
    isPublic: boolean;
    isAdult: boolean;
    sortOrder: number;
    metadata: {
      featured: boolean;
      featuredUntil?: Date;
      trending: boolean;
      popularityScore: number;
    };
  };
  const emptyForm: FormShape = {
    name: "",
    description: "",
    color: "#6366f1",
    icon: "",
    coverImage: "",
    parentGenre: null,
    tags: [],
    isPublic: true,
    isAdult: false,
    sortOrder: 0,
    metadata: {
      featured: false,
      featuredUntil: "",
      trending: false,
      popularityScore: 0,
    },
  };
  const [form, setForm] = useState<FormShape>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats (optional)
  const [stats, setStats] = useState<{
    totalGenres: number;
    featuredCount: number;
    trendingCount: number;
  } | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / limit)),
    [totalItems, limit],
  );

  // Load parent options for select
  useEffect(() => {
    const loadParents = async () => {
      try {
        const res = await fetch(
          `/api/genres?limit=1000&sortBy=name&sortOrder=asc`,
        );
        const json = await res.json();
        if (json?.success) {
          setParentOptions(json.data || []);
        }
      } catch (e) {
        logger.error("Failed to load genre parents", e);
      }
    };
    loadParents();
  }, []);

  // Load list
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);
        params.set("includeStats", "true");
        if (search.trim()) params.set("search", search.trim());
        if (parentFilter === "root") {
          params.set("parentGenre", "root");
        } else if (parentFilter !== "all") {
          params.set("parentGenre", parentFilter);
        }

        const res = await fetch(`/api/genres?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (json?.success) {
          setGenres(json.data || []);
          setTotalItems(json.pagination?.totalItems || 0);
          setStats(json.stats || null);
        } else {
          setGenres([]);
          setTotalItems(0);
          setStats(null);
        }
      } catch (e) {
        if ((e as { name?: string })?.name !== "AbortError") {
          logger.error("Failed to load genres", e);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [page, limit, search, parentFilter, sortBy, sortOrder]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleEdit = (g: Genre) => {
    setEditingId(g._id);
    setForm({
      name: g.name || "",
      description: g.description || "",
      color: g.color || "#6366f1",
      icon: g.icon || "",
      coverImage: g.coverImage || "",
      parentGenre: g.parentGenre?._id || null,
      tags: g.tags || [],
      isPublic: !!g.isPublic,
      isAdult: !!g.isAdult,
      sortOrder: g.sortOrder ?? 0,
      metadata: {
        featured: !!g.metadata?.featured,
        featuredUntil: g.metadata?.featuredUntil || "",
        trending: !!g.metadata?.trending,
        popularityScore: Number(g.metadata?.popularityScore || 0),
      },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this genre? You cannot undo this.")) return;
    try {
      const res = await fetch(`/api/genres?ids=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Failed to delete genre");
        return;
      }
      await refreshList();
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    } catch (e) {
      logger.error("Delete failed", e);
      alert("Delete failed");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected genre(s)?`)) return;
    try {
      const ids = Array.from(selectedIds).join(",");
      const res = await fetch(`/api/genres?ids=${encodeURIComponent(ids)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Failed to delete selected genres");
        return;
      }
      await refreshList();
      setSelectedIds(new Set());
    } catch (e) {
      logger.error("Bulk delete failed", e);
      alert("Bulk delete failed");
    }
  };

  const refreshList = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(1));
      params.set("limit", String(limit));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("includeStats", "true");
      if (search.trim()) params.set("search", search.trim());
      if (parentFilter === "root") params.set("parentGenre", "root");
      else if (parentFilter !== "all") params.set("parentGenre", parentFilter);

      const res = await fetch(`/api/genres?${params.toString()}`);
      const json = await res.json();
      if (json?.success) {
        setGenres(json.data || []);
        setTotalItems(json.pagination?.totalItems || 0);
        setStats(json.stats || null);
        setPage(1);
      }
    } catch (e) {
      logger.error("Failed to refresh genres", e);
    }
  };

  const upsertGenre = async (payload: GenrePayload) => {
    setIsSubmitting(true);
    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/genres?id=${encodeURIComponent(editingId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/genres`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Save failed");
        return null;
      }
      return json.data as Genre;
    } catch (e) {
      logger.error("Save failed", e);
      alert("Save failed");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Name is required");
      return;
    }

    // Prevent selecting itself as parent on edit
    if (editingId && form.parentGenre && form.parentGenre === editingId) {
      alert("A genre cannot be its own parent");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || "",
      color: form.color?.trim() || "#6366f1",
      icon: form.icon?.trim() || "",
      coverImage: form.coverImage?.trim() || "",
      parentGenre: form.parentGenre || undefined,
      tags: (form.tags || []).map((t) => t.trim()).filter(Boolean),
      isPublic: !!form.isPublic,
      isAdult: !!form.isAdult,
      sortOrder: Number(form.sortOrder || 0),
      metadata: {
        featured: !!form.metadata.featured,
        featuredUntil: form.metadata.featuredUntil
          ? new Date(form.metadata.featuredUntil)
          : undefined,
        trending: !!form.metadata.trending,
        popularityScore: Number(form.metadata.popularityScore || 0),
      },
    };

    const saved = await upsertGenre(payload);
    if (!saved) return;

    resetForm();
    await refreshList();
    alert(editingId ? "Genre updated" : "Genre created");
  };

  // Utilities
  const formatDateTimeLocal = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => `${n}`.padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAllOnPage = () => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      genres.forEach((g) => n.add(g._id));
      return n;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const parentLabel = (g: Genre) => g.parentGenre?.name || "—";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Genres CMS</h1>
          <p className="mt-2 text-gray-600">
            Create, edit, and manage video/photo/news genres
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Delete Selected ({selectedIds.size})
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 rounded-md border hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="font-semibold text-gray-900 dark:text-white">
            {editingId ? "Edit Genre" : "Create Genre"}
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-600 hover:underline"
            >
              New genre
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-6">
          {/* Basic fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Genre name"
              />
              {!!form.name.trim() && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Slug preview:{" "}
                  {form.name
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "")}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parent Genre
              </label>
              <select
                value={form.parentGenre || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    parentGenre: e.target.value || null,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">None (root)</option>
                {parentOptions
                  .filter((opt) => !editingId || opt._id !== editingId) // cannot parent to itself
                  .map((opt) => (
                    <option key={opt._id} value={opt._id}>
                      {opt.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Descriptions and visuals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Color
              </label>
              <input
                type="text"
                value={form.color || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, color: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="#6366f1"
              />
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: form.color || "#6366f1" }}
                  title={form.color || "#6366f1"}
                />
                <span className="text-xs text-gray-500">
                  {form.color || "#6366f1"}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Icon Image
              </label>
              {form.icon ? (
                <div className="mt-1">
                  <div className="relative w-10 h-10 rounded border mb-2 overflow-hidden">
                    <Image
                      src={form.icon}
                      alt="Icon preview"
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, icon: "" }))}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove icon
                  </button>
                </div>
              ) : (
                <div className="mt-1">
                  <UploadDropzone
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setForm((p) => ({
                          ...p,
                          icon: res[0].url,
                        }));
                      }
                    }}
                    onUploadError={(error: Error) => {
                      alert(`Icon upload failed: ${error.message}`);
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cover Image
              </label>
              {form.coverImage ? (
                <div className="mt-1">
                  <div className="relative w-32 h-16 rounded border mb-2 overflow-hidden">
                    <Image
                      src={form.coverImage}
                      alt="Cover image preview"
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, coverImage: "" }))}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove cover image
                  </button>
                </div>
              ) : (
                <div className="mt-1">
                  <UploadDropzone
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setForm((p) => ({
                          ...p,
                          coverImage: res[0].url,
                        }));
                      }
                    }}
                    onUploadError={(error: Error) => {
                      alert(`Cover image upload failed: ${error.message}`);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Flags and sorting */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isPublic: e.target.checked }))
                  }
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                />
                <span>Public</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isAdult}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isAdult: e.target.checked }))
                  }
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                />
                <span>Adult Content (18+)</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    sortOrder: Number(e.target.value) || 0,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.metadata.featured}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      metadata: { ...p.metadata, featured: e.target.checked },
                    }))
                  }
                />
                <span>Featured</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.metadata.trending}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      metadata: { ...p.metadata, trending: e.target.checked },
                    }))
                  }
                />
                <span>Trending</span>
              </label>
            </div>
          </div>

          {/* Featured until + popularity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Featured Until
              </label>
              <input
                type="datetime-local"
                value={formatDateTimeLocal(form.metadata.featuredUntil)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    metadata: {
                      ...p.metadata,
                      featuredUntil: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : "",
                    },
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Popularity Score
              </label>
              <input
                type="number"
                value={form.metadata.popularityScore}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    metadata: {
                      ...p.metadata,
                      popularityScore: Number(e.target.value || 0),
                    },
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>

          {/* Tags */}
          <TagInput
            tags={form.tags || []}
            onChange={(tags) => setForm((p) => ({ ...p, tags }))}
            label="Tags"
            placeholder="Enter tags..."
          />

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isSubmitting || !form.name.trim()}
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              {isSubmitting
                ? "Saving..."
                : editingId
                  ? "Update Genre"
                  : "Create Genre"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Name, description..."
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Parent Genre
            </label>
            <select
              value={parentFilter}
              onChange={(e) => {
                setParentFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Genres</option>
              <option value="top">Top Level Only</option>
              {parentOptions.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as "sortOrder" | "name" | "createdAt");
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="sortOrder">Sort Order</option>
              <option value="name">Name</option>
              <option value="createdAt">Created At</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as "asc" | "desc");
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              setSearch("");
              setParentFilter("all");
              setSortBy("sortOrder");
              setSortOrder("asc");
              setPage(1);
            }}
            className="px-4 py-2 rounded-md border hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={selectAllOnPage}
            className="px-4 py-2 rounded-md border hover:bg-gray-50"
          >
            Select All On Page
          </button>
          <button
            onClick={clearSelection}
            className="px-4 py-2 rounded-md border hover:bg-gray-50"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex gap-6">
            <div>Total: {stats.totalGenres}</div>
            <div>Featured: {stats.featuredCount}</div>
            <div>Trending: {stats.trendingCount}</div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="font-semibold text-gray-900 dark:text-white">
            Genres
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "Loading..." : `${totalItems} total`}
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {!loading && genres.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No genres found.
            </div>
          )}

          {genres.map((g) => {
            const counts = g.contentCounts || {};
            return (
              <div
                key={g._id}
                className="px-4 py-3 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(g._id)}
                  onChange={() => toggleSelect(g._id)}
                  className="mt-2"
                />
                <div
                  className="w-12 h-8 rounded border grid place-items-center"
                  title={g.color || "#6366f1"}
                >
                  <div
                    className="w-8 h-4 rounded"
                    style={{ backgroundColor: g.color || "#6366f1" }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium truncate">{g.name}</div>
                    {g.metadata?.featured && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                    {g.metadata?.trending && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                        Trending
                      </span>
                    )}
                    {!g.isPublic && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                        Private
                      </span>
                    )}
                    {g.isAdult && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                        18+
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded border text-gray-600">
                      Sort {g.sortOrder ?? 0}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    Parent: {parentLabel(g)}
                  </div>

                  {!!g.tags?.length && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {g.tags!.slice(0, 6).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700"
                        >
                          #{t}
                        </span>
                      ))}
                      {(g.tags!.length || 0) > 6 && (
                        <span className="text-[10px] text-gray-500">
                          +{(g.tags!.length || 0) - 6}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
                    <span className="px-2 py-0.5 rounded border">
                      Photos {counts.photos || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded border">
                      Videos {counts.videos || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded border">
                      Galleries {counts.galleries || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded border">
                      Idols {counts.idols || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded border">
                      News {counts.news || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(g)}
                    className="px-3 py-1.5 rounded bg-blue-600 dark:bg-blue-500 text-white text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(g._id)}
                    className="px-3 py-1.5 rounded bg-red-600 dark:bg-red-500 text-white text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm">
            <div className="text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
