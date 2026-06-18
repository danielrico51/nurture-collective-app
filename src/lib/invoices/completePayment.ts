import "server-only";

import { markServiceInvoicePaid } from "@/lib/client-services/storage";

export const completeServiceInvoicePayment = async (input: {
  clientId: string;
  serviceId: string;
  invoiceId: string;
  paymentProvider: string;
  paymentReference?: string;
}): Promise<void> => {
  await markServiceInvoicePaid(
    input.clientId,
    input.serviceId,
    input.invoiceId,
    {
      provider: input.paymentProvider,
      reference: input.paymentReference,
    }
  );
};
