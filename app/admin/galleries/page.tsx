"use client";

import { useEffect, useMemo, useState } from "react";
import TagInput from "../../../components/admin/TagInput";

type ObjectId = string;

type IdolOption = {
  _id: string;
  name: string;
  stageName?: string;
  slug: string;
  profileImage?: string;
};

type GenreOption = {
  _id: string;
  name: string;
  slug: string;
  color?: string;
};

type Gallery = {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  coverPhoto?: string;
  isPublic: boolean;
  photoCount: number;
  tags?: string[];
  category?: string;
  photographer?: string;
  location?: string;
  dateTaken?: string;
  viewCount?: number;
  likeCount?: number;
  idol?: IdolOption | string | null;
  genre?: GenreOption | string | null;
  createdAt: string;
  updatedAt: string;
};

type GalleryForm = {
  title: string;
  description?: string;
  coverPhoto?: string;
  isPublic: boolean;
  tags: string[];
  category?: string;
  photographer?: string;
  location?: string;
  dateTaken?: string; // yyyy-MM-dd
  idol?: string | null;
  genre?: string | null;
};

type GalleryPayload = {
  title: string;
  description?: string;
  coverPhoto?: string;
  isPublic: boolean;
  tags: string[];
  category?: string;
  photographer?: string;
  location?: string;
  dateTaken?: Date;
  idol?: string | null;
  genre?: string | null;
};

