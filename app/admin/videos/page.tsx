"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { UploadDropzone } from "@/lib/uploadthing";
import TagInput from "../../components/admin/TagInput";
import logger from "@/lib/utils/logger";
import Image from "next/image";

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

type Video = {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  channelAvatar: string;
  channelName: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  thumbnailUrl: string;
  videoSourceUrl: string;
  idol: IdolOption | string;
  genres?: (GenreOption | string)[];
  tags?: string[];
  category?: string;
  uploadDate: string;
  releaseDate?: string;
  isPublic: boolean;
  isAdult: boolean;
  isFeatured: boolean;
  metadata?: {
    featured?: boolean;
    trending?: boolean;
    qualityScore?: number;
    resolution?: string;
    fileSize?: number;
  };
  createdAt: string;
  updatedAt: string;
};

type VideoForm = {
  title: string;
  description: string;
  channelAvatar: string;
  channelName: string;
  duration: string;
  thumbnailUrl: string;
  videoSourceUrl: string;
  idol: string | null;
  genres: string[];
  tags: string[];
  category: string;
  releaseDate: string;
  isPublic: boolean;
  isAdult: boolean;
  isFeatured: boolean;
  resolution: string;
  fileSize: undefined | number;
};

const CATEGORIES = [
  "Interview",
  "Performance",
  "Behind the Scenes",
  "Music Video",
  "Variety Show",
  "Drama",
  "Commercial",
  "Photo Shoot",
  "Event",
  "Other",
];

const RESOLUTIONS = ["480p", "720p", "1080p", "1440p", "4K", "8K"];

