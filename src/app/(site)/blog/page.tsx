import { BlogDigest } from "@/components/Blog/BlogDigest";
import Breadcrumb from "@/components/Common/Breadcrumb";
import PageIntroWithImage from "@/components/Common/PageIntroWithImage";
import SectionTitle from "@/components/Common/SectionTitle";
import { pageArtwork } from "@/config/pageArtwork";
import {
  MARKETING_OAK_SURFACE,
  marketingCard,
  marketingLink,
  marketingPageShell,
} from "@/config/marketingDesign";
import { fetchPublishedBlogPosts } from "@/lib/blog/public";
import { formatBlogDate } from "@/lib/blog/format";
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
    <div className={marketingPageShell}>
      <Breadcrumb pageName="Blog" />
      <section className="py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <PageIntroWithImage
            imageSrc={pageArtwork.blog.src}
            imageAlt={pageArtwork.blog.alt}
            blend="strong"
          >
            <SectionTitle
              title="Stories & guidance for your journey"
              subtitle={`Practical support from ${brands.nestingPlace.name} — ${brands.nestingPlace.tagline.toLowerCase()}.`}
              centered={false}
            />
          </PageIntroWithImage>
        </div>
      </section>

      <section
        className="py-10 sm:py-12 lg:py-14"
        style={{ backgroundColor: MARKETING_OAK_SURFACE }}
      >
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <BlogDigest articleCount={posts.length} />

          {posts.length === 0 ? (
            <p className="mt-12 text-center text-nurture-charcoal/60">
              New articles are on the way. Check back soon.
            </p>
          ) : (
            <ul className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.slug}>
                  <article className={`flex h-full flex-col ${marketingCard} transition hover:border-nurture-lilac/45 hover:shadow-md`}>
                    <time
                      dateTime={post.date}
                      className="text-xs font-semibold uppercase tracking-wide text-nurture-grape"
                    >
                      {formatBlogDate(post.date)}
                    </time>
                    <h2 className="mt-3 font-serif text-xl font-semibold text-nurture-charcoal">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="hover:text-nurture-grape"
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
                      className={`mt-4 text-sm font-semibold ${marketingLink}`}
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
    </div>
  );
}
