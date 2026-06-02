export interface ChannelSummary {
  channel_id: string;
  channel_type: string;
  community_id: string | null;
  name: string;
  unread_count: number;
  last_message_at: string | null;
}

export interface ChannelListResponse {
  results: ChannelSummary[];
}

export interface ChatMessage {
  message_id: string;
  sender_id: string;
  sender_name: string;
  channel_id: string;
  message: string;
  timestamp: string;
  metadata: Record<string, unknown>;
  moderation_status: string;
}

export interface MessageListResponse {
  messages: ChatMessage[];
  next_cursor: string | null;
}

const authHeaders = async (): Promise<HeadersInit> => {
  const { fetchAuthSession } = await import("aws-amplify/auth");
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as T;
};

export const fetchCommunityChannels = async (
  communityId: string
): Promise<ChannelListResponse> => {
  const response = await fetch(
    `/api/community/channels?community_id=${encodeURIComponent(communityId)}`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse<ChannelListResponse>(response);
};

export const fetchChannelMessages = async (
  channelId: string,
  cursor?: string
): Promise<MessageListResponse> => {
  const query = cursor
    ? `?cursor=${encodeURIComponent(cursor)}&limit=50`
    : "?limit=50";
  const response = await fetch(
    `/api/community/channels/${encodeURIComponent(channelId)}/messages${query}`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse<MessageListResponse>(response);
};

export const sendChannelMessage = async (
  channelId: string,
  message: string
): Promise<ChatMessage> => {
  const response = await fetch(
    `/api/community/channels/${encodeURIComponent(channelId)}/messages`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ message }),
    }
  );
  return handleResponse<ChatMessage>(response);
};

export const markChannelRead = async (
  channelId: string,
  messageId?: string
): Promise<void> => {
  const response = await fetch(
    `/api/community/channels/${encodeURIComponent(channelId)}/read`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(messageId ? { message_id: messageId } : {}),
    }
  );
  await handleResponse(response);
};
