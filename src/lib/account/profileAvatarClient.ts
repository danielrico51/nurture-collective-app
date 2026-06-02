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

export const uploadProfileAvatar = async (
  file: File
): Promise<{ url: string; optimized: boolean }> => {
  const prepared = await prepareProfileAvatarFile(file);
  const { intakeRequestHeaders } = await import("@/lib/api/intakeRequestHeaders");
  const authHeaders = await intakeRequestHeaders();
  const headers: Record<string, string> = {};
  if (
    typeof authHeaders === "object" &&
    authHeaders !== null &&
    "Authorization" in authHeaders &&
    typeof authHeaders.Authorization === "string"
  ) {
    headers.Authorization = authHeaders.Authorization;
  }

  const form = new FormData();
  form.append("file", prepared);

  const response = await fetch("/api/account/avatar", {
    method: "POST",
    headers,
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Upload failed");
  }
  return {
    url: (data as { url: string }).url,
    optimized: prepared.size < file.size,
  };
};

export const fetchMemberProfile = async (): Promise<{
  user_id: string;
  display_name: string;
  avatar_url: string;
}> => {
  const { intakeRequestHeaders } = await import("@/lib/api/intakeRequestHeaders");
  const response = await fetch("/api/community/users/me", {
    headers: await intakeRequestHeaders(),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not load profile");
  }
  return data;
};
