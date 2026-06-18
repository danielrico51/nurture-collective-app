"use client";

export type ServiceFeeItemDraft = {
  id: string;
  label: string;
  amount: string;
};

export const createEmptyFeeItemDraft = (): ServiceFeeItemDraft => ({
  id: crypto.randomUUID(),
  label: "",
  amount: "",
});

export const feeItemsFromDrafts = (
  drafts: ServiceFeeItemDraft[]
): Array<{ id: string; label: string; amountCents: number }> | null => {
  const parsed = drafts
    .map((draft) => {
      const label = draft.label.trim();
      const dollars = Number(draft.amount);
      if (!label || !Number.isFinite(dollars) || dollars < 0) {
        return null;
      }
      return {
        id: draft.id,
        label,
        amountCents: Math.round(dollars * 100),
      };
    })
    .filter(
      (item): item is { id: string; label: string; amountCents: number } =>
        item !== null
    );

  return parsed.length > 0 ? parsed : null;
};

export const draftsFromFeeItems = (
  items: Array<{ id: string; label: string; amountCents: number }>
): ServiceFeeItemDraft[] =>
  items.map((item) => ({
    id: item.id,
    label: item.label,
    amount: (item.amountCents / 100).toFixed(2),
  }));

export const sumDraftFeeItemsCents = (drafts: ServiceFeeItemDraft[]): number =>
  drafts.reduce((total, draft) => {
    const dollars = Number(draft.amount);
    if (!Number.isFinite(dollars) || dollars < 0) return total;
    return total + Math.round(dollars * 100);
  }, 0);

const formatMoney = (cents: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );

interface ServiceFeeItemsEditorProps {
  items: ServiceFeeItemDraft[];
  onChange: (items: ServiceFeeItemDraft[]) => void;
  disabled?: boolean;
}

const ServiceFeeItemsEditor = ({
  items,
  onChange,
  disabled = false,
}: ServiceFeeItemsEditorProps) => {
  const totalCents = sumDraftFeeItemsCents(items);

  const updateItem = (
    id: string,
    patch: Partial<Pick<ServiceFeeItemDraft, "label" | "amount">>
  ) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      onChange([createEmptyFeeItemDraft()]);
      return;
    }
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
          Fee breakdown
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...items, createEmptyFeeItemDraft()])}
          className="text-xs font-semibold text-nurture-sage-dark hover:underline disabled:opacity-60"
        >
          + Add line
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
            <input
              value={item.label}
              disabled={disabled}
              onChange={(e) => updateItem(item.id, { label: e.target.value })}
              placeholder="Doula fee, TNP, transportation…"
              className="w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage disabled:opacity-60"
            />
            <input
              value={item.amount}
              disabled={disabled}
              onChange={(e) => updateItem(item.id, { amount: e.target.value })}
              placeholder="0.00"
              inputMode="decimal"
              className="w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage disabled:opacity-60"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeItem(item.id)}
              className="rounded-xl border border-nurture-sage/20 px-3 py-2 text-xs font-semibold text-nurture-charcoal/60 hover:bg-nurture-cream disabled:opacity-60"
              aria-label="Remove line item"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs font-semibold text-nurture-charcoal">
        Total: {formatMoney(totalCents)}
      </p>
    </div>
  );
};

export default ServiceFeeItemsEditor;
