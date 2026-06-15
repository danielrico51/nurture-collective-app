import { classRegistrationPaymentConfig } from "@/config/classRegistrations";
import type {
  ClassRegistration,
  ClassRegistrationPaymentMethod,
} from "@/types/classRegistration";
import type { EventItem } from "@/types/event";

export const registrationRequiresPayment = (
  registration: Pick<ClassRegistration, "status" | "amountCents">
): boolean =>
  registration.status === "confirmed" && registration.amountCents > 0;

export const isStripePaymentAvailable = () =>
  classRegistrationPaymentConfig.stripeEnabled;

export const isVenmoPaymentAvailable = () =>
  classRegistrationPaymentConfig.venmoEnabled;

export const isClassPaymentConfigured = () =>
  isStripePaymentAvailable() || isVenmoPaymentAvailable();

export type RegistrationPaymentFields = {
  amountCents: number;
  paymentMethod?: ClassRegistrationPaymentMethod;
  paymentStatus: ClassRegistration["paymentStatus"];
};

export const resolveRegistrationPaymentFields = (input: {
  event: EventItem;
  waitlist: boolean;
  paymentMethod?: ClassRegistrationPaymentMethod;
}): RegistrationPaymentFields => {
  const amountCents = input.event.priceCents ?? 0;
  const requiresPayment = !input.waitlist && amountCents > 0;

  if (!requiresPayment) {
    return {
      amountCents,
      paymentMethod: "free" as const,
      paymentStatus: "unpaid" as const,
    };
  }

  if (input.paymentMethod !== "stripe" && input.paymentMethod !== "venmo") {
    return {
      amountCents,
      paymentStatus: "unpaid" as const,
    };
  }

  if (input.paymentMethod === "stripe" && !isStripePaymentAvailable()) {
    throw new Error("Card payment is not available right now");
  }

  if (input.paymentMethod === "venmo" && !isVenmoPaymentAvailable()) {
    throw new Error("Venmo payment is not available right now");
  }

  return {
    amountCents,
    paymentMethod: input.paymentMethod,
    paymentStatus: "pending" as const,
  };
};

export const buildVenmoPaymentUrl = (input: {
  handle: string;
  amountCents: number;
  note: string;
}): string => {
  const amount = (input.amountCents / 100).toFixed(2);
  const params = new URLSearchParams({
    recipients: input.handle.replace(/^@/, ""),
    amount,
    note: input.note,
  });
  return `https://account.venmo.com/pay?${params.toString()}`;
};

export const buildVenmoPaymentNote = (
  event: EventItem,
  registration: ClassRegistration
) => {
  const shortId = registration.id.slice(0, 8);
  return `${event.title} · reg ${shortId}`;
};

export const formatPaymentStatusLabel = (
  registration: Pick<
    ClassRegistration,
    "paymentStatus" | "paymentMethod" | "amountCents"
  >
): string => {
  if (registration.amountCents <= 0) return "N/A";
  switch (registration.paymentStatus) {
    case "paid":
      return registration.paymentMethod === "venmo" ? "Paid (Venmo)" : "Paid";
    case "pending":
      return registration.paymentMethod === "venmo"
        ? "Venmo pending"
        : "Payment pending";
    case "refunded":
      return "Refunded";
    default:
      return "Unpaid";
  }
};
