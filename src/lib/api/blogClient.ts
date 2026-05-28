import type { BlogPost, CreateBlogPostInput, UpdateBlogPostInput } from "@/types/blog";

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

export const fetchAdminBlogPosts = async (seed = false): Promise<{ posts: BlogPost[] }> => {
  const params = seed ? "?seed=true" : "";
  const response = await fetch(`/api/admin/blog${params}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse<{ posts: BlogPost[] }>(response);
};

export const createAdminBlogPost = async (
  input: CreateBlogPostInput
): Promise<{ post: BlogPost }> => {
  const response = await fetch("/api/admin/blog", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  return handleResponse<{ post: BlogPost }>(response);
};

export const updateAdminBlogPost = async (
  slug: string,
  input: UpdateBlogPostInput
): Promise<{ post: BlogPost }> => {
  const response = await fetch(`/api/admin/blog/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  return handleResponse<{ post: BlogPost }>(response);
};

export const deleteAdminBlogPost = async (slug: string): Promise<void> => {
  const response = await fetch(`/api/admin/blog/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  await handleResponse<{ ok: boolean }>(response);
};
