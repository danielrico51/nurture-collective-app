"use client";

import IntakeFlow from "@/components/Intake/IntakeFlow";
import {
  buildCareStartHref,
  getSupportInterestFromServiceSlug,
  readCareServiceContext,
} from "@/config/carePaths";
import { INTAKE_DRAFT_STORAGE_KEY } from "@/content/intake";
import { fetchIntake } from "@/lib/api/intakeClient";
import { attributesToProfileForm } from "@/lib/auth/profileAttributes";
import type { IntakeDraft, SupportInterest } from "@/types/intake";
import { isIntakeComplete } from "@/types/intake";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const IntakePage = () => {
  const router = useRouter();
  const { authStatus, user } = useAuthenticator((context) => [
    context.authStatus,
    context.user,
  ]);
  const [loading, setLoading] = useState(true);
  const [initialDraft, setInitialDraft] = useState<IntakeDraft>({});
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(buildCareStartHref());
      return;
    }
    if (authStatus !== "authenticated" || !user?.userId) return;

    const load = async () => {
      try {
        const [attributes, intake] = await Promise.all([
          fetchUserAttributes(),
          fetchIntake().catch(() => ({ profile: null, recommendations: [] })),
        ]);

        const form = attributesToProfileForm(attributes);
        const name = [form.givenName, form.familyName].filter(Boolean).join(" ");
        const email = form.email || user.signInDetails?.loginId || "";

        let draft: IntakeDraft = {
          name,
          email,
          phone: form.phoneNumber,
          supportInterests: [],
          challenges: [],
          preferredSchedule: {
            days: [],
            times: [],
            modality: "either",
            timezone:
              typeof Intl !== "undefined"
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : "America/New_York",
          },
        };

        const localRaw =
          typeof window !== "undefined"
            ? localStorage.getItem(`${INTAKE_DRAFT_STORAGE_KEY}-${user.userId}`)
            : null;
        if (localRaw) {
          try {
            draft = { ...draft, ...JSON.parse(localRaw) };
          } catch {
            /* ignore corrupt local draft */
          }
        }

        if (intake.profile) {
          const { id, userId, createdAt, updatedAt, ...rest } = intake.profile;
          draft = { ...draft, ...rest };
          if (isIntakeComplete(intake.profile.intakeStatus)) {
            setAlreadySubmitted(true);
          }
        }

        const serviceSlug = readCareServiceContext();
        if (serviceSlug) {
          const interest = getSupportInterestFromServiceSlug(serviceSlug);
          if (interest) {
            const existing = draft.supportInterests ?? [];
            draft.supportInterests = Array.from(
              new Set([...existing, interest])
            ) as SupportInterest[];
          }
        }

        setInitialDraft(draft);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authStatus, router, user]);

  if (authStatus !== "authenticated" || loading || !user?.userId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-nurture-cream to-white">
        <p className="text-nurture-charcoal/60">Preparing your care journey…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-nurture-cream via-white to-nurture-cream/50">
      <IntakeFlow
        userId={user.userId}
        initialDraft={initialDraft}
        alreadySubmitted={alreadySubmitted}
      />
    </div>
  );
};

export default IntakePage;
