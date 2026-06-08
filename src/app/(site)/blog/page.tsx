import { BlogDigest } from "@/components/Blog/BlogDigest";
import Breadcrumb from "@/components/Common/Breadcrumb";
import SectionTitle from "@/components/Common/SectionTitle";
import { formatBlogDate } from "@/lib/blog/format";
import { fetchPublishedBlogPosts } from "@/lib/blog/public";
import { brands } from "@/content/site";
import { buildPageMetadata } from "@/config/seo";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Pregnancy, Birth & Postpartum Blog",
  description:
    "Practical guidance on pregnancy, birth, postpartum recovery, lactation, and family wellness from The Nesting Place for moms in NJ, NY, CT, and PA.",
  path: "/blog",
  keywords: [
    "pregnancy blog New Jersey",
    "postpartum advice for new moms",
    "birth doula tips",
  ],
});

export default async function BlogIndexPage() {
  const posts = await fetchPublishedBlogPosts();

  return (
    <>
      <Breadcrumb pageName="Blog" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Stories & guidance for your journey"
            subtitle={`Practical support from ${brands.nestingPlace.name} — ${brands.nestingPlace.tagline.toLowerCase()}.`}
            centered
          />

          <BlogDigest articleCount={posts.length} />

          {posts.length === 0 ? (
            <p className="mt-12 text-center text-nurture-charcoal/60">
              New articles are on the way. Check back soon.
            </p>
          ) : (
            <ul className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.slug}>
                  <article className="flex h-full flex-col rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm transition hover:border-nurture-sage/30 hover:shadow-md">
                    <time
                      dateTime={post.date}
                      className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark"
                    >
                      {formatBlogDate(post.date)}
                    </time>
                    <h2 className="mt-3 font-serif text-xl font-semibold text-nurture-charcoal">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="hover:text-nurture-sage-dark"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-nurture-charcoal/75">
                      {post.excerpt}
                    </p>
                    {post.author ? (
                      <p className="mt-3 text-xs text-nurture-charcoal/50">
                        {post.author}
                      </p>
                    ) : null}
                    <Link
                      href={`/blog/${post.slug}`}
                      className="mt-4 text-sm font-semibold text-nurture-sage-dark hover:underline"
                    >
                      Read article →
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
