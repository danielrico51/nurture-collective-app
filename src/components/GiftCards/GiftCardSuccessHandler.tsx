"use client";

import {
  GiftCardSuccessBanner,
  type GiftCardConfirmSummary,
} from "@/components/GiftCards/GiftCardSuccessBanner";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";

function GiftCardSuccessContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const sessionId = searchParams.get("session_id");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<GiftCardConfirmSummary | null>(null);

  const showSuccess = status === "success" && Boolean(sessionId);

  useEffect(() => {
    if (!showSuccess || !sessionId || confirmed) return;

    const confirm = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/gift-cards/confirm?session_id=${encodeURIComponent(sessionId)}`
        );
        const data = (await res.json()) as {
          ok?: boolean;
          status?: string;
          error?: string;
          summary?: GiftCardConfirmSummary;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Could not confirm payment");
        }
        if (data.summary) {
          setSummary(data.summary);
        }
        if (data.status === "paid") {
          toast.success("Payment received — thank you for your gift card purchase!");
        }
        setConfirmed(true);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Payment may still be processing. Our team will follow up by email."
        );
      } finally {
        setLoading(false);
      }
    };

    void confirm();
  }, [showSuccess, sessionId, confirmed]);

  if (!showSuccess) return null;

  return <GiftCardSuccessBanner summary={summary} loading={loading && !confirmed} />;
}

export function GiftCardSuccessHandler() {
  return (
    <Suspense fallback={null}>
      <GiftCardSuccessContent />
    </Suspense>
  );
}
