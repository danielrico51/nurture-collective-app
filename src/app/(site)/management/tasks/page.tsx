"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import TaskBoard from "@/components/Management/TaskBoard";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ManagementTasksPage = () => {
  const router = useRouter();
  const { authStatus, user } = useAuthenticator((context) => [
    context.authStatus,
    context.user,
  ]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/signin");
    }
  }, [authStatus, router]);

  if (authStatus !== "authenticated") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-nurture-charcoal/60">Loading task board…</p>
      </div>
    );
  }

  const userEmail = user?.signInDetails?.loginId ?? "";

  return (
    <>
      <Breadcrumb pageName="Team tasks" />
      <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-8 text-sm text-nurture-charcoal/60">
          <Link href="/dashboard" className="hover:text-nurture-sage-dark">
            ← Back to dashboard
          </Link>
        </p>
        <TaskBoard userEmail={userEmail} />
      </div>
    </>
  );
};

export default ManagementTasksPage;
