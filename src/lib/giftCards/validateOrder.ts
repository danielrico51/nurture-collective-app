import {
  giftCardDesigns,
  giftCardMaxAmount,
  giftCardMinAmount,
  type GiftCardDesignId,
} from "@/content/giftCards";
import type { GiftCardCheckoutRequest } from "@/types/giftCard";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_DESIGNS = new Set(giftCardDesigns.map((design) => design.id));

export const dollarsToCents = (amount: number): number =>
  Math.round(amount * 100);

export const centsToDollars = (amountCents: number): number =>
  amountCents / 100;

export const validateGiftCardCheckout = (
  body: Partial<GiftCardCheckoutRequest>
): { ok: true; data: GiftCardCheckoutRequest } | { ok: false; error: string } => {
  const amountCents = body.amountCents;
  if (amountCents === undefined || !Number.isInteger(amountCents) || amountCents <= 0) {
    return { ok: false, error: "Gift card amount is required." };
  }

  const minCents = dollarsToCents(giftCardMinAmount);
  const maxCents = dollarsToCents(giftCardMaxAmount);
  if (amountCents < minCents || amountCents > maxCents) {
    return {
      ok: false,
      error: `Amount must be between $${giftCardMinAmount} and $${giftCardMaxAmount}.`,
    };
  }

  const designId = body.designId;
  if (!designId || !VALID_DESIGNS.has(designId as GiftCardDesignId)) {
    return { ok: false, error: "Please choose a gift card design." };
  }

  const deliveryTiming = body.deliveryTiming;
  if (deliveryTiming !== "immediate" && deliveryTiming !== "scheduled") {
    return { ok: false, error: "Please choose when to deliver the gift card." };
  }

  const deliverOn = body.deliverOn?.trim();
  if (deliveryTiming === "scheduled") {
    if (!deliverOn) {
      return { ok: false, error: "Please choose a delivery date." };
    }
    const deliveryDate = new Date(`${deliverOn}T12:00:00`);
    if (Number.isNaN(deliveryDate.getTime())) {
      return { ok: false, error: "Delivery date is invalid." };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deliveryDate < today) {
      return { ok: false, error: "Delivery date must be today or later." };
    }
  }

  const purchaserName = body.purchaser?.name?.trim() ?? "";
  const purchaserEmail = body.purchaser?.email?.trim() ?? "";
  const purchaserPhone = body.purchaser?.phone?.trim() || undefined;
  const recipientName = body.recipient?.name?.trim() ?? "";
  const recipientEmail = body.recipient?.email?.trim() ?? "";
  const message = body.message?.trim() || undefined;

  if (!purchaserName || !purchaserEmail || !recipientName || !recipientEmail) {
    return { ok: false, error: "Purchaser and recipient name and email are required." };
  }

  if (!EMAIL_PATTERN.test(purchaserEmail) || !EMAIL_PATTERN.test(recipientEmail)) {
    return { ok: false, error: "Please enter valid email addresses." };
  }

  if (message && message.length > 500) {
    return { ok: false, error: "Personal message must be 500 characters or fewer." };
  }

  const successUrl = body.successUrl?.trim() ?? "";
  const cancelUrl = body.cancelUrl?.trim() ?? "";
  if (!successUrl || !cancelUrl) {
    return { ok: false, error: "Checkout return URLs are required." };
  }

  try {
    const success = new URL(successUrl);
    const cancel = new URL(cancelUrl);
    const allowed = (url: URL) =>
      url.protocol === "https:" ||
      (url.hostname === "localhost" && url.protocol === "http:");
    if (!allowed(success) || !allowed(cancel)) {
      return { ok: false, error: "Invalid checkout return URLs." };
    }
  } catch {
    return { ok: false, error: "Invalid checkout return URLs." };
  }

  return {
    ok: true,
    data: {
      amountCents,
      designId: designId as GiftCardDesignId,
      deliveryTiming,
      deliverOn: deliveryTiming === "scheduled" ? deliverOn : undefined,
      purchaser: {
        name: purchaserName,
        email: purchaserEmail,
        phone: purchaserPhone,
      },
      recipient: {
        name: recipientName,
        email: recipientEmail,
      },
      message,
      sendCopyToPurchaser: Boolean(body.sendCopyToPurchaser),
      successUrl,
      cancelUrl,
    },
  };
};
