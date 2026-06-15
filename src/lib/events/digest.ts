import "server-only";

import {
  detectSafetyEscalation,
  SAFETY_ESCALATION_REPLY,
} from "@/lib/conversation/safety";
import {
  buildEventCorpus,
  buildEventDigestSystemPrompt,
  buildStaticEventDigestReply,
  normalizeEventDigestHistory,
} from "@/lib/events/digestContent";
import { getEventBySlug, listPublishedEvents } from "@/lib/events/storage";
import {
  isOpenAiConfigured,
  streamChatCompletion,
  type ChatMessage,
} from "@/lib/openai/client";
import type { EventDigestHistoryMessage } from "@/types/event";

const MAX_RELATED_LISTINGS = 6;

export {
  buildEventCorpus,
  buildStaticEventDigestReply,
  normalizeEventDigestHistory,
  validateEventDigestQuestion,
} from "@/lib/events/digestContent";

export async function* streamEventDigestAnswer(
  slug: string,
  question: string,
  history: EventDigestHistoryMessage[] = []
): AsyncGenerator<string, string, unknown> {
  if (detectSafetyEscalation(question)) {
    yield SAFETY_ESCALATION_REPLY;
    return SAFETY_ESCALATION_REPLY;
  }

  const event = await getEventBySlug(slug);
  if (!event) {
    const missing = "This listing could not be found.";
    yield missing;
    return missing;
  }

  const related = (await listPublishedEvents())
    .filter((entry) => entry.slug !== event.slug)
    .slice(0, MAX_RELATED_LISTINGS);

  if (!isOpenAiConfigured()) {
    const staticReply = buildStaticEventDigestReply(event, related, question);
    yield staticReply;
    return staticReply;
  }

  const corpus = buildEventCorpus(event, related);
  const messages: ChatMessage[] = [
    { role: "system", content: buildEventDigestSystemPrompt(corpus, event) },
    ...normalizeEventDigestHistory(history).map((item) => ({
      role: item.role,
      content: item.content,
    })),
    { role: "user", content: question },
  ];

  let full = "";
  try {
    for await (const token of streamChatCompletion(messages)) {
      full += token;
      yield token;
    }
    return full;
  } catch (error) {
    console.error("[events-digest] OpenAI failed, using static digest:", error);
    const staticReply = buildStaticEventDigestReply(event, related, question);
    yield staticReply;
    return staticReply;
  }
}
