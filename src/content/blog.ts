/**
 * @deprecated Blog posts are stored in S3 (see `src/lib/blog/storage.ts`).
 * Legacy external links kept for reference during migration.
 */
export interface LegacyBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  externalUrl: string;
}

/** Curated from Alison's blog at thenestingplacenj.com/blog */
export const legacyBlogPosts: LegacyBlogPost[] = [
  {
    slug: "prenatal-massage-wellness",
    title: "Why Prenatal Massage and Wellness Matter for Moms-to-Be",
    excerpt:
      "Pregnancy is a beautiful journey filled with excitement, anticipation, and sometimes, a bit of discomfort.",
    date: "2026-01-05",
    externalUrl:
      "https://www.thenestingplacenj.com/post/why-prenatal-massage-and-wellness-matter-for-moms-to-be",
  },
];
