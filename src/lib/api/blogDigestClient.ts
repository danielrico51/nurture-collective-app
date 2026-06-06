import type { BlogDigestHistoryMessage } from "@/types/blog";

export const sendBlogDigestQuestion = async (
  message: string,
  history: BlogDigestHistoryMessage[],
  handlers: {
    onToken: (token: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
  }
): Promise<void> => {
  const response = await fetch("/api/blog/digest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    handlers.onError(
      typeof data.error === "string" ? data.error : "Question failed"
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
      if (payload === "[DONE]") {
        handlers.onDone();
        return;
      }
      try {
        const event = JSON.parse(payload) as {
          type: string;
          value?: string;
          error?: string;
        };
        if (event.type === "token" && event.value) handlers.onToken(event.value);
        if (event.type === "error") handlers.onError(event.error ?? "Stream error");
      } catch {
        /* ignore malformed chunks */
      }
    }
  }

  handlers.onDone();
};
