"use client";

import {
  giftCardDesigns,
  giftCardMaxAmount,
  giftCardMinAmount,
  giftCardPresetAmounts,
  type GiftCardDesignId,
} from "@/content/giftCards";
import { giftCardCheckoutConfig } from "@/config/giftCards";
import { dollarsToCents } from "@/lib/giftCards/validateOrder";
import type {
  GiftCardCheckoutResponse,
  GiftCardDeliveryTiming,
} from "@/types/giftCard";
import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";

const inputClassName =
  "mt-2 w-full rounded-lg border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

const tomorrowIsoDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const EGiftCardForm = () => {
  const [selectedPreset, setSelectedPreset] = useState<number | "custom">(100);
  const [customAmount, setCustomAmount] = useState("");
  const [designId, setDesignId] = useState<GiftCardDesignId>("sage");
  const [deliveryTiming, setDeliveryTiming] =
    useState<GiftCardDeliveryTiming>("immediate");
  const [deliverOn, setDeliverOn] = useState(tomorrowIsoDate());
  const [sendCopyToPurchaser, setSendCopyToPurchaser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    orderId: string;
    message?: string;
    checkoutPending: boolean;
    amountDollars: number;
    designClassName: string;
  } | null>(null);

  const amountDollars = useMemo(() => {
    if (selectedPreset === "custom") {
      const parsed = Number(customAmount);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return selectedPreset;
  }, [customAmount, selectedPreset]);

  const amountLabel = formatCurrency(amountDollars || 0);
  const selectedDesign =
    giftCardDesigns.find((design) => design.id === designId) ?? giftCardDesigns[0];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    const form = event.currentTarget;
    const data = new FormData(form);
    const amountCents = dollarsToCents(amountDollars);

    if (amountCents < dollarsToCents(giftCardMinAmount)) {
      toast.error(`Minimum gift card amount is $${giftCardMinAmount}.`);
      setSubmitting(false);
      return;
    }

    if (amountCents > dollarsToCents(giftCardMaxAmount)) {
      toast.error(`Maximum gift card amount is $${giftCardMaxAmount}.`);
      setSubmitting(false);
      return;
    }

    const origin = window.location.origin;
    const payload = {
      amountCents,
      designId,
      deliveryTiming,
      deliverOn: deliveryTiming === "scheduled" ? String(data.get("deliverOn") ?? "") : undefined,
      purchaser: {
        name: String(data.get("purchaserName") ?? ""),
        email: String(data.get("purchaserEmail") ?? ""),
        phone: String(data.get("purchaserPhone") ?? "") || undefined,
      },
      recipient: {
        name: String(data.get("recipientName") ?? ""),
        email: String(data.get("recipientEmail") ?? ""),
      },
      message: String(data.get("message") ?? "") || undefined,
      sendCopyToPurchaser,
      successUrl: `${origin}/gift-cards?status=success`,
      cancelUrl: `${origin}/gift-cards?status=cancelled`,
    };

    try {
      const response = await fetch("/api/gift-cards/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as GiftCardCheckoutResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Could not start checkout");
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      setConfirmation({
        orderId: result.orderId,
        message: result.message,
        checkoutPending: !giftCardCheckoutConfig.paymentsEnabled,
        amountDollars,
        designClassName: selectedDesign.className,
      });
      form.reset();
      setSelectedPreset(100);
      setCustomAmount("");
      setDesignId("sage");
      setDeliveryTiming("immediate");
      toast.success("Gift card order received");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="rounded-2xl border border-nurture-sage/20 bg-white p-8 shadow-sm">
        <div
          className={`rounded-2xl bg-gradient-to-br ${confirmation.designClassName} px-6 py-10 text-center`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nurture-charcoal/60">
            The Nesting Place eGift Card
          </p>
          <p className="mt-3 font-serif text-4xl font-semibold text-nurture-charcoal">
            {formatCurrency(confirmation.amountDollars)}
          </p>
        </div>
        <h2 className="mt-8 font-serif text-2xl font-semibold text-nurture-charcoal">
          {confirmation.checkoutPending
            ? "Almost there — payment coming soon"
            : "Order received"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-nurture-charcoal/75">
          {confirmation.message ??
            "Thank you! We'll email you shortly with next steps to complete your purchase."}
        </p>
        <p className="mt-4 rounded-lg bg-nurture-cream/80 px-4 py-3 text-sm text-nurture-charcoal/70">
          Reference:{" "}
          <span className="font-mono text-xs">{confirmation.orderId}</span>
        </p>
        <button
          type="button"
          onClick={() => setConfirmation(null)}
          className="mt-6 w-full rounded-full border border-nurture-sage/30 px-5 py-3 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
        >
          Purchase another gift card
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            eGift Card
          </h2>
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            Digital delivery by email · redeemable toward maternal wellness services
          </p>
        </div>
        <div
          className={`hidden min-w-[7rem] rounded-xl bg-gradient-to-br sm:block ${selectedDesign.className} px-4 py-5 text-center`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-nurture-charcoal/55">
            Preview
          </p>
          <p className="mt-1 font-serif text-xl font-semibold text-nurture-charcoal">
            {amountLabel}
          </p>
        </div>
      </div>

      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-nurture-charcoal">
          Gift amount
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {giftCardPresetAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setSelectedPreset(amount)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedPreset === amount
                  ? "bg-nurture-sage text-white"
                  : "border border-nurture-sage/25 text-nurture-charcoal/75 hover:border-nurture-sage/45"
              }`}
            >
              {formatCurrency(amount)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedPreset("custom")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedPreset === "custom"
                ? "bg-nurture-sage text-white"
                : "border border-nurture-sage/25 text-nurture-charcoal/75 hover:border-nurture-sage/45"
            }`}
          >
            Custom
          </button>
        </div>
        {selectedPreset === "custom" ? (
          <div className="mt-4">
            <label htmlFor="customAmount" className="sr-only">
              Custom amount
            </label>
            <div className="relative max-w-xs">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-nurture-charcoal/50">
                $
              </span>
              <input
                id="customAmount"
                name="customAmount"
                type="number"
                min={giftCardMinAmount}
                max={giftCardMaxAmount}
                step="1"
                required
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                className={`${inputClassName} pl-8`}
                placeholder={`${giftCardMinAmount}–${giftCardMaxAmount}`}
              />
            </div>
          </div>
        ) : null}
        <p className="mt-2 text-xs text-nurture-charcoal/50">
          ${giftCardMinAmount}–${giftCardMaxAmount} · Amount selected: {amountLabel}
        </p>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-nurture-charcoal">Card design</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {giftCardDesigns.map((design) => (
            <button
              key={design.id}
              type="button"
              onClick={() => setDesignId(design.id)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                designId === design.id
                  ? "border-nurture-sage bg-nurture-sage/10 text-nurture-sage-dark"
                  : "border-nurture-sage/20 text-nurture-charcoal/70 hover:border-nurture-sage/40"
              }`}
            >
              <span
                className={`mr-2 inline-block h-4 w-4 rounded-full bg-gradient-to-br ${design.className}`}
              />
              {design.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-nurture-charcoal">Recipient</p>
        </div>
        <div>
          <label htmlFor="recipientName" className="block text-sm font-medium text-nurture-charcoal">
            Recipient name
          </label>
          <input
            id="recipientName"
            name="recipientName"
            type="text"
            required
            autoComplete="name"
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="recipientEmail" className="block text-sm font-medium text-nurture-charcoal">
            Recipient email
          </label>
          <input
            id="recipientEmail"
            name="recipientEmail"
            type="email"
            required
            autoComplete="email"
            className={inputClassName}
          />
        </div>
      </div>

      <div className="mt-8">
        <label htmlFor="message" className="block text-sm font-medium text-nurture-charcoal">
          Personal message{" "}
          <span className="font-normal text-nurture-charcoal/50">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={500}
          placeholder="Wishing you rest, support, and a gentle fourth trimester…"
          className={inputClassName}
        />
      </div>

      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-nurture-charcoal">Delivery</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-xl border px-4 py-3 text-sm ${
              deliveryTiming === "immediate"
                ? "border-nurture-sage bg-nurture-sage/10"
                : "border-nurture-sage/20"
            }`}
          >
            <input
              type="radio"
              name="deliveryTiming"
              value="immediate"
              checked={deliveryTiming === "immediate"}
              onChange={() => setDeliveryTiming("immediate")}
              className="sr-only"
            />
            <span className="font-medium text-nurture-charcoal">Send immediately</span>
            <p className="mt-1 text-xs text-nurture-charcoal/60">
              After payment, we email the recipient right away.
            </p>
          </label>
          <label
            className={`cursor-pointer rounded-xl border px-4 py-3 text-sm ${
              deliveryTiming === "scheduled"
                ? "border-nurture-sage bg-nurture-sage/10"
                : "border-nurture-sage/20"
            }`}
          >
            <input
              type="radio"
              name="deliveryTiming"
              value="scheduled"
              checked={deliveryTiming === "scheduled"}
              onChange={() => setDeliveryTiming("scheduled")}
              className="sr-only"
            />
            <span className="font-medium text-nurture-charcoal">Schedule delivery</span>
            <p className="mt-1 text-xs text-nurture-charcoal/60">
              Choose a future date for a birthday, shower, or holiday.
            </p>
          </label>
        </div>
        {deliveryTiming === "scheduled" ? (
          <div className="mt-4 max-w-xs">
            <label htmlFor="deliverOn" className="block text-sm font-medium text-nurture-charcoal">
              Delivery date
            </label>
            <input
              id="deliverOn"
              name="deliverOn"
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              value={deliverOn}
              onChange={(event) => setDeliverOn(event.target.value)}
              className={inputClassName}
            />
          </div>
        ) : null}
      </fieldset>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-nurture-charcoal">Your information</p>
        </div>
        <div>
          <label htmlFor="purchaserName" className="block text-sm font-medium text-nurture-charcoal">
            Your name
          </label>
          <input
            id="purchaserName"
            name="purchaserName"
            type="text"
            required
            autoComplete="name"
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="purchaserEmail" className="block text-sm font-medium text-nurture-charcoal">
            Your email
          </label>
          <input
            id="purchaserEmail"
            name="purchaserEmail"
            type="email"
            required
            autoComplete="email"
            className={inputClassName}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="purchaserPhone" className="block text-sm font-medium text-nurture-charcoal">
            Phone{" "}
            <span className="font-normal text-nurture-charcoal/50">(optional)</span>
          </label>
          <input
            id="purchaserPhone"
            name="purchaserPhone"
            type="tel"
            autoComplete="tel"
            placeholder="+12065550100"
            className={inputClassName}
          />
        </div>
      </div>

      <label className="mt-6 flex items-start gap-3 text-sm text-nurture-charcoal/75">
        <input
          type="checkbox"
          checked={sendCopyToPurchaser}
          onChange={(event) => setSendCopyToPurchaser(event.target.checked)}
          className="mt-1 accent-nurture-sage"
        />
        Email me a copy of the gift card receipt
      </label>

      <label className="mt-4 flex items-start gap-3 text-sm text-nurture-charcoal/75">
        <input
          type="checkbox"
          name="termsAccepted"
          required
          className="mt-1 accent-nurture-sage"
        />
        I understand gift cards are non-refundable except where required by law, and
        services are subject to availability in the recipient&apos;s service area.
      </label>

      <button
        type="submit"
        disabled={submitting || amountDollars < giftCardMinAmount}
        className="mt-8 w-full rounded-full bg-nurture-sage py-3.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
      >
        {submitting
          ? "Processing…"
          : giftCardCheckoutConfig.paymentsEnabled
            ? `Continue to payment · ${amountLabel}`
            : `Submit order · ${amountLabel}`}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-nurture-charcoal/50">
        {giftCardCheckoutConfig.paymentsEnabled
          ? "You will be redirected to our secure payment partner to complete purchase."
          : "Secure checkout is being connected. Orders are saved now and our team will follow up to complete payment."}
      </p>
    </form>
  );
};

export default EGiftCardForm;
