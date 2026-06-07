/**
 * Merge migrated legacy blog posts into S3 (or local .data/blog/posts.json).
 *
 * Usage:
 *   npm run sync:legacy-blog
 *   TASKS_S3_BUCKET=nurture-collective-tasks npm run sync:legacy-blog
 */
import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import { resolve, join } from "path";
import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { LEGACY_IMPORTED_BLOG_POSTS } from "../src/lib/blog/legacyImported";
import { normalizeBlogPost } from "../src/lib/blog/normalize";
import type { BlogDocument } from "../src/types/blog";

const loadEnvFile = (filename: string) => {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
};

loadEnvFile(".env.local");
loadEnvFile(".env");

const SAMPLE_PLACEHOLDER_SLUGS = new Set([
  "welcome-to-our-blog",
  "why-prenatal-massage-matters",
  "what-a-birth-doula-does",
  "draft-postpartum-checklist",
]);

const DEFAULT_S3_KEY = "management/blog/posts.json";
const DEFAULT_BUCKET = "nurture-collective-tasks";
const LOCAL_FILE = join(process.cwd(), ".data", "blog", "posts.json");

const emptyDocument = (): BlogDocument => ({
  version: 1,
  posts: [],
  updatedAt: new Date().toISOString(),
});

const isLocalStorageEnabled = () => {
  if (process.env.BLOG_USE_LOCAL_STORAGE === "true") return true;
  if (process.env.TASKS_S3_BUCKET?.trim()) return false;
  return process.env.NODE_ENV === "development";
};

const readLocalDocument = async (): Promise<BlogDocument> => {
  try {
    const body = await readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(body) as BlogDocument;
    if (!Array.isArray(parsed.posts)) return emptyDocument();
    return {
      ...parsed,
      posts: parsed.posts.map((post) => normalizeBlogPost(post)),
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return emptyDocument();
    throw error;
  }
};

const writeLocalDocument = async (document: BlogDocument): Promise<void> => {
  await mkdir(join(process.cwd(), ".data", "blog"), { recursive: true });
  await writeFile(
    LOCAL_FILE,
    JSON.stringify({ ...document, updatedAt: new Date().toISOString() }, null, 2),
    "utf8"
  );
};

const readS3Document = async (): Promise<BlogDocument> => {
  const region = process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1";
  const client = new S3Client({ region });
  const Bucket =
    process.env.BLOG_S3_BUCKET?.trim() ||
    process.env.TASKS_S3_BUCKET?.trim() ||
    DEFAULT_BUCKET;
  const Key = process.env.BLOG_S3_KEY?.trim() || DEFAULT_S3_KEY;

  try {
    const response = await client.send(new GetObjectCommand({ Bucket, Key }));
    const body = await response.Body?.transformToString();
    if (!body) return emptyDocument();
    const parsed = JSON.parse(body) as BlogDocument;
    if (!Array.isArray(parsed.posts)) return emptyDocument();
    return {
      ...parsed,
      posts: parsed.posts.map((post) => normalizeBlogPost(post)),
    };
  } catch (error) {
    if (error instanceof NoSuchKey) return emptyDocument();
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (
      err.name === "NoSuchKey" ||
      err.name === "NotFound" ||
      err.$metadata?.httpStatusCode === 404
    ) {
      return emptyDocument();
    }
    throw error;
  }
};

const writeS3Document = async (document: BlogDocument): Promise<void> => {
  const region = process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1";
  const client = new S3Client({ region });
  const Bucket =
    process.env.BLOG_S3_BUCKET?.trim() ||
    process.env.TASKS_S3_BUCKET?.trim() ||
    DEFAULT_BUCKET;
  const Key = process.env.BLOG_S3_KEY?.trim() || DEFAULT_S3_KEY;

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

const mergeLegacyPosts = (doc: BlogDocument) => {
  const existingSlugs = new Set(doc.posts.map((post) => post.slug));
  const missing = LEGACY_IMPORTED_BLOG_POSTS.filter(
    (post) => !existingSlugs.has(post.slug)
  );
  if (missing.length === 0) {
    return { document: doc, added: 0, removedSamples: 0 };
  }

  let posts = [...doc.posts, ...missing];
  const removedSamples = posts.filter((post) =>
    SAMPLE_PLACEHOLDER_SLUGS.has(post.slug)
  ).length;
  posts = posts.filter((post) => !SAMPLE_PLACEHOLDER_SLUGS.has(post.slug));

  return {
    document: { ...doc, posts },
    added: missing.length,
    removedSamples,
  };
};

const main = async () => {
  const mode = isLocalStorageEnabled() ? "local" : "s3";
  console.log(`Blog storage mode: ${mode}`);

  const doc =
    mode === "local" ? await readLocalDocument() : await readS3Document();
  const { document, added, removedSamples } = mergeLegacyPosts(doc);

  if (added === 0) {
    console.log("No missing legacy posts — storage is already up to date.");
    return;
  }

  if (mode === "local") {
    await writeLocalDocument(document);
  } else {
    await writeS3Document(document);
  }

  console.log(
    `Done. Added ${added} legacy post(s), removed ${removedSamples} placeholder sample(s).`
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
