import {
  ENGAGEMENT_SERVICE_TYPES,
  ENGAGEMENT_STATUSES,
  PAYMENT_EXPECTATION_KINDS,
  PAYOUT_BATCH_STATUSES,
  SHIFT_STATUSES,
  SHIFT_TYPES,
  type CreateEngagementPackageInput,
  type CreatePaymentExpectationInput,
  type CreateProviderPayoutBatchInput,
  type CreateScheduleShiftInput,
  type CreateScheduleShiftsFromLabelInput,
  type CreateServiceEngagementInput,
  type EngagementServiceType,
  type EngagementStatus,
  type PaymentExpectationKind,
  type PayoutBatchStatus,
  type ShiftStatus,
  type ShiftType,
  type UpdateEngagementPackageInput,
  type UpdatePaymentExpectationInput,
  type UpdateProviderPayoutBatchInput,
  type UpdateScheduleShiftInput,
  type UpdateServiceEngagementInput,
} from "@/types/serviceEngagement";
import { isEngagementPaymentMethod, isKnownPaymentMethod } from "@/config/paymentMethods";
import type { PaymentMethodId } from "@/types/clientService";

export class ScheduleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleValidationError";
  }
}

export const parseIsoDate = (value: unknown, field: string): string => {
  if (value === undefined || value === null || value === "") {
    throw new ScheduleValidationError(`${field} is required`);
  }
  const date = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ScheduleValidationError(`${field} must be YYYY-MM-DD`);
  }
  return date;
};

export const parseOptionalIsoDate = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  const date = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ScheduleValidationError("Date must be YYYY-MM-DD");
  }
  return date;
};

export const parseOptionalDateTime = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  const stamp = String(value).trim();
  const parsed = Date.parse(stamp);
  if (Number.isNaN(parsed)) {
    throw new ScheduleValidationError("Invalid date/time value");
  }
  return new Date(parsed).toISOString();
};

const parseMoneyCents = (value: unknown, field: string): number => {
  const cents = Number(value);
  if (!Number.isFinite(cents)) {
    throw new ScheduleValidationError(`${field} must be a number`);
  }
  return Math.round(cents);
};

const parseOptionalHours = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours < 0) {
    throw new ScheduleValidationError("hoursTotal must be a non-negative number");
  }
  return hours;
};

const parsePackageInput = (raw: unknown): CreateEngagementPackageInput => {
  if (!raw || typeof raw !== "object") {
    throw new ScheduleValidationError("package is required");
  }
  const body = raw as Record<string, unknown>;
  return {
    label: body.label ? String(body.label).trim() : "Primary",
    clientFeeCents: parseMoneyCents(body.clientFeeCents, "clientFeeCents"),
    hoursTotal: parseOptionalHours(body.hoursTotal),
    hoursAnnotation: String(body.hoursAnnotation ?? "").trim(),
    schedulePattern: String(body.schedulePattern ?? "").trim(),
    doulaFeeCents:
      body.doulaFeeCents === undefined || body.doulaFeeCents === null
        ? null
        : parseMoneyCents(body.doulaFeeCents, "doulaFeeCents"),
    providerId: body.providerId ? String(body.providerId).trim() : null,
    notes: String(body.notes ?? "").trim(),
  };
};

const parseExpectationInput = (
  raw: unknown,
  defaultKind: PaymentExpectationKind
): CreatePaymentExpectationInput => {
  if (!raw || typeof raw !== "object") {
    throw new ScheduleValidationError(`${defaultKind} payload is invalid`);
  }
  const body = raw as Record<string, unknown>;
  const kind = body.kind
    ? (String(body.kind) as PaymentExpectationKind)
    : defaultKind;
  if (!PAYMENT_EXPECTATION_KINDS.includes(kind)) {
    throw new ScheduleValidationError("Invalid payment expectation kind");
  }
  return {
    kind,
    amountCents: parseMoneyCents(body.amountCents, "amountCents"),
    dueDate: parseOptionalIsoDate(body.dueDate),
    dueLabel: String(body.dueLabel ?? "").trim(),
    paidAt: parseOptionalDateTime(body.paidAt),
    coverageProviderId: body.coverageProviderId
      ? String(body.coverageProviderId).trim()
      : null,
    notes: String(body.notes ?? "").trim(),
  };
};

const parsePreferredPaymentMethod = (
  value: unknown,
  optional: boolean
): PaymentMethodId | null | undefined => {
  if (value === undefined) {
    return optional ? undefined : null;
  }
  if (value === null || value === "") {
    return null;
  }
  const id = String(value).trim();
  if (!isKnownPaymentMethod(id)) {
    throw new ScheduleValidationError("Invalid preferredPaymentMethod");
  }
  if (!isEngagementPaymentMethod(id)) {
    throw new ScheduleValidationError(
      "Stripe is not available for engagements. Use QuickBooks for card payments."
    );
  }
  return id;
};

