"use client";

import { fetchAuthSession } from "aws-amplify/auth";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

function AdminQuickBooksContent() {
  const searchParams = useSearchParams();
  const [statusLoading, setStatusLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
      const data = (await res.json()) as {
        connected?: boolean;
        realmId?: string;
        message?: string;
      };
      setConnected(Boolean(data.connected));
      setRealmId(data.realmId ?? null);
      setStatusMessage(data.message ?? (res.ok ? null : `Status check failed (${res.status})`));
    } catch (error) {
      setConnected(false);
      setRealmId(null);
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
        Connect your QuickBooks Online sandbox or production company for billing
        and invoice sync. Admin sign-in is required — opening the API URL directly
        in a new tab will not work.
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
