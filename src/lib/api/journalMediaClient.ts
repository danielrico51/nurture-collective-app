import { ALLOWED_JOURNAL_IMAGE_TYPES } from "@/lib/journal/mediaTypes";

const authHeaders = async (): Promise<HeadersInit> => {
  const { fetchAuthSession } = await import("aws-amplify/auth");
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
};

export const uploadJournalTimelinePhoto = async (file: File): Promise<string> => {
  if (!(ALLOWED_JOURNAL_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new Error("Use JPEG, PNG, or WebP for timeline photos.");
  }

  const headers = await authHeaders();

  const presignResponse = await fetch("/api/journal/media/presign", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type }),
  });

  if (presignResponse.status === 409) {
    const form = new FormData();
    form.append("file", file);
    const uploadResponse = await fetch("/api/journal/media/upload", {
      method: "POST",
      headers,
      body: form,
    });
    const uploadData = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok) {
      throw new Error(
        typeof uploadData.error === "string"
          ? uploadData.error
          : "Could not upload photo"
      );
    }
    return (uploadData as { url: string }).url;
  }

  const presignData = await presignResponse.json().catch(() => ({}));
  if (!presignResponse.ok) {
    throw new Error(
      typeof presignData.error === "string"
        ? presignData.error
        : "Could not prepare upload"
    );
  }

  const { uploadUrl, url } = presignData as { uploadUrl: string; url: string };
  let putResponse: Response;
  try {
    putResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
  } catch {
    throw new Error(
      "Could not upload your photo. If this keeps happening, try again after a hard refresh."
    );
  }
  if (!putResponse.ok) {
    throw new Error("Upload to storage failed. Please try again.");
  }
  return url;
};
