"use client";

import {
  createClientService,
  createServiceInvoice,
  fetchClientServices,
  updateServiceInvoice,
} from "@/lib/api/clientsClient";
import { PAYMENT_METHODS } from "@/config/paymentMethods";
import type {
  ClientServiceWithInvoices,
  PaymentMethodId,
  ServiceInvoiceStatus,
} from "@/types/clientService";
import { useCallback, useEffect, useState } from "react";
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
  const [serviceFee, setServiceFee] = useState("");
  const [serviceDocUrl, setServiceDocUrl] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");

  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceMethod, setInvoiceMethod] = useState<PaymentMethodId>("zelle");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchClientServices(clientId);
      setServices(data.services);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load services");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetServiceForm = () => {
    setServiceTitle("");
    setServiceProvider("");
    setServiceDate(new Date().toISOString().slice(0, 10));
    setServiceFee("");
    setServiceDocUrl("");
    setServiceNotes("");
  };

  const handleCreateService = async (event: React.FormEvent) => {
    event.preventDefault();
    const totalFeeCents = parseDollarsToCents(serviceFee);
    if (!serviceTitle.trim()) {
      toast.error("Service title is required");
      return;
    }
    if (totalFeeCents === null) {
      toast.error("Enter a valid total fee");
      return;
    }

    setSaving(true);
    try {
      await createClientService(clientId, {
        title: serviceTitle.trim(),
        providerName: serviceProvider.trim(),
        serviceDate,
        totalFeeCents,
        googleDocUrl: serviceDocUrl.trim() || null,
        notes: serviceNotes.trim(),
      });
      toast.success("Service added");
      resetServiceForm();
      setShowAddServiceForm(false);
      await load();
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
    const amountCents = options?.fullBalance
      ? service.balanceDueCents
      : parseDollarsToCents(invoiceAmount);

    if (amountCents === null || amountCents <= 0) {
      toast.error("Enter a valid invoice amount");
      return;
    }

    setSaving(true);
    try {
      await createServiceInvoice(clientId, service.serviceId, {
        amountCents,
        paymentMethod: invoiceMethod,
        description: invoiceDescription.trim() || undefined,
        dueDate: invoiceDueDate || null,
        send: options?.send ?? true,
      });
      toast.success("Invoice created");
      setInvoiceAmount("");
      setInvoiceDescription("");
      setInvoiceDueDate("");
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create invoice");
    } finally {
      setSaving(false);
    }
  };

  const handleInvoiceAction = async (
    serviceId: string,
    invoiceId: string,
    action: "markSent" | "markPaid"
  ) => {
    setSaving(true);
    try {
      await updateServiceInvoice(clientId, serviceId, invoiceId, {
        markSent: action === "markSent",
        markPaid: action === "markPaid",
      });
      toast.success(action === "markPaid" ? "Marked paid" : "Invoice sent");
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
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
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Total fee (USD)
            </span>
            <input
              value={serviceFee}
              onChange={(e) => setServiceFee(e.target.value)}
              placeholder="154.25"
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
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
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-nurture-sage/15 bg-white px-3 py-2 text-xs"
                            >
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
                                {invoice.status === "draft" ? (
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                      void handleInvoiceAction(
                                        service.serviceId,
                                        invoice.invoiceId,
                                        "markSent"
                                      )
                                    }
                                    className="text-nurture-sage-dark font-medium hover:underline disabled:opacity-60"
                                  >
                                    Send
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
                              Amount (USD)
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
