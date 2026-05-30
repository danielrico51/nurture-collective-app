"use client";

import ConversationalIntake from "@/components/Intake/ConversationalIntake";
import GuestSaveProgressPrompt from "@/components/Intake/GuestSaveProgressPrompt";
import {
  resolveCareServiceContext,
  type CareServiceContext,
} from "@/config/carePaths";
import { careCoordinator } from "@/content/site";
import { isPublicIntakeEnabled } from "@/config/intakeAccess";
import { getOrCreateGuestSessionId } from "@/lib/auth/guestSession";
import { useMemberIntake } from "@/hooks/useMemberIntake";
import { useSessionAuth } from "@/hooks/useSessionAuth";
import { attributesToProfileForm } from "@/lib/auth/profileAttributes";
import { isIntakeComplete } from "@/types/intake";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface IntakeExperienceProps {
  /** When true, skip Cognito and use guest session (public dev intake). */
  allowGuest?: boolean;
}

const IntakeExperience = ({ allowGuest = false }: IntakeExperienceProps) => {
  const router = useRouter();
  const publicMode = allowGuest && isPublicIntakeEnabled();
  const { authStatus, ready } = useSessionAuth();
  const intakeEnabled =
    ready && (publicMode || authStatus === "authenticated");
  const { intake, loading: intakeLoading } = useMemberIntake(intakeEnabled);
  const [authReady, setAuthReady] = useState(publicMode);
  const [bootstrapped, setBootstrapped] = useState(publicMode);
  const [userId, setUserId] = useState<string | null>(
    publicMode ? getOrCreateGuestSessionId() : null
  );
  const [defaults, setDefaults] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});
  const [initialService] = useState<CareServiceContext | null>(() => {
    if (typeof window === "undefined") return null;
    return resolveCareServiceContext();
  });
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (publicMode) return;
    if (!ready || intakeLoading || redirectedRef.current) return;
    if (isIntakeComplete(intake?.profile?.intakeStatus)) {
      redirectedRef.current = true;
      router.replace("/dashboard");
      return;
    }
    setBootstrapped(true);
  }, [intake?.profile?.intakeStatus, intakeLoading, publicMode, ready, router]);

  useEffect(() => {
    if (publicMode) {
      setUserId(getOrCreateGuestSessionId());
      setAuthReady(true);
      setBootstrapped(true);
      return;
    }

    if (!ready) return;
    if (authStatus === "unauthenticated") {
      router.push("/signin");
      return;
    }
    if (authStatus !== "authenticated") return;

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

        setDefaults({
          name,
          email,
          phone: form.phoneNumber,
        });
      } finally {
        setAuthReady(true);
      }
    };

    load();
  }, [authStatus, publicMode, ready, router]);

  if (!ready || !authReady || !bootstrapped || !userId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-nurture-cream to-white">
        <p className="text-nurture-charcoal/60">{careCoordinator.intake.preparing}</p>
      </div>
    );
  }

  if (!publicMode && authStatus !== "authenticated") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-nurture-cream to-white">
        <p className="text-nurture-charcoal/60">{careCoordinator.intake.preparing}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col overflow-hidden bg-gradient-to-b from-nurture-cream via-white to-nurture-cream/50 sm:min-h-[calc(100dvh-5rem)]">
      {publicMode ? (
        <GuestSaveProgressPrompt variant="banner" className="shrink-0" />
      ) : null}
      <div className="min-h-0 flex-1">
        <ConversationalIntake
        userId={userId}
        defaults={defaults}
        guestMode={publicMode}
        initialService={initialService}
        />
      </div>
    </div>
  );
};

export default IntakeExperience;
