"use client";

import {
  createClientService,
  createServiceInvoice,
  fetchClientServices,
  updateClientService,
  updateServiceInvoice,
} from "@/lib/api/clientsClient";
import ServiceFeeItemsEditor, {
  createEmptyFeeItemDraft,
  draftsFromFeeItems,
  feeItemsFromDrafts,
  type ServiceFeeItemDraft,
} from "@/components/Admin/ServiceFeeItemsEditor";
import { PAYMENT_METHODS } from "@/config/paymentMethods";
import { formatServiceInvoiceQuickBooksLabel } from "@/lib/invoices/quickbooksLabels";
import {
  DEFAULT_PROCESSING_FEE_PERCENT,
  paymentMethodSupportsProcessingFee,
  resolveInvoiceAmounts,
} from "@/lib/invoices/processingFee";
import type {
  ClientServiceWithInvoices,
  PaymentMethodId,
  ServiceInvoiceStatus,
} from "@/types/clientService";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface ClientServicesTabProps {
  clientId: string;
  onChanged?: () => void;
}

const STATUS_BADGE: Record<ServiceInvoiceStatus, string> = {
  draft: "bg-nurture-charcoal/10 text-nurture-charcoal/70",
  sent: "bg-violet-100 text-violet-800",
  pending_payment: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-nurture-charcoal/10 text-nurture-charcoal/50",
  refunded: "bg-rose-100 text-rose-800",
};

const formatMoney = (cents: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );

const parseDollarsToCents = (value: string): number | null => {
  const dollars = Number(value);
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  return Math.round(dollars * 100);
};

interface InvoiceFormDraft {
  amount: string;
  method: PaymentMethodId;
  description: string;
  notes: string;
  dueDate: string;
  applyProcessingFee: boolean;
  processingFeePercent: string;
}

const invoiceFormDraftFromInvoice = (invoice: {
  subtotalCents: number;
  processingFeeCents: number;
  processingFeePercent: number | null;
  paymentMethod: PaymentMethodId;
  description: string;
  notes: string;
  dueDate: string | null;
}): InvoiceFormDraft => ({
  amount: (invoice.subtotalCents / 100).toFixed(2),
  method: invoice.paymentMethod,
  description: invoice.description,
  notes: invoice.notes,
  dueDate: invoice.dueDate ?? "",
  applyProcessingFee: invoice.processingFeeCents > 0,
  processingFeePercent: String(
    invoice.processingFeePercent ?? DEFAULT_PROCESSING_FEE_PERCENT
  ),
});

const previewInvoiceAmounts = (draft: InvoiceFormDraft) => {
  const subtotalCents = parseDollarsToCents(draft.amount) ?? 0;
  const feePercent = Number(draft.processingFeePercent);
  return resolveInvoiceAmounts({
    subtotalCents,
    applyProcessingFee:
      draft.applyProcessingFee &&
      paymentMethodSupportsProcessingFee(draft.method),
    processingFeePercent: Number.isFinite(feePercent) ? feePercent : DEFAULT_PROCESSING_FEE_PERCENT,
  });
};

