import { serverQuickBooksConfig } from "@/config/quickbooks";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import type { PurchaseOrder } from "@/types/billing";

export type BillingN8nEventType =
  | "billing.order.created"
  | "billing.payment.succeeded"
  | "billing.payment.failed"
  | "billing.invoice.requested"
  | "billing.invoice.synced"
  | "billing.refund.processed"
  | "billing.quickbooks.webhook";

export interface BillingN8nEvent {
  type: BillingN8nEventType;
  receivedAt: string;
  order: PurchaseOrder;
  quickbooks?: {
    customerId?: string;
    invoiceId?: string;
    invoiceNumber?: string;
    paymentId?: string;
    entity?: string;
    operation?: string;
  };
  payment?: {
    provider?: string;
    reference?: string;
    amountCents?: number;
  };
  source?: string;
}

export const emitBillingEvent = async (
  event: Omit<BillingN8nEvent, "receivedAt">
): Promise<boolean> => {
  if (!serverQuickBooksConfig.billingWebhookUrl) {
    console.info(`[billing] n8n webhook not configured, skipping ${event.type}`);
    return false;
  }

  try {
    const result = await forwardToN8n(
      serverQuickBooksConfig.billingWebhookUrl,
      serverQuickBooksConfig.billingWebhookSecret,
      {
        ...event,
        receivedAt: new Date().toISOString(),
      } satisfies BillingN8nEvent
    );
    return result.forwarded;
  } catch (error) {
    console.error(`[billing] n8n forward failed (${event.type}):`, error);
    return false;
  }
};
