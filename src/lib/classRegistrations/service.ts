import type {
  ClassAvailability,
  ClassRegistration,
  CreateClassRegistrationInput,
  UpdateClassRegistrationInput,
} from "@/types/classRegistration";
import type { EventItem } from "@/types/event";
import {
  resolveRegistrationPaymentFields,
  type RegistrationPaymentFields,
} from "@/lib/classRegistrations/payments";
import {
  listClassRegistrations,
  readClassRegistration,
  writeClassRegistration,
} from "@/lib/classRegistrations/storage";
import { syncEventToGoogleCalendar } from "@/lib/events/calendar/sync";
import { getEventBySlug } from "@/lib/events/storage";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ClassRegistrationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClassRegistrationValidationError";
  }
}

export class ClassRegistrationCapacityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClassRegistrationCapacityError";
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isOnlineRegistrationEnabled = (
  event: Pick<EventItem, "registrationMode">
): boolean => event.registrationMode === "online";

export const countOccupyingRegistrations = (
  registrations: ClassRegistration[]
): { confirmed: number; waitlisted: number } => {
  let confirmed = 0;
  let waitlisted = 0;

  for (const registration of registrations) {
    if (registration.status === "cancelled") continue;
    if (registration.status === "waitlisted") {
      waitlisted += 1;
    } else {
      confirmed += 1;
    }
  }

  return { confirmed, waitlisted };
};

export const buildClassAvailability = (
  event: EventItem,
  registrations: ClassRegistration[]
): ClassAvailability => {
  const { confirmed, waitlisted } = countOccupyingRegistrations(registrations);
  const capacity =
    typeof event.capacity === "number" && event.capacity > 0
      ? event.capacity
      : null;
  const spotsRemaining =
    capacity === null ? null : Math.max(capacity - confirmed, 0);

  return {
    eventSlug: event.slug,
    capacity,
    confirmedCount: confirmed,
    waitlistCount: waitlisted,
    spotsRemaining,
    waitlistEnabled: Boolean(event.waitlistEnabled),
    registrationOpen: Boolean(
      isOnlineRegistrationEnabled(event) &&
        event.status === "published" &&
        event.listingStatus !== "completed" &&
        (capacity === null ||
          (spotsRemaining ?? 0) > 0 ||
          event.waitlistEnabled)
    ),
  };
};

export const validateRegistrationInput = (
  raw: unknown
): CreateClassRegistrationInput => {
  if (!raw || typeof raw !== "object") {
    throw new ClassRegistrationValidationError("Malformed payload");
  }

  const body = raw as Record<string, unknown>;
  const registrantName = String(body.registrantName ?? body.name ?? "").trim();
  const registrantEmail = normalizeEmail(
    String(body.registrantEmail ?? body.email ?? "")
  );
  const registrantPhone = String(body.registrantPhone ?? body.phone ?? "").trim();
  const notes = String(body.notes ?? "").trim();
  const source = String(body.source ?? "website").trim() as CreateClassRegistrationInput["source"];
  const paymentMethodRaw = String(body.paymentMethod ?? "").trim();

  if (!registrantName) {
    throw new ClassRegistrationValidationError("Name is required");
  }
  if (!registrantEmail) {
    throw new ClassRegistrationValidationError("Email is required");
  }
  if (!EMAIL_PATTERN.test(registrantEmail)) {
    throw new ClassRegistrationValidationError("Invalid email address");
  }

  const paymentMethod =
    paymentMethodRaw === "stripe" || paymentMethodRaw === "venmo"
      ? paymentMethodRaw
      : undefined;

  return {
    registrantName,
    registrantEmail,
    registrantPhone: registrantPhone || undefined,
    notes: notes || undefined,
    source:
      source === "google_business" || source === "admin_manual"
        ? source
        : "website",
    paymentMethod,
  };
};

export const createClassRegistration = async (
  event: EventItem,
  rawInput: unknown
): Promise<ClassRegistration> => {
  if (!isOnlineRegistrationEnabled(event)) {
    throw new ClassRegistrationValidationError(
      "Online registration is not enabled for this listing"
    );
  }
  if (event.status !== "published") {
    throw new ClassRegistrationValidationError("This listing is not published");
  }

  const input = validateRegistrationInput(rawInput);
  const existing = await listClassRegistrations(event.slug);
  const availability = buildClassAvailability(event, existing);

  if (!availability.registrationOpen) {
    throw new ClassRegistrationCapacityError(
      "Registration is closed for this class"
    );
  }

  const duplicate = existing.find(
    (entry) =>
      entry.status !== "cancelled" &&
      normalizeEmail(entry.registrantEmail) === input.registrantEmail
  );
  if (duplicate) {
    throw new ClassRegistrationValidationError(
      "This email is already registered for this class"
    );
  }

  const now = new Date().toISOString();
  const waitlist = Boolean(
    availability.capacity !== null &&
      availability.spotsRemaining === 0 &&
      event.waitlistEnabled
  );

  let paymentFields: RegistrationPaymentFields;

  try {
    paymentFields = resolveRegistrationPaymentFields({
      event,
      waitlist,
      paymentMethod: input.paymentMethod,
    });
  } catch (error) {
    throw new ClassRegistrationValidationError(
      error instanceof Error ? error.message : "Invalid payment method"
    );
  }

  const registration: ClassRegistration = {
    id: crypto.randomUUID(),
    eventSlug: event.slug,
    eventTitle: event.title,
    registrantName: input.registrantName,
    registrantEmail: input.registrantEmail,
    registrantPhone: input.registrantPhone,
    notes: input.notes,
    status: waitlist ? "waitlisted" : "confirmed",
    paymentStatus: paymentFields.paymentStatus,
    paymentMethod: paymentFields.paymentMethod,
    amountCents: paymentFields.amountCents,
    source: input.source ?? "website",
    createdAt: now,
    updatedAt: now,
    confirmedAt: waitlist ? undefined : now,
  };

  return writeClassRegistration(registration);
};

export const updateClassRegistration = async (
  registrationId: string,
  input: UpdateClassRegistrationInput
): Promise<ClassRegistration> => {
  const existing = await readClassRegistration(registrationId);
  if (!existing) {
    throw new ClassRegistrationValidationError("Registration not found");
  }

  const next: ClassRegistration = {
    ...existing,
    status: input.status ?? existing.status,
    paymentStatus: input.paymentStatus ?? existing.paymentStatus,
    paymentMethod: input.paymentMethod ?? existing.paymentMethod,
    paidAt:
      input.paymentStatus === "paid" && !existing.paidAt
        ? new Date().toISOString()
        : existing.paidAt,
    confirmedAt:
      input.status === "confirmed" && !existing.confirmedAt
        ? new Date().toISOString()
        : existing.confirmedAt,
  };

  const saved = await writeClassRegistration(next);

  const event = await getEventBySlug(existing.eventSlug, { includeDrafts: true });
  if (event && saved.status !== existing.status) {
    void syncEventToGoogleCalendar(event).catch((error) => {
      console.error("[class-registrations] calendar reconcile failed:", error);
    });
  }

  return saved;
};

export const getClassAvailabilityForEvent = async (
  event: EventItem
): Promise<ClassAvailability> => {
  const registrations = await listClassRegistrations(event.slug);
  return buildClassAvailability(event, registrations);
};
