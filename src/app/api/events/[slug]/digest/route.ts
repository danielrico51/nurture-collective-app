import { NextRequest } from "next/server";
import { handleEventsStorageError } from "@/lib/api/routeHelpers";
import {
  normalizeEventDigestHistory,
  streamEventDigestAnswer,
  validateEventDigestQuestion,
} from "@/lib/events/digest";
import { getEventBySlug } from "@/lib/events/storage";
import type { EventDigestHistoryMessage } from "@/types/event";
import { checkRateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const getClientKey = (request: NextRequest, slug: string): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  return `event-digest:${slug}:${ip}`;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const event = await getEventBySlug(params.slug);
  if (!event) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rateLimit = checkRateLimit(
    getClientKey(request, params.slug),
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS
  );
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many questions. Please wait a moment and try again." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { message?: string; history?: EventDigestHistoryMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const message = body.message?.trim() ?? "";
  const validationError = validateEventDigestQuestion(message);
  if (validationError) {
    return new Response(JSON.stringify({ error: validationError }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const history = normalizeEventDigestHistory(body.history);

  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const token of streamEventDigestAnswer(
            params.slug,
            message,
            history
          )) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "token", value: token })}\n\n`
              )
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const response = handleEventsStorageError(err);
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
    const response = handleEventsStorageError(err);
    return new Response(await response.text(), { status: response.status });
  }
}
