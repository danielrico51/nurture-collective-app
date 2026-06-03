import type { GiftCardOrder } from "@/types/giftCard";

/** Sample paid order for email previews and local tests. */
export const createSampleGiftCardOrder = (
  overrides?: Partial<GiftCardOrder>
): GiftCardOrder => {
  const now = new Date().toISOString();
  return {
    id: "sample-order-00000000-0000-4000-8000-000000000001",
    status: "paid",
    amountCents: 5000,
    currency: "USD",
    designId: "sage",
    purchaser: {
      name: "Alex Morgan",
      email: "purchaser@example.com",
      phone: "555-0100",
    },
    recipient: {
      name: "Jordan Lee",
      email: "recipient@example.com",
    },
    message: "Wishing you rest and support on your journey — we love you!",
    sendCopyToPurchaser: true,
    createdAt: now,
    updatedAt: now,
    paidAt: now,
    paymentProvider: "stripe",
    paymentReference: "cs_test_sample_session",
    quickbooks: {
      syncStatus: "synced",
      salesReceiptId: "123",
      salesReceiptNumber: "1042",
      lastSyncAt: now,
    },
    ...overrides,
  };
};
