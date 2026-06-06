import "server-only";

import {
  detectSafetyEscalation,
  SAFETY_ESCALATION_REPLY,
} from "@/lib/conversation/safety";
import {
  isOpenAiConfigured,
  streamChatCompletion,
  type ChatMessage,
} from "@/lib/openai/client";
import { listPublishedPosts } from "@/lib/blog/storage";
import type { BlogDigestHistoryMessage, BlogPost } from "@/types/blog";

const MAX_BODY_CHARS_PER_POST = 2200;
const MAX_QUESTION_CHARS = 500;
const MAX_HISTORY_MESSAGES = 8;

const truncateBody = (body: string): string => {
  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_BODY_CHARS_PER_POST) return normalized;
  return `${normalized.slice(0, MAX_BODY_CHARS_PER_POST)}…`;
};

export const buildBlogCorpus = (posts: BlogPost[]): string =>
  posts
    .map(
      (post) =>
        `### ${post.title}
Path: /blog/${post.slug}
Date: ${post.date}
Author: ${post.author ?? "The Nesting Place"}
Excerpt: ${post.excerpt}
Content: ${truncateBody(post.body)}`
    )
    .join("\n\n---\n\n");

const buildSystemPrompt = (corpus: string): string =>
  `You are a warm, supportive blog guide for The Nesting Place — helping pregnant and postpartum moms explore our article library.

Your job:
- Summarize articles, highlight key takeaways, and recommend what to read next.
- Answer questions only using the article library below. If something is not covered, say so kindly and point to the closest related articles.
- When you reference an article, include its path exactly like /blog/article-slug so readers can open it.
- Use clear, encouraging language. Prefer short paragraphs and bullet points for lists.
- This is educational support, not medical advice. Do not diagnose or prescribe. Encourage moms to talk with their care team for personal medical questions.
- Keep most answers under 250 words unless the mom asks for more detail.

Article library:
${corpus}`;

export const validateDigestQuestion = (message: string): string | null => {
  const trimmed = message.trim();
  if (!trimmed) return "Please enter a question.";
  if (trimmed.length > MAX_QUESTION_CHARS) {
    return `Questions must be ${MAX_QUESTION_CHARS} characters or fewer.`;
  }
  return null;
};

export const normalizeDigestHistory = (
  history: BlogDigestHistoryMessage[] | undefined
): BlogDigestHistoryMessage[] => {
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

const isBroadSummaryQuestion = (question: string): boolean =>
  /\b(takeaway|key point|summary|summarize|overview|main theme|highlights?|what should i read|read first|across these)\b/i.test(
    question
  );

const sortPostsNewestFirst = (posts: BlogPost[]): BlogPost[] =>
  [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

const formatPostBullets = (posts: BlogPost[]): string =>
  posts
    .map((post) => `• ${post.title} — /blog/${post.slug}\n  ${post.excerpt}`)
    .join("\n\n");

export const buildStaticDigestReply = (
  posts: BlogPost[],
  question: string
): string => {
  const sorted = sortPostsNewestFirst(posts);

  if (isBroadSummaryQuestion(question)) {
    return [
      "Main takeaways from our article library:",
      "",
      formatPostBullets(sorted),
      "",
      "Open any link above for the full article, or ask a follow-up about a specific topic (doula, breastfeeding, postpartum, and more).",
    ].join("\n");
  }

  const q = question.toLowerCase();
  const terms = q
    .split(/\W+/)
    .filter((term) => term.length > 3)
    .slice(0, 8);

  const scored = sorted.map((post) => {
    const haystack =
      `${post.title} ${post.excerpt} ${post.body}`.toLowerCase();
    const score = terms.reduce(
      (total, term) => total + (haystack.includes(term) ? 1 : 0),
      0
    );
    return { post, score };
  });

  const matches = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.post);

  const picks = (matches.length > 0 ? matches : sorted).slice(0, 5);

  return [
    "Here’s what our articles cover on that topic:",
    "",
    formatPostBullets(picks),
    "",
    "Open any link above for the full story, or ask your care team for personalized guidance.",
  ].join("\n");
};

/** @deprecated Use buildStaticDigestReply */
export const buildFallbackDigestReply = buildStaticDigestReply;

export async function* streamBlogDigestAnswer(
  question: string,
  history: BlogDigestHistoryMessage[] = []
): AsyncGenerator<string, string, unknown> {
  if (detectSafetyEscalation(question)) {
    yield SAFETY_ESCALATION_REPLY;
    return SAFETY_ESCALATION_REPLY;
  }

  const posts = await listPublishedPosts();
  if (posts.length === 0) {
    const empty =
      "Our blog library is still being set up. Check back soon for articles on pregnancy, birth, and postpartum.";
    yield empty;
    return empty;
  }

  if (!isOpenAiConfigured()) {
    const staticReply = buildStaticDigestReply(posts, question);
    yield staticReply;
    return staticReply;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(buildBlogCorpus(posts)) },
    ...normalizeDigestHistory(history).map((item) => ({
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
    console.error("[blog-digest] OpenAI failed, using static digest:", error);
    const staticReply = buildStaticDigestReply(posts, question);
    yield staticReply;
    return staticReply;
  }
}
