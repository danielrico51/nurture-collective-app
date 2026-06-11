export const getOpenAiApiKey = (): string | undefined =>
  process.env.OPENAI_API_KEY?.trim() || undefined;

export const getOpenAiModel = (): string =>
  process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

export const isOpenAiConfigured = (): boolean => Boolean(getOpenAiApiKey());

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamChatCompletionOptions {
  signal?: AbortSignal;
}

export interface ChatCompletionTextOptions {
  signal?: AbortSignal;
  maxTokens?: number;
  temperature?: number;
}

/** Non-streaming completion — faster for SMS webhooks that need the full reply at once. */
export async function chatCompletionText(
  messages: ChatMessage[],
  options: ChatCompletionTextOptions = {}
): Promise<string> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      messages,
      temperature: options.temperature ?? 0.65,
      max_tokens: options.maxTokens ?? 320,
      stream: false,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI completion failed: ${response.status} ${error}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function* streamChatCompletion(
  messages: ChatMessage[],
  options: StreamChatCompletionOptions = {}
): AsyncGenerator<string, void, unknown> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      messages,
      stream: true,
      temperature: 0.65,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI stream failed: ${response.status} ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
        };
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) yield token;
      } catch {
        /* skip malformed chunks */
      }
    }
  }
}

export async function chatCompletionJson<T>(
  messages: ChatMessage[]
): Promise<T> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI JSON failed: ${response.status} ${error}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty OpenAI JSON response");
  return JSON.parse(content) as T;
}