export default function AdminVideosPage() {
  useSession();

  const [videos, setVideos] = useState<Video[]>([]);
  const [idols, setIdols] = useState<IdolOption[]>([]);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingIdols, setLoadingIdols] = useState(true);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [idolFilter, setIdolFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm: VideoForm = {
    title: "",
    description: "",
    channelAvatar: "",
    channelName: "",
    duration: "",
    thumbnailUrl: "",
    videoSourceUrl: "",
    idol: null,
    genres: [],
    tags: [],
    category: "",
    releaseDate: "",
    isPublic: true,
    isAdult: false,
    isFeatured: false,
    resolution: "",
    fileSize: undefined,
  };

  const [form, setForm] = useState<VideoForm>(emptyForm);

  const fetchIdols = useCallback(async () => {
    try {
      setLoadingIdols(true);
      const res = await fetch("/api/idols?limit=1000");
      const data = await res.json();
      if (data.success) {
        setIdols(data.data || []);
      }
    } catch (error) {
      logger.error("Error fetching idols:", error);
    } finally {
      setLoadingIdols(false);
    }
  }, []);

  const fetchGenres = useCallback(async () => {
    try {
      setLoadingGenres(true);
      const res = await fetch("/api/genres?limit=1000");
      const data = await res.json();
      if (data.success) {
        setGenres(data.data || []);
      }
    } catch (error) {
      logger.error("Error fetching genres:", error);
    } finally {
      setLoadingGenres(false);
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.append("search", search);
      if (idolFilter !== "all") params.append("idol", idolFilter);
      if (genreFilter !== "all") params.append("genre", genreFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);

      const res = await fetch(`/api/videos?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setVideos(data.data || []);
        setTotalItems(data.pagination?.totalItems || 0);
      }
    } catch (error) {
      logger.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    fetchIdols();
    fetchGenres();
  }, [fetchIdols, fetchGenres]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / limit)),
    [totalItems, limit],
  );

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (video: Video) => {
    const releaseDate = video.releaseDate
      ? new Date(video.releaseDate).toISOString().split("T")[0]
      : "";

    setForm({
      title: video.title || "",
      description: video.description || "",
      channelAvatar: video.channelAvatar || "",
      channelName: video.channelName || "",
      duration: video.duration || "",
      thumbnailUrl: video.thumbnailUrl || "",
      videoSourceUrl: video.videoSourceUrl || "",
      idol:
        typeof video.idol === "string" ? video.idol : video.idol?._id || null,
      genres: (video.genres || []).map((g) =>
        typeof g === "string" ? g : g._id,
      ),
      tags: video.tags || [],
      category: video.category || "",
      releaseDate,
      isPublic: !!video.isPublic,
      isAdult: !!video.isAdult,
      isFeatured: !!video.isFeatured,
      resolution: video.metadata?.resolution || "",
      fileSize: video.metadata?.fileSize,
    });
    setEditingId(video._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/videos?ids=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Failed to delete video");
        return;
      }
      fetchVideos();
    } catch (error) {
      alert("Error deleting video");
      logger.error("Error deleting video", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.idol) {
      alert("Title and Idol are required");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the selected idol for auto-populated fields
      const selectedIdol = idols.find((idol) => idol._id === form.idol);

      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || "",
        channelAvatar:
          form.channelAvatar ||
          selectedIdol?.profileImage ||
          "https://via.placeholder.com/64x64?text=Avatar",
        channelName:
          form.channelName ||
          (selectedIdol ? selectedIdol.stageName || selectedIdol.name : ""),
        duration: form.duration.trim() || "0:00", // Default if not provided
        thumbnailUrl: form.thumbnailUrl.trim(),
        videoSourceUrl: form.videoSourceUrl.trim(),
        idol: form.idol,
        genres: form.genres,
        tags: form.tags,
        category: form.category || "",
        releaseDate: form.releaseDate ? new Date(form.releaseDate) : new Date(),
        isPublic: form.isPublic,
        isAdult: form.isAdult,
        isFeatured: form.isFeatured,
        resolution: form.resolution || "",
        fileSize: form.fileSize,
      };

      const url = editingId
        ? `/api/videos?id=${encodeURIComponent(editingId)}`
        : "/api/videos";

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Failed to save video");
        return;
      }

      resetForm();
      fetchVideos();
    } catch (error) {
      alert("Error saving video");
      logger.error("Error saving video", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const idolName = (idol?: IdolOption | string | null) => {
    if (!idol) return "—";
    if (typeof idol === "string") {
      const found = idols.find((i) => i._id === idol);
      return found ? found.stageName || found.name : "—";
    }
    return idol.stageName || idol.name || "—";
  };

  const genreNames = (videoGenres?: (GenreOption | string)[] | null) => {
    if (!videoGenres || videoGenres.length === 0) return "—";
    return videoGenres
      .map((g) => {
        if (typeof g === "string") {
          const found = genres.find((genre) => genre._id === g);
          return found ? found.name : "Unknown";
        }
        return g.name;
      })
      .join(", ");
  };

  const formatDuration = (duration: string) => {
    return duration || "—";
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes >= 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Videos CMS
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage idol videos with genre and idol associations
          </p>
        </div>

        {/* Form Panel */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit Video" : "Create Video"}
              </div>
              {editingId && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {editingId}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="px-4 py-4 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
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
                    placeholder="Video title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Video description"
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Thumbnail Image *
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
                  {form.thumbnailUrl ? (
                    <div className="mt-1">
                      <div className="relative w-full max-w-xs h-32 mb-2">
                        <Image
                          src={form.thumbnailUrl}
                          alt="Thumbnail preview"
                          fill
                          className="object-cover rounded border"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, thumbnailUrl: "" }))
                        }
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        Remove thumbnail
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
                              thumbnailUrl: res[0].url,
                            }));
                          }
                        }}
                        onUploadError={(error: Error) => {
                          alert(`Thumbnail upload failed: ${error.message}`);
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Video File *
                  </label>
                  <input
                    type="url"
                    value={form.videoSourceUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, videoSourceUrl: e.target.value }))
                    }
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="https://..."
                  />
                  {form.videoSourceUrl ? (
                    <div className="mt-1">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                        <p className="text-sm text-green-800 dark:text-green-300">
                          Video uploaded successfully!
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-all">
                          {form.videoSourceUrl}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((p) => ({ ...p, videoSourceUrl: "" }))
                          }
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 mt-2"
                        >
                          Remove video
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <UploadDropzone
                        endpoint="videoUploader"
                        onClientUploadComplete={(res) => {
                          if (res?.[0]) {
                            setForm((p) => ({
                              ...p,
                              videoSourceUrl: res[0].url,
                            }));
                          }
                        }}
                        onUploadError={(error: Error) => {
                          alert(`Video upload failed: ${error.message}`);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Channel Info (Auto-populated from Idol) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Channel Name (Auto-filled from Idol)
                  </label>
                  <input
                    type="text"
                    value={form.channelName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, channelName: e.target.value }))
                    }
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Select an idol to auto-fill"
                    readOnly={!form.idol}
                  />
                  {form.idol && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Auto-filled from selected idol. You can still edit if
                      needed.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Channel Avatar (Auto-filled from Idol)
                  </label>
                  {form.channelAvatar ? (
                    <div className="mt-1">
                      <div className="relative w-16 h-16 mb-2">
                        <Image
                          src={form.channelAvatar}
                          alt="Channel avatar preview"
                          fill
                          className="object-cover rounded-full border"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Using idol profile image
                      </p>
                    </div>
                  ) : form.idol ? (
                    <div className="mt-1 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-dashed border-yellow-300 dark:border-yellow-800 rounded-lg text-center">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Selected idol has no profile image
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        A default avatar will be used
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1 p-4 bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select an idol to auto-fill avatar
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Duration - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Duration (Optional)
                </label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, duration: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., 5:32 (will be auto-detected if not provided)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty to auto-detect duration from video file
                </p>
              </div>

              {/* Idol Selection (Required) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Idol *
                </label>
                <select
                  value={form.idol || ""}
                  onChange={(e) => {
                    const idolId = e.target.value || null;
                    const selectedIdol = idols.find(
                      (idol) => idol._id === idolId,
                    );
                    setForm((p) => ({
                      ...p,
                      idol: idolId,
                      channelName: selectedIdol
                        ? selectedIdol.stageName || selectedIdol.name
                        : "",
                      channelAvatar: selectedIdol?.profileImage || "",
                    }));
                  }}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">-- Select Idol --</option>
                  {loadingIdols ? (
                    <option disabled>Loading idols...</option>
                  ) : (
                    idols.map((idol) => (
                      <option key={idol._id} value={idol._id}>
                        {idol.stageName || idol.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Genres Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Genres
                </label>
                <div className="mt-2 max-h-48 overflow-auto border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded p-2">
                  {loadingGenres ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Loading genres...
                    </div>
                  ) : genres.length ? (
                    genres.map((g) => {
                      const checked = (form.genres || []).includes(g._id);
                      return (
                        <label
                          key={g._id}
                          className="flex items-center gap-2 py-1 text-sm cursor-pointer text-gray-700 dark:text-gray-300"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setForm((p) => {
                                const set = new Set(p.genres || []);
                                if (e.target.checked) set.add(g._id);
                                else set.delete(g._id);
                                return { ...p, genres: Array.from(set) };
                              });
                            }}
                            className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                          />
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: g.color }}
                          />
                          <span>{g.name}</span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No genres found
                    </div>
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

              {/* Category and Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Category --</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={form.releaseDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, releaseDate: e.target.value }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Resolution
                  </label>
                  <select
                    value={form.resolution}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, resolution: e.target.value }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Resolution --</option>
                    {RESOLUTIONS.map((res) => (
                      <option key={res} value={res}>
                        {res}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  File Size (bytes)
                </label>
                <input
                  type="number"
                  value={form.fileSize ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      fileSize: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="File size in bytes"
                />
              </div>

              {/* Flags */}
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
                  <span>Adult Content</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, isFeatured: e.target.checked }))
                    }
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                  />
                  <span>Featured</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isSubmitting || !form.title.trim() || !form.idol}
                  className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                      ? "Update Video"
                      : "Create Video"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Create Button */}
        {!showForm && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
            >
              + Create New Video
            </button>
          </div>
        )}

        {/* List Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="font-semibold text-gray-900 dark:text-white">
              Videos
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Loading..." : `${totalItems} total`}
            </div>
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
                  <option value="all">All Idols</option>
                  {idols.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.stageName || i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Genre
                </label>
                <select
                  value={genreFilter}
                  onChange={(e) => {
                    setGenreFilter(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">All Genres</option>
                  {genres.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="title">Title</option>
                  <option value="viewCount">Views</option>
                  <option value="likeCount">Likes</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Order:
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Video List */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {!loading && videos.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No videos found.
              </div>
            )}

            {videos.map((v) => {
              const genresDisplay = genreNames(v.genres);
              const idolDisplay = idolName(v.idol);

              return (
                <div
                  key={v._id}
                  className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 relative w-32 h-20">
                      <Image
                        src={v.thumbnailUrl}
                        alt={v.title}
                        fill
                        className="object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/160x90?text=No+Image";
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {v.title}
                          </h3>
                          {v.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                              {v.description}
                            </p>
                          )}
                          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                            <div>Idol: {idolDisplay}</div>
                            <div>Genres: {genresDisplay}</div>
                            <div>Category: {v.category || "—"}</div>
                            <div>Duration: {formatDuration(v.duration)}</div>
                            <div>
                              Resolution: {v.metadata?.resolution || "—"}
                            </div>
                            <div>
                              Size: {formatFileSize(v.metadata?.fileSize)}
                            </div>
                            <div>Channel: {v.channelName}</div>
                            <div>
                              Views: {v.viewCount?.toLocaleString() || 0}
                            </div>
                            <div>
                              Likes: {v.likeCount?.toLocaleString() || 0}
                            </div>
                          </div>

                          {!!v.tags?.length && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {v.tags!.slice(0, 8).map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                                >
                                  #{t}
                                </span>
                              ))}
                              {(v.tags!.length || 0) > 8 && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                  +{(v.tags!.length || 0) - 8}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            {v.isPublic && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Public
                              </span>
                            )}
                            {v.isAdult && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                18+
                              </span>
                            )}
                            {v.isFeatured && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleEdit(v)}
                            className="px-3 py-1 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(v._id)}
                            className="px-3 py-1 text-sm bg-red-600 dark:bg-red-500 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages} ({totalItems} total)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