export const validateCreateServiceEngagementInput = (
  raw: unknown
): CreateServiceEngagementInput => {
  if (!raw || typeof raw !== "object") {
    throw new ScheduleValidationError("Malformed payload");
  }
  const body = raw as Record<string, unknown>;
  const serviceType = body.serviceType
    ? (String(body.serviceType) as EngagementServiceType)
    : "postpartum";
  if (!ENGAGEMENT_SERVICE_TYPES.includes(serviceType)) {
    throw new ScheduleValidationError("Invalid serviceType");
  }
  const status = body.status
    ? (String(body.status) as EngagementStatus)
    : "booked";
  if (!ENGAGEMENT_STATUSES.includes(status)) {
    throw new ScheduleValidationError("Invalid status");
  }

  const bookDate = parseIsoDate(body.bookDate, "bookDate");
  const scheduleYear =
    body.scheduleYear !== undefined
      ? Number(body.scheduleYear)
      : Number(bookDate.slice(0, 4));

  if (!Number.isFinite(scheduleYear) || scheduleYear < 2000 || scheduleYear > 2100) {
    throw new ScheduleValidationError("Invalid scheduleYear");
  }

  const input: CreateServiceEngagementInput = {
    serviceType,
    scheduleYear,
    primaryProviderId: body.primaryProviderId
      ? String(body.primaryProviderId).trim()
      : null,
    bookDate,
    estimatedDate: parseOptionalIsoDate(body.estimatedDate),
    estimatedNotes: String(body.estimatedNotes ?? "").trim(),
    status,
    preferredPaymentMethod:
      parsePreferredPaymentMethod(body.preferredPaymentMethod, true) ?? null,
    package: parsePackageInput(body.package),
    serviceTitle: body.serviceTitle ? String(body.serviceTitle).trim() : undefined,
    linkExistingServiceId: body.linkExistingServiceId
      ? String(body.linkExistingServiceId).trim()
      : null,
  };

  if (body.deposit !== undefined) {
    input.deposit = parseExpectationInput(body.deposit, "deposit");
  }
  if (body.balance !== undefined) {
    input.balance = parseExpectationInput(body.balance, "balance");
  }

  return input;
};

export const validateUpdateServiceEngagementInput = (
  raw: unknown
): UpdateServiceEngagementInput => {
  if (!raw || typeof raw !== "object") {
    throw new ScheduleValidationError("Malformed payload");
  }
  const body = raw as Record<string, unknown>;
  const updates: UpdateServiceEngagementInput = {};

  if (body.serviceType !== undefined) {
    const serviceType = String(body.serviceType) as EngagementServiceType;
    if (!ENGAGEMENT_SERVICE_TYPES.includes(serviceType)) {
      throw new ScheduleValidationError("Invalid serviceType");
    }
    updates.serviceType = serviceType;
  }
  if (body.scheduleYear !== undefined) {
    const year = Number(body.scheduleYear);
    if (!Number.isFinite(year)) {
      throw new ScheduleValidationError("Invalid scheduleYear");
    }
    updates.scheduleYear = year;
  }
  if (body.primaryProviderId !== undefined) {
    updates.primaryProviderId = body.primaryProviderId
      ? String(body.primaryProviderId).trim()
      : null;
  }
  if (body.bookDate !== undefined) {
    updates.bookDate = parseIsoDate(body.bookDate, "bookDate");
  }
  if (body.estimatedDate !== undefined) {
    updates.estimatedDate = parseOptionalIsoDate(body.estimatedDate);
  }
  if (body.estimatedNotes !== undefined) {
    updates.estimatedNotes = String(body.estimatedNotes).trim();
  }
  if (body.status !== undefined) {
    const status = String(body.status) as EngagementStatus;
    if (!ENGAGEMENT_STATUSES.includes(status)) {
      throw new ScheduleValidationError("Invalid status");
    }
    updates.status = status;
  }
  if (body.preferredPaymentMethod !== undefined) {
    updates.preferredPaymentMethod =
      parsePreferredPaymentMethod(body.preferredPaymentMethod, false) ?? null;
  }

  return updates;
};

