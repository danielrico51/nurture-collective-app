"use client";

import { fetchAuthSession } from "aws-amplify/auth";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

type QuickBooksSurchargingHint = "enabled" | "disabled" | "unknown";

interface QuickBooksPaymentsSetup {
  onlinePaymentsEnabled?: boolean;
  creditCardPaymentsEnabled?: boolean;
  achPaymentsEnabled?: boolean;
  surchargingHint?: QuickBooksSurchargingHint;
  surchargingDetail?: string;
  rawSurchargePreferenceKeys?: string[];
  error?: string;
}

interface QuickBooksStatusResponse {
  connected?: boolean;
  realmId?: string;
  message?: string;
  paymentsSetup?: QuickBooksPaymentsSetup | null;
}

const SURCHARGE_HELP_URL =
  "https://quickbooks.intuit.com/learn-support/en-us/help-article/process-credit-card-payments/add-surcharge-customer-invoice-payments-quickbooks/L6Sg9UWf9_US_en_US";

const surchargingLabel = (hint: QuickBooksSurchargingHint | undefined): string => {
  switch (hint) {
    case "enabled":
      return "Likely enabled (API hint)";
    case "disabled":
      return "Likely disabled (API hint)";
    default:
      return "Verify manually in QuickBooks";
  }
};

const surchargingBadgeClass = (hint: QuickBooksSurchargingHint | undefined): string => {
  switch (hint) {
    case "enabled":
      return "bg-emerald-100 text-emerald-800";
    case "disabled":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-nurture-charcoal/10 text-nurture-charcoal/70";
  }
};

