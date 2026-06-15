import { describe, expect, it } from "vitest";
import {
  buildEventCorpus,
  buildStaticEventDigestReply,
  validateEventDigestQuestion,
} from "@/lib/events/digestContent";
import type { EventItem } from "@/types/event";

const event: EventItem = {
  slug: "childbirth-101",
  title: "Childbirth 101",
  excerpt: "A welcoming introduction to labor and birth.",
  body: "Learn comfort measures, stages of labor, and partner support tips.",
  kind: "class",
  format: "In-person",
  location: "Livingston, NJ",
  eventDate: "2026-06-15",
  startTime: "18:30",
  listingStatus: "upcoming",
  status: "published",
  registrationMode: "online",
  priceCents: 15000,
  waitlistEnabled: true,
  faq: [
    {
      question: "Should I bring a partner?",
      answer: "Partners and support people are welcome.",
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("event digest", () => {
  it("validates questions", () => {
    expect(validateEventDigestQuestion("")).toBe("Please enter a question.");
    expect(validateEventDigestQuestion("  hello  ")).toBeNull();
  });

  it("builds corpus with listing, faq, and policies", () => {
    const corpus = buildEventCorpus(event, []);
    expect(corpus).toContain("Childbirth 101");
    expect(corpus).toContain("/events-and-classes/childbirth-101");
    expect(corpus).toContain("Should I bring a partner?");
    expect(corpus).toContain("Refund & cancellation policy");
    expect(corpus).toContain("(201) 623-3629");
  });

  it("answers refund questions statically", () => {
    const reply = buildStaticEventDigestReply(event, [], "What is your refund policy?");
    expect(reply).toContain("Refund & Cancellation Policy");
    expect(reply).toContain("non-refundable");
  });

  it("answers registration questions with register path", () => {
    const reply = buildStaticEventDigestReply(
      event,
      [],
      "How do I register for this class?"
    );
    expect(reply).toContain("/events-and-classes/childbirth-101/register");
    expect(reply).toContain("$150.00");
  });

  it("surfaces faq content for preparation questions", () => {
    const reply = buildStaticEventDigestReply(event, [], "What should I bring?");
    expect(reply).toContain("Should I bring a partner?");
  });
});
