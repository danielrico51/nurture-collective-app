"use client";

import { AuthPageShell } from "@/components/Auth/AuthPageShell";
import { FederatedProfileCompletionForm } from "@/components/Auth/FederatedProfileCompletionForm";
import { readAuthReturnTo } from "@/config/socialAuth";
import { useSearchParams } from "next/navigation";

export default function CompleteProfilePage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? readAuthReturnTo();

  return (
    <AuthPageShell
      title="Finish your profile"
      subtitle="A few details help us personalize your Nesting Place experience."
    >
      <FederatedProfileCompletionForm returnTo={returnTo} />
    </AuthPageShell>
  );
}
