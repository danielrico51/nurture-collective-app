import { fetchAuthSession } from "aws-amplify/auth";
import type { ConversationSession } from "@/types/conversation";

const authHeaders = async (): Promise<HeadersInit> => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const startConversation = async (
  defaults?: {
    email?: string;
    name?: string;
    phone?: string;
  },
  options?: { forceNew?: boolean }
): Promise<{
  session: ConversationSession;
  quickReplies: string[];
}> => {
  const response = await fetch("/api/conversation/start", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ ...(defaults ?? {}), forceNew: options?.forceNew === true }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not start conversation");
  }
  return data;
};

export const sendConversationMessage = async (
  sessionId: string,
  message: string,
  handlers: {
    onToken: (token: string) => void;
    onDone: (payload: {
      session: ConversationSession;
      intakeSubmitted?: boolean;
    }) => void;
    onError: (error: string) => void;
  }
): Promise<void> => {
  const response = await fetch("/api/conversation/message", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ sessionId, message }),
  });

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    handlers.onError(
      typeof data.error === "string" ? data.error : "Message failed"
    );
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const event = JSON.parse(payload) as {
          type: string;
          value?: string;
          session?: ConversationSession;
          intakeSubmitted?: boolean;
          error?: string;
        };
        if (event.type === "token" && event.value) handlers.onToken(event.value);
        if (event.type === "done" && event.session) {
          handlers.onDone({
            session: event.session,
            intakeSubmitted: event.intakeSubmitted,
          });
        }
        if (event.type === "error") handlers.onError(event.error ?? "Stream error");
      } catch {
        /* ignore */
      }
    }
  }
};

export const fetchConversation = async (
  sessionId: string
): Promise<ConversationSession> => {
  const response = await fetch(`/api/conversation/${sessionId}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not load conversation");
  }
  return data.session;
};
