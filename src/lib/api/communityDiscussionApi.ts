import { parseCommunityApiError } from "@/lib/api/communityApiError";
import { fetchCommunityWithRetry } from "@/lib/api/communityFetch";
import type { PostReactions, ReactionType } from "@/lib/community/reactions";
import { emptyReactions } from "@/lib/community/reactions";

export type { PostReactions, ReactionType };

export interface CommunityPost {
  post_id: string;
  community_id: string;
  author_id: string;
  author_name: string;
  author_avatar_url?: string;
  title: string;
  body: string;
  image_urls?: string[];
  comment_count: number;
  reactions: PostReactions;
  created_at: string;
}

export interface ReactionResponse {
  reactions: PostReactions;
}

export interface PostListResponse {
  results: CommunityPost[];
  next_cursor: string | null;
}

export interface PostComment {
  comment_id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  author_name: string;
  author_avatar_url?: string;
  body: string;
  created_at: string;
  replies?: PostComment[];
}

export interface CommentListResponse {
  comments: PostComment[];
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

const authHeadersMultipart = async (): Promise<HeadersInit> => {
  const { fetchAuthSession } = await import("aws-amplify/auth");
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseCommunityApiError(data, response.status));
  }
  return data as T;
};

const communityBase = (communityId: string) =>
  `/api/community/communities/${encodeURIComponent(communityId)}`;

export const fetchCommunityPosts = async (
  communityId: string,
  cursor?: string
): Promise<PostListResponse> => {
  const params = new URLSearchParams({ limit: "30" });
  if (cursor) params.set("cursor", cursor);
  const response = await fetchCommunityWithRetry(
    `${communityBase(communityId)}/posts?${params}`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse<PostListResponse>(response);
};

export const createCommunityPost = async (
  communityId: string,
  payload: { title?: string; body: string; image_urls?: string[] }
): Promise<CommunityPost> => {
  const response = await fetch(`${communityBase(communityId)}/posts`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<CommunityPost>(response);
};

const parseMediaUploadError = async (
  response: Response,
  fallback: string
): Promise<string> => {
  const text = await response.text();
  try {
    const data = JSON.parse(text) as { error?: string };
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    /* HTML from CDN (e.g. body size limit) — not JSON */
  }
  if (response.status === 403) {
    return "Photo upload was blocked. Try a smaller image or try again in a moment.";
  }
  if (response.status >= 500) {
    return "Photo upload failed temporarily. Please try again.";
  }
  return parseCommunityApiError({}, response.status) || fallback;
};

/** Local dev fallback when S3 is not configured (filesystem storage). */
const legacyPostImageUpload = async (
  communityId: string,
  file: File
): Promise<{ url: string; filename: string }> => {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(
    `${communityBase(communityId)}/posts/upload`,
    {
      method: "POST",
      headers: await authHeadersMultipart(),
      body: form,
    }
  );
  if (!response.ok) {
    throw new Error(
      await parseMediaUploadError(response, "Could not upload photo")
    );
  }
  return response.json() as Promise<{ url: string; filename: string }>;
};

export const uploadCommunityPostImage = async (
  communityId: string,
  file: File
): Promise<{ url: string; filename: string }> => {
  const headers = await authHeaders();

  const presignResponse = await fetch(
    `${communityBase(communityId)}/posts/upload/presign`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ contentType: file.type }),
    }
  );

  if (presignResponse.status === 409) {
    return legacyPostImageUpload(communityId, file);
  }

  if (!presignResponse.ok) {
    throw new Error(
      await parseMediaUploadError(
        presignResponse,
        "Could not prepare photo upload"
      )
    );
  }

  const { uploadUrl, url, filename } = (await presignResponse.json()) as {
    uploadUrl: string;
    url: string;
    filename: string;
  };

  const putResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putResponse.ok) {
    throw new Error(
      "Could not upload your photo to storage. Please try again."
    );
  }

  return { url, filename };
};

export const fetchCommunityPost = async (
  communityId: string,
  postId: string
): Promise<CommunityPost> => {
  const response = await fetchCommunityWithRetry(
    `${communityBase(communityId)}/posts/${encodeURIComponent(postId)}`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse<CommunityPost>(response);
};

export const fetchPostComments = async (
  communityId: string,
  postId: string
): Promise<CommentListResponse> => {
  const response = await fetchCommunityWithRetry(
    `${communityBase(communityId)}/posts/${encodeURIComponent(postId)}/comments`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse<CommentListResponse>(response);
};

export const setPostReaction = async (
  communityId: string,
  postId: string,
  reactionType: ReactionType
): Promise<ReactionResponse> => {
  const response = await fetch(
    `${communityBase(communityId)}/posts/${encodeURIComponent(postId)}/reactions`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ reaction_type: reactionType }),
    }
  );
  return handleResponse<ReactionResponse>(response);
};

export const removePostReaction = async (
  communityId: string,
  postId: string
): Promise<ReactionResponse> => {
  const response = await fetch(
    `${communityBase(communityId)}/posts/${encodeURIComponent(postId)}/reactions`,
    {
      method: "DELETE",
      headers: await authHeaders(),
    }
  );
  return handleResponse<ReactionResponse>(response);
};

/** Normalize API payloads that omit reactions (older responses). */
export const withDefaultReactions = (post: CommunityPost): CommunityPost => ({
  ...post,
  image_urls: post.image_urls ?? [],
  reactions: post.reactions ?? emptyReactions(),
});

export const createPostComment = async (
  communityId: string,
  postId: string,
  payload: { body: string; parent_id?: string }
): Promise<PostComment> => {
  const response = await fetch(
    `${communityBase(communityId)}/posts/${encodeURIComponent(postId)}/comments`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<PostComment>(response);
};
