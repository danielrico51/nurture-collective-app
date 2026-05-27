import { NextRequest } from "next/server";
import { requireAuthUserOrGuest } from "@/lib/api/authHelpers";
import { handleIntakeStorageError } from "@/lib/api/routeHelpers";
import { processConversationMessageStream } from "@/lib/conversation/engine";
import { getConversationSession } from "@/lib/conversation/storage";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuthUserOrGuest(request);
  if (error || !user) return error;

  let body: { sessionId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
    });
  }

  const sessionId = body.sessionId?.trim();
  const message = body.message?.trim();
  if (!sessionId || !message) {
    return new Response(
      JSON.stringify({ error: "sessionId and message are required" }),
      { status: 400 }
    );
  }

  try {
    const session = await getConversationSession(user.sub, sessionId, user.email);
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
      });
    }
    if (session.status === "completed") {
      return new Response(JSON.stringify({ error: "Session already completed" }), {
        status: 400,
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of processConversationMessageStream(
            session,
            message
          )) {
            if (event.type === "token") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "token", value: event.value })}\n\n`)
              );
            }
            if (event.type === "done") {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "done",
                    session: event.session,
                    intakeSubmitted: event.intakeSubmitted ?? false,
                  })}\n\n`
                )
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: err instanceof Error ? err.message : "Stream failed",
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
    const response = handleIntakeStorageError(err);
    return new Response(await response.text(), { status: response.status });
  }
}
