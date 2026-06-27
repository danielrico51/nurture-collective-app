import { BLOG_SERVICE_TAGS } from "@/content/blogServiceTags";
import type { ServiceSlug } from "@/content/site";
import type { BlogPost } from "@/types/blog";

const isServiceSlug = (value: string): value is ServiceSlug =>
  [
    "birth-doula",
    "overnight-newborn",
    "postpartum-care",
    "lactation",
    "prenatal-massage",
    "postpartum-massage",
    "birth-photography",
    "childbirth-education",
    "placenta-encapsulation",
  ].includes(value);

const normalizeServiceSlugList = (slugs: string[] | undefined): ServiceSlug[] => {
  if (!slugs?.length) return [];
  return Array.from(new Set(slugs.filter(isServiceSlug)));
};

/** Resolves service tags from the post record or the legacy slug map. */
export const resolvePostServiceSlugs = (post: Pick<BlogPost, "slug" | "serviceSlugs">): ServiceSlug[] => {
  const fromPost = normalizeServiceSlugList(post.serviceSlugs);
  if (fromPost.length > 0) return fromPost;
  return BLOG_SERVICE_TAGS[post.slug] ?? [];
};

export interface RelatedBlogPost {
  slug: string;
  title: string;
  excerpt: string;
}

export const getRelatedBlogPostsForService = (
  posts: BlogPost[],
  serviceSlug: ServiceSlug,
  limit = 2
): RelatedBlogPost[] =>
  posts
    .filter((post) => post.status === "published")
    .filter((post) => resolvePostServiceSlugs(post).includes(serviceSlug))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
    }));
