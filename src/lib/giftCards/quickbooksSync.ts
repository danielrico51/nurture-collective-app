import { resolveQuickBooksItemIdForCategory } from "@/lib/invoices/quickbooksIncomeRouting";
import { serverQuickBooksConfig } from "@/config/quickbooks";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import { serverGiftCardConfig } from "@/config/giftCards";
import { centsToDollars } from "@/lib/giftCards/validateOrder";
import { writeGiftCardOrder } from "@/lib/giftCards/storage";
import { ensureQuickBooksCustomer } from "@/lib/integrations/quickbooks";
import { readQuickBooksTokens } from "@/lib/integrations/quickbooks/tokenStorage";
import { createQuickBooksSalesReceipt } from "@/lib/integrations/quickbooks/salesReceipts";
import type { GiftCardOrder } from "@/types/giftCard";

const syncGiftCardToQuickBooksDirect = async (
  order: GiftCardOrder,
  paymentReference?: string
): Promise<GiftCardOrder> => {
  const customer = await ensureQuickBooksCustomer({
    displayName: order.purchaser.name.trim() || order.purchaser.email.split("@")[0],
    email: order.purchaser.email,
    givenName: order.purchaser.name.split(" ")[0],
    familyName: order.purchaser.name.split(" ").slice(1).join(" ") || undefined,
  });

  const amount = centsToDollars(order.amountCents);
  const giftCardItemId =
    resolveQuickBooksItemIdForCategory("other_operation_income") ||
    serverQuickBooksConfig.defaultItemId ||
    undefined;
  const receipt = await createQuickBooksSalesReceipt({
    customerId: customer.Id,
    docNumber: order.id.slice(0, 21),
    privateNote: `eGift card ${order.id}${paymentReference ? ` · Stripe ${paymentReference}` : ""}`,
    customerMemo: "Thank you for your eGift card purchase.",
    lineItems: [
      {
        amount,
        description: `The Nesting Place eGift Card — $${amount.toFixed(2)} (recipient: ${order.recipient.email})`,
        quantity: 1,
        unitPrice: amount,
        itemId: giftCardItemId,
      },
    ],
  });

  const updated: GiftCardOrder = {
    ...order,
    quickbooks: {
      customerId: customer.Id,
      salesReceiptId: receipt.Id,
      salesReceiptNumber: receipt.DocNumber,
      syncStatus: "synced",
      lastSyncAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  await writeGiftCardOrder(updated);
  return updated;
};

const forwardGiftCardPaymentToN8n = async (
  order: GiftCardOrder,
  payment: { provider: string; reference?: string }
): Promise<void> => {
  const webhookUrl =
    serverQuickBooksConfig.billingWebhookUrl ||
    serverGiftCardConfig.orderWebhookUrl;
  const secret =
    serverQuickBooksConfig.billingWebhookSecret ||
    serverGiftCardConfig.orderWebhookSecret;

  if (!webhookUrl) {
    console.info("[gift-cards] No n8n webhook configured for payment sync");
    return;
  }

  await forwardToN8n(webhookUrl, secret, {
    type: "gift_card.payment.succeeded",
    receivedAt: new Date().toISOString(),
    order,
    payment: {
      provider: payment.provider,
      reference: payment.reference,
      amountCents: order.amountCents,
    },
  });
};

/** Record paid gift card in QuickBooks (Sales Receipt) after Stripe payment. */
export const syncGiftCardPaymentToQuickBooks = async (
  order: GiftCardOrder,
  payment: { provider: string; reference?: string }
): Promise<GiftCardOrder> => {
  await forwardGiftCardPaymentToN8n(order, payment);

  const tokens = await readQuickBooksTokens();
  if (!tokens?.refreshToken) {
    console.info("[gift-cards] QuickBooks not connected — skipping sales receipt");
    return order;
  }

  try {
    return await syncGiftCardToQuickBooksDirect(order, payment.reference);
  } catch (error) {
    const message = error instanceof Error ? error.message : "QuickBooks sync failed";
    const failed: GiftCardOrder = {
      ...order,
      quickbooks: {
        ...order.quickbooks,
        syncStatus: "failed",
        lastError: message,
        lastSyncAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    await writeGiftCardOrder(failed);
    console.error("[gift-cards] QuickBooks sales receipt failed:", error);
    return failed;
  }
};
