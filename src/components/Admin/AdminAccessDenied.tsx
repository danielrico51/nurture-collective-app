"use client";

import { getTasksAccessGroup } from "@/lib/auth/groups";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";

interface AdminAccessDeniedProps {
  groups: string[];
  onRefresh: () => Promise<string[]>;
  refreshing: boolean;
}

export function AdminAccessDenied({
  groups,
  onRefresh,
  refreshing,
}: AdminAccessDeniedProps) {
  const { signOut } = useAuthenticator((context) => [context.signOut]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <div className="rounded-3xl border border-nurture-sage/20 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nurture-sage-dark">
          Admin workspace
        </p>
        <h1 className="mt-3 font-serif text-2xl font-semibold text-nurture-charcoal">
          Admin access required
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-nurture-charcoal/70">
          Your account must be in the Cognito{" "}
          <span className="font-semibold">{getTasksAccessGroup()}</span> group.
          If you were just added, refresh your session or sign out and back in
          so your token picks up the new group.
        </p>

        {groups.length > 0 ? (
          <p className="mt-4 rounded-xl bg-nurture-cream/80 px-4 py-3 text-left text-xs text-nurture-charcoal/65">
            Groups in your current token:{" "}
            <span className="font-medium">{groups.join(", ")}</span>
          </p>
        ) : (
          <p className="mt-4 rounded-xl bg-nurture-blush/20 px-4 py-3 text-left text-xs text-nurture-charcoal/65">
            No groups were found in your current sign-in token yet.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => onRefresh()}
            disabled={refreshing}
            className="rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-medium text-white hover:bg-nurture-sage-dark disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh session"}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-nurture-sage px-6 py-2.5 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
          >
            Sign out
          </button>
        </div>

        <Link
          href="/apps"
          className="mt-5 inline-block text-sm text-nurture-charcoal/55 hover:text-nurture-sage-dark"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
