"use client";
import { sanitizeHtmlSimple } from "@/lib/utils/sanitize";
import logger from "@/lib/utils/logger";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { UploadDropzone } from "@/lib/uploadthing";
import TagInput from "../../../components/admin/TagInput";

type ObjectId = string;

type NewsArticle = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author: {
    name: string;
    email?: string;
    avatar?: string;
  };
  featuredImage?: string;
  images?: { url: string; caption?: string; altText?: string }[];
  category:
    | "general"
    | "releases"
    | "events"
    | "interviews"
    | "announcements"
    | "reviews"
    | "industry"
    | "behind-the-scenes"
    | "personal"
    | "collaborations";
  tags?: string[];
  relatedIdols?: ObjectId[];
  relatedGenres?: ObjectId[];
  status: "draft" | "published" | "archived" | "scheduled";
  publishedAt?: string;
  scheduledAt?: string;
  isPublic: boolean;
  isFeatured: boolean;
  isBreaking: boolean;
  priority?: number;
  readingTime?: number;
  createdAt: string;
  updatedAt: string;
};

type IdolOption = {
  _id: string;
  name: string;
  stageName?: string;
  slug: string;
  profileImage?: string;
};
type GenreOption = { _id: string; name: string; slug: string; color?: string };

const CATEGORIES = [
  "general",
  "releases",
  "events",
  "interviews",
  "announcements",
  "reviews",
  "industry",
  "behind-the-scenes",
  "personal",
  "collaborations",
] as const;

const STATUSES = ["draft", "published", "archived", "scheduled"] as const;

