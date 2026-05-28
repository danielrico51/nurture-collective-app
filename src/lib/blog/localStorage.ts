import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { normalizeBlogPost } from "@/lib/blog/normalize";
import type { BlogDocument } from "@/types/blog";

const LOCAL_DIR = path.join(process.cwd(), ".data", "blog");
const LOCAL_FILE = path.join(LOCAL_DIR, "posts.json");

export const emptyBlogDocument = (): BlogDocument => ({
  version: 1,
  posts: [],
  updatedAt: new Date().toISOString(),
});

export const readLocalBlogDocument = async (): Promise<BlogDocument> => {
  try {
    const body = await readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(body) as BlogDocument;
    if (!Array.isArray(parsed.posts)) return emptyBlogDocument();
    return {
      ...parsed,
      posts: parsed.posts.map((post) => normalizeBlogPost(post)),
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return emptyBlogDocument();
    throw error;
  }
};

export const writeLocalBlogDocument = async (
  document: BlogDocument
): Promise<void> => {
  await mkdir(LOCAL_DIR, { recursive: true });
  const payload: BlogDocument = {
    ...document,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(LOCAL_FILE, JSON.stringify(payload, null, 2), "utf8");
};
