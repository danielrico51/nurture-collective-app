import type {
  ClassAvailability,
  ClassRegistration,
  ClassRegistrationPaymentMethod,
  CreateClassRegistrationInput,
  RegisterForEventResponse,
  UpdateClassRegistrationInput,
} from "@/types/classRegistration";

export const fetchEventAvailability = async (
  slug: string
): Promise<{ availability: ClassAvailability; priceCents: number }> => {
  const response = await fetch(`/api/events/${encodeURIComponent(slug)}/availability`, {
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as { availability: ClassAvailability; priceCents: number };
};

export const registerForEvent = async (
  slug: string,
  input: CreateClassRegistrationInput
): Promise<RegisterForEventResponse> => {
  const response = await fetch(`/api/events/${encodeURIComponent(slug)}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as RegisterForEventResponse;
};

export const confirmClassRegistrationPayment = async (
  sessionId: string
): Promise<{
  ok: boolean;
  paymentStatus?: string;
  eventSlug?: string;
}> => {
  const response = await fetch(
    `/api/events/registrations/confirm?session_id=${encodeURIComponent(sessionId)}`,
    { cache: "no-store" }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as {
    ok: boolean;
    paymentStatus?: string;
    eventSlug?: string;
  };
};

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

export const fetchAdminEventRegistrations = async (
  slug: string
): Promise<{
  registrations: ClassRegistration[];
  availability: ClassAvailability;
}> => {
  const response = await fetch(
    `/api/admin/events/${encodeURIComponent(slug)}/registrations`,
    {
      headers: await authHeaders(),
      cache: "no-store",
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as {
    registrations: ClassRegistration[];
    availability: ClassAvailability;
  };
};

export const fetchAdminProviderRosterLink = async (
  slug: string
): Promise<{
  url: string;
  path: string;
  instructorEmail: string;
  expiresAt: string;
}> => {
  const response = await fetch(
    `/api/admin/events/${encodeURIComponent(slug)}/provider-roster-link`,
    {
      headers: await authHeaders(),
      cache: "no-store",
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as {
    url: string;
    path: string;
    instructorEmail: string;
    expiresAt: string;
  };
};

export const updateAdminRegistration = async (
  registrationId: string,
  input: UpdateClassRegistrationInput
): Promise<{ registration: ClassRegistration }> => {
  const response = await fetch(
    `/api/admin/registrations/${encodeURIComponent(registrationId)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(input),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as { registration: ClassRegistration };
};
