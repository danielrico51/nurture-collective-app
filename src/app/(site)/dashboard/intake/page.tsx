"use client";

import IntakeFlow from "@/components/Intake/IntakeFlow";
import {
  getSupportInterestFromServiceSlug,
  readCareServiceContext,
} from "@/config/carePaths";
import { INTAKE_DRAFT_STORAGE_KEY } from "@/content/intake";
import { useMemberIntake } from "@/hooks/useMemberIntake";
import { useSessionAuth } from "@/hooks/useSessionAuth";
import { attributesToProfileForm } from "@/lib/auth/profileAttributes";
import type { IntakeDraft, SupportInterest } from "@/types/intake";
import { isIntakeComplete } from "@/types/intake";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const IntakePage = () => {
  const router = useRouter();
  const { authStatus, ready } = useSessionAuth();
  const intakeEnabled = ready && authStatus === "authenticated";
  const { intake, loading: intakeLoading } = useMemberIntake(intakeEnabled);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [initialDraft, setInitialDraft] = useState<IntakeDraft>({});
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    if (!ready || intakeLoading) return;
    if (isIntakeComplete(intake?.profile?.intakeStatus)) {
      router.replace("/dashboard");
    }
  }, [intake?.profile?.intakeStatus, intakeLoading, ready, router]);

  useEffect(() => {
    if (!ready) return;

    if (authStatus === "unauthenticated") {
      router.push("/signin");
      return;
    }

    if (authStatus !== "authenticated" || intakeLoading || draftReady) return;

    const load = async () => {
      try {
        const session = await fetchAuthSession();
        const sub = session.userSub;
        if (!sub) {
          router.push("/signin");
          return;
        }
        setUserId(sub);

        const attributes = await fetchUserAttributes();

        const form = attributesToProfileForm(attributes);
        const name = [form.givenName, form.familyName].filter(Boolean).join(" ");
        const email =
          form.email || session.tokens?.idToken?.payload?.email?.toString() || "";

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
            ? localStorage.getItem(`${INTAKE_DRAFT_STORAGE_KEY}-${sub}`)
            : null;
        if (localRaw) {
          try {
            draft = { ...draft, ...JSON.parse(localRaw) };
          } catch {
            /* ignore corrupt local draft */
          }
        }

        if (intake?.profile) {
          const { id, userId: _uid, createdAt, updatedAt, ...rest } =
            intake.profile;
          draft = { ...draft, ...rest };
          if (isIntakeComplete(intake.profile.intakeStatus)) {
            setAlreadySubmitted(true);
            return;
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
        setDraftReady(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authStatus, draftReady, intake?.profile, intakeLoading, ready, router]);

  if (
    !ready ||
    authStatus !== "authenticated" ||
    intakeLoading ||
    loading ||
    !userId
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-nurture-cream to-white">
        <p className="text-nurture-charcoal/60">Preparing your support journey…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-nurture-cream via-white to-nurture-cream/50">
      <IntakeFlow
        userId={userId}
        initialDraft={initialDraft}
        alreadySubmitted={alreadySubmitted}
      />
    </div>
  );
};

export default IntakePage;
