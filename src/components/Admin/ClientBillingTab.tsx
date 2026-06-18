"use client";

import {
  createClientBillingOrder,
  fetchClientBilling,
} from "@/lib/api/clientsClient";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/types/billing";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ClientBillingTabProps {
  clientId: string;
  defaultEmail: string;
  defaultName: string;
}

const STATUS_BADGE: Record<PurchaseOrderStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  payment_processing: "bg-sky-100 text-sky-800",
  paid: "bg-emerald-100 text-emerald-800",
  invoice_pending: "bg-amber-100 text-amber-800",
  invoice_sent: "bg-violet-100 text-violet-800",
  invoice_paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-nurture-charcoal/10 text-nurture-charcoal/60",
  refunded: "bg-rose-100 text-rose-800",
};

const formatMoney = (cents: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

const ClientBillingTab = ({
  clientId,
  defaultEmail,
  defaultName,
}: ClientBillingTabProps) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"invoice" | "charge">("invoice");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchClientBilling(clientId);
      setOrders(data.orders);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load billing");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const dollars = Number(amount);
    const qty = Number(quantity);
    if (!description.trim()) {
      toast.error("Add a description");
      return;
    }
    if (!Number.isFinite(dollars) || dollars <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const result = await createClientBillingOrder(clientId, {
        mode,
        customerEmail: defaultEmail || undefined,
        customerName: defaultName || undefined,
        lineItems: [
          {
            sku: description.trim().slice(0, 64),
            name: description.trim(),
            quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
            unitAmountCents: Math.round(dollars * 100),
          },
        ],
      });
      if (mode === "charge" && result.payment.checkoutUrl) {
        toast.success("Charge created — payment link ready");
        window.open(result.payment.checkoutUrl, "_blank", "noopener");
      } else {
        toast.success(
          result.payment.message || "Invoice created and sent via QuickBooks"
        );
      }
      setDescription("");
      setAmount("");
      setQuantity("1");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-nurture-sage/15 bg-white p-4"
      >
        <h4 className="text-sm font-semibold text-nurture-charcoal">
          New billing order
        </h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Description
            </span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Postpartum doula package"
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Amount (USD)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Quantity
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Type
            </span>
            <select
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as "invoice" | "charge")
              }
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            >
              <option value="invoice">Send QuickBooks invoice</option>
              <option value="charge">Create payment link (Stripe)</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-full bg-nurture-sage px-5 py-2 text-sm font-semibold text-white transition hover:bg-nurture-sage-dark disabled:opacity-60"
        >
          {saving
            ? "Creating…"
            : mode === "charge"
              ? "Create payment link"
              : "Create & send invoice"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-nurture-charcoal/60">Loading billing…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-nurture-charcoal/60">No billing orders yet.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-nurture-sage/15 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-nurture-charcoal">
                  {formatMoney(order.amountCents)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[order.status]}`}
                >
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-1 text-sm text-nurture-charcoal/70">
                {order.lineItems.map((item) => item.name).join(", ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-nurture-charcoal/50">
                <span>Created {formatDate(order.createdAt)}</span>
                {order.quickbooks?.invoiceNumber ? (
                  <span>QBO #{order.quickbooks.invoiceNumber}</span>
                ) : null}
                {order.quickbooks?.syncStatus ? (
                  <span>QBO: {order.quickbooks.syncStatus}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientBillingTab;
