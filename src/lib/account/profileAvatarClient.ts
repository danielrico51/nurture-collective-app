import { compressImageForUpload } from "@/lib/images/compressImage";

const ALLOWED_AVATAR_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Hard limit after compression — server rejects above this. */
export const AVATAR_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

export const validateAvatarImageFile = (file: File): string | null => {
  if (!ALLOWED_AVATAR_IMAGE_TYPES.includes(file.type)) {
    return "Use JPEG, PNG, or WebP for your profile photo.";
  }
  return null;
};

/** Resize and compress so uploads stay under the server limit. */
export const prepareProfileAvatarFile = async (file: File): Promise<File> => {
  const validationError = validateAvatarImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  if (file.size <= AVATAR_UPLOAD_MAX_BYTES && file.type === "image/jpeg") {
    const bitmap = await createImageBitmap(file);
    const fitsDimension =
      bitmap.width <= 512 && bitmap.height <= 512;
    bitmap.close();
    if (fitsDimension) {
      return file;
    }
  }

  return compressImageForUpload(file, {
    maxDimension: 512,
    maxBytes: AVATAR_UPLOAD_MAX_BYTES * 0.9,
    mimeType: "image/jpeg",
    filenameStem: "profile-photo",
  });
};

const getAuthHeader = async (): Promise<Record<string, string>> => {
  const { intakeRequestHeaders } = await import("@/lib/api/intakeRequestHeaders");
  const authHeaders = await intakeRequestHeaders();
  const headers: Record<string, string> = {};
  if (
    typeof authHeaders === "object" &&
    authHeaders !== null &&
    "Authorization" in authHeaders &&
    typeof (authHeaders as { Authorization?: unknown }).Authorization === "string"
  ) {
    headers.Authorization = (authHeaders as { Authorization: string }).Authorization;
  }
  return headers;
};

/**
 * Legacy multipart upload through the Next.js SSR route. Only used as a
 * fallback for local dev (filesystem storage) where S3 is not configured.
 */
const legacyMultipartUpload = async (
  prepared: File,
  original: File,
  authHeader: Record<string, string>
): Promise<{ url: string; optimized: boolean }> => {
  const form = new FormData();
  form.append("file", prepared);
  const response = await fetch("/api/account/avatar", {
    method: "POST",
    headers: authHeader,
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Upload failed");
  }
  return {
    url: (data as { url: string }).url,
    optimized: prepared.size < original.size,
  };
};

export const uploadProfileAvatar = async (
  file: File
): Promise<{ url: string; optimized: boolean }> => {
  const prepared = await prepareProfileAvatarFile(file);
  const authHeader = await getAuthHeader();

  // Ask the server for a presigned S3 PUT URL (tiny request/response, so it
  // never hits the Amplify CDN body-size limit that breaks large uploads).
  const presignResponse = await fetch("/api/account/avatar/presign", {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: prepared.type }),
  });

  // 409 => S3 not configured (local dev): fall back to the legacy route.
  if (presignResponse.status === 409) {
    return legacyMultipartUpload(prepared, file, authHeader);
  }

  const presignData = await presignResponse.json().catch(() => ({}));
  if (!presignResponse.ok) {
    throw new Error(
      typeof presignData.error === "string"
        ? presignData.error
        : "Could not prepare the upload."
    );
  }

  const { uploadUrl, url } = presignData as { uploadUrl: string; url: string };

  // Upload the bytes DIRECTLY to S3 from the browser (bypasses Amplify SSR).
  const putResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": prepared.type },
    body: prepared,
  });
  if (!putResponse.ok) {
    throw new Error("Could not upload your photo to storage. Please try again.");
  }

  // Persist the avatar URL on the member's community profile.
  const patchResponse = await fetch("/api/community/users/me", {
    method: "PATCH",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ avatar_url: url }),
  });
  if (!patchResponse.ok) {
    const data = await patchResponse.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Photo uploaded but profile sync failed."
    );
  }

  return { url, optimized: prepared.size < file.size };
};

export const fetchMemberProfile = async (): Promise<{
  user_id: string;
  display_name: string;
  avatar_url: string;
}> => {
  const { fetchWithRetry } = await import("@/lib/api/fetchWithRetry");
  const { intakeRequestHeaders } = await import("@/lib/api/intakeRequestHeaders");
  const response = await fetchWithRetry("/api/community/users/me", {
    headers: await intakeRequestHeaders(),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not load profile");
  }
  return data;
};
