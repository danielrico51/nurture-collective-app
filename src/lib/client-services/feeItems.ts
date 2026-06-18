import type { ClientServiceFeeItem } from "@/types/clientService";

export interface ClientServiceFeeItemInput {
  id?: string;
  label: string;
  amountCents: number;
}

export const sumFeeItemsCents = (items: ClientServiceFeeItem[]): number =>
  items.reduce((total, item) => total + item.amountCents, 0);

export const parseFeeItemsInput = (raw: unknown): ClientServiceFeeItem[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [];
  }

  const items: ClientServiceFeeItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      throw new Error("Each fee item must be an object");
    }
    const label = String((entry as { label?: unknown }).label ?? "").trim();
    if (!label) {
      throw new Error("Each fee item needs a label");
    }
    const amountCents = Number((entry as { amountCents?: unknown }).amountCents);
    if (!Number.isFinite(amountCents) || amountCents < 0) {
      throw new Error("Each fee item amount must be zero or greater");
    }
    const id =
      String((entry as { id?: unknown }).id ?? "").trim() || crypto.randomUUID();
    items.push({
      id,
      label,
      amountCents: Math.round(amountCents),
    });
  }

  return items;
};

export const resolveServiceTotalFeeCents = (input: {
  feeItems: ClientServiceFeeItem[];
  totalFeeCents?: number;
}): number => {
  if (input.feeItems.length > 0) {
    const sum = sumFeeItemsCents(input.feeItems);
    if (sum <= 0) {
      throw new Error("Fee item total must be greater than zero");
    }
    if (
      input.totalFeeCents !== undefined &&
      input.totalFeeCents !== sum
    ) {
      throw new Error("Total fee must match the sum of fee items");
    }
    return sum;
  }

  const total = Number(input.totalFeeCents);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Enter at least one fee item or a total fee");
  }
  return Math.round(total);
};
