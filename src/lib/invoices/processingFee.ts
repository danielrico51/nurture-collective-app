import type { PaymentMethodId } from "@/types/clientService";

export const DEFAULT_PROCESSING_FEE_PERCENT = 3;

/** Payment methods where the CRM adds a manual processing-fee line item. */
export const PROCESSING_FEE_PAYMENT_METHODS: PaymentMethodId[] = [
  "venmo",
  "stripe",
  "quickbooks",
];

export const paymentMethodSupportsProcessingFee = (
  method: PaymentMethodId
): boolean => PROCESSING_FEE_PAYMENT_METHODS.includes(method);

export const computeProcessingFeeCents = (
  subtotalCents: number,
  percent: number
): number => {
  if (subtotalCents <= 0 || percent <= 0) return 0;
  return Math.round((subtotalCents * percent) / 100);
};

export const resolveInvoiceAmounts = (input: {
  subtotalCents: number;
  applyProcessingFee?: boolean;
  processingFeePercent?: number | null;
}): {
  subtotalCents: number;
  processingFeeCents: number;
  processingFeePercent: number | null;
  amountCents: number;
} => {
  const subtotalCents = Math.max(0, Math.round(input.subtotalCents));
  const apply = Boolean(input.applyProcessingFee);
  const percent =
    apply && input.processingFeePercent != null && input.processingFeePercent > 0
      ? input.processingFeePercent
      : apply
        ? DEFAULT_PROCESSING_FEE_PERCENT
        : null;

  const processingFeeCents =
    percent != null ? computeProcessingFeeCents(subtotalCents, percent) : 0;

  return {
    subtotalCents,
    processingFeeCents,
    processingFeePercent: processingFeeCents > 0 ? percent : null,
    amountCents: subtotalCents + processingFeeCents,
  };
};

export const normalizeStoredInvoiceAmounts = (invoice: {
  amountCents: number;
  subtotalCents?: number | null;
  processingFeeCents?: number | null;
  processingFeePercent?: number | null;
}): {
  subtotalCents: number;
  processingFeeCents: number;
  processingFeePercent: number | null;
  amountCents: number;
} => {
  const processingFeeCents = Math.max(
    0,
    Math.round(invoice.processingFeeCents ?? 0)
  );
  const subtotalCents =
    invoice.subtotalCents != null && invoice.subtotalCents > 0
      ? Math.round(invoice.subtotalCents)
      : Math.max(0, invoice.amountCents - processingFeeCents);

  return {
    subtotalCents,
    processingFeeCents,
    processingFeePercent:
      processingFeeCents > 0
        ? invoice.processingFeePercent ?? DEFAULT_PROCESSING_FEE_PERCENT
        : null,
    amountCents: subtotalCents + processingFeeCents,
  };
};

export const resolveInvoiceAmountFieldsFromInput = (input: {
  amountCents?: unknown;
  applyProcessingFee?: boolean;
  processingFeePercent?: number | null;
  paymentMethod: PaymentMethodId;
  existing?: {
    subtotalCents?: number;
    processingFeeCents?: number;
    processingFeePercent?: number | null;
    amountCents: number;
    paymentMethod: PaymentMethodId;
  };
}): {
  subtotalCents: number;
  processingFeeCents: number;
  processingFeePercent: number | null;
  amountCents: number;
} => {
  const paymentMethod = input.paymentMethod;
  const existingAmounts = input.existing
    ? normalizeStoredInvoiceAmounts(input.existing)
    : null;

  const subtotalCents =
    input.amountCents !== undefined
      ? Math.max(0, Math.round(Number(input.amountCents)))
      : (existingAmounts?.subtotalCents ?? 0);

  if (!Number.isFinite(subtotalCents)) {
    throw new Error("amountCents must be a non-negative amount");
  }

  const supportsFee = paymentMethodSupportsProcessingFee(paymentMethod);
  const applyFee =
    input.applyProcessingFee !== undefined
      ? Boolean(input.applyProcessingFee)
      : supportsFee && (existingAmounts?.processingFeeCents ?? 0) > 0;

  if (!supportsFee || !applyFee) {
    return {
      subtotalCents,
      processingFeeCents: 0,
      processingFeePercent: null,
      amountCents: subtotalCents,
    };
  }

  return resolveInvoiceAmounts({
    subtotalCents,
    applyProcessingFee: true,
    processingFeePercent:
      input.processingFeePercent !== undefined
        ? input.processingFeePercent
        : existingAmounts?.processingFeePercent,
  });
};
