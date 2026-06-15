import { classRefundPolicy } from "@/content/events";
import { brands } from "@/content/site";
import {
  formatEventDate,
  formatEventPrice,
  formatEventSchedule,
  kindLabel,
  REGISTRATION_MODE_LABELS,
} from "@/lib/events/format";
import type { EventDigestHistoryMessage, EventItem } from "@/types/event";

const MAX_BODY_CHARS = 2200;
export const MAX_EVENT_DIGEST_QUESTION_CHARS = 500;
const MAX_HISTORY_MESSAGES = 8;

const truncateText = (text: string, max = MAX_BODY_CHARS): string => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}…`;
};

const formatFaq = (event: EventItem): string => {
  if (!event.faq?.length) return "None listed.";
  return event.faq
    .map((entry) => `Q: ${entry.question}\nA: ${entry.answer}`)
    .join("\n\n");
};

export const buildPrimaryEventSection = (event: EventItem): string => {
  const priceLabel = formatEventPrice(event.priceCents);
  const schedule = formatEventSchedule(event.eventDate, event.startTime);

  return `### ${event.title}
Path: /events-and-classes/${event.slug}
Kind: ${kindLabel(event.kind)}
Date: ${formatEventDate(event.eventDate)}
Schedule: ${schedule}
Format: ${event.format}
Location: ${event.location ?? "See listing"}
${priceLabel ? `Fee: ${priceLabel}` : "Fee: No fee listed"}
Registration: ${REGISTRATION_MODE_LABELS[event.registrationMode ?? "contact"]}
${typeof event.capacity === "number" ? `Capacity: ${event.capacity}` : ""}
${event.waitlistEnabled ? "Waitlist: enabled when full" : ""}
${event.instructorName ? `Instructor: ${event.instructorName}` : ""}
Excerpt: ${event.excerpt}
Details: ${truncateText(event.body)}
FAQ:
${formatFaq(event)}`;
};

export const buildRelatedEventsSection = (events: EventItem[]): string => {
  if (!events.length) return "";
  return events
    .map(
      (event) =>
        `• ${event.title} (${kindLabel(event.kind)}) — /events-and-classes/${event.slug}\n  ${event.excerpt}`
    )
    .join("\n\n");
};

export const buildEventCorpus = (
  event: EventItem,
  related: EventItem[]
): string => {
  const sections = [
    buildPrimaryEventSection(event),
    `### Refund & cancellation policy
${classRefundPolicy.paragraphs.join(" ")}`,
    related.length
      ? `### Other published listings\n${buildRelatedEventsSection(related)}`
      : "",
    `### Contact The Nesting Place
Phone: ${brands.nestingPlace.localPhone}
Email: ${brands.nestingPlace.email}
Website classes page: /events-and-classes`,
  ];

  return sections.filter(Boolean).join("\n\n---\n\n");
};

export const buildEventDigestSystemPrompt = (
  corpus: string,
  event: EventItem
): string =>
  `You are a warm, supportive class & events guide for The Nesting Place — helping pregnant and postpartum families learn about "${event.title}" and related offerings.

Your job:
- Answer questions about this class or event using the knowledge base below (listing details, FAQ, policies, and related classes).
- When referencing this listing or another, include paths exactly like /events-and-classes/slug so readers can open them.
- For registration and payment, explain what the listing says (online registration, fees, waitlist). Do not invent prices or dates not in the knowledge base.
- Use clear, encouraging language. Prefer short paragraphs and bullet points for lists.
- This is educational support, not medical advice. Do not diagnose or prescribe.
- If you cannot answer from the knowledge base, say so kindly and suggest calling ${brands.nestingPlace.localPhone} or using the contact form.
- Keep most answers under 250 words unless the user asks for more detail.

Knowledge base:
${corpus}`;

export const validateEventDigestQuestion = (message: string): string | null => {
  const trimmed = message.trim();
  if (!trimmed) return "Please enter a question.";
  if (trimmed.length > MAX_EVENT_DIGEST_QUESTION_CHARS) {
    return `Questions must be ${MAX_EVENT_DIGEST_QUESTION_CHARS} characters or fewer.`;
  }
  return null;
};

export const normalizeEventDigestHistory = (
  history: EventDigestHistoryMessage[] | undefined
): EventDigestHistoryMessage[] => {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim()
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }));
};

const formatFaqBullets = (event: EventItem): string => {
  if (!event.faq?.length) {
    return "We don't have FAQ entries for this listing yet — ask our team or check the class details above.";
  }
  return event.faq
    .map((entry) => `• ${entry.question}\n  ${entry.answer}`)
    .join("\n\n");
};

export const buildStaticEventDigestReply = (
  event: EventItem,
  related: EventItem[],
  question: string
): string => {
  const q = question.toLowerCase();

  if (/\b(refund|cancel|credit|policy)\b/i.test(q)) {
    return [
      classRefundPolicy.title,
      "",
      ...classRefundPolicy.paragraphs.map((paragraph) => `• ${paragraph}`),
      "",
      `Questions? Call ${brands.nestingPlace.localPhone} or email ${brands.nestingPlace.email}.`,
    ].join("\n");
  }

  if (/\b(register|sign up|signup|book|waitlist|spot)\b/i.test(q)) {
    const registerPath = `/events-and-classes/${event.slug}/register`;
    const mode = event.registrationMode ?? "contact";
    if (mode === "online") {
      return [
        `You can register online for ${event.title}:`,
        registerPath,
        "",
        formatEventPrice(event.priceCents)
          ? `The listed fee is ${formatEventPrice(event.priceCents)}. You can pay by card or Venmo during registration.`
          : "See the listing for any fee details.",
        "",
        `Still unsure? Call ${brands.nestingPlace.localPhone}.`,
      ].join("\n");
    }
    return [
      `Registration for ${event.title} is handled via ${REGISTRATION_MODE_LABELS[mode].toLowerCase()}.`,
      `View details: /events-and-classes/${event.slug}`,
      "",
      `Call ${brands.nestingPlace.localPhone} and we'll help you sign up.`,
    ].join("\n");
  }

  if (/\b(faq|question|bring|prepare|learn|cover)\b/i.test(q)) {
    return [
      `Here's what we share about ${event.title}:`,
      "",
      event.excerpt,
      "",
      "FAQ:",
      formatFaqBullets(event),
    ].join("\n");
  }

  const terms = q
    .split(/\W+/)
    .filter((term) => term.length > 3)
    .slice(0, 8);

  const pool = [event, ...related];
  const scored = pool.map((entry) => {
    const haystack =
      `${entry.title} ${entry.excerpt} ${entry.body} ${entry.faq?.map((item) => `${item.question} ${item.answer}`).join(" ") ?? ""}`.toLowerCase();
    const score = terms.reduce(
      (total, term) => total + (haystack.includes(term) ? 1 : 0),
      0
    );
    return { entry, score };
  });

  const picks = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.entry);

  const recommendations = (picks.length ? picks : [event]).slice(0, 3);

  return [
    `Here's what I found about "${event.title}":`,
    "",
    event.excerpt,
    "",
    "Helpful links:",
    ...recommendations.map(
      (entry) => `• ${entry.title} — /events-and-classes/${entry.slug}`
    ),
    "",
    `For personal questions, call ${brands.nestingPlace.localPhone}.`,
  ].join("\n");
};
