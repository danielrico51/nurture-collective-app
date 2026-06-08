import { describe, expect, it } from "vitest";
import { BLOG_SERVICE_TAGS } from "@/content/blogServiceTags";
import {
  getRelatedBlogPostsForService,
  resolvePostServiceSlugs,
} from "@/lib/blog/serviceTags";
import type { BlogPost } from "@/types/blog";

const samplePost = (
  overrides: Partial<BlogPost> & Pick<BlogPost, "slug" | "title">
): BlogPost => ({
  excerpt: "Excerpt",
  body: "Body",
  date: "2024-01-01",
  status: "published",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("resolvePostServiceSlugs", () => {
  it("uses stored serviceSlugs when present", () => {
    expect(
      resolvePostServiceSlugs({
        slug: "custom-post",
        serviceSlugs: ["lactation"],
      })
    ).toEqual(["lactation"]);
  });

  it("falls back to legacy slug map", () => {
    const [slug] = Object.keys(BLOG_SERVICE_TAGS);
    expect(resolvePostServiceSlugs({ slug })).toEqual(BLOG_SERVICE_TAGS[slug]);
  });
});

describe("getRelatedBlogPostsForService", () => {
  it("returns published posts tagged to the service, newest first", () => {
    const posts = [
      samplePost({
        slug: "older",
        title: "Older lactation article",
        date: "2023-01-01",
        serviceSlugs: ["lactation"],
      }),
      samplePost({
        slug: "newer",
        title: "Newer lactation article",
        date: "2025-01-01",
        serviceSlugs: ["lactation"],
      }),
      samplePost({
        slug: "draft",
        title: "Draft lactation article",
        date: "2026-01-01",
        status: "draft",
        serviceSlugs: ["lactation"],
      }),
      samplePost({
        slug: "other",
        title: "Birth article",
        date: "2026-01-01",
        serviceSlugs: ["birth-doula"],
      }),
    ];

    expect(getRelatedBlogPostsForService(posts, "lactation")).toEqual([
      {
        slug: "newer",
        title: "Newer lactation article",
        excerpt: "Excerpt",
      },
      {
        slug: "older",
        title: "Older lactation article",
        excerpt: "Excerpt",
      },
    ]);
  });
});
