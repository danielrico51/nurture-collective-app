import Breadcrumb from "@/components/Common/Breadcrumb";
import ProviderClassRoster from "@/components/Provider/ProviderClassRoster";
import { buildPageMetadata } from "@/config/seo";
import { getProviderClassRoster } from "@/lib/classRegistrations/providerRoster";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface ProviderClassPageProps {
  params: { token: string };
}

export async function generateMetadata({
  params,
}: ProviderClassPageProps): Promise<Metadata> {
  const roster = await getProviderClassRoster(decodeURIComponent(params.token));
  const base = buildPageMetadata({
    title: roster ? `Class roster · ${roster.event.title}` : "Class roster",
    description: roster
      ? `Read-only roster for ${roster.event.title}.`
      : "Instructor class roster",
    path: "/provider/classes",
  });
  return {
    ...base,
    robots: { index: false, follow: false },
  };
}

export default async function ProviderClassRosterPage({
  params,
}: ProviderClassPageProps) {
  const roster = await getProviderClassRoster(decodeURIComponent(params.token));
  if (!roster) notFound();

  return (
    <>
      <Breadcrumb pageName="Class roster" />
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ProviderClassRoster roster={roster} />
        </div>
      </section>
    </>
  );
}
