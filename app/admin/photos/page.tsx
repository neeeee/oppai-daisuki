"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { UploadDropzone } from "../../lib/uploadthing";
import TagInput from "../../../components/admin/TagInput";
import logger from "@/lib/utils/logger";

type IdolOption = {
  _id: string;
  name: string;
  stageName?: string;
  slug: string;
  profileImage?: string;
};

type GalleryOption = {
  _id: string;
  title: string;
  slug: string;
};

type Photo = {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl: string;
  altText?: string;
  tags?: string[];
  category?: string;
  photographer?: string;
  location?: string;
  dateTaken?: string;
  resolution?: { width?: number; height?: number };
  fileSize?: number;
  isPublic: boolean;
  viewCount?: number;
  likeCount?: number;
  gallery?: GalleryOption | string | null;
  idol?: IdolOption | string | null;
  createdAt: string;
  updatedAt: string;
};

type PhotoForm = {
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl: string;
  altText?: string;
  tags: string[];
  category?: string;
  photographer?: string;
  location?: string;
  dateTaken?: string; // yyyy-MM-dd
  resolution?: { width?: number | ""; height?: number | "" };
  fileSize?: number | "";
  isPublic: boolean;
  gallery?: string | null;
  idol?: string | null;
};

export default function AdminPhotosPage() {
  // Lists
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Taxonomies
  const [idols, setIdols] = useState<IdolOption[]>([]);
  const [galleries, setGalleries] = useState<GalleryOption[]>([]);
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [idolFilter, setIdolFilter] = useState<string>("all");
  const [galleryFilter, setGalleryFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Sorting
  const [sortBy, setSortBy] = useState<"createdAt" | "viewCount" | "likeCount">(
    "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // Form
  const emptyForm: PhotoForm = {
    title: "",
    description: "",
    imageUrl: "",
    thumbnailUrl: "",
    altText: "",
    tags: [],
    category: "",
    photographer: "",
    location: "",
    dateTaken: "",
    resolution: { width: "", height: "" },
    fileSize: "",
    isPublic: true,
    gallery: null,
    idol: null,
  };
  const [form, setForm] = useState<PhotoForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Derived
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / limit)),
    [totalItems, limit],
  );

  // Load taxonomy
  useEffect(() => {
    const loadTaxonomies = async () => {
      setLoadingTaxonomies(true);
      try {
        const [idolsRes, galleriesRes] = await Promise.all([
          fetch(`/api/idols?limit=1000`),
          fetch(`/api/galleries?limit=1000&includePrivate=true`),
        ]);
        const [idolsJson, galleriesJson] = await Promise.all([
          idolsRes.json(),
          galleriesRes.json(),
        ]);
        if (idolsJson?.success) setIdols(idolsJson.data || []);
        if (galleriesJson?.success) setGalleries(galleriesJson.data || []);
      } catch (e) {
        logger.error("Failed to load taxonomies", e);
      } finally {
        setLoadingTaxonomies(false);
      }
    };
    loadTaxonomies();
  }, []);

  // Load photos
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
        if (search.trim()) params.set("search", search.trim());
        if (idolFilter !== "all") params.set("idol", idolFilter);
        if (galleryFilter !== "all") params.set("gallery", galleryFilter);
        if (categoryFilter !== "all") params.set("category", categoryFilter);

        const res = await fetch(`/api/photos?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (json?.success) {
          setPhotos(json.data || []);
          setTotalItems(json.pagination?.totalItems || 0);
        } else {
          setPhotos([]);
          setTotalItems(0);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          logger.error("Failed to load photos", e);
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
    galleryFilter,
    categoryFilter,
    sortBy,
    sortOrder,
  ]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setShowUploader(false);
  };

  const refreshList = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(1));
      params.set("limit", String(limit));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (search.trim()) params.set("search", search.trim());
      if (idolFilter !== "all") params.set("idol", idolFilter);
      if (galleryFilter !== "all") params.set("gallery", galleryFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await fetch(`/api/photos?${params.toString()}`);
      const json = await res.json();
      if (json?.success) {
        setPhotos(json.data || []);
        setTotalItems(json.pagination?.totalItems || 0);
        setPage(1);
      }
    } catch (e) {
      logger.error("Failed to refresh photos", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this photo? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/photos?ids=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Failed to delete photo");
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
    if (!confirm(`Delete ${selectedIds.size} selected photo(s)?`)) return;
    try {
      const ids = Array.from(selectedIds).join(",");
      const res = await fetch(`/api/photos?ids=${encodeURIComponent(ids)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Failed to delete selected photos");
        return;
      }
      await refreshList();
      setSelectedIds(new Set());
    } catch (e) {
      logger.error("Bulk delete failed", e);
      alert("Bulk delete failed");
    }
  };

  type PhotoPayload = {
    title: string;
    description?: string;
    imageUrl: string;
    thumbnailUrl: string;
    altText?: string;
    tags: string[];
    category?: string;
    photographer?: string;
    location?: string;
    dateTaken?: Date;
    resolution?: { width?: number; height?: number };
    fileSize?: number;
    isPublic: boolean;
    gallery?: string | null;
    idol?: string | null;
  };
  const upsertPhoto = async (payload: PhotoPayload) => {
    setIsSubmitting(true);
    try {
      // Only create is supported (no PUT endpoint exists for /api/photos in this project)
      const res = await fetch(`/api/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Save failed");
        return null;
      }
      return json.data as Photo;
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
    if (!form.imageUrl.trim()) {
      alert("Image URL is required");
      return;
    }
    if (!form.thumbnailUrl.trim()) {
      alert("Thumbnail URL is required");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || "",
      imageUrl: form.imageUrl.trim(),
      thumbnailUrl: form.thumbnailUrl.trim(),
      altText: form.altText?.trim() || "",
      tags: (form.tags || []).map((t) => t.trim()).filter(Boolean),
      category: form.category?.trim() || "",
      photographer: form.photographer?.trim() || "",
      location: form.location?.trim() || "",
      dateTaken: form.dateTaken ? new Date(form.dateTaken) : undefined,
      resolution: {
        width: form.resolution?.width
          ? Number(form.resolution.width)
          : undefined,
        height: form.resolution?.height
          ? Number(form.resolution.height)
          : undefined,
      },
      fileSize: form.fileSize ? Number(form.fileSize) : undefined,
      isPublic: !!form.isPublic,
      gallery: form.gallery || undefined,
      idol: form.idol || undefined,
    };

    const saved = await upsertPhoto(payload);
    if (!saved) return;

    resetForm();
    await refreshList();
    alert("Photo created");
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
      photos.forEach((p) => n.add(p._id));
      return n;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const idolName = (idol?: IdolOption | string | null) => {
    if (!idol) return "—";
    if (typeof idol === "string") {
      const found = idols.find((i) => i._id === idol);
      return found ? found.stageName || found.name : "—";
    }
    return idol.stageName || idol.name || "—";
  };

  const galleryTitle = (g?: GalleryOption | string | null) => {
    if (!g) return "—";
    if (typeof g === "string") {
      const found = galleries.find((x) => x._id === g);
      return found ? found.title : "—";
    }
    return g.title || "—";
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [photos]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Photos CMS</h1>
          <p className="mt-2 text-gray-600">
            Create and manage photos. You can upload images to get URLs or paste
            your own.
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
          <div className="font-semibold">Create Photo</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Upload Mode:</span>
            <button
              type="button"
              onClick={() => setShowUploader((s) => !s)}
              className={`px-3 py-1.5 rounded ${
                showUploader
                  ? "bg-indigo-100 text-indigo-700"
                  : "hover:bg-gray-100"
              }`}
            >
              {showUploader ? "Manual Entry" : "File Upload"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-6">
          {/* Uploaders */}
          {showUploader && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Image Upload */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Upload Image
                </div>
                <UploadDropzone
                  endpoint="imageUploader"
                  onClientUploadComplete={(
                    res: Array<{ url: string }> | undefined,
                  ) => {
                    const first = res?.[0];
                    if (first) {
                      setForm((p) => ({ ...p, imageUrl: first.url }));
                    }
                  }}
                  onUploadError={(error: Error) => {
                    alert(`Image upload failed: ${error.message}`);
                  }}
                  appearance={{
                    container:
                      "border-2 border-dashed border-gray-300 rounded-lg p-6",
                    label: "text-gray-600",
                    allowedContent: "text-gray-500 text-sm",
                    button:
                      "bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-white text-sm font-medium transition-colors",
                  }}
                />
                {form.imageUrl && (
                  <div className="relative mt-3 w-64 h-40 rounded border overflow-hidden">
                    <Image
                      src={form.imageUrl}
                      alt="Uploaded image"
                      fill
                      className="object-cover"
                      sizes="256px"
                    />
                  </div>
                )}
              </div>

              {/* Thumbnail Upload */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Upload Thumbnail
                </div>
                <UploadDropzone
                  endpoint="imageUploader"
                  onClientUploadComplete={(
                    res: Array<{ url: string }> | undefined,
                  ) => {
                    const first = res?.[0];
                    if (first) {
                      setForm((p) => ({ ...p, thumbnailUrl: first.url }));
                    }
                  }}
                  onUploadError={(error: Error) => {
                    alert(`Thumbnail upload failed: ${error.message}`);
                  }}
                  appearance={{
                    container:
                      "border-2 border-dashed border-gray-300 rounded-lg p-6",
                    label: "text-gray-600",
                    allowedContent: "text-gray-500 text-sm",
                    button:
                      "bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm font-medium transition-colors",
                  }}
                />
                {form.thumbnailUrl && (
                  <div className="relative mt-3 w-40 h-28 rounded border overflow-hidden">
                    <Image
                      src={form.thumbnailUrl}
                      alt="Uploaded thumbnail"
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Required URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image URL
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, imageUrl: e.target.value }))
                }
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="https://..."
              />
              {form.imageUrl && (
                <div className="relative mt-2 w-48 h-32 rounded border overflow-hidden">
                  <Image
                    src={form.imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={form.thumbnailUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, thumbnailUrl: e.target.value }))
                }
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="https://..."
              />
              {form.thumbnailUrl && (
                <div className="relative mt-2 w-32 h-20 rounded border overflow-hidden">
                  <Image
                    src={form.thumbnailUrl}
                    alt="Thumb"
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Title and description */}
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
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Photo title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          {/* Meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Alt Text
              </label>
              <input
                type="text"
                value={form.altText || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, altText: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Accessible description"
              />
            </div>
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
                placeholder="e.g., Gravure"
              />
            </div>
            <div className="flex items-center">
              <label className="inline-flex items-center gap-2 text-sm mt-6">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isPublic: e.target.checked }))
                  }
                />
                <span>Public</span>
              </label>
            </div>
          </div>

          {/* People, places, dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          {/* Relations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Idol
              </label>
              <select
                value={form.idol || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, idol: e.target.value || null }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                Gallery
              </label>
              <select
                value={form.gallery || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, gallery: e.target.value || null }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {loadingTaxonomies ? (
                  <option disabled>Loading...</option>
                ) : (
                  galleries.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Technical */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Width (px)
              </label>
              <input
                type="number"
                value={form.resolution?.width ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    resolution: {
                      ...(p.resolution || {}),
                      width: e.target.value ? Number(e.target.value) : "",
                    },
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="e.g. 1920"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Height (px)
              </label>
              <input
                type="number"
                value={form.resolution?.height ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    resolution: {
                      ...(p.resolution || {}),
                      height: e.target.value ? Number(e.target.value) : "",
                    },
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="e.g. 1080"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                File Size (bytes)
              </label>
              <input
                type="number"
                value={form.fileSize ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    fileSize: e.target.value ? Number(e.target.value) : "",
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="e.g. 456789"
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
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !form.title.trim() ||
                !form.imageUrl.trim() ||
                !form.thumbnailUrl.trim()
              }
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Create Photo"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
            >
              Reset
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Note: The current listing API only returns public photos. If you
            create a non-public photo, it may not appear in the list below.
          </p>
        </form>
      </div>

      {/* Filters */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
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
              placeholder="Search title, description..."
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Idol
            </label>
            <select
              value={idolFilter}
              onChange={(e) => {
                setIdolFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Gallery
            </label>
            <select
              value={galleryFilter}
              onChange={(e) => {
                setGalleryFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All</option>
              {galleries.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.title}
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
                setSortBy(
                  e.target.value as "createdAt" | "viewCount" | "likeCount",
                );
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="createdAt">Created At</option>
              <option value="viewCount">View Count</option>
              <option value="likeCount">Like Count</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700">Direction</label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as "asc" | "desc");
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
              setGalleryFilter("all");
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

      {/* List */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Photos</div>
          <div className="text-sm text-gray-500">
            {loading ? "Loading..." : `${totalItems} total`}
          </div>
        </div>

        {/* Photo List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {!loading && photos.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No photos found.
            </div>
          )}

          {photos.map((p) => (
            <div key={p._id} className="px-4 py-3 flex items-start gap-4">
              <input
                type="checkbox"
                className="mt-2"
                checked={selectedIds.has(p._id)}
                onChange={() => toggleSelect(p._id)}
              />
              <img
                src={p.thumbnailUrl}
                alt={p.altText || p.title}
                className="w-28 h-18 object-cover rounded border"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-medium truncate">{p.title}</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border text-gray-600">
                    Views {p.viewCount ?? 0}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border text-gray-600">
                    Likes {p.likeCount ?? 0}
                  </span>
                </div>

                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs text-gray-600">
                  <div>
                    Idol: {idolName(p.idol as string | null | undefined)}
                  </div>
                  <div>
                    Gallery:{" "}
                    {galleryTitle(p.gallery as string | null | undefined)}
                  </div>
                  <div>Category: {p.category || "—"}</div>
                  <div>Photographer: {p.photographer || "—"}</div>
                  <div>Location: {p.location || "—"}</div>
                  <div>
                    Date Taken:{" "}
                    {p.dateTaken
                      ? new Date(p.dateTaken).toLocaleDateString()
                      : "—"}
                  </div>
                </div>

                {!!p.tags?.length && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.tags!.slice(0, 8).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                      >
                        #{t}
                      </span>
                    ))}
                    {(p.tags!.length || 0) > 8 && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        +{(p.tags!.length || 0) - 8}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-1 text-xs text-gray-500">
                  Created: {formatDate(p.createdAt)} • Updated:{" "}
                  {formatDate(p.updatedAt)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(p._id)}
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
