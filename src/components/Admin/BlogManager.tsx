"use client";

import {
  createAdminBlogPost,
  deleteAdminBlogPost,
  fetchAdminBlogPosts,
  updateAdminBlogPost,
} from "@/lib/api/blogClient";
import { formatBlogDate } from "@/lib/blog/format";
import { slugifyTitle } from "@/lib/blog/slug";
import { publishedCoreServices } from "@/content/site";
import type { ServiceSlug } from "@/content/site";
import { resolvePostServiceSlugs } from "@/lib/blog/serviceTags";
import type { BlogPost, BlogPostStatus } from "@/types/blog";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const SERVICE_TAG_OPTIONS = publishedCoreServices.map((service) => ({
  slug: service.slug,
  title: service.title,
}));

const emptyDraft = (): Partial<BlogPost> => ({
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  date: new Date().toISOString().slice(0, 10),
  status: "draft",
  author: "The Nesting Place Team",
  externalUrl: "",
  serviceSlugs: [],
});

const BlogManager = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Partial<BlogPost>>(emptyDraft());

  const loadPosts = useCallback(async (seed = false) => {
    setLoading(true);
    try {
      const { posts: next } = await fetchAdminBlogPosts(seed);
      setPosts(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts(true);
  }, [loadPosts]);

  const selectPost = (post: BlogPost) => {
    setIsNew(false);
    setSelectedSlug(post.slug);
    setForm({ ...post, serviceSlugs: resolvePostServiceSlugs(post) });
  };

  const startNew = () => {
    setIsNew(true);
    setSelectedSlug(null);
    setForm(emptyDraft());
  };

  const updateField = <K extends keyof BlogPost>(key: K, value: BlogPost[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && isNew && !prev.slug?.trim()) {
        next.slug = slugifyTitle(String(value));
      }
      return next;
    });
  };

  const toggleServiceTag = (slug: ServiceSlug) => {
    setForm((prev) => {
      const current = prev.serviceSlugs ?? [];
      const next = current.includes(slug)
        ? current.filter((entry) => entry !== slug)
        : [...current, slug];
      return { ...prev, serviceSlugs: next };
    });
  };

  const handleSave = async () => {
    if (!form.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const { post } = await createAdminBlogPost({
          title: form.title,
          excerpt: form.excerpt ?? "",
          body: form.body ?? "",
          date: form.date,
          status: form.status as BlogPostStatus,
          author: form.author,
          externalUrl: form.externalUrl || undefined,
          serviceSlugs: form.serviceSlugs,
          slug: form.slug?.trim() || undefined,
        });
        toast.success("Post created");
        await loadPosts();
        selectPost(post);
      } else if (selectedSlug) {
        const { post } = await updateAdminBlogPost(selectedSlug, {
          title: form.title,
          excerpt: form.excerpt,
          body: form.body,
          date: form.date,
          status: form.status as BlogPostStatus,
          author: form.author,
          externalUrl: form.externalUrl || undefined,
          serviceSlugs: form.serviceSlugs,
        });
        toast.success("Post saved");
        await loadPosts();
        selectPost(post);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSlug || isNew) return;
    if (!window.confirm(`Delete "${form.title}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteAdminBlogPost(selectedSlug);
      toast.success("Post deleted");
      startNew();
      await loadPosts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const editing = isNew || Boolean(selectedSlug);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Blog posts
          </h2>
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            Create and edit articles stored in S3 ({posts.length} total).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadPosts(true)}
            className="rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={startNew}
            className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
          >
            New post
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-nurture-sage/15 bg-nurture-cream/30 p-4">
          {loading ? (
            <p className="text-sm text-nurture-charcoal/60">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-nurture-charcoal/60">
              No posts yet. Samples seed on first load in local dev.
            </p>
          ) : (
            <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
              {posts.map((post) => (
                <li key={post.slug}>
                  <button
                    type="button"
                    onClick={() => selectPost(post)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      selectedSlug === post.slug && !isNew
                        ? "bg-white shadow-sm ring-1 ring-nurture-sage/25"
                        : "hover:bg-white/80"
                    }`}
                  >
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        post.status === "published"
                          ? "bg-nurture-sage/15 text-nurture-sage-dark"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {post.status}
                    </span>
                    <span className="mt-1 block font-medium text-nurture-charcoal">
                      {post.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-nurture-charcoal/50">
                      {formatBlogDate(post.date)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="rounded-2xl border border-nurture-sage/15 bg-white p-6">
          {!editing ? (
            <p className="text-sm text-nurture-charcoal/60">
              Select a post or create a new one.
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Title
                  </span>
                  <input
                    type="text"
                    value={form.title ?? ""}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Slug
                  </span>
                  <input
                    type="text"
                    value={form.slug ?? ""}
                    onChange={(e) => updateField("slug", e.target.value)}
                    disabled={!isNew}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm disabled:bg-nurture-cream/50"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Date
                  </span>
                  <input
                    type="date"
                    value={form.date ?? ""}
                    onChange={(e) => updateField("date", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Status
                  </span>
                  <select
                    value={form.status ?? "draft"}
                    onChange={(e) =>
                      updateField("status", e.target.value as BlogPostStatus)
                    }
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Author
                  </span>
                  <input
                    type="text"
                    value={form.author ?? ""}
                    onChange={(e) => updateField("author", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Excerpt
                  </span>
                  <textarea
                    value={form.excerpt ?? ""}
                    onChange={(e) => updateField("excerpt", e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Body (paragraphs separated by blank lines)
                  </span>
                  <textarea
                    value={form.body ?? ""}
                    onChange={(e) => updateField("body", e.target.value)}
                    rows={12}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 font-mono text-sm leading-relaxed"
                  />
                </label>
                <fieldset className="block sm:col-span-2">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Related services
                  </legend>
                  <p className="mt-1 text-xs text-nurture-charcoal/55">
                    Tagged articles appear in service &quot;Learn more&quot; panels.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SERVICE_TAG_OPTIONS.map((service) => {
                      const selected = (form.serviceSlugs ?? []).includes(service.slug);
                      return (
                        <button
                          key={service.slug}
                          type="button"
                          onClick={() => toggleServiceTag(service.slug)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            selected
                              ? "border-nurture-sage bg-nurture-sage/15 text-nurture-sage-dark"
                              : "border-nurture-sage/25 text-nurture-charcoal/70 hover:border-nurture-sage/45"
                          }`}
                        >
                          {service.title}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    External URL (optional)
                  </span>
                  <input
                    type="url"
                    value={form.externalUrl ?? ""}
                    onChange={(e) => updateField("externalUrl", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                    placeholder="https://"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-nurture-sage/10 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-nurture-sage px-5 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
                >
                  {saving ? "Saving…" : isNew ? "Create post" : "Save changes"}
                </button>
                {!isNew && selectedSlug ? (
                  <>
                    {form.status === "published" ? (
                      <Link
                        href={`/blog/${selectedSlug}`}
                        target="_blank"
                        className="text-sm font-semibold text-nurture-sage-dark hover:underline"
                      >
                        View live →
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={saving}
                      className="text-sm font-medium text-red-700/80 hover:text-red-800 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogManager;