export default function AdminNewsPage() {
  const { data: session } = useSession();

  // Lists
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Taxonomy
  const [idols, setIdols] = useState<IdolOption[]>([]);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Form state
  const emptyForm: Omit<
    NewsArticle,
    "_id" | "slug" | "createdAt" | "updatedAt" | "readingTime"
  > = {
    title: "",
    excerpt: "",
    content: "",
    author: {
      name: "",
      email: "",
      avatar: "",
    },
    featuredImage: "",
    images: [],
    category: "general",
    tags: [],
    relatedIdols: [],
    relatedGenres: [],
    status: "draft",
    publishedAt: undefined,
    scheduledAt: undefined,
    isPublic: true,
    isFeatured: false,
    isBreaking: false,
    priority: 0,
  };
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditor, setShowEditor] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const authorDefaultName = useMemo(() => {
    // Use email as fallback if present, otherwise "Admin"
    return session?.user?.email || "Admin";
  }, [session?.user?.email]);

  useEffect(() => {
    // Initialize author name on mount
    setForm((prev) => ({
      ...prev,
      author: {
        name: authorDefaultName,
        email: session?.user?.email || "",
        avatar: "",
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorDefaultName]);

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

  useEffect(() => {
    const controller = new AbortController();
    const loadNews = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("includeUnpublished", "true");
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        // Sort newest first by updatedAt or publishedAt if exists
        params.set("sortBy", "updatedAt");
        params.set("sortOrder", "desc");

        const res = await fetch(`/api/news?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (json?.success) {
          setArticles(json.data || []);
          setTotalItems(json.pagination?.totalItems || 0);
        }
      } catch (e) {
        if ((e as { name?: string })?.name !== "AbortError") {
          // non-abort error; optionally surface UI state
        }
      } finally {
        setLoading(false);
      }
    };
    loadNews();
    return () => controller.abort();
  }, [page, limit, search, statusFilter, categoryFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / limit)),
    [totalItems, limit],
  );

  const resetForm = () => {
    setForm({
      ...emptyForm,
      author: {
        name: authorDefaultName,
        email: session?.user?.email || "",
        avatar: "",
      },
    });
    setEditingId(null);
    setShowEditor(true);
    setShowPreview(false);
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingId(article._id);
    setForm({
      title: article.title,
      excerpt: article.excerpt || "",
      content: article.content,
      author: {
        name: article.author?.name || authorDefaultName,
        email: article.author?.email || session?.user?.email || "",
        avatar: article.author?.avatar || "",
      },
      featuredImage: article.featuredImage || "",
      images: article.images || [],
      category: article.category,
      tags: article.tags || [],
      relatedIdols: (article.relatedIdols || []) as ObjectId[],
      relatedGenres: (article.relatedGenres || []) as ObjectId[],
      status: article.status,
      publishedAt: article.publishedAt,
      scheduledAt: article.scheduledAt,
      isPublic: article.isPublic,
      isFeatured: article.isFeatured,
      isBreaking: article.isBreaking,
      priority: article.priority || 0,
    });
    setShowEditor(true);
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/news?ids=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Failed to delete article");
        return;
      }
      // Refresh list
      setArticles((prev) => prev.filter((a) => a._id !== id));
      setTotalItems((prev) => Math.max(0, prev - 1));
    } catch (e) {
      logger.error("Fetch failed", e);
      alert("Delete failed");
    }
  };

  const upsertArticle = async (
    payload: Omit<
      NewsArticle,
      "_id" | "slug" | "createdAt" | "updatedAt" | "readingTime"
    >,
  ) => {
    setIsSubmitting(true);
    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/news?id=${encodeURIComponent(editingId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/news`, {
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
      return json.data as NewsArticle;
    } catch (e) {
      logger.error("Delete failed", e);
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
    if (!form.content.trim()) {
      alert("Content is required");
      return;
    }
    if (!form.author?.name?.trim()) {
      alert("Author name is required");
      return;
    }

    const payload = {
      ...form,
      // Normalize data
      title: form.title.trim(),
      excerpt: form.excerpt?.trim() || "",
      content: form.content,
      author: {
        name: form.author?.name?.trim() || authorDefaultName,
        email: form.author?.email?.trim() || session?.user?.email || "",
        avatar: form.author?.avatar?.trim() || "",
      },
      featuredImage: form.featuredImage?.trim() || "",
      category: form.category,
      tags: (Array.isArray(form.tags)
        ? form.tags
        : (form.tags || []).filter(Boolean)
      )
        .map((t) => t.trim())
        .filter(Boolean),
      relatedIdols: form.relatedIdols || [],
      relatedGenres: form.relatedGenres || [],
      status: form.status,
      isPublic: !!form.isPublic,
      isFeatured: !!form.isFeatured,
      isBreaking: !!form.isBreaking,
      priority: Number(form.priority || 0),
      // Keep scheduled/published only if set
      publishedAt: form.publishedAt
        ? new Date(form.publishedAt).toISOString()
        : undefined,
      scheduledAt: form.scheduledAt
        ? new Date(form.scheduledAt).toISOString()
        : undefined,
    };

    const saved = await upsertArticle(payload);
    if (!saved) return;

    // Refresh list
    setPage(1);
    resetForm();
    await refreshList();
    alert(editingId ? "Article updated" : "Article created");
  };

  const refreshList = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(1));
      params.set("limit", String(limit));
      params.set("includeUnpublished", "true");
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      params.set("sortBy", "updatedAt");
      params.set("sortOrder", "desc");
      const res = await fetch(`/api/news?${params.toString()}`);
      const json = await res.json();
      if (json?.success) {
        setArticles(json.data || []);
        setTotalItems(json.pagination?.totalItems || 0);
        setPage(1);
      }
    } catch (e) {
      logger.error("Failed to refresh list", e);
    }
  };

  // Helpers
  const formatDateTimeLocal = (iso?: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    const pad = (n: number) => `${n}`.padStart(2, "0");
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  };

  // Minimal markdown to HTML for preview (admin-only use)
  const renderMarkdown = (md: string) => {
    // Escape HTML
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks ```
    html = html.replace(/```([\s\S]*?)```/g, (_m, code) => {
      return `<pre class="bg-gray-900 text-gray-100 p-3 rounded"><code>${code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</code></pre>`;
    });

    // Inline code
    html = html.replace(
      /`([^`]+)`/g,
      "<code class='bg-gray-100 px-1 rounded'>$1</code>",
    );

    // Headings
    html = html
      .replace(
        /^###### (.*)$/gm,
        "<h6 class='text-sm font-semibold mt-4'>$1</h6>",
      )
      .replace(
        /^##### (.*)$/gm,
        "<h5 class='text-base font-semibold mt-4'>$1</h5>",
      )
      .replace(
        /^#### (.*)$/gm,
        "<h4 class='text-lg font-semibold mt-4'>$1</h4>",
      )
      .replace(/^### (.*)$/gm, "<h3 class='text-xl font-bold mt-4'>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2 class='text-2xl font-bold mt-4'>$1</h2>")
      .replace(/^# (.*)$/gm, "<h1 class='text-3xl font-bold mt-4'>$1</h1>");

    // Bold, Italic
    html = html
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>");

    // Links [text](url)
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      `<a class="text-indigo-600 underline" target="_blank" rel="noopener noreferrer" href="$2">$1</a>`,
    );

    // Unordered lists
    html = html.replace(
      /(^|\n)\s*[-*]\s+(.+)/g,
      (_m, p1, p2) => `${p1}<li>${p2}</li>`,
    );
    html = html.replace(
      /(<li>[\s\S]*?<\/li>)/g,
      "<ul class='list-disc ml-6 my-2'>$1</ul>",
    );

    // Paragraphs
    html = html
      .split(/\n{2,}/)
      .map((block) => {
        if (
          /^<(h\d|ul|pre|blockquote)/.test(block.trim()) ||
          /<\/(ul|pre)>$/.test(block.trim())
        ) {
          return block;
        }
        if (block.trim().startsWith("<li>")) return block;
        return `<p class="my-3">${block.replace(/\n/g, "<br/>")}</p>`;
      })
      .join("");

    // Defense-in-depth: production-only sanitization of generated HTML
    if (process.env.NODE_ENV === "production") {
      html = html
        .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
        .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
        .replace(/(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '$1="#"');
    }

    return { __html: sanitizeHtmlSimple(html) };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            News CMS
          </h1>
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            Create, edit, and manage news articles (Markdown-supported)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editingId ? (
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              New Article
            </button>
          ) : null}
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {editingId ? "Edit Article" : "Create Article"}
            </span>
            {editingId && (
              <span className="text-xs text-gray-500">ID: {editingId}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditor(true)}
              className={`px-3 py-1.5 rounded ${showEditor ? "bg-indigo-100 text-indigo-700" : "hover:bg-gray-100"}`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`px-3 py-1.5 rounded ${showPreview ? "bg-indigo-100 text-indigo-700" : "hover:bg-gray-100"}`}
            >
              Preview
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-6">
          {/* Title + Slug preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter article title"
            />
            {!!form.title.trim() && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
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

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Excerpt (optional)
            </label>
            <textarea
              value={form.excerpt || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, excerpt: e.target.value }))
              }
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Short summary up to ~500 characters"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Featured Image (optional)
            </label>
            {form.featuredImage ? (
              <div className="mt-1">
                <Image
                  src={form.featuredImage}
                  alt="Featured image preview"
                  className="w-64 h-36 object-cover rounded border border-gray-300 dark:border-gray-600 mb-2"
                />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, featuredImage: "" }))}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Remove featured image
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
                        featuredImage: res[0].url,
                      }));
                    }
                  }}
                  onUploadError={(error: Error) => {
                    alert(`Featured image upload failed: ${error.message}`);
                  }}
                />
              </div>
            )}
          </div>

          {/* Markdown editor / preview */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Content (Markdown)
              </label>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Supports headings, bold/italic, links, lists, code blocks
              </div>
            </div>

            {showEditor && (
              <textarea
                value={form.content}
                onChange={(e) =>
                  setForm((p) => ({ ...p, content: e.target.value }))
                }
                rows={12}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm font-mono text-sm"
                placeholder="# Heading

Write your article in Markdown..."
              />
            )}

            {showPreview && (
              <div
                className="prose max-w-none mt-3 text-sm"
                dangerouslySetInnerHTML={renderMarkdown(form.content || "")}
              />
            )}
          </div>

          {/* Meta fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    category: e.target.value as
                      | "general"
                      | "releases"
                      | "events"
                      | "interviews"
                      | "announcements"
                      | "reviews"
                      | "industry"
                      | "behind-the-scenes"
                      | "personal"
                      | "collaborations",
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    status: e.target.value as
                      | "draft"
                      | "published"
                      | "archived"
                      | "scheduled",
                  }))
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

            {/* PublishedAt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Publish Date/Time
              </label>
              <input
                type="datetime-local"
                value={formatDateTimeLocal(form.publishedAt)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    publishedAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            {/* ScheduledAt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Schedule Date/Time
              </label>
              <input
                type="datetime-local"
                value={formatDateTimeLocal(form.scheduledAt)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    scheduledAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            {/* Flags */}
            <div className="flex items-center gap-6 mt-2">
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
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isFeatured: e.target.checked }))
                  }
                />
                <span>Featured</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isBreaking}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isBreaking: e.target.checked }))
                  }
                />
                <span>Breaking</span>
              </label>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Priority (0-10)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={form.priority || 0}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    priority: Number(e.target.value || 0),
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

          {/* Relations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Idols */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Related Idols
              </label>
              <div className="mt-2 max-h-40 overflow-auto border rounded p-2">
                {loadingTaxonomies ? (
                  <div className="text-sm text-gray-500">Loading idols...</div>
                ) : idols.length ? (
                  idols.map((idol) => {
                    const checked = (form.relatedIdols || []).includes(
                      idol._id,
                    );
                    return (
                      <label
                        key={idol._id}
                        className="flex items-center gap-2 py-1 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setForm((p) => {
                              const set = new Set(p.relatedIdols || []);
                              if (e.target.checked) set.add(idol._id);
                              else set.delete(idol._id);
                              return {
                                ...p,
                                relatedIdols: Array.from(set) as ObjectId[],
                              };
                            })
                          }
                        />
                        <span>{idol.stageName || idol.name}</span>
                      </label>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500">No idols found</div>
                )}
              </div>
            </div>

            {/* Genres */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Related Genres
              </label>
              <div className="mt-2 max-h-40 overflow-auto border rounded p-2">
                {loadingTaxonomies ? (
                  <div className="text-sm text-gray-500">Loading genres...</div>
                ) : genres.length ? (
                  genres.map((genre) => {
                    const checked = (form.relatedGenres || []).includes(
                      genre._id,
                    );
                    return (
                      <label
                        key={genre._id}
                        className="flex items-center gap-2 py-1 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setForm((p) => {
                              const set = new Set(p.relatedGenres || []);
                              if (e.target.checked) set.add(genre._id);
                              else set.delete(genre._id);
                              return {
                                ...p,
                                relatedGenres: Array.from(set) as ObjectId[],
                              };
                            })
                          }
                        />
                        <span>{genre.name}</span>
                      </label>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500">No genres found</div>
                )}
              </div>
            </div>
          </div>

          {/* Author */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Author Name *
              </label>
              <input
                type="text"
                value={form.author?.name || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    author: { ...p.author, name: e.target.value },
                  }))
                }
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Author's full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Author Email *
              </label>
              <input
                type="email"
                value={form.author?.email || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    author: { ...p.author, email: e.target.value },
                  }))
                }
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="author@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Author Avatar URL
              </label>
              <input
                type="url"
                value={form.author?.avatar || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    author: { ...p.author, avatar: e.target.value },
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !form.title.trim() ||
                !form.content.trim() ||
                !form.author?.name?.trim()
              }
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              {isSubmitting
                ? "Saving..."
                : editingId
                  ? "Update Article"
                  : "Create Article"}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
              placeholder="Search title, content..."
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
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setCategoryFilter("all");
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="font-semibold text-gray-900 dark:text-white">
            Articles
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "Loading..." : `${totalItems} total`}
          </div>
        </div>

        <div className="divide-y">
          {!loading && articles.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No articles found.
            </div>
          )}

          {articles.map((a) => {
            const sub = [
              a.status,
              a.category,
              a.publishedAt
                ? `Published ${new Date(a.publishedAt).toLocaleString()}`
                : null,
              a.updatedAt
                ? `Updated ${new Date(a.updatedAt).toLocaleString()}`
                : null,
            ]
              .filter(Boolean)
              .join(" • ");

            return (
              <div key={a._id} className="px-4 py-3 flex items-start gap-4">
                {a.featuredImage ? (
                  <Image
                    src={a.featuredImage}
                    alt={a.title}
                    className="w-24 h-16 object-cover rounded border"
                  />
                ) : (
                  <div className="w-24 h-16 rounded border bg-gray-50 grid place-items-center text-gray-400 text-xs">
                    No image
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{a.title}</div>
                    {a.isFeatured && (
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                    {a.isBreaking && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                        Breaking
                      </span>
                    )}
                    {!a.isPublic && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                        Private
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{sub}</div>
                  {!!a.tags?.length && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {a.tags!.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700"
                        >
                          #{t}
                        </span>
                      ))}
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
