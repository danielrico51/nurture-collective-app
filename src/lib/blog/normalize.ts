import { BLOG_SERVICE_TAGS } from "@/content/blogServiceTags";
import type { ServiceSlug } from "@/content/site";
import { slugifyTitle } from "@/lib/blog/slug";
import type { BlogPost, BlogPostStatus, CreateBlogPostInput } from "@/types/blog";

const SERVICE_SLUGS: ServiceSlug[] = [
  "birth-doula",
  "overnight-newborn",
  "postpartum-care",
  "lactation",
  "prenatal-massage",
  "postpartum-massage",
  "birth-photography",
  "childbirth-education",
  "placenta-encapsulation",
];

const isStatus = (value: unknown): value is BlogPostStatus =>
  value === "draft" || value === "published";

const isServiceSlug = (value: unknown): value is ServiceSlug =>
  typeof value === "string" && SERVICE_SLUGS.includes(value as ServiceSlug);

const normalizeServiceSlugs = (
  raw: unknown,
  slug: string
): ServiceSlug[] | undefined => {
  if (!Array.isArray(raw)) {
    const fallback = BLOG_SERVICE_TAGS[slug];
    return fallback?.length ? fallback : undefined;
  }
  const slugs = Array.from(new Set(raw.filter(isServiceSlug)));
  if (slugs.length > 0) return slugs;
  const fallback = BLOG_SERVICE_TAGS[slug];
  return fallback?.length ? fallback : undefined;
};

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
    serviceSlugs: normalizeServiceSlugs(raw.serviceSlugs, slug),
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
