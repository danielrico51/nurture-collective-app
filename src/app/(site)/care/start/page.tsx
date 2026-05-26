"use client";

import {
  CARE_SERVICE_STORAGE_KEY,
  buildIntakeHref,
} from "@/config/carePaths";
import { resolveMemberHomePath } from "@/lib/intake/memberNavigation";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CareStartPage() {
  const router = useRouter();
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  useEffect(() => {
    if (authStatus === "configuring") return;

    let service: string | undefined;
    if (typeof window !== "undefined") {
      service =
        new URLSearchParams(window.location.search).get("service")?.trim() ||
        undefined;
      if (service) {
        sessionStorage.setItem(CARE_SERVICE_STORAGE_KEY, service);
      }
    }

    if (authStatus === "unauthenticated") {
      router.replace("/signin");
      return;
    }

    if (authStatus === "authenticated") {
      resolveMemberHomePath().then((path) => {
        if (path === "/dashboard/intake") {
          router.replace(buildIntakeHref(service));
          return;
        }
        router.replace(path);
      });
    }
  }, [authStatus, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-nurture-cream">
      <p className="text-nurture-charcoal/60">Starting your care journey…</p>
    </div>
  );
}
