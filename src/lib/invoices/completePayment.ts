import "server-only";

import {
  readClientService,
  readServiceInvoice,
  markServiceInvoicePaid,
} from "@/lib/client-services/storage";
import { getClientById } from "@/lib/clients/storage";
import { syncServiceInvoicePaymentToQuickBooks } from "@/lib/invoices/quickbooksSync";

export const completeServiceInvoicePayment = async (input: {
  clientId: string;
  serviceId: string;
  invoiceId: string;
  paymentProvider: string;
  paymentReference?: string;
}): Promise<void> => {
  const existing = await readServiceInvoice(
    input.clientId,
    input.serviceId,
    input.invoiceId
  );
  if (!existing) return;

  const invoice =
    existing.status === "paid"
      ? existing
      : await markServiceInvoicePaid(
          input.clientId,
          input.serviceId,
          input.invoiceId,
          {
            provider: input.paymentProvider,
            reference: input.paymentReference,
          }
        );

  const [service, client] = await Promise.all([
    readClientService(input.clientId, input.serviceId),
    getClientById(input.clientId),
  ]);
  if (!service || !client) return;

  await syncServiceInvoicePaymentToQuickBooks({
    clientId: input.clientId,
    serviceId: input.serviceId,
    invoice,
    service,
    client,
    payment: {
      provider: input.paymentProvider,
      reference: input.paymentReference,
    },
  });
};
