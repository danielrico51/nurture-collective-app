"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";

function GiftCardSuccessContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const sessionId = searchParams.get("session_id");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (status !== "success" || !sessionId || confirmed) return;

    const confirm = async () => {
      try {
        const res = await fetch(
          `/api/gift-cards/confirm?session_id=${encodeURIComponent(sessionId)}`
        );
        const data = (await res.json()) as { ok?: boolean; status?: string; error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Could not confirm payment");
        }
        if (data.status === "paid") {
          toast.success("Payment received — thank you for your gift card purchase!");
        }
        setConfirmed(true);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Payment may still be processing. We'll email your receipt shortly."
        );
      }
    };

    void confirm();
  }, [status, sessionId, confirmed]);

  return null;
}

export function GiftCardSuccessHandler() {
  return (
    <Suspense fallback={null}>
      <GiftCardSuccessContent />
    </Suspense>
  );
}
