/**
 * Import blog posts from thenestingplacenj.com (Wix) into local + committed JSON.
 *
 * Usage:
 *   npm run import:legacy-blog
 *   npm run import:legacy-blog -- --write-local   # also writes .data/blog/posts.json
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { BlogDocument, BlogPost } from "../src/types/blog";

const LEGACY_ORIGIN = "https://www.thenestingplacenj.com";
const SITEMAP_URL = `${LEGACY_ORIGIN}/blog-posts-sitemap.xml`;
const OUTPUT_TS = path.join(
  process.cwd(),
  "src/lib/blog/legacyImported.ts"
);
const OUTPUT_LOCAL = path.join(process.cwd(), ".data/blog/posts.json");

type SitemapEntry = { url: string; lastmod: string };
type JsonLdPost = {
  headline?: string;
  description?: string;
  datePublished?: string;
  author?: { name?: string };
};

const decodeHtml = (value: string): string =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();

const stripTags = (value: string): string =>
  decodeHtml(value.replace(/<[^>]+>/g, " "));

const parseSitemap = (xml: string): SitemapEntry[] => {
  const entries: SitemapEntry[] = [];
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  for (const block of urlBlocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim();
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim();
    if (loc?.includes("/post/") && lastmod) {
      entries.push({ url: loc, lastmod });
    }
  }
  return entries;
};

const parseJsonLd = (html: string): JsonLdPost | null => {
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]) as JsonLdPost & { "@type"?: string };
    if (parsed["@type"] === "BlogPosting" || parsed.headline) return parsed;
  } catch {
    /* ignore */
  }
  return null;
};

const extractBodyBlocks = (
  html: string
): Array<{ type: "h2" | "p"; text: string }> => {
  const start = html.indexOf('data-id="content-viewer"');
  if (start < 0) return [];
  const end = html.indexOf('<div type="last"', start);
  const chunk = html.slice(start, end > start ? end : undefined);

  const blocks: Array<{ type: "h2" | "p"; text: string }> = [];
  const re =
    /<h2 class="UFQNs[\s\S]*?<\/h2>|<p class="-Q4aO[\s\S]*?<\/p>/g;

  let match: RegExpExecArray | null;
  while ((match = re.exec(chunk)) !== null) {
    const raw = match[0];
    const isHeading = raw.startsWith("<h2");
    const text = stripTags(raw);
    if (!text) continue;
    blocks.push({ type: isHeading ? "h2" : "p", text });
  }
  return blocks;
};

const blocksToBody = (blocks: Array<{ type: "h2" | "p"; text: string }>): string =>
  blocks
    .map((block) => (block.type === "h2" ? `## ${block.text}` : block.text))
    .join("\n\n");

const slugFromUrl = (url: string): string => {
  const segment = url.split("/post/")[1]?.replace(/\/$/, "") ?? "post";
  return segment.toLowerCase();
};

const toIsoDate = (value: string): string => value.slice(0, 10);

const buildPost = (
  entry: SitemapEntry,
  html: string
): BlogPost | null => {
  const jsonLd = parseJsonLd(html);
  const title =
    jsonLd?.headline?.trim() ||
    html.match(/data-hook="post-title"[^>]*>[\s\S]*?<h1[^>]*>([^<]+)<\/h1>/)?.[1]?.trim();
  if (!title) return null;

  const blocks = extractBodyBlocks(html);
  const body = blocksToBody(blocks);
  if (!body) return null;

  const published = jsonLd?.datePublished ?? entry.lastmod;
  const date = toIsoDate(published);
  const iso = `${date}T12:00:00.000Z`;
  const excerpt =
    decodeHtml(jsonLd?.description ?? "").slice(0, 280) ||
    body.replace(/^##\s+/gm, "").slice(0, 280);

  return {
    slug: slugFromUrl(entry.url),
    title: decodeHtml(title),
    excerpt,
    body,
    date,
    status: "published",
    author: jsonLd?.author?.name?.trim() || "The Nesting Place",
    externalUrl: entry.url,
    createdAt: iso,
    updatedAt: iso,
  };
};

const writeLegacyModule = async (posts: BlogPost[]) => {
  const payload = JSON.stringify(posts, null, 2);
  const moduleSource = `import type { BlogPost } from "@/types/blog";

/** Imported from ${LEGACY_ORIGIN}/blog — regenerate with \`npm run import:legacy-blog\`. */
export const LEGACY_IMPORTED_BLOG_POSTS: BlogPost[] = ${payload};
`;
  await writeFile(OUTPUT_TS, moduleSource, "utf8");
};

const writeLocalDocument = async (posts: BlogPost[]) => {
  const doc: BlogDocument = {
    version: 1,
    posts,
    updatedAt: new Date().toISOString(),
  };
  await mkdir(path.dirname(OUTPUT_LOCAL), { recursive: true });
  await writeFile(OUTPUT_LOCAL, JSON.stringify(doc, null, 2), "utf8");
};

const main = async () => {
  const writeLocal = process.argv.includes("--write-local");

  console.log(`Fetching sitemap: ${SITEMAP_URL}`);
  const sitemapRes = await fetch(SITEMAP_URL);
  if (!sitemapRes.ok) {
    throw new Error(`Sitemap fetch failed: ${sitemapRes.status}`);
  }
  const sitemapXml = await sitemapRes.text();
  const entries = parseSitemap(sitemapXml);
  console.log(`Found ${entries.length} legacy posts.`);

  const posts: BlogPost[] = [];
  for (const entry of entries) {
    process.stdout.write(`Importing ${entry.url}… `);
    const res = await fetch(entry.url);
    if (!res.ok) {
      console.log(`SKIP (${res.status})`);
      continue;
    }
    const html = await res.text();
    const post = buildPost(entry, html);
    if (!post) {
      console.log("SKIP (parse failed)");
      continue;
    }
    posts.push(post);
    console.log("OK");
    await new Promise((r) => setTimeout(r, 300));
  }

  posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  await writeLegacyModule(posts);
  console.log(`Wrote ${posts.length} posts → ${OUTPUT_TS}`);

  if (writeLocal) {
    await writeLocalDocument(posts);
    console.log(`Wrote local storage → ${OUTPUT_LOCAL}`);
  } else {
    console.log("Tip: run with --write-local to refresh .data/blog/posts.json");
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
