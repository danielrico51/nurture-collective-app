import { quickBooksPost } from "@/lib/integrations/quickbooks/client";

export const createQuickBooksInvoicePayment = async (input: {
  customerId: string;
  invoiceId: string;
  amount: number;
  privateNote?: string;
}): Promise<void> => {
  await quickBooksPost("/payment", {
    CustomerRef: { value: input.customerId },
    TotalAmt: input.amount,
    Line: [
      {
        Amount: input.amount,
        LinkedTxn: [{ TxnId: input.invoiceId, TxnType: "Invoice" }],
      },
    ],
    PrivateNote: input.privateNote,
  });
};
