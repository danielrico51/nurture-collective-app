import type { EventItem } from "@/types/event";

const at = (date: string): Pick<EventItem, "eventDate" | "createdAt" | "updatedAt"> => {
  const iso = `${date}T12:00:00.000Z`;
  return { eventDate: date, createdAt: iso, updatedAt: iso };
};

export const SAMPLE_EVENTS: EventItem[] = [
  {
    slug: "childbirth-education",
    title: "Childbirth education",
    excerpt:
      "Prepare for labor, birth, and the early days with evidence-based education tailored to your goals.",
    body: `Our childbirth education series covers stages of labor, comfort techniques, partner support, and what to expect in hospital, birth center, or home settings.

Sessions are kept small so you can ask questions and build confidence before your due date. Contact us to register for the next cohort in Northern New Jersey.`,
    kind: "class",
    format: "In-person",
    location: "Northern New Jersey",
    listingStatus: "contact",
    status: "published",
    ...at("2026-06-15"),
  },
  {
    slug: "newborn-care-class",
    title: "Newborn care & feeding",
    excerpt:
      "Hands-on guidance on newborn care, breastfeeding, bottle feeding, and pumping before your baby arrives.",
    body: `Learn practical newborn care skills with experienced educators. Topics include feeding choices, diapering, soothing, and when to reach out for lactation or pediatric support.

Ideal for first-time parents and anyone wanting a refresher before baby comes home.`,
    kind: "class",
    format: "In-person",
    location: "Northern New Jersey",
    listingStatus: "upcoming",
    status: "published",
    ...at("2026-07-10"),
  },
  {
    slug: "prenatal-wellness-workshop",
    title: "Prenatal wellness workshop",
    excerpt:
      "Small-group sessions on self-care, pelvic floor health, and navigating pregnancy with community support.",
    body: `Join other expectant parents for a relaxed workshop on movement, breath, and self-care during pregnancy. Hybrid attendance available for families who prefer to join virtually.

Space is limited — register early to reserve your spot.`,
    kind: "event",
    format: "Hybrid",
    location: "Ridgewood, NJ & virtual",
    listingStatus: "upcoming",
    status: "published",
    registrationUrl: "/contact",
    ...at("2026-08-05"),
  },
  {
    slug: "postpartum-support-gathering",
    title: "Postpartum support gathering",
    excerpt:
      "Connect with other new parents in a warm, judgment-free space during the fourth trimester.",
    body: `Peer connection matters after birth. Our postpartum gatherings offer facilitated conversation, resource sharing, and community — no perfection required.

This listing is a draft example for admin testing and is not shown on the public site until published.`,
    kind: "event",
    format: "In-person",
    location: "Bergen County, NJ",
    listingStatus: "contact",
    status: "draft",
    ...at("2026-09-12"),
  },
];
