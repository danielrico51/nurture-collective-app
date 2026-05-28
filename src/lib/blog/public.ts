import { getRequestOrigin } from "@/lib/http/requestOrigin";
import type { BlogPost } from "@/types/blog";

export const fetchPublishedBlogPosts = async (): Promise<BlogPost[]> => {
  const origin = getRequestOrigin();
  const response = await fetch(`${origin}/api/blog`, { cache: "no-store" });
  if (!response.ok) return [];
  const data = (await response.json()) as { posts?: BlogPost[] };
  return data.posts ?? [];
};

export const fetchPublishedBlogPost = async (
  slug: string
): Promise<BlogPost | null> => {
  const origin = getRequestOrigin();
  const response = await fetch(`${origin}/api/blog/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { post?: BlogPost };
  return data.post ?? null;
};