export const validateUpdateEngagementPackageInput = (
  raw: unknown
): UpdateEngagementPackageInput => {
  if (!raw || typeof raw !== "object") {
    throw new ScheduleValidationError("Malformed payload");
  }
  const body = raw as Record<string, unknown>;
  const updates: UpdateEngagementPackageInput = {};

  if (body.label !== undefined) updates.label = String(body.label).trim();
  if (body.clientFeeCents !== undefined) {
    updates.clientFeeCents = parseMoneyCents(body.clientFeeCents, "clientFeeCents");
  }
  if (body.hoursTotal !== undefined) {
    updates.hoursTotal = parseOptionalHours(body.hoursTotal);
  }
  if (body.hoursAnnotation !== undefined) {
    updates.hoursAnnotation = String(body.hoursAnnotation).trim();
  }
  if (body.schedulePattern !== undefined) {
    updates.schedulePattern = String(body.schedulePattern).trim();
  }
  if (body.doulaFeeCents !== undefined) {
    updates.doulaFeeCents =
      body.doulaFeeCents === null
        ? null
        : parseMoneyCents(body.doulaFeeCents, "doulaFeeCents");
  }
  if (body.providerId !== undefined) {
    updates.providerId = body.providerId ? String(body.providerId).trim() : null;
  }
  if (body.notes !== undefined) updates.notes = String(body.notes).trim();

  return updates;
};

export const validateUpdatePaymentExpectationInput = (
  raw: unknown
): UpdatePaymentExpectationInput => {
  if (!raw || typeof raw !== "object") {
    throw new ScheduleValidationError("Malformed payload");
  }
  const body = raw as Record<string, unknown>;
  const updates: UpdatePaymentExpectationInput = {};

  if (body.kind !== undefined) {
    const kind = String(body.kind) as PaymentExpectationKind;
    if (!PAYMENT_EXPECTATION_KINDS.includes(kind)) {
      throw new ScheduleValidationError("Invalid payment expectation kind");
    }
    updates.kind = kind;
  }
  if (body.amountCents !== undefined) {
    updates.amountCents = parseMoneyCents(body.amountCents, "amountCents");
  }
  if (body.dueDate !== undefined) {
    updates.dueDate = parseOptionalIsoDate(body.dueDate);
  }
  if (body.dueLabel !== undefined) {
    updates.dueLabel = String(body.dueLabel).trim();
  }
  if (body.paidAt !== undefined) {
    updates.paidAt = parseOptionalDateTime(body.paidAt);
  }
  if (body.invoiceId !== undefined) {
    updates.invoiceId = body.invoiceId ? String(body.invoiceId).trim() : null;
  }
  if (body.coverageProviderId !== undefined) {
    updates.coverageProviderId = body.coverageProviderId
      ? String(body.coverageProviderId).trim()
      : null;
  }
  if (body.notes !== undefined) updates.notes = String(body.notes).trim();

  return updates;
};

const parseShiftType = (value: unknown): ShiftType => {
  const shiftType = String(value ?? "unknown") as ShiftType;
  if (!SHIFT_TYPES.includes(shiftType)) {
    throw new ScheduleValidationError("Invalid shiftType");
  }
  return shiftType;
};

const parseShiftStatus = (value: unknown): ShiftStatus => {
  const status = String(value ?? "scheduled") as ShiftStatus;
  if (!SHIFT_STATUSES.includes(status)) {
    throw new ScheduleValidationError("Invalid shift status");
  }
  return status;
};

export const validateCreateScheduleShiftInput = (
  raw: unknown
): CreateScheduleShiftInput => {
  if (!raw || typeof raw !== "object") {
    throw new ScheduleValidationError("Malformed payload");
  }
  const body = raw as Record<string, unknown>;
  const providerId = String(body.providerId ?? "").trim();
  if (!providerId) {
    throw new ScheduleValidationError("providerId is required");
  }
  return {
    providerId,
    shiftDate: parseIsoDate(body.shiftDate, "shiftDate"),
    packageId: body.packageId ? String(body.packageId).trim() : null,
    hours: parseOptionalHours(body.hours),
    shiftType: parseShiftType(body.shiftType),
    status: parseShiftStatus(body.status),
    notes: String(body.notes ?? "").trim(),
  };
};

export const validateCreateScheduleShiftsFromLabelInput = (
  raw: unknown
): CreateScheduleShiftsFromLabelInput => {
  if (!raw || typeof raw !== "object") {
    throw new ScheduleValidationError("Malformed payload");
  }
  const body = raw as Record<string, unknown>;
  const visitDatesLabel = String(body.visitDatesLabel ?? "").trim();
  const providerId = String(body.providerId ?? "").trim();
  if (!visitDatesLabel) {
    throw new ScheduleValidationError("visitDatesLabel is required");
  }
  if (!providerId) {
    throw new ScheduleValidationError("providerId is required");
  }
  return {
    visitDatesLabel,
    providerId,
    packageId: body.packageId ? String(body.packageId).trim() : null,
    hoursPerShift: parseOptionalHours(body.hoursPerShift),
    shiftType: parseShiftType(body.shiftType),
  };
};