function AdminQuickBooksContent() {
  const searchParams = useSearchParams();
  const [statusLoading, setStatusLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [paymentsSetup, setPaymentsSetup] =
    useState<QuickBooksPaymentsSetup | null>(null);

  const authHeaders = useCallback(async (): Promise<HeadersInit> => {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) throw new Error("Not signed in");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/integrations/quickbooks/status", { headers });
      const data = (await res.json()) as QuickBooksStatusResponse;
      setConnected(Boolean(data.connected));
      setRealmId(data.realmId ?? null);
      setPaymentsSetup(data.paymentsSetup ?? null);
      setStatusMessage(
        data.message ?? (res.ok ? null : `Status check failed (${res.status})`)
      );
    } catch (error) {
      setConnected(false);
      setRealmId(null);
      setPaymentsSetup(null);
      setStatusMessage(
        error instanceof Error ? error.message : "Could not check QuickBooks status"
      );
    } finally {
      setStatusLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      toast.success("QuickBooks connected successfully");
      const realmFromUrl = searchParams.get("realmId");
      if (realmFromUrl) {
        setRealmId(realmFromUrl);
        setConnected(true);
      }
      void loadStatus();
    }
  }, [searchParams, loadStatus]);

  const connectQuickBooks = async () => {
    setConnecting(true);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/integrations/quickbooks/oauth/start", {
        method: "POST",
        headers,
        credentials: "include",
      });
      const data = (await res.json()) as {
        authorizeUrl?: string;
        error?: string;
        hint?: string;
      };

      if (!res.ok || !data.authorizeUrl) {
        throw new Error(
          data.hint ?? data.error ?? "Could not start QuickBooks connection"
        );
      }

      window.location.href = data.authorizeUrl;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "QuickBooks connect failed";
      toast.error(message);
      setConnecting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
        QuickBooks
      </h2>
      <p className="mt-2 text-sm text-nurture-charcoal/65">
        Connect QuickBooks Online for CRM invoice sync. Service invoices sent via
        QuickBooks use the service amount only — processing surcharges are applied
        by QuickBooks at checkout when enabled below.
      </p>

      <div className="mt-8 rounded-2xl border border-nurture-sage/20 bg-nurture-cream/30 p-6">
        {statusLoading ? (
          <p className="text-sm text-nurture-charcoal/60">Checking connection…</p>
        ) : connected ? (
          <div>
            <p className="text-sm font-semibold text-nurture-sage-dark">
              Connected
            </p>
            {realmId ? (
              <p className="mt-1 text-sm text-nurture-charcoal/70">
                Company (realm) ID: <code className="text-xs">{realmId}</code>
              </p>
            ) : null}
          </div>
        ) : (
          <div>
            <p className="text-sm text-nurture-charcoal/70">
              Not connected yet. Use the button below while signed in as an admin.
            </p>
            {statusMessage ? (
              <p className="mt-2 text-xs text-amber-800/90">{statusMessage}</p>
            ) : null}
          </div>
        )}

        <button
          type="button"
          onClick={() => void connectQuickBooks()}
          disabled={connecting}
          className="mt-6 rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-nurture-sage-dark disabled:opacity-60"
        >
          {connecting ? "Redirecting to Intuit…" : "Connect QuickBooks"}
        </button>

        <button
          type="button"
          onClick={() => void loadStatus()}
          className="mt-3 ml-3 text-sm font-medium text-nurture-sage-dark underline-offset-2 hover:underline"
        >
          Refresh status
        </button>
      </div>

      {connected ? (
        <div className="mt-6 rounded-2xl border border-nurture-sage/20 bg-white p-6">
          <h3 className="text-sm font-semibold text-nurture-charcoal">
            Online payments &amp; surcharging
          </h3>
          {paymentsSetup?.error ? (
            <p className="mt-2 text-sm text-red-600">{paymentsSetup.error}</p>
          ) : paymentsSetup ? (
            <div className="mt-4 space-y-3 text-sm text-nurture-charcoal/80">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    paymentsSetup.onlinePaymentsEnabled
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  Online payments:{" "}
                  {paymentsSetup.onlinePaymentsEnabled ? "On" : "Off"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    paymentsSetup.creditCardPaymentsEnabled
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-nurture-charcoal/10 text-nurture-charcoal/60"
                  }`}
                >
                  Cards: {paymentsSetup.creditCardPaymentsEnabled ? "On" : "Off"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    paymentsSetup.achPaymentsEnabled
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-nurture-charcoal/10 text-nurture-charcoal/60"
                  }`}
                >
                  ACH: {paymentsSetup.achPaymentsEnabled ? "On" : "Off"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${surchargingBadgeClass(paymentsSetup.surchargingHint)}`}
                >
                  Surcharging: {surchargingLabel(paymentsSetup.surchargingHint)}
                </span>
              </div>
              {paymentsSetup.surchargingDetail ? (
                <p className="text-xs leading-relaxed text-nurture-charcoal/70">
                  {paymentsSetup.surchargingDetail}
                </p>
              ) : null}
              {!paymentsSetup.onlinePaymentsEnabled ? (
                <p className="text-xs text-amber-900/90">
                  Turn on invoice online payments in QuickBooks (Settings → Account
                  and settings → Sales → Invoice payments) so CRM payment links
                  work.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-nurture-charcoal/60">
              Payment preference details unavailable.
            </p>
          )}

          <div className="mt-5 rounded-xl border border-nurture-sage/15 bg-nurture-cream/40 p-4 text-xs leading-relaxed text-nurture-charcoal/75">
            <p className="font-semibold text-nurture-charcoal">
              Enable surcharging in QuickBooks
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Settings → Account and settings → Sales</li>
              <li>Invoice payments → Edit</li>
              <li>
                Turn on <strong>Percentage based surcharging</strong> (credit
                card, ACH, or both)
              </li>
              <li>Save, then send a test invoice and open the pay link</li>
            </ol>
            <p className="mt-3">
              At checkout you should see the service total plus a separate
              surcharge line before the client pays. Intuit does not expose full
              surcharge configuration via API — use a test payment to confirm.
            </p>
            <a
              href={SURCHARGE_HELP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-semibold text-nurture-sage-dark underline-offset-2 hover:underline"
            >
              Intuit surcharging help article →
            </a>
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-xs text-nurture-charcoal/50">
        Intuit redirect URI must match{" "}
        <code className="rounded bg-white/80 px-1">
          /api/integrations/quickbooks/oauth/callback
        </code>{" "}
        on your deployed domain.
      </p>
    </div>
  );
}

export default function AdminQuickBooksPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-nurture-charcoal/60">Loading QuickBooks…</p>
      }
    >
      <AdminQuickBooksContent />
    </Suspense>
  );
}
