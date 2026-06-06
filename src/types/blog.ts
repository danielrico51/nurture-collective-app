export type BlogPostStatus = "draft" | "published";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  /** Display date (YYYY-MM-DD). */
  date: string;
  status: BlogPostStatus;
  author?: string;
  externalUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogDocument {
  version: 1;
  posts: BlogPost[];
  updatedAt: string;
}

export type CreateBlogPostInput = {
  title: string;
  excerpt: string;
  body: string;
  date?: string;
  status?: BlogPostStatus;
  author?: string;
  externalUrl?: string;
  slug?: string;
};

export type UpdateBlogPostInput = Partial<
  Omit<BlogPost, "slug" | "createdAt" | "updatedAt">
>;

export type BlogDigestHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};