export default function AdminGalleriesPage() {
  // Lists
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Taxonomies
  const [idols, setIdols] = useState<IdolOption[]>([]);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [idolFilter, setIdolFilter] = useState<string>("all");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // Sorting
  const [sortBy, setSortBy] = useState<
    "createdAt" | "updatedAt" | "title" | "photoCount"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Form
  const emptyForm: GalleryForm = {
    title: "",
    description: "",
    coverPhoto: "",
    isPublic: true,
    tags: [],
    category: "",
    photographer: "",
    location: "",
    dateTaken: "",
    idol: null,
    genre: null,
  };
  const [form, setForm] = useState<GalleryForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection (bulk)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Stats (optional, from API when includeStats=true)
  const [stats, setStats] = useState<null | {
    totalGalleries: number;
    publicCount: number;
    privateCount: number;
  }>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / limit)),
    [totalItems, limit],
  );

  // Load idols and genres
  useEffect(() => {
    const loadTaxonomies = async () => {
      setLoadingTaxonomies(true);
      try {
        const [idolsRes, genresRes] = await Promise.all([
          fetch(`/api/idols?limit=1000`),
          fetch(`/api/genres?limit=1000`),
        ]);
        const [idolsJson, genresJson] = await Promise.all([
          idolsRes.json(),
          genresRes.json(),
        ]);
        if (idolsJson?.success) setIdols(idolsJson.data || []);
        if (genresJson?.success) setGenres(genresJson.data || []);
      } catch (e) {
        console.error("Failed to load taxonomies", e);
      } finally {
        setLoadingTaxonomies(false);
      }
    };
    loadTaxonomies();
  }, []);

  // Load galleries
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("includePrivate", "true"); // show both public and private in admin
        params.set("includeStats", "true");
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);
        if (search.trim()) params.set("search", search.trim());
        if (idolFilter !== "all") params.set("idol", idolFilter);
        if (genreFilter !== "all") params.set("genre", genreFilter);
        if (categoryFilter !== "all") params.set("category", categoryFilter);

        const res = await fetch(`/api/galleries?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (json?.success) {
          setGalleries(json.data || []);
          setTotalItems(json.pagination?.totalItems || 0);
          setStats(json.stats || null);
        } else {
          setGalleries([]);
          setTotalItems(0);
          setStats(null);
        }
      } catch (e) {
        if ((e as any).name !== "AbortError") {
          console.error("Failed to load galleries", e);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [
    page,
    limit,
    search,
    idolFilter,
    genreFilter,
    categoryFilter,
    sortBy,
    sortOrder,
  ]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleEdit = (g: Gallery) => {
    setEditingId(g._id);
    setForm({
      title: g.title || "",
      description: g.description || "",
      coverPhoto: g.coverPhoto || "",
      isPublic: !!g.isPublic,
      tags: g.tags || [],
      category: g.category || "",
      photographer: g.photographer || "",
      location: g.location || "",
      dateTaken: g.dateTaken ? formatDateInput(g.dateTaken) : "",
      idol: (typeof g.idol === "string" ? g.idol : g.idol?._id) || null,
      genre: (typeof g.genre === "string" ? g.genre : g.genre?._id) || null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this gallery? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/galleries?ids=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json: {
        success?: boolean;
        error?: string;
        blockingGalleries?: {
          _id: string;
          title?: string;
          photoCount?: number;
        }[];
      } = await res.json();
      if (!json?.success) {
        if (json?.blockingGalleries?.length) {
          alert(
            `Cannot delete. Some galleries contain photos:\n` +
              json.blockingGalleries
                .map(
                  (b) => `- ${b.title || b._id} (${b.photoCount || 0} photos)`,
                )
                .join("\n"),
          );
        } else {
          alert(json?.error || "Failed to delete gallery");
        }
        return;
      }
      await refreshList();
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    } catch (e) {
      console.error("Delete failed", e);
      alert("Delete failed");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected gallery(ies)?`)) return;
    try {
      const ids = Array.from(selectedIds).join(",");
      const res = await fetch(`/api/galleries?ids=${encodeURIComponent(ids)}`, {
        method: "DELETE",
      });
      const json: {
        success?: boolean;
        error?: string;
        blockingGalleries?: {
          _id: string;
          title?: string;
          photoCount?: number;
        }[];
      } = await res.json();
      if (!json?.success) {
        if (json?.blockingGalleries?.length) {
          alert(
            `Cannot delete. Some galleries contain photos:\n` +
              json.blockingGalleries
                .map(
                  (b) => `- ${b.title || b._id} (${b.photoCount || 0} photos)`,
                )
                .join("\n"),
          );
        } else {
          alert(json?.error || "Failed to delete selected galleries");
        }
        return;
      }
      await refreshList();
      setSelectedIds(new Set());
    } catch (e) {
      console.error("Bulk delete failed", e);
      alert("Bulk delete failed");
    }
  };

  const refreshList = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(1));
      params.set("limit", String(limit));
      params.set("includePrivate", "true");
      params.set("includeStats", "true");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (search.trim()) params.set("search", search.trim());
      if (idolFilter !== "all") params.set("idol", idolFilter);
      if (genreFilter !== "all") params.set("genre", genreFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const res = await fetch(`/api/galleries?${params.toString()}`);
      const json = await res.json();
      if (json?.success) {
        setGalleries(json.data || []);
        setTotalItems(json.pagination?.totalItems || 0);
        setStats(json.stats || null);
        setPage(1);
      }
    } catch (e) {
      console.error("Failed to refresh galleries", e);
    }
  };

  const upsertGallery = async (payload: GalleryPayload) => {
    setIsSubmitting(true);
    try {
      let res: Response;
      if (editingId) {
        res = await fetch(
          `/api/galleries?id=${encodeURIComponent(editingId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
      } else {
        res = await fetch(`/api/galleries`, {
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
      return json.data as Gallery;
    } catch (e) {
      console.error("Save failed", e);
      alert("Save failed");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Title is required");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || "",
      coverPhoto: form.coverPhoto?.trim() || "",
      isPublic: !!form.isPublic,
      tags: (form.tags || []).map((t) => t.trim()).filter(Boolean),
      category: form.category?.trim() || "",
      photographer: form.photographer?.trim() || "",
      location: form.location?.trim() || "",
      dateTaken: form.dateTaken ? new Date(form.dateTaken) : undefined,
      idol: form.idol || undefined,
      genre: form.genre || undefined,
    };

    const saved = await upsertGallery(payload);
    if (!saved) return;

    resetForm();
    await refreshList();
    alert(editingId ? "Gallery updated" : "Gallery created");
  };

  // Helpers
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
      galleries.forEach((g) => n.add(g._id));
      return n;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString();
  };
  const formatDateInput = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${MM}-${dd}`;
  };

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    galleries.forEach((g) => {
      if (g.category) set.add(g.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [galleries]);

  const idolName = (idol?: IdolOption | string | null) => {
    if (!idol) return "—";
    if (typeof idol === "string") {
      const found = idols.find((i) => i._id === idol);
      return found ? found.stageName || found.name : "—";
    }
    return idol.stageName || idol.name || "—";
  };
  const genreName = (genre?: GenreOption | string | null) => {
    if (!genre) return "—";
    if (typeof genre === "string") {
      const found = genres.find((g) => g._id === genre);
      return found ? found.name : "—";
    }
    return genre.name || "—";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Galleries CMS</h1>
          <p className="mt-2 text-gray-600">
            Create, edit, and manage photo galleries (linked to idols and
            genres)
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
      <div className="bg-white rounded-lg shadow border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">
            {editingId ? "Edit Gallery" : "Create Gallery"}
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-600 hover:underline"
            >
              New gallery
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-6">
          {/* Title and cover */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Gallery title"
              />
              {!!form.title.trim() && (
                <div className="mt-1 text-xs text-gray-500">
                  Slug preview:{" "}
                  {form.title
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "")}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Public
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, isPublic: e.target.checked }))
                    }
                  />
                  <span>Visible to users</span>
                </label>
              </div>
            </div>
          </div>

          {/* Cover photo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cover Photo URL
            </label>
            <input
              type="url"
              value={form.coverPhoto || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, coverPhoto: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="https://..."
            />
            {form.coverPhoto ? (
              <img
                src={form.coverPhoto}
                alt="Cover"
                className="mt-2 w-64 h-36 object-cover rounded border"
              />
            ) : null}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="Short description"
            />
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                value={form.category || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="e.g. Gravure"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Photographer
              </label>
              <input
                type="text"
                value={form.photographer || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, photographer: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={form.location || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="City, Country"
              />
            </div>
          </div>

          {/* Date + Relations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date Taken
              </label>
              <input
                type="date"
                value={form.dateTaken || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dateTaken: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Idol
              </label>
              <select
                value={form.idol || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, idol: e.target.value || null }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">Unassigned</option>
                {loadingTaxonomies ? (
                  <option disabled>Loading...</option>
                ) : (
                  idols.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.stageName || i.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Genre
              </label>
              <select
                value={form.genre || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, genre: e.target.value || null }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">Unassigned</option>
                {loadingTaxonomies ? (
                  <option disabled>Loading...</option>
                ) : (
                  genres.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))
                )}
              </select>
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
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting || !form.title.trim()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : editingId
                  ? "Update Gallery"
                  : "Create Gallery"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search title/description/tags..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">Idol</label>
            <select
              value={idolFilter}
              onChange={(e) => {
                setIdolFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">All</option>
              {idols.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.stageName || i.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700">Genre</label>
            <select
              value={genreFilter}
              onChange={(e) => {
                setGenreFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">All</option>
              {genres.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">All</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="createdAt">Created At</option>
              <option value="updatedAt">Updated At</option>
              <option value="title">Title</option>
              <option value="photoCount">Photo Count</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700">Direction</label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as any);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              setSearch("");
              setIdolFilter("all");
              setGenreFilter("all");
              setCategoryFilter("all");
              setSortBy("createdAt");
              setSortOrder("desc");
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
        <div className="bg-white rounded-lg shadow border p-4 text-sm text-gray-700">
          <div className="flex gap-6">
            <div>Total: {stats.totalGalleries}</div>
            <div>Public: {stats.publicCount}</div>
            <div>Private: {stats.privateCount}</div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Galleries</div>
          <div className="text-sm text-gray-500">
            {loading ? "Loading..." : `${totalItems} total`}
          </div>
        </div>

        <div className="divide-y">
          {!loading && galleries.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No galleries found.
            </div>
          )}

          {galleries.map((g) => (
            <div key={g._id} className="px-4 py-3 flex items-start gap-4">
              <input
                type="checkbox"
                className="mt-2"
                checked={selectedIds.has(g._id)}
                onChange={() => toggleSelect(g._id)}
              />
              {g.coverPhoto ? (
                <img
                  src={g.coverPhoto}
                  alt={g.title}
                  className="w-28 h-18 object-cover rounded border"
                />
              ) : (
                <div className="w-28 h-18 rounded border bg-gray-50 grid place-items-center text-gray-400 text-xs">
                  No cover
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-medium truncate">{g.title}</div>
                  {!g.isPublic && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                      Private
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded border text-gray-600">
                    Photos {g.photoCount ?? 0}
                  </span>
                </div>

                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs text-gray-600">
                  <div>Idol: {idolName(g.idol as any)}</div>
                  <div>Genre: {genreName(g.genre as any)}</div>
                  <div>Category: {g.category || "—"}</div>
                  <div>Photographer: {g.photographer || "—"}</div>
                  <div>Location: {g.location || "—"}</div>
                  <div>
                    Date Taken:{" "}
                    {g.dateTaken ? formatDateInput(g.dateTaken) : "—"}
                  </div>
                </div>

                {!!g.tags?.length && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {g.tags!.slice(0, 8).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700"
                      >
                        #{t}
                      </span>
                    ))}
                    {(g.tags!.length || 0) > 8 && (
                      <span className="text-[10px] text-gray-500">
                        +{(g.tags!.length || 0) - 8}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-1 text-xs text-gray-500">
                  Created: {formatDate(g.createdAt)} • Updated:{" "}
                  {formatDate(g.updatedAt)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(g)}
                  className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(g._id)}
                  className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-50"
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
