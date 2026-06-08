import { BlogPostBody } from "@/components/Blog/BlogPostBody";
import Breadcrumb from "@/components/Common/Breadcrumb";
import JsonLd from "@/components/Seo/JsonLd";
import { buildPageMetadata } from "@/config/seo";
import { formatBlogDate } from "@/lib/blog/format";
import { fetchPublishedBlogPost, fetchPublishedBlogPosts } from "@/lib/blog/public";
import { buildArticleJsonLd } from "@/lib/seo/jsonLd";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface BlogPostPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const post = await fetchPublishedBlogPost(params.slug);
  if (!post) {
    return buildPageMetadata({
      title: "Blog Article",
      description: "Articles on pregnancy, birth, and postpartum from The Nesting Place.",
      path: "/blog",
    });
  }
  return buildPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    openGraphType: "article",
    keywords: ["pregnancy", "postpartum", "birth", "maternal wellness"],
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await fetchPublishedBlogPost(params.slug);
  if (!post) notFound();

  const allPosts = await fetchPublishedBlogPosts();
  const morePosts = allPosts.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={buildArticleJsonLd({
          title: post.title,
          description: post.excerpt,
          slug: post.slug,
          date: post.date,
          updatedAt: post.updatedAt,
          author: post.author,
        })}
      />
      <Breadcrumb pageName="Blog" />
      <article className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="text-sm font-semibold text-nurture-sage-dark hover:underline"
          >
            ← All articles
          </Link>

          <header className="mt-8 border-b border-nurture-sage/15 pb-8">
            <time
              dateTime={post.date}
              className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark"
            >
              {formatBlogDate(post.date)}
            </time>
            <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight text-nurture-charcoal sm:text-4xl">
              {post.title}
            </h1>
            {post.author ? (
              <p className="mt-3 text-sm text-nurture-charcoal/60">By {post.author}</p>
            ) : null}
            {post.excerpt ? (
              <p className="mt-4 text-lg text-nurture-charcoal/75">{post.excerpt}</p>
            ) : null}
          </header>

          <div className="mt-10">
            <BlogPostBody body={post.body} />
          </div>

          {post.externalUrl ? (
            <p className="mt-10 text-sm text-nurture-charcoal/60">
              Originally published on our{" "}
              <a
                href={post.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-nurture-sage-dark hover:underline"
              >
                previous site
              </a>
              .
            </p>
          ) : null}

          {morePosts.length > 0 ? (
            <aside className="mt-16 rounded-2xl border border-nurture-sage/15 bg-nurture-cream/40 p-6">
              <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
                More to read
              </h2>
              <ul className="mt-4 space-y-3">
                {morePosts.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/blog/${item.slug}`}
                      className="text-sm font-medium text-nurture-sage-dark hover:underline"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </article>
    </>
  );
}
