import "server-only";

import { getBillingPaymentProvider } from "@/lib/payments/getProvider";
import type { ClientRecord } from "@/types/client";
import type {
  ClientService,
  ServiceInvoice,
  ServiceInvoiceStripeRef,
} from "@/types/clientService";

export const createServiceInvoiceStripeCheckout = async (input: {
  invoice: ServiceInvoice;
  service: ClientService;
  client: ClientRecord;
  origin: string;
}): Promise<ServiceInvoiceStripeRef> => {
  const provider = getBillingPaymentProvider();
  const description =
    input.invoice.description || input.service.title || "Care services";

  const result = await provider.createCheckout({
    orderId: input.invoice.invoiceId,
    amountCents: input.invoice.amountCents,
    currency: "USD",
    description: `${input.invoice.invoiceNumber} — ${description}`.slice(0, 500),
    purchaserEmail: input.client.email.trim().toLowerCase(),
    successUrl: `${input.origin}/admin/clients?invoice=${encodeURIComponent(input.invoice.invoiceNumber)}&paid=1`,
    cancelUrl: `${input.origin}/admin/clients?invoice=${encodeURIComponent(input.invoice.invoiceNumber)}&cancelled=1`,
    metadata: {
      orderType: "service_invoice",
      billing: "true",
      clientId: input.client.clientId,
      serviceId: input.service.serviceId,
      serviceInvoiceId: input.invoice.invoiceId,
      invoiceNumber: input.invoice.invoiceNumber,
    },
  });

  return {
    checkoutSessionId: result.paymentReference,
    paymentIntentId: undefined,
    checkoutUrl: result.checkoutUrl,
  };
};
