"use client";

import { confirmClassRegistrationPayment } from "@/lib/api/classRegistrationsClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ClassRegistrationReturnHandlerProps {
  eventSlug: string;
}

const ClassRegistrationReturnHandler = ({
  eventSlug,
}: ClassRegistrationReturnHandlerProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id")?.trim();
    if (!sessionId || paymentConfirmed) return;

    void (async () => {
      try {
        const result = await confirmClassRegistrationPayment(sessionId);
        if (result.paymentStatus === "paid") {
          setPaymentConfirmed(true);
          toast.success("Payment received — you're all set!");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not confirm payment"
        );
      } finally {
        router.replace(`/events-and-classes/${eventSlug}/register`, {
          scroll: false,
        });
      }
    })();
  }, [eventSlug, paymentConfirmed, router, searchParams]);

  if (!paymentConfirmed) return null;

  return (
    <div className="mb-6 rounded-2xl border border-nurture-sage/25 bg-nurture-cream/50 p-5">
      <h2 className="font-serif text-xl font-semibold text-nurture-charcoal">
        Payment received
      </h2>
      <p className="mt-2 text-sm text-nurture-charcoal/75">
        Your class fee is paid and your registration is complete. Check your inbox
        for confirmation details.
      </p>
    </div>
  );
};

export default ClassRegistrationReturnHandler;
