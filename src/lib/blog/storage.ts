import "server-only";

import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { normalizeBlogPost, buildCreatePost } from "@/lib/blog/normalize";
import { SAMPLE_BLOG_POSTS } from "@/lib/blog/samples";
import { isValidSlug } from "@/lib/blog/slug";
import {
  emptyBlogDocument,
  readLocalBlogDocument,
  writeLocalBlogDocument,
} from "@/lib/blog/localStorage";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import type {
  BlogDocument,
  BlogPost,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from "@/types/blog";

const DEFAULT_S3_KEY = "management/blog/posts.json";
const DEFAULT_BUCKET = "nurture-collective-tasks";

const isLocalStorageEnabled = () => {
  if (process.env.BLOG_USE_LOCAL_STORAGE === "true") return true;
  if (process.env.TASKS_S3_BUCKET?.trim()) return false;
  return process.env.NODE_ENV === "development";
};

export const getBlogStorageMode = (): "local" | "s3" =>
  isLocalStorageEnabled() ? "local" : "s3";

const getS3Client = () => {
  const region =
    process.env.AWS_REGION ??
    process.env.NEXT_PUBLIC_AWS_REGION ??
    "us-east-1";
  return new S3Client({
    region,
    credentials: getServerCredentials(),
  });
};

const getBucket = () =>
  process.env.BLOG_S3_BUCKET?.trim() ||
  process.env.TASKS_S3_BUCKET?.trim() ||
  DEFAULT_BUCKET;

const getObjectKey = () =>
  process.env.BLOG_S3_KEY?.trim() || DEFAULT_S3_KEY;

const readS3BlogDocument = async (): Promise<BlogDocument> => {
  const client = getS3Client();
  const Bucket = getBucket();
  const Key = getObjectKey();

  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket, Key })
    );
    const body = await response.Body?.transformToString();
    if (!body) return emptyBlogDocument();

    const parsed = JSON.parse(body) as BlogDocument;
    if (!Array.isArray(parsed.posts)) return emptyBlogDocument();
    return {
      ...parsed,
      posts: parsed.posts.map((post) => normalizeBlogPost(post)),
    };
  } catch (error) {
    if (error instanceof NoSuchKey) return emptyBlogDocument();
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (
      err.name === "NoSuchKey" ||
      err.name === "NotFound" ||
      err.$metadata?.httpStatusCode === 404
    ) {
      return emptyBlogDocument();
    }
    throw error;
  }
};

const writeS3BlogDocument = async (document: BlogDocument): Promise<void> => {
  const client = getS3Client();
  const Bucket = getBucket();
  const Key = getObjectKey();

  await client.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body: JSON.stringify(
        { ...document, updatedAt: new Date().toISOString() },
        null,
        2
      ),
      ContentType: "application/json",
    })
  );
};

const readBlogDocument = async (): Promise<BlogDocument> => {
  if (isLocalStorageEnabled()) {
    return readLocalBlogDocument();
  }
  return readS3BlogDocument();
};

const writeBlogDocument = async (document: BlogDocument): Promise<void> => {
  if (isLocalStorageEnabled()) {
    return writeLocalBlogDocument(document);
  }
  return writeS3BlogDocument(document);
};

const sortPosts = (posts: BlogPost[]): BlogPost[] =>
  [...posts].sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() ||
      b.slug.localeCompare(a.slug)
  );

/** Seed sample posts when storage is empty (local dev). */
export const seedBlogSamplesIfEmpty = async (): Promise<boolean> => {
  const doc = await readBlogDocument();
  if (doc.posts.length > 0) return false;
  await writeBlogDocument({
    version: 1,
    posts: SAMPLE_BLOG_POSTS,
    updatedAt: new Date().toISOString(),
  });
  return true;
};

export const listAllPosts = async (): Promise<BlogPost[]> => {
  const doc = await readBlogDocument();
  if (doc.posts.length === 0 && getBlogStorageMode() === "local") {
    await seedBlogSamplesIfEmpty();
    const seeded = await readBlogDocument();
    return sortPosts(seeded.posts);
  }
  return sortPosts(doc.posts);
};

export const listPublishedPosts = async (): Promise<BlogPost[]> => {
  const posts = await listAllPosts();
  return posts.filter((post) => post.status === "published");
};

export const getPostBySlug = async (
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<BlogPost | null> => {
  if (!isValidSlug(slug)) return null;
  const posts = await listAllPosts();
  const post = posts.find((item) => item.slug === slug) ?? null;
  if (!post) return null;
  if (!options?.includeDrafts && post.status !== "published") return null;
  return post;
};

export const createPost = async (
  input: CreateBlogPostInput
): Promise<BlogPost> => {
  const doc = await readBlogDocument();
  const slugs = doc.posts.map((post) => post.slug);
  const post = buildCreatePost(input, slugs);
  if (!post.title) {
    throw new Error("Title is required");
  }
  await writeBlogDocument({
    ...doc,
    posts: [...doc.posts, post],
  });
  return post;
};

export const updatePost = async (
  slug: string,
  input: UpdateBlogPostInput
): Promise<BlogPost | null> => {
  if (!isValidSlug(slug)) return null;
  const doc = await readBlogDocument();
  const index = doc.posts.findIndex((post) => post.slug === slug);
  if (index < 0) return null;

  const current = doc.posts[index];
  const next = normalizeBlogPost({
    ...current,
    ...input,
    slug: current.slug,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  });

  const posts = [...doc.posts];
  posts[index] = next;
  await writeBlogDocument({ ...doc, posts });
  return next;
};

export const deletePost = async (slug: string): Promise<boolean> => {
  if (!isValidSlug(slug)) return false;
  const doc = await readBlogDocument();
  const posts = doc.posts.filter((post) => post.slug !== slug);
  if (posts.length === doc.posts.length) return false;
  await writeBlogDocument({ ...doc, posts });
  return true;
};
