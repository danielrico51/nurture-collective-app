import { slugifyTitle } from "@/lib/blog/slug";
import type { BlogPost, BlogPostStatus, CreateBlogPostInput } from "@/types/blog";

const isStatus = (value: unknown): value is BlogPostStatus =>
  value === "draft" || value === "published";

export const normalizeBlogPost = (
  raw: Partial<BlogPost> & { title: string }
): BlogPost => {
  const now = new Date().toISOString();
  const title = raw.title.trim();
  const slug = (raw.slug?.trim() || slugifyTitle(title)).toLowerCase();

  return {
    slug,
    title,
    excerpt: raw.excerpt?.trim() ?? "",
    body: raw.body?.trim() ?? "",
    date: raw.date?.trim() || now.slice(0, 10),
    status: isStatus(raw.status) ? raw.status : "draft",
    author: raw.author?.trim() || undefined,
    externalUrl: raw.externalUrl?.trim() || undefined,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
};

export const buildCreatePost = (
  input: CreateBlogPostInput,
  existingSlugs: string[]
): BlogPost => {
  let slug = input.slug?.trim().toLowerCase() || slugifyTitle(input.title);
  if (existingSlugs.includes(slug)) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }
  const now = new Date().toISOString();
  return normalizeBlogPost({
    ...input,
    slug,
    createdAt: now,
    updatedAt: now,
  });
};
