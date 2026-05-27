"use client";

import {
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
    if (typeof window !== "undefined") {
      service =
        new URLSearchParams(window.location.search).get("service")?.trim() ||
        undefined;
      if (service) {
        sessionStorage.setItem(CARE_SERVICE_STORAGE_KEY, service);
      }
    }

    if (publicIntake) {
      router.replace(buildIntakeHref(service));
      return;
    }

    if (authStatus === "unauthenticated") {
      router.replace("/signin");
      return;
    }

    fetchIntake()
      .then((data) => {
        if (isIntakeComplete(data.profile?.intakeStatus)) {
          router.replace("/dashboard");
          return;
        }
        router.replace(buildIntakeHref(service));
      })
      .catch(() => {
        router.replace(buildIntakeHref(service));
      });
  }, [authStatus, publicIntake, ready, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-nurture-cream">
      <p className="text-nurture-charcoal/60">Starting your support journey…</p>
    </div>
  );
}
