"use client";
import Image from "next/image";
import logger from "@/lib/utils/logger";

import { useEffect, useMemo, useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing";
import TagInput from "../../components/admin/TagInput";

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
  photos: string[];
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
  photos: string[];
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
  photos?: string[];
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
    photos: [],
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
        logger.error("Failed to load taxonomies", e);
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
        if ((e as { name?: string })?.name !== "AbortError") {
          logger.error("Failed to load galleries", e);
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
    const photoUrls = Array.isArray(g.photos)
      ? (g.photos as (string | { imageUrl: string })[]).map((p) =>
          typeof p === "string" ? p : p.imageUrl
        )
      : [];
    setEditingId(g._id);
    setForm({
      title: g.title || "",
      description: g.description || "",
      coverPhoto: g.coverPhoto || "",
      photos: photoUrls,
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
      logger.error("Delete failed", e);
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
      logger.error("Bulk delete failed", e);
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
      logger.error("Failed to refresh galleries", e);
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
      logger.error("Save failed", e);
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

    const coverPhoto = form.coverPhoto?.trim();

    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || "",
      ...(coverPhoto && { coverPhoto }),
      photos: form.photos || [],
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Galleries CMS</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
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
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
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
            {editingId ? "Edit Gallery" : "Create Gallery"}
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline"
            >
              New gallery
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-6">
          {/* Title and cover */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Gallery title"
                />
                {editingId && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Gallery ID: <span className="font-mono">{editingId}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Public
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, isPublic: e.target.checked }))
                    }
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                  />
                  <span>Visible to users</span>
                </label>
              </div>
            </div>
          </div>

          {/* Cover photo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cover Photo
            </label>
            {form.coverPhoto ? (
              <div className="mt-1">
                <div className="relative w-64 h-36 rounded border border-gray-300 dark:border-gray-600 mb-2 overflow-hidden">
                  <Image
                    src={form.coverPhoto}
                    alt="Cover photo preview"
                    fill
                    className="object-cover"
                    sizes="256px"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, coverPhoto: "" }))}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Remove cover photo
                </button>
              </div>
            ) : (
              <div className="mt-1">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <div className="text-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      📸 Upload Cover Photo
                    </span>
                  </div>
                  <UploadDropzone
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setForm((p) => ({
                          ...p,
                          coverPhoto: res[0].ufsUrl,
                        }));
                        alert("✅ Cover photo uploaded successfully!");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      alert(`❌ Cover photo upload failed: ${error.message}`);
                    }}
                    appearance={{
                      button:
                        "ut-ready:bg-blue-500 ut-uploading:cursor-not-allowed bg-blue-500 bg-none after:bg-blue-400",
                      allowedContent: "text-gray-600 dark:text-gray-400",
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    This image will be displayed as the gallery cover on listing
                    pages
                  </p>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Photos in Album
            </label>

            <UploadDropzone
              endpoint="albumUploader"
              onClientUploadComplete={(files) => {
                const urls = files.map((f) => f.ufsUrl);
                setForm((p) => ({
                  ...p,
                  photos: [...(p.photos || []), ...urls],
                }));
                alert(`✅ ${urls.length} photos uploaded`);
              }}
              onUploadError={(err) => alert(`❌ Upload failed: ${err.message}`)}
              appearance={{
                button:
                  "bg-indigo-600 text-white hover:bg-indigo-700 ut-uploading:cursor-not-allowed",
                allowedContent: "text-gray-600 dark:text-gray-400",
              }}
            />

            {!!form.photos?.length && (
              <div className="mt-3 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {form.photos.map((url, idx) => (
                    <div
                      key={url}
                      className="relative w-full aspect-square border border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-gray-100 dark:bg-gray-700"
                    >
                      <Image
                        src={url}
                        alt="Photo"
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, 16vw"
                        loading={idx < 12 ? "eager" : "lazy"}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.parentElement?.classList.add("image-error");
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Description */}
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

          {/* Meta grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <input
                type="text"
                value={form.category || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="e.g., Portrait, Landscape"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Photographer
              </label>
              <input
                type="text"
                value={form.photographer || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, photographer: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Photographer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <input
                type="text"
                value={form.location || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Photo location"
              />
            </div>
          </div>

          {/* Date + Relations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date Taken
              </label>
              <input
                type="date"
                value={form.dateTaken || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dateTaken: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Idol (Optional)
              </label>
              <select
                value={form.idol || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, idol: e.target.value || null }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Genre
              </label>
              <select
                value={form.genre || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, genre: e.target.value || null }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isSubmitting || !form.title.trim()}
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors"
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
                className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search title/description/tags..."
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">Idol</label>
            <select
              value={idolFilter}
              onChange={(e) => {
                setIdolFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
            <label className="text-sm text-gray-700 dark:text-gray-300">Genre</label>
            <select
              value={genreFilter}
              onChange={(e) => {
                setGenreFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
            <label className="text-sm text-gray-700 dark:text-gray-300">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
            <label className="text-sm text-gray-700 dark:text-gray-300">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(
                  e.target.value as
                    | "createdAt"
                    | "updatedAt"
                    | "title"
                    | "photoCount",
                );
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="createdAt">Created At</option>
              <option value="updatedAt">Updated At</option>
              <option value="title">Title</option>
              <option value="photoCount">Photo Count</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">Direction</label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as "asc" | "desc");
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Reset
          </button>
          <button
            onClick={selectAllOnPage}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Select All On Page
          </button>
          <button
            onClick={clearSelection}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex gap-6">
            <div>Total: {stats.totalGalleries}</div>
            <div>Public: {stats.publicCount}</div>
            <div>Private: {stats.privateCount}</div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="font-semibold text-gray-900 dark:text-white">Galleries</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "Loading..." : `${totalItems} total`}
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {!loading && galleries.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No galleries found.
            </div>
          )}

          {galleries.map((g, idx) => (
            <div key={g._id} className="px-4 py-3 flex items-start gap-4">
              <input
                type="checkbox"
                className="mt-2"
                checked={selectedIds.has(g._id)}
                onChange={() => toggleSelect(g._id)}
              />
              {g.coverPhoto ? (
                <div className="relative w-28 h-18 rounded border border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={g.coverPhoto}
                    alt={g.title}
                    fill
                    className="object-cover"
                    sizes="112px"
                    loading={idx < 6 ? "eager" : "lazy"}
                  />
                </div>
              ) : (
                <div className="w-28 h-18 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 grid place-items-center text-gray-400 dark:text-gray-500 text-xs">
                  No cover
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-medium truncate text-gray-900 dark:text-white">{g.title}</div>
                  {!g.isPublic && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      Private
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                    Photos {g.photoCount ?? 0}
                  </span>
                </div>

                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div>Idol: {idolName(String(g.idol))}</div>
                  <div>Genre: {genreName(String(g.genre))}</div>
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
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        #{t}
                      </span>
                    ))}
                    {(g.tags!.length || 0) > 8 && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        +{(g.tags!.length || 0) - 8}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm">
            <div className="text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
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
