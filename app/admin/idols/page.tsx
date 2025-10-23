"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import TagInput from "../../../components/admin/TagInput";

type ObjectId = string;

type GenreOption = { _id: string; name: string; slug: string; color?: string };

type Idol = {
  _id: string;
  name: string;
  stageName?: string;
  slug: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  birthDate?: string;
  birthPlace?: string;
  height?: number;
  measurements?: {
    bust?: number;
    waist?: number;
    hips?: number;
    cupSize?: string;
  };
  bloodType?: string;
  zodiacSign?: string;
  hobbies?: string[];
  specialSkills?: string[];
  careerStart?: string;
  status: "active" | "retired" | "hiatus";
  agency?: string;
  socialMedia?: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
  genres?: ObjectId[];
  tags?: string[];
  isVerified: boolean;
  isPublic: boolean;
  viewCount?: number;
  favoriteCount?: number;
  photoCount?: number;
  videoCount?: number;
  galleryCount?: number;
  createdAt: string;
  updatedAt: string;
};

const STATUSES = ["active", "retired", "hiatus"] as const;

export default function AdminIdolsPage() {
  const { data: session } = useSession();

  // Lists
  const [idols, setIdols] = useState<Idol[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genreFilter, setGenreFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // Genres taxonomy
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);

  // Form state
  type FormShape = Omit<
    Idol,
    | "_id"
    | "slug"
    | "createdAt"
    | "updatedAt"
    | "viewCount"
    | "favoriteCount"
    | "photoCount"
    | "videoCount"
    | "galleryCount"
  > & { genres: ObjectId[]; tags: string[] };
  const emptyForm: FormShape = {
    name: "",
    stageName: "",
    bio: "",
    profileImage: "",
    coverImage: "",
    birthDate: "",
    birthPlace: "",
    height: undefined,
    measurements: {
      bust: undefined,
      waist: undefined,
      hips: undefined,
      cupSize: "",
    },
    bloodType: "",
    zodiacSign: "",
    hobbies: [],
    specialSkills: [],
    careerStart: "",
    status: "active",
    agency: "",
    socialMedia: {
      twitter: "",
      instagram: "",
      tiktok: "",
      youtube: "",
      website: "",
    },
    genres: [],
    tags: [],
    isVerified: false,
    isPublic: true,
  };
  const [form, setForm] = useState<FormShape>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load genres taxonomy
  useEffect(() => {
    const loadGenres = async () => {
      setLoadingGenres(true);
      try {
        const res = await fetch(`/api/genres?limit=1000`);
        const json = await res.json();
        if (json?.success) {
          setGenres(json.data || []);
        }
      } catch (e) {
        console.error("Failed to load genres", e);
      } finally {
        setLoadingGenres(false);
      }
    };
    loadGenres();
  }, []);

  // Load idols
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        // NOTE: /api/idols returns only public items (isPublic: true) by design.
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (genreFilter !== "all") params.set("genre", genreFilter);
        params.set("sortBy", "createdAt");
        params.set("sortOrder", "desc");

        const res = await fetch(`/api/idols?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (json?.success) {
          setIdols(json.data || []);
          setTotalItems(json.pagination?.totalItems || 0);
        } else {
          setIdols([]);
          setTotalItems(0);
        }
      } catch (e) {
        if ((e as any).name !== "AbortError") {
          console.error("Failed to load idols", e);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [page, limit, search, statusFilter, genreFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / limit)),
    [totalItems, limit],
  );

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleEdit = (idol: Idol) => {
    setEditingId(idol._id);
    setForm({
      name: idol.name || "",
      stageName: idol.stageName || "",
      bio: idol.bio || "",
      profileImage: idol.profileImage || "",
      coverImage: idol.coverImage || "",
      birthDate: idol.birthDate ? idol.birthDate.slice(0, 10) : "",
      birthPlace: idol.birthPlace || "",
      height: idol.height,
      measurements: {
        bust: idol.measurements?.bust,
        waist: idol.measurements?.waist,
        hips: idol.measurements?.hips,
        cupSize: idol.measurements?.cupSize || "",
      },
      bloodType: idol.bloodType || "",
      zodiacSign: idol.zodiacSign || "",
      hobbies: idol.hobbies || [],
      specialSkills: idol.specialSkills || [],
      careerStart: idol.careerStart ? idol.careerStart.slice(0, 10) : "",
      status: idol.status || "active",
      agency: idol.agency || "",
      socialMedia: {
        twitter: idol.socialMedia?.twitter || "",
        instagram: idol.socialMedia?.instagram || "",
        tiktok: idol.socialMedia?.tiktok || "",
        youtube: idol.socialMedia?.youtube || "",
        website: idol.socialMedia?.website || "",
      },
      genres: (idol.genres || []) as ObjectId[],
      tags: idol.tags || [],
      isVerified: !!idol.isVerified,
      isPublic: !!idol.isPublic,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this idol? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/idols?ids=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Failed to delete idol");
        return;
      }
      // Refresh list locally
      setIdols((prev) => prev.filter((a) => a._id !== id));
      setTotalItems((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Delete failed", e);
      alert("Delete failed");
    }
  };

  const refreshList = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(1));
      params.set("limit", String(limit));
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (genreFilter !== "all") params.set("genre", genreFilter);
      params.set("sortBy", "createdAt");
      params.set("sortOrder", "desc");
      const res = await fetch(`/api/idols?${params.toString()}`);
      const json = await res.json();
      if (json?.success) {
        setIdols(json.data || []);
        setTotalItems(json.pagination?.totalItems || 0);
        setPage(1);
      }
    } catch (e) {
      console.error("Failed to refresh list", e);
    }
  };

  const upsertIdol = async (payload: any) => {
    setIsSubmitting(true);
    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/idols?id=${encodeURIComponent(editingId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/idols`, {
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
      return json.data as Idol;
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

    if (!form.name.trim()) {
      alert("Name is required");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      stageName: form.stageName?.trim() || "",
      bio: form.bio || "",
      profileImage: form.profileImage?.trim() || "",
      coverImage: form.coverImage?.trim() || "",
      birthDate: form.birthDate ? new Date(form.birthDate) : undefined,
      birthPlace: form.birthPlace?.trim() || "",
      height: form.height ? Number(form.height) : undefined,
      measurements: {
        bust: form.measurements?.bust
          ? Number(form.measurements.bust)
          : undefined,
        waist: form.measurements?.waist
          ? Number(form.measurements.waist)
          : undefined,
        hips: form.measurements?.hips
          ? Number(form.measurements.hips)
          : undefined,
        cupSize: form.measurements?.cupSize?.trim() || "",
      },
      bloodType: form.bloodType?.trim() || "",
      zodiacSign: form.zodiacSign?.trim() || "",
      hobbies: (form.hobbies || []).map((h) => h.trim()).filter(Boolean),
      specialSkills: (form.specialSkills || [])
        .map((s) => s.trim())
        .filter(Boolean),
      careerStart: form.careerStart ? new Date(form.careerStart) : undefined,
      status: form.status,
      agency: form.agency?.trim() || "",
      socialMedia: {
        twitter: form.socialMedia?.twitter?.trim() || "",
        instagram: form.socialMedia?.instagram?.trim() || "",
        tiktok: form.socialMedia?.tiktok?.trim() || "",
        youtube: form.socialMedia?.youtube?.trim() || "",
        website: form.socialMedia?.website?.trim() || "",
      },
      genres: form.genres || [],
      tags: (form.tags || []).map((t) => t.trim()).filter(Boolean),
      isVerified: !!form.isVerified,
      isPublic: !!form.isPublic,
    };

    const saved = await upsertIdol(payload);
    if (!saved) return;

    resetForm();
    await refreshList();
    alert(editingId ? "Idol updated" : "Idol created");
  };

  const tagString = (tags?: string[]) => (tags || []).join(", ");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Idols CMS</h1>
          <p className="mt-2 text-gray-600">
            Create, edit, and manage idol entries (with genre associations)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editingId ? (
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              New Idol
            </button>
          ) : null}
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">
            {editingId ? "Edit Idol" : "Create Idol"}
          </div>
          {editingId && (
            <div className="text-xs text-gray-500">ID: {editingId}</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-6">
          {/* Basic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Full name"
              />
              {!!form.name.trim() && (
                <div className="mt-1 text-xs text-gray-500">
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
              <label className="block text-sm font-medium text-gray-700">
                Stage Name
              </label>
              <input
                type="text"
                value={form.stageName || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, stageName: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Optional stage name"
              />
            </div>
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Profile Image URL
              </label>
              <input
                type="url"
                value={form.profileImage || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, profileImage: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="https://..."
              />
              {form.profileImage ? (
                <img
                  src={form.profileImage}
                  alt="Profile"
                  className="mt-2 w-24 h-24 object-cover rounded-full border"
                />
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cover Image URL
              </label>
              <input
                type="url"
                value={form.coverImage || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, coverImage: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="https://..."
              />
              {form.coverImage ? (
                <img
                  src={form.coverImage}
                  alt="Cover"
                  className="mt-2 w-48 h-24 object-cover rounded border"
                />
              ) : null}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              value={form.bio || ""}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="Short biography"
            />
          </div>

          {/* Personal info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Birth Date
              </label>
              <input
                type="date"
                value={form.birthDate || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, birthDate: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Birth Place
              </label>
              <input
                type="text"
                value={form.birthPlace || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, birthPlace: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="City, Country"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Height (cm)
              </label>
              <input
                type="number"
                value={form.height ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    height: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="e.g. 165"
              />
            </div>
          </div>

          {/* Measurements */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              Measurements
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-gray-600">Bust (cm)</label>
                <input
                  type="number"
                  value={form.measurements?.bust ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      measurements: {
                        ...p.measurements,
                        bust: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">
                  Waist (cm)
                </label>
                <input
                  type="number"
                  value={form.measurements?.waist ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      measurements: {
                        ...p.measurements,
                        waist: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Hips (cm)</label>
                <input
                  type="number"
                  value={form.measurements?.hips ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      measurements: {
                        ...p.measurements,
                        hips: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Cup Size</label>
                <input
                  type="text"
                  value={form.measurements?.cupSize ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      measurements: {
                        ...p.measurements,
                        cupSize: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="e.g. D"
                />
              </div>
            </div>
          </div>

          {/* Career & status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Career Start
              </label>
              <input
                type="date"
                value={form.careerStart || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, careerStart: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as any }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Agency
              </label>
              <input
                type="text"
                value={form.agency || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, agency: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>

          {/* Social */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              Social Media
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600">Twitter</label>
                <input
                  type="url"
                  value={form.socialMedia?.twitter || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      socialMedia: {
                        ...p.socialMedia,
                        twitter: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Instagram</label>
                <input
                  type="url"
                  value={form.socialMedia?.instagram || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      socialMedia: {
                        ...p.socialMedia,
                        instagram: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">TikTok</label>
                <input
                  type="url"
                  value={form.socialMedia?.tiktok || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      socialMedia: { ...p.socialMedia, tiktok: e.target.value },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="https://tiktok.com/@..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">YouTube</label>
                <input
                  type="url"
                  value={form.socialMedia?.youtube || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      socialMedia: {
                        ...p.socialMedia,
                        youtube: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Website</label>
                <input
                  type="url"
                  value={form.socialMedia?.website || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      socialMedia: {
                        ...p.socialMedia,
                        website: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Genres
            </label>
            <div className="mt-2 max-h-48 overflow-auto border rounded p-2">
              {loadingGenres ? (
                <div className="text-sm text-gray-500">Loading genres...</div>
              ) : genres.length ? (
                genres.map((g) => {
                  const checked = (form.genres || []).includes(g._id);
                  return (
                    <label
                      key={g._id}
                      className="flex items-center gap-2 py-1 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setForm((p) => {
                            const set = new Set(p.genres || []);
                            if (e.target.checked) set.add(g._id);
                            else set.delete(g._id);
                            return {
                              ...p,
                              genres: Array.from(set) as ObjectId[],
                            };
                          })
                        }
                      />
                      <span>{g.name}</span>
                    </label>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500">No genres found</div>
              )}
            </div>
          </div>

          {/* Tags */}
          <TagInput
            tags={form.tags || []}
            onChange={(tags) => setForm((p) => ({ ...p, tags }))}
            label="Tags"
            placeholder="Enter tags..."
          />

          {/* Flags */}
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isVerified}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isVerified: e.target.checked }))
                }
              />
              <span>Verified</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
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

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting || !form.name.trim()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : editingId
                  ? "Update Idol"
                  : "Create Idol"}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm text-gray-700">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, stage name, bio..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
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
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setGenreFilter("all");
                setPage(1);
              }}
              className="w-full px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Idols</div>
          <div className="text-sm text-gray-500">
            {loading ? "Loading..." : `${totalItems} total`}
          </div>
        </div>

        <div className="divide-y">
          {!loading && idols.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No idols found.
            </div>
          )}

          {idols.map((a) => {
            return (
              <div key={a._id} className="px-4 py-3 flex items-start gap-4">
                {a.profileImage ? (
                  <img
                    src={a.profileImage}
                    alt={a.name}
                    className="w-16 h-16 object-cover rounded-full border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border bg-gray-50 grid place-items-center text-gray-400 text-xs">
                    No image
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">
                      {a.stageName || a.name}
                    </div>
                    {a.isVerified && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                        Verified
                      </span>
                    )}
                    {!a.isPublic && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                        Private
                      </span>
                    )}
                    <span className="text-xs text-gray-500 px-1.5 py-0.5 rounded border">
                      {a.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Photos {a.photoCount ?? 0} • Videos {a.videoCount ?? 0} •
                    Galleries {a.galleryCount ?? 0}
                  </div>
                  {!!a.tags?.length && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {a.tags!.slice(0, 6).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700"
                        >
                          #{t}
                        </span>
                      ))}
                      {(a.tags!.length || 0) > 6 && (
                        <span className="text-[10px] text-gray-500">
                          +{(a.tags!.length || 0) - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(a)}
                    className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a._id)}
                    className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
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
