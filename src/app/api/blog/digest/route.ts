import { NextRequest } from "next/server";
import { handleBlogStorageError } from "@/lib/api/routeHelpers";
import {
  normalizeDigestHistory,
  streamBlogDigestAnswer,
  validateDigestQuestion,
} from "@/lib/blog/digest";
import type { BlogDigestHistoryMessage } from "@/types/blog";
import { checkRateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const getClientKey = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return `blog-digest:${forwarded.split(",")[0]?.trim() ?? "unknown"}`;
  return `blog-digest:${request.headers.get("x-real-ip") ?? "unknown"}`;
};

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(
    getClientKey(request),
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS
  );
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many questions. Please wait a moment and try again." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { message?: string; history?: BlogDigestHistoryMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const message = body.message?.trim() ?? "";
  const validationError = validateDigestQuestion(message);
  if (validationError) {
    return new Response(JSON.stringify({ error: validationError }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const history = normalizeDigestHistory(body.history);

  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const token of streamBlogDigestAnswer(message, history)) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "token", value: token })}\n\n`
              )
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const response = handleBlogStorageError(err);
          const payload = await response.json().catch(() => ({
            error: err instanceof Error ? err.message : "Digest failed",
          }));
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error:
                  typeof payload.error === "string"
                    ? payload.error
                    : "Digest failed",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const response = handleBlogStorageError(err);
    return new Response(await response.text(), { status: response.status });
  }
}
