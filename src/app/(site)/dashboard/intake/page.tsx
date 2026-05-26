"use client";

import ConversationalIntake from "@/components/Intake/ConversationalIntake";
import {
  getSupportInterestFromServiceSlug,
  readCareServiceContext,
} from "@/config/carePaths";
import { useMemberIntake } from "@/hooks/useMemberIntake";
import { useSessionAuth } from "@/hooks/useSessionAuth";
import { attributesToProfileForm } from "@/lib/auth/profileAttributes";
import { isIntakeComplete } from "@/types/intake";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const IntakePage = () => {
  const router = useRouter();
  const { authStatus, ready } = useSessionAuth();
  const intakeEnabled = ready && authStatus === "authenticated";
  const { intake, loading: intakeLoading } = useMemberIntake(intakeEnabled);
  const [authReady, setAuthReady] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!ready || intakeLoading || redirectedRef.current) return;
    if (isIntakeComplete(intake?.profile?.intakeStatus)) {
      redirectedRef.current = true;
      router.replace("/dashboard");
      return;
    }
    setBootstrapped(true);
  }, [intake?.profile?.intakeStatus, intakeLoading, ready, router]);

  useEffect(() => {
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

        const serviceSlug = readCareServiceContext();
        if (serviceSlug) {
          getSupportInterestFromServiceSlug(serviceSlug);
        }

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
  }, [authStatus, ready, router]);

  if (
    !ready ||
    authStatus !== "authenticated" ||
    !authReady ||
    !bootstrapped ||
    !userId
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-nurture-cream to-white">
        <p className="text-nurture-charcoal/60">Preparing your concierge…</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-5rem)] overflow-hidden bg-gradient-to-b from-nurture-cream via-white to-nurture-cream/50">
      <ConversationalIntake userId={userId} defaults={defaults} />
    </div>
  );
};

export default IntakePage;