export const validateUpdateScheduleShiftInput = (
  raw: unknown
): UpdateScheduleShiftInput => {
  if (!raw || typeof raw !== "object") {
    throw new ScheduleValidationError("Malformed payload");
  }
  const body = raw as Record<string, unknown>;
  const updates: UpdateScheduleShiftInput = {};
  if (body.providerId !== undefined) {
    updates.providerId = String(body.providerId).trim();
  }
  if (body.shiftDate !== undefined) {
    updates.shiftDate = parseIsoDate(body.shiftDate, "shiftDate");
  }
  if (body.packageId !== undefined) {
    updates.packageId = body.packageId ? String(body.packageId).trim() : null;
  }
  if (body.hours !== undefined) {
    updates.hours = parseOptionalHours(body.hours);
  }
  if (body.shiftType !== undefined) {
    updates.shiftType = parseShiftType(body.shiftType);
  }
  if (body.status !== undefined) {
    updates.status = parseShiftStatus(body.status);
  }
  if (body.payoutBatchId !== undefined) {
    updates.payoutBatchId = body.payoutBatchId
      ? String(body.payoutBatchId).trim()
      : null;
  }
  if (body.notes !== undefined) updates.notes = String(body.notes).trim();
  return updates;
};

export const validateCreateProviderPayoutBatchInput = (
  raw: unknown
): CreateProviderPayoutBatchInput => {
  if (!raw || typeof raw !== "object") {
    throw new ScheduleValidationError("Malformed payload");
  }
  const body = raw as Record<string, unknown>;
  const providerId = String(body.providerId ?? "").trim();
  if (!providerId) {
    throw new ScheduleValidationError("providerId is required");
  }
  const status = body.status
    ? (String(body.status) as PayoutBatchStatus)
    : "pending";
  if (!PAYOUT_BATCH_STATUSES.includes(status)) {
    throw new ScheduleValidationError("Invalid payout status");
  }
  return {
    providerId,
    amountCents: parseMoneyCents(body.amountCents, "amountCents"),
    packageId: body.packageId ? String(body.packageId).trim() : null,
    doulaFeeCents:
      body.doulaFeeCents === undefined || body.doulaFeeCents === null
        ? null
        : parseMoneyCents(body.doulaFeeCents, "doulaFeeCents"),
    hours: parseOptionalHours(body.hours),
    visitDatesLabel: String(body.visitDatesLabel ?? "").trim(),
    shiftIds: Array.isArray(body.shiftIds)
      ? body.shiftIds.map((id) => String(id).trim()).filter(Boolean)
      : [],
    paidAt: parseOptionalDateTime(body.paidAt),
    status,
    notes: String(body.notes ?? "").trim(),
  };
};

export const validateUpdateProviderPayoutBatchInput = (
  raw: unknown
): UpdateProviderPayoutBatchInput => {
  if (!raw || typeof raw !== "object") {
    throw new ScheduleValidationError("Malformed payload");
  }
  const body = raw as Record<string, unknown>;
  const updates: UpdateProviderPayoutBatchInput = {};
  if (body.providerId !== undefined) {
    updates.providerId = String(body.providerId).trim();
  }
  if (body.amountCents !== undefined) {
    updates.amountCents = parseMoneyCents(body.amountCents, "amountCents");
  }
  if (body.packageId !== undefined) {
    updates.packageId = body.packageId ? String(body.packageId).trim() : null;
  }
  if (body.doulaFeeCents !== undefined) {
    updates.doulaFeeCents =
      body.doulaFeeCents === null
        ? null
        : parseMoneyCents(body.doulaFeeCents, "doulaFeeCents");
  }
  if (body.hours !== undefined) {
    updates.hours = parseOptionalHours(body.hours);
  }
  if (body.visitDatesLabel !== undefined) {
    updates.visitDatesLabel = String(body.visitDatesLabel).trim();
  }
  if (body.shiftIds !== undefined) {
    updates.shiftIds = Array.isArray(body.shiftIds)
      ? body.shiftIds.map((id) => String(id).trim()).filter(Boolean)
      : [];
  }
  if (body.paidAt !== undefined) {
    updates.paidAt = parseOptionalDateTime(body.paidAt);
  }
  if (body.status !== undefined) {
    const status = String(body.status) as PayoutBatchStatus;
    if (!PAYOUT_BATCH_STATUSES.includes(status)) {
      throw new ScheduleValidationError("Invalid payout status");
    }
    updates.status = status;
  }
  if (body.markPaid === true) updates.markPaid = true;
  if (body.notes !== undefined) updates.notes = String(body.notes).trim();
  return updates;
};
