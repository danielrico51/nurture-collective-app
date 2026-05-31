import type {
  PurchaseCheckoutRequest,
  PurchaseLineItem,
} from "@/types/billing";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidLineItem = (item: unknown): item is PurchaseLineItem => {
  if (!item || typeof item !== "object") return false;
  const line = item as Partial<PurchaseLineItem>;
  return (
    typeof line.sku === "string" &&
    line.sku.trim().length > 0 &&
    typeof line.name === "string" &&
    line.name.trim().length > 0 &&
    typeof line.quantity === "number" &&
    Number.isFinite(line.quantity) &&
    line.quantity > 0 &&
    typeof line.unitAmountCents === "number" &&
    Number.isFinite(line.unitAmountCents) &&
    line.unitAmountCents >= 0
  );
};

export const validatePurchaseCheckout = (
  body: Partial<PurchaseCheckoutRequest>
):
  | { ok: true; data: PurchaseCheckoutRequest }
  | { ok: false; error: string } => {
  const customerEmail = body.customerEmail?.trim().toLowerCase() ?? "";
  if (!EMAIL_PATTERN.test(customerEmail)) {
    return { ok: false, error: "A valid customer email is required" };
  }

  if (!Array.isArray(body.lineItems) || body.lineItems.length === 0) {
    return { ok: false, error: "At least one line item is required" };
  }

  if (!body.lineItems.every(isValidLineItem)) {
    return { ok: false, error: "Each line item must include sku, name, quantity, and unitAmountCents" };
  }

  const successUrl = body.successUrl?.trim() ?? "";
  const cancelUrl = body.cancelUrl?.trim() ?? "";
  if (!successUrl || !cancelUrl) {
    return { ok: false, error: "successUrl and cancelUrl are required" };
  }

  return {
    ok: true,
    data: {
      customerEmail,
      customerName: body.customerName?.trim(),
      userId: body.userId?.trim(),
      clientId: body.clientId?.trim(),
      leadId: body.leadId?.trim(),
      lineItems: body.lineItems,
      successUrl,
      cancelUrl,
      metadata:
        body.metadata && typeof body.metadata === "object"
          ? Object.fromEntries(
              Object.entries(body.metadata).filter(
                ([, value]) => typeof value === "string"
              )
            )
          : undefined,
      invoiceOnly: Boolean(body.invoiceOnly),
    },
  };
};
