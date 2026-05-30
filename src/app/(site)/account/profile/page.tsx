"use client";

import ProfileForm from "@/components/Account/ProfileForm";
import Breadcrumb from "@/components/Common/Breadcrumb";
import SectionTitle from "@/components/Common/SectionTitle";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ProfilePage = () => {
  const router = useRouter();
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/signin");
    }
  }, [authStatus, router]);

  if (authStatus !== "authenticated") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-nurture-charcoal/60">Loading your profile…</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="My profile" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <p className="mb-6 text-sm text-nurture-charcoal/60">
              <Link href="/apps" className="hover:text-nurture-sage-dark">
                ← Back to dashboard
              </Link>
            </p>
            <SectionTitle
              title="Personal information"
              subtitle="Update your contact details and profile information."
            />
            <div className="mt-10">
              <ProfileForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProfilePage;
