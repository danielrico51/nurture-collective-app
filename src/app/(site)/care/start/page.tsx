"use client";

import {
  BOOK_INTRO_PATH,
  CARE_SERVICE_STORAGE_KEY,
  buildIntakeHref,
} from "@/config/carePaths";
import { isPublicIntakeEnabled } from "@/config/intakeAccess";
import { fetchIntake } from "@/lib/api/intakeClient";
import { useSessionAuth } from "@/hooks/useSessionAuth";
import { isIntakeComplete } from "@/types/intake";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CareStartPage() {
  const router = useRouter();
  const { authStatus, ready } = useSessionAuth();
  const publicIntake = isPublicIntakeEnabled();

  useEffect(() => {
    if (!ready || authStatus === "configuring") return;

    let service: string | undefined;
    let book = false;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      service = params.get("service")?.trim() || undefined;
      book = params.get("book") === "1";
      if (service) {
        sessionStorage.setItem(CARE_SERVICE_STORAGE_KEY, service);
      }
    }

    if (book) {
      const params = new URLSearchParams();
      if (service) params.set("service", service);
      const query = params.toString();
      router.replace(query ? `${BOOK_INTRO_PATH}?${query}` : BOOK_INTRO_PATH);
      return;
    }

    const intakeHref = buildIntakeHref(service);

    if (publicIntake) {
      router.replace(intakeHref);
      return;
    }

    if (authStatus === "unauthenticated") {
      router.replace("/signin");
      return;
    }

    fetchIntake()
      .then((data) => {
        if (isIntakeComplete(data.profile?.intakeStatus)) {
          router.replace("/apps");
          return;
        }
        router.replace(intakeHref);
      })
      .catch(() => {
        router.replace(intakeHref);
      });
  }, [authStatus, publicIntake, ready, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-nurture-cream">
      <p className="text-nurture-charcoal/60">Starting your support journey…</p>
    </div>
  );
}
