import type { BlogPost } from "@/types/blog";

const at = (date: string): Pick<BlogPost, "date" | "createdAt" | "updatedAt"> => {
  const iso = `${date}T12:00:00.000Z`;
  return { date, createdAt: iso, updatedAt: iso };
};

/** Seed posts for local dev and first-time S3 setup. */
export const SAMPLE_BLOG_POSTS: BlogPost[] = [
  {
    slug: "welcome-to-our-blog",
    title: "Welcome to The Nesting Place Blog",
    excerpt:
      "Stories, tips, and updates from our maternal wellness team — doula support, postpartum care, and community for growing families.",
    body: `We're glad you're here. This blog is where we share practical guidance for pregnancy, birth, and the fourth trimester — written by the same team that supports families in our Northern New Jersey practice.

Check back for articles on doula care, newborn support, lactation, and self-care. If you have a topic you'd like us to cover, reach out through our contact page.`,
    status: "published",
    author: "The Nesting Place Team",
    ...at("2026-05-01"),
  },
  {
    slug: "why-prenatal-massage-matters",
    title: "Why Prenatal Massage Matters for Moms-to-Be",
    excerpt:
      "Gentle bodywork during pregnancy can ease tension, improve sleep, and help you feel more connected to your changing body.",
    body: `Pregnancy brings joy and anticipation — and often aches, tight hips, and restless nights. Prenatal massage is designed for your stage of pregnancy, with positioning and pressure that keep you and baby safe.

Many families tell us they leave sessions feeling lighter, more grounded, and better prepared for labor. It's not a luxury; it's part of a holistic wellness plan alongside your prenatal care team.

Ask your care coordinator about availability in our active service regions.`,
    status: "published",
    author: "The Nesting Place Team",
    ...at("2026-04-15"),
  },
  {
    slug: "what-a-birth-doula-does",
    title: "What a Birth Doula Does (and Doesn't Do)",
    excerpt:
      "A doula offers continuous emotional and physical support during labor — complementing, not replacing, your clinical care team.",
    body: `A birth doula stays with you through labor and birth as a steady, trained presence. We help with comfort measures, positioning, breathing, and advocacy — so you and your partner feel informed and supported.

Doulas do not perform medical tasks or replace your OB, midwife, or nurses. Research shows doula support is associated with shorter labors, fewer interventions, and more positive birth memories.

If you're planning a hospital, birth center, or home birth, we'd love to talk about fit and availability.`,
    status: "published",
    author: "The Nesting Place Team",
    ...at("2026-03-20"),
  },
  {
    slug: "draft-postpartum-checklist",
    title: "Postpartum Home Prep Checklist (Draft)",
    excerpt:
      "A working draft of essentials for the first weeks home — not yet published.",
    body: `This post is still in draft. Topics will include feeding setup, rest stations, help schedules, and when to call your pediatrician or lactation consultant.`,
    status: "draft",
    author: "The Nesting Place Team",
    ...at("2026-05-28"),
  },
];