const ClientServicesTab = ({ clientId, onChanged }: ClientServicesTabProps) => {
  const [services, setServices] = useState<ClientServiceWithInvoices[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);

  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceProvider, setServiceProvider] = useState("");
  const [serviceDate, setServiceDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [serviceFeeItems, setServiceFeeItems] = useState<ServiceFeeItemDraft[]>(
    () => [createEmptyFeeItemDraft()]
  );
  const [editingFeeServiceId, setEditingFeeServiceId] = useState<string | null>(
    null
  );
  const [editFeeItems, setEditFeeItems] = useState<ServiceFeeItemDraft[]>([]);
  const [serviceDocUrl, setServiceDocUrl] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");

  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceMethod, setInvoiceMethod] = useState<PaymentMethodId>("zelle");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [invoiceApplyProcessingFee, setInvoiceApplyProcessingFee] = useState(false);
  const [invoiceProcessingFeePercent, setInvoiceProcessingFeePercent] = useState(
    String(DEFAULT_PROCESSING_FEE_PERCENT)
  );
  const [editingInvoiceKey, setEditingInvoiceKey] = useState<string | null>(null);
  const [editInvoiceDraft, setEditInvoiceDraft] = useState<InvoiceFormDraft | null>(
    null
  );
  const [draftInvoiceNotes, setDraftInvoiceNotes] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setInvoiceApplyProcessingFee(paymentMethodSupportsProcessingFee(invoiceMethod));
  }, [invoiceMethod]);

  const newInvoicePreview = useMemo(
    () =>
      previewInvoiceAmounts({
        amount: invoiceAmount,
        method: invoiceMethod,
        description: invoiceDescription,
        notes: invoiceNotes,
        dueDate: invoiceDueDate,
        applyProcessingFee: invoiceApplyProcessingFee,
        processingFeePercent: invoiceProcessingFeePercent,
      }),
    [
      invoiceAmount,
      invoiceMethod,
      invoiceDescription,
      invoiceNotes,
      invoiceDueDate,
      invoiceApplyProcessingFee,
      invoiceProcessingFeePercent,
    ]
  );

  const editInvoicePreview = useMemo(
    () => (editInvoiceDraft ? previewInvoiceAmounts(editInvoiceDraft) : null),
    [editInvoiceDraft]
  );

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }
    try {
      const data = await fetchClientServices(clientId);
      setServices(data.services);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load services");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetServiceForm = () => {
    setServiceTitle("");
    setServiceProvider("");
    setServiceDate(new Date().toISOString().slice(0, 10));
    setServiceFeeItems([createEmptyFeeItemDraft()]);
    setServiceDocUrl("");
    setServiceNotes("");
  };

  const handleCreateService = async (event: React.FormEvent) => {
    event.preventDefault();
    const feeItems = feeItemsFromDrafts(serviceFeeItems);
    if (!serviceTitle.trim()) {
      toast.error("Service title is required");
      return;
    }
    if (!feeItems) {
      toast.error("Add at least one fee line with a label and amount");
      return;
    }

    setSaving(true);
    try {
      await createClientService(clientId, {
        title: serviceTitle.trim(),
        providerName: serviceProvider.trim(),
        serviceDate,
        feeItems,
        googleDocUrl: serviceDocUrl.trim() || null,
        notes: serviceNotes.trim(),
      });
      toast.success("Service added");
      resetServiceForm();
      setShowAddServiceForm(false);
      await load({ silent: true });
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add service");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInvoice = async (
    service: ClientServiceWithInvoices,
    options?: { fullBalance?: boolean; send?: boolean }
  ) => {
    const subtotalCents = options?.fullBalance
      ? service.balanceDueCents
      : parseDollarsToCents(invoiceAmount);

    if (subtotalCents === null || subtotalCents <= 0) {
      toast.error("Enter a valid invoice amount");
      return;
    }

    const feePercent = Number(invoiceProcessingFeePercent);
    const amounts = resolveInvoiceAmounts({
      subtotalCents,
      applyProcessingFee:
        invoiceApplyProcessingFee &&
        paymentMethodSupportsProcessingFee(invoiceMethod),
      processingFeePercent: Number.isFinite(feePercent)
        ? feePercent
        : DEFAULT_PROCESSING_FEE_PERCENT,
    });

    setSaving(true);
    try {
      await createServiceInvoice(clientId, service.serviceId, {
        amountCents: amounts.subtotalCents,
        applyProcessingFee:
          invoiceApplyProcessingFee &&
          paymentMethodSupportsProcessingFee(invoiceMethod),
        processingFeePercent: amounts.processingFeePercent,
        paymentMethod: invoiceMethod,
        description: invoiceDescription.trim() || undefined,
        notes: invoiceNotes.trim() || undefined,
        dueDate: invoiceDueDate || null,
        send: options?.send ?? true,
      });
      toast.success(options?.send === false ? "Invoice saved as draft" : "Invoice sent");
      setInvoiceAmount("");
      setInvoiceDescription("");
      setInvoiceNotes("");
      setInvoiceDueDate("");
      setInvoiceApplyProcessingFee(
        paymentMethodSupportsProcessingFee(invoiceMethod)
      );
      setInvoiceProcessingFeePercent(String(DEFAULT_PROCESSING_FEE_PERCENT));
      await load({ silent: true });
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create invoice");
    } finally {
      setSaving(false);
    }
  };

  const startEditingFeeBreakdown = (service: ClientServiceWithInvoices) => {
    setEditingFeeServiceId(service.serviceId);
    setEditFeeItems(
      service.feeItems.length > 0
        ? draftsFromFeeItems(service.feeItems)
        : [
            {
              id: crypto.randomUUID(),
              label: "Service fee",
              amount: (service.totalFeeCents / 100).toFixed(2),
            },
          ]
    );
  };

  const handleSaveFeeBreakdown = async (serviceId: string) => {
    const feeItems = feeItemsFromDrafts(editFeeItems);
    if (!feeItems) {
      toast.error("Add at least one fee line with a label and amount");
      return;
    }

    setSaving(true);
    try {
      await updateClientService(clientId, serviceId, { feeItems });
      toast.success("Fee breakdown updated");
      setEditingFeeServiceId(null);
      setEditFeeItems([]);
      await load({ silent: true });
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update breakdown");
    } finally {
      setSaving(false);
    }
  };

  const handleInvoiceAction = async (
    serviceId: string,
    invoiceId: string,
    action: "markSent" | "markPaid" | "markRefunded" | "resend",
    options?: { notes?: string }
  ) => {
    if (action === "markRefunded") {
      const confirmed = window.confirm(
        "Mark this invoice as refunded? This is a tracking label only — process the actual refund manually (Venmo, Stripe, QuickBooks, etc.). The service balance will be restored."
      );
      if (!confirmed) return;
    }

    setSaving(true);
    try {
      await updateServiceInvoice(clientId, serviceId, invoiceId, {
        markSent: action === "markSent",
        markPaid: action === "markPaid",
        markRefunded: action === "markRefunded",
        resend: action === "resend",
        notes: options?.notes,
      });
      toast.success(
        action === "markPaid"
          ? "Marked paid"
          : action === "markRefunded"
            ? "Marked refunded"
            : action === "resend"
              ? "Invoice resent"
              : "Invoice sent"
      );
      await load({ silent: true });
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraftInvoiceNotes = async (
    serviceId: string,
    invoiceId: string
  ) => {
    setSaving(true);
    try {
      await updateServiceInvoice(clientId, serviceId, invoiceId, {
        notes: draftInvoiceNotes[invoiceId] ?? "",
      });
      toast.success("Invoice notes saved");
      await load({ silent: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save notes");
    } finally {
      setSaving(false);
    }
  };

  const startEditingInvoice = (
    serviceId: string,
    invoice: ClientServiceWithInvoices["invoices"][number]
  ) => {
    setEditingInvoiceKey(`${serviceId}:${invoice.invoiceId}`);
    setEditInvoiceDraft(invoiceFormDraftFromInvoice(invoice));
  };

  const cancelEditingInvoice = () => {
    setEditingInvoiceKey(null);
    setEditInvoiceDraft(null);
  };

  const handleSaveInvoiceEdit = async (
    serviceId: string,
    invoiceId: string,
    options: { markSent?: boolean; saveAndResend?: boolean }
  ) => {
    if (!editInvoiceDraft) return;

    const subtotalCents = parseDollarsToCents(editInvoiceDraft.amount);
    if (subtotalCents === null || subtotalCents <= 0) {
      toast.error("Enter a valid invoice amount");
      return;
    }

    const feePercent = Number(editInvoiceDraft.processingFeePercent);
    const amounts = resolveInvoiceAmounts({
      subtotalCents,
      applyProcessingFee:
        editInvoiceDraft.applyProcessingFee &&
        paymentMethodSupportsProcessingFee(editInvoiceDraft.method),
      processingFeePercent: Number.isFinite(feePercent)
        ? feePercent
        : DEFAULT_PROCESSING_FEE_PERCENT,
    });

    setSaving(true);
    try {
      await updateServiceInvoice(clientId, serviceId, invoiceId, {
        amountCents: amounts.subtotalCents,
        applyProcessingFee:
          editInvoiceDraft.applyProcessingFee &&
          paymentMethodSupportsProcessingFee(editInvoiceDraft.method),
        processingFeePercent: amounts.processingFeePercent,
        paymentMethod: editInvoiceDraft.method,
        description: editInvoiceDraft.description.trim(),
        notes: editInvoiceDraft.notes.trim(),
        dueDate: editInvoiceDraft.dueDate || null,
        markSent: options.markSent,
        saveAndResend: options.saveAndResend,
      });
      toast.success(
        options.saveAndResend
          ? "Invoice updated and resent"
          : options.markSent
            ? "Invoice sent"
            : "Invoice saved"
      );
      cancelEditingInvoice();
      await load({ silent: true });
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save invoice");
    } finally {
      setSaving(false);
    }
  };

  const renderProcessingFeeFields = (
    draft: {
      method: PaymentMethodId;
      applyProcessingFee: boolean;
      processingFeePercent: string;
    },
    preview: ReturnType<typeof previewInvoiceAmounts>,
    onChange: (updates: Partial<InvoiceFormDraft>) => void
  ) => {
    if (!paymentMethodSupportsProcessingFee(draft.method)) return null;

    return (
      <div className="sm:col-span-2 space-y-2 rounded-xl border border-nurture-sage/15 bg-nurture-cream/30 p-3">
        <label className="flex items-start gap-2 text-sm text-nurture-charcoal">
          <input
            type="checkbox"
            checked={draft.applyProcessingFee}
            onChange={(e) =>
              onChange({ applyProcessingFee: e.target.checked })
            }
            className="mt-0.5 rounded border-nurture-sage/40"
          />
          <span>
            Add processing fee for card/Venmo payments (default{" "}
            {DEFAULT_PROCESSING_FEE_PERCENT}%)
          </span>
        </label>
        {draft.applyProcessingFee ? (
          <label className="block max-w-xs">
            <span className="text-xs text-nurture-charcoal/60">
              Processing fee (%)
            </span>
            <input
              value={draft.processingFeePercent}
              onChange={(e) =>
                onChange({ processingFeePercent: e.target.value })
              }
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
            />
          </label>
        ) : null}
        {preview.subtotalCents > 0 && draft.applyProcessingFee ? (
          <p className="text-xs text-nurture-charcoal/70">
            Service {formatMoney(preview.subtotalCents)}
            {preview.processingFeeCents > 0
              ? ` + fee ${formatMoney(preview.processingFeeCents)}`
              : ""}{" "}
            = <strong>{formatMoney(preview.amountCents)}</strong> total due
          </p>
        ) : null}
      </div>
    );
  };

  const renderInvoiceEditForm = (
    serviceId: string,
    invoice: ClientServiceWithInvoices["invoices"][number],
    status: ServiceInvoiceStatus
  ) => {
    if (!editInvoiceDraft || editingInvoiceKey !== `${serviceId}:${invoice.invoiceId}`) {
      return null;
    }

    const preview = editInvoicePreview ?? previewInvoiceAmounts(editInvoiceDraft);
    const canEditAmount = status !== "paid";

    return (
      <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
          Edit invoice
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-nurture-charcoal/60">
              Amount (USD, before fee)
            </span>
            <input
              value={editInvoiceDraft.amount}
              onChange={(e) =>
                setEditInvoiceDraft((current) =>
                  current ? { ...current, amount: e.target.value } : current
                )
              }
              disabled={!canEditAmount}
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm disabled:bg-nurture-charcoal/5"
            />
          </label>
          <label className="block">
            <span className="text-xs text-nurture-charcoal/60">Payment method</span>
            <select
              value={editInvoiceDraft.method}
              onChange={(e) => {
                const method = e.target.value as PaymentMethodId;
                setEditInvoiceDraft((current) =>
                  current
                    ? {
                        ...current,
                        method,
                        applyProcessingFee:
                          paymentMethodSupportsProcessingFee(method),
                      }
                    : current
                );
              }}
              disabled={!canEditAmount}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm disabled:bg-nurture-charcoal/5"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label}
                </option>
              ))}
            </select>
          </label>
          {canEditAmount
            ? renderProcessingFeeFields(
                editInvoiceDraft,
                preview,
                (updates) =>
                  setEditInvoiceDraft((current) =>
                    current ? { ...current, ...updates } : current
                  )
              )
            : null}
          <label className="block sm:col-span-2">
            <span className="text-xs text-nurture-charcoal/60">Description</span>
            <input
              value={editInvoiceDraft.description}
              onChange={(e) =>
                setEditInvoiceDraft((current) =>
                  current ? { ...current, description: e.target.value } : current
                )
              }
              disabled={!canEditAmount}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm disabled:bg-nurture-charcoal/5"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-nurture-charcoal/60">
              Notes (included in client email)
            </span>
            <textarea
              rows={2}
              value={editInvoiceDraft.notes}
              onChange={(e) =>
                setEditInvoiceDraft((current) =>
                  current ? { ...current, notes: e.target.value } : current
                )
              }
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-nurture-charcoal/60">Due date</span>
            <input
              type="date"
              value={editInvoiceDraft.dueDate}
              onChange={(e) =>
                setEditInvoiceDraft((current) =>
                  current ? { ...current, dueDate: e.target.value } : current
                )
              }
              disabled={!canEditAmount}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm disabled:bg-nurture-charcoal/5"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "draft" ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void handleSaveInvoiceEdit(serviceId, invoice.invoiceId, {})
                }
                className="rounded-full border border-nurture-sage/30 px-3 py-1.5 text-xs font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-60"
              >
                Save draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void handleSaveInvoiceEdit(serviceId, invoice.invoiceId, {
                    markSent: true,
                  })
                }
                className="rounded-full bg-nurture-sage px-3 py-1.5 text-xs font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
              >
                Save & send
              </button>
            </>
          ) : status === "sent" || status === "pending_payment" ? (
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void handleSaveInvoiceEdit(serviceId, invoice.invoiceId, {
                  saveAndResend: true,
                })
              }
              className="rounded-full bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
            >
              Save & resend
            </button>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={cancelEditingInvoice}
            className="rounded-full border border-nurture-sage/30 px-3 py-1.5 text-xs font-semibold text-nurture-charcoal/70 hover:bg-nurture-charcoal/5 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <p className="text-sm text-nurture-charcoal/60">Loading services…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-nurture-charcoal">Services</h4>
        <button
          type="button"
          onClick={() => {
            if (showAddServiceForm) {
              resetServiceForm();
            }
            setShowAddServiceForm((current) => !current);
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white transition hover:bg-nurture-sage-dark"
          aria-expanded={showAddServiceForm}
        >
          <span aria-hidden className="text-base leading-none">
            {showAddServiceForm ? "×" : "+"}
          </span>
          {showAddServiceForm ? "Close" : "Add service"}
        </button>
      </div>

      {showAddServiceForm ? (
      <form
        onSubmit={handleCreateService}
        className="rounded-2xl border border-nurture-sage/15 bg-white p-4 space-y-3"
      >
        <h4 className="text-sm font-semibold text-nurture-charcoal">New service</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Service
            </span>
            <input
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder="CPR 2/7, Postpartum doula deposit…"
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Provider
            </span>
            <input
              value={serviceProvider}
              onChange={(e) => setServiceProvider(e.target.value)}
              placeholder="Amanda, Rachel…"
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Service date
            </span>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block sm:col-span-2">
            <ServiceFeeItemsEditor
              items={serviceFeeItems}
              onChange={setServiceFeeItems}
              disabled={saving}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Google Doc URL (optional)
            </span>
            <input
              value={serviceDocUrl}
              onChange={(e) => setServiceDocUrl(e.target.value)}
              placeholder="https://docs.google.com/…"
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Notes
            </span>
            <textarea
              rows={2}
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white transition hover:bg-nurture-sage-dark disabled:opacity-60"
          >
            Save service
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              resetServiceForm();
              setShowAddServiceForm(false);
            }}
            className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-semibold text-nurture-sage-dark transition hover:bg-nurture-sage/10 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
      ) : null}

      {services.length === 0 && !showAddServiceForm ? (
        <p className="text-sm text-nurture-charcoal/60">
          No services yet. Click Add service to create one.
        </p>
      ) : null}

      {services.length === 0 ? null : (
        <ul className="space-y-3">
          {services.map((service) => {
            const expanded = expandedId === service.serviceId;
            return (
              <li
                key={service.serviceId}
                className="rounded-2xl border border-nurture-sage/15 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expanded ? null : service.serviceId)
                  }
                  className="w-full px-4 py-3 text-left hover:bg-nurture-cream/50 transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-nurture-charcoal">
                        {service.title}
                      </p>
                      <p className="text-xs text-nurture-charcoal/60 mt-0.5">
                        {service.providerName || "—"} · {service.serviceDate}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold text-nurture-charcoal">
                        {formatMoney(service.totalFeeCents)} total
                      </p>
                      <p className="text-emerald-700">
                        {formatMoney(service.paidCents)} paid
                      </p>
                      <p className="text-amber-800">
                        {formatMoney(service.balanceDueCents)} due
                      </p>
                    </div>
                  </div>
                </button>

                {expanded ? (
                  <div className="border-t border-nurture-sage/10 px-4 py-4 space-y-4 bg-nurture-cream/30">
                    {service.googleDocUrl ? (
                      <a
                        href={service.googleDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-nurture-sage-dark hover:underline"
                      >
                        Open Google Doc
                      </a>
                    ) : null}
                    {service.notes ? (
                      <p className="text-xs text-nurture-charcoal/70 whitespace-pre-wrap">
                        {service.notes}
                      </p>
                    ) : null}

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
                          Fee breakdown
                        </h5>
                        {editingFeeServiceId !== service.serviceId ? (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => startEditingFeeBreakdown(service)}
                            className="text-xs font-semibold text-nurture-sage-dark hover:underline disabled:opacity-60"
                          >
                            Edit breakdown
                          </button>
                        ) : null}
                      </div>
                      {editingFeeServiceId === service.serviceId ? (
                        <div className="rounded-xl border border-nurture-sage/20 bg-white p-3 space-y-3">
                          <ServiceFeeItemsEditor
                            items={editFeeItems}
                            onChange={setEditFeeItems}
                            disabled={saving}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                void handleSaveFeeBreakdown(service.serviceId)
                              }
                              className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
                            >
                              Save breakdown
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => {
                                setEditingFeeServiceId(null);
                                setEditFeeItems([]);
                              }}
                              className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : service.feeItems.length > 0 ? (
                        <ul className="rounded-xl border border-nurture-sage/15 bg-white divide-y divide-nurture-sage/10 text-xs">
                          {service.feeItems.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between gap-3 px-3 py-2"
                            >
                              <span className="text-nurture-charcoal">{item.label}</span>
                              <span className="font-semibold text-nurture-charcoal">
                                {formatMoney(item.amountCents)}
                              </span>
                            </li>
                          ))}
                          <li className="flex items-center justify-between gap-3 px-3 py-2 bg-nurture-cream/40 font-semibold">
                            <span className="text-nurture-charcoal">Total</span>
                            <span>{formatMoney(service.totalFeeCents)}</span>
                          </li>
                        </ul>
                      ) : (
                        <p className="text-xs text-nurture-charcoal/60">
                          {formatMoney(service.totalFeeCents)} total — click Edit breakdown
                          to itemize (Doula fee, TNP, transportation, etc.).
                        </p>
                      )}
                    </div>

                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50 mb-2">
                        Invoices
                      </h5>
                      {service.invoices.length === 0 ? (
                        <p className="text-xs text-nurture-charcoal/60">No invoices yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {service.invoices.map((invoice) => (
                            <li
                              key={invoice.invoiceId}
                              className="rounded-xl border border-nurture-sage/15 bg-white px-3 py-2 text-xs space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold text-nurture-charcoal">
                                  {invoice.invoiceNumber}
                                </p>
                                <p className="text-nurture-charcoal/60">
                                  {invoice.description} ·{" "}
                                  {PAYMENT_METHODS.find(
                                    (m) => m.id === invoice.paymentMethod
                                  )?.label ?? invoice.paymentMethod}
                                </p>
                                {invoice.processingFeeCents > 0 ? (
                                  <p className="text-nurture-charcoal/60">
                                    {formatMoney(invoice.subtotalCents)} +{" "}
                                    {formatMoney(invoice.processingFeeCents)} fee (
                                    {invoice.processingFeePercent}%)
                                  </p>
                                ) : null}
                                {formatServiceInvoiceQuickBooksLabel(
                                  invoice.quickbooks
                                ) ? (
                                  <p className="text-nurture-charcoal/60">
                                    QuickBooks:{" "}
                                    {formatServiceInvoiceQuickBooksLabel(
                                      invoice.quickbooks
                                    )}
                                  </p>
                                ) : null}
                                {invoice.notes && invoice.status !== "draft" ? (
                                  <p className="mt-1 text-nurture-charcoal/70 whitespace-pre-wrap">
                                    <span className="font-semibold">Notes:</span>{" "}
                                    {invoice.notes}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">
                                  {formatMoney(invoice.amountCents)}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ${STATUS_BADGE[invoice.status]}`}
                                >
                                  {invoice.status.replace(/_/g, " ")}
                                </span>
                                {invoice.pdfDownloadUrl ? (
                                  <a
                                    href={invoice.pdfDownloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-nurture-sage-dark font-medium hover:underline"
                                  >
                                    Client PDF link
                                  </a>
                                ) : null}
                                {invoice.status !== "draft" ? (
                                  <a
                                    href={`/api/admin/clients/${clientId}/services/${service.serviceId}/invoices/${invoice.invoiceId}/document`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-nurture-sage-dark font-medium hover:underline"
                                  >
                                    View / print
                                  </a>
                                ) : null}
                                {invoice.lastEmailError ? (
                                  <span
                                    className="text-rose-700"
                                    title={invoice.lastEmailError}
                                  >
                                    Email failed
                                  </span>
                                ) : null}
                                {invoice.status === "draft" ? (
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                      void handleInvoiceAction(
                                        service.serviceId,
                                        invoice.invoiceId,
                                        "markSent",
                                        {
                                          notes:
                                            draftInvoiceNotes[invoice.invoiceId] ??
                                            invoice.notes,
                                        }
                                      )
                                    }
                                    className="text-nurture-sage-dark font-medium hover:underline disabled:opacity-60"
                                  >
                                    Send
                                  </button>
                                ) : null}
                                {(invoice.status === "draft" ||
                                  invoice.status === "sent" ||
                                  invoice.status === "pending_payment") &&
                                editingInvoiceKey !==
                                  `${service.serviceId}:${invoice.invoiceId}` ? (
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                      startEditingInvoice(service.serviceId, invoice)
                                    }
                                    className="text-nurture-charcoal font-medium hover:underline disabled:opacity-60"
                                  >
                                    Edit
                                  </button>
                                ) : null}
                                {invoice.status === "paid" ||
                                invoice.status === "sent" ||
                                invoice.status === "pending_payment" ? (
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                      void handleInvoiceAction(
                                        service.serviceId,
                                        invoice.invoiceId,
                                        "resend",
                                        {
                                          notes:
                                            draftInvoiceNotes[invoice.invoiceId] ??
                                            invoice.notes,
                                        }
                                      )
                                    }
                                    className="text-violet-700 font-medium hover:underline disabled:opacity-60"
                                  >
                                    Resend
                                  </button>
                                ) : null}
                                {invoice.status === "paid" ? (
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                      void handleInvoiceAction(
                                        service.serviceId,
                                        invoice.invoiceId,
                                        "markRefunded"
                                      )
                                    }
                                    className="text-rose-700 font-medium hover:underline disabled:opacity-60"
                                  >
                                    Mark refunded
                                  </button>
                                ) : null}
                                {invoice.status !== "paid" &&
                                invoice.status !== "cancelled" &&
                                invoice.status !== "refunded" ? (
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                      void handleInvoiceAction(
                                        service.serviceId,
                                        invoice.invoiceId,
                                        "markPaid"
                                      )
                                    }
                                    className="text-emerald-700 font-medium hover:underline disabled:opacity-60"
                                  >
                                    Mark paid
                                  </button>
                                ) : null}
                              </div>
                              </div>
                              {renderInvoiceEditForm(
                                service.serviceId,
                                invoice,
                                invoice.status
                              )}
                              {invoice.status === "draft" &&
                              editingInvoiceKey !==
                                `${service.serviceId}:${invoice.invoiceId}` ? (
                                <label className="block">
                                  <span className="text-nurture-charcoal/60">
                                    Notes (included in client email)
                                  </span>
                                  <textarea
                                    rows={2}
                                    value={
                                      draftInvoiceNotes[invoice.invoiceId] ??
                                      invoice.notes
                                    }
                                    onChange={(e) =>
                                      setDraftInvoiceNotes((current) => ({
                                        ...current,
                                        [invoice.invoiceId]: e.target.value,
                                      }))
                                    }
                                    placeholder="Insurance submission details, reimbursement codes, special instructions…"
                                    className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                                  />
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                      void handleSaveDraftInvoiceNotes(
                                        service.serviceId,
                                        invoice.invoiceId
                                      )
                                    }
                                    className="mt-1 text-nurture-sage-dark font-medium hover:underline disabled:opacity-60"
                                  >
                                    Save notes
                                  </button>
                                </label>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {service.balanceDueCents > 0 ? (
                      <div className="rounded-xl border border-nurture-sage/20 bg-white p-3 space-y-3">
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
                          New invoice
                        </h5>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-xs text-nurture-charcoal/60">
                              Amount (USD, before fee)
                            </span>
                            <input
                              value={invoiceAmount}
                              onChange={(e) => setInvoiceAmount(e.target.value)}
                              placeholder={(service.balanceDueCents / 100).toFixed(2)}
                              inputMode="decimal"
                              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs text-nurture-charcoal/60">
                              Payment method
                            </span>
                            <select
                              value={invoiceMethod}
                              onChange={(e) =>
                                setInvoiceMethod(e.target.value as PaymentMethodId)
                              }
                              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                            >
                              {PAYMENT_METHODS.map((method) => (
                                <option key={method.id} value={method.id}>
                                  {method.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          {renderProcessingFeeFields(
                            {
                              method: invoiceMethod,
                              applyProcessingFee: invoiceApplyProcessingFee,
                              processingFeePercent: invoiceProcessingFeePercent,
                            },
                            newInvoicePreview,
                            (updates) => {
                              if (updates.applyProcessingFee !== undefined) {
                                setInvoiceApplyProcessingFee(
                                  updates.applyProcessingFee
                                );
                              }
                              if (updates.processingFeePercent !== undefined) {
                                setInvoiceProcessingFeePercent(
                                  updates.processingFeePercent
                                );
                              }
                            }
                          )}
                          <label className="block sm:col-span-2">
                            <span className="text-xs text-nurture-charcoal/60">
                              Description
                            </span>
                            <input
                              value={invoiceDescription}
                              onChange={(e) => setInvoiceDescription(e.target.value)}
                              placeholder="Deposit, installment 2…"
                              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                            />
                          </label>
                          <label className="block sm:col-span-2">
                            <span className="text-xs text-nurture-charcoal/60">
                              Notes (included in client email)
                            </span>
                            <textarea
                              rows={2}
                              value={invoiceNotes}
                              onChange={(e) => setInvoiceNotes(e.target.value)}
                              placeholder="Insurance submission details, reimbursement codes, special instructions…"
                              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs text-nurture-charcoal/60">
                              Due date
                            </span>
                            <input
                              type="date"
                              value={invoiceDueDate}
                              onChange={(e) => setInvoiceDueDate(e.target.value)}
                              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                            />
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void handleCreateInvoice(service)}
                            className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
                          >
                            Create & send invoice
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              void handleCreateInvoice(service, { fullBalance: true })
                            }
                            className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-60"
                          >
                            Bill full balance ({formatMoney(service.balanceDueCents)})
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-700 font-medium">
                        Service fully paid.
                      </p>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ClientServicesTab;
