import AuthRouteLayout from "@/components/Auth/AuthRouteLayout";
import { noIndexMetadata } from "@/config/seo";
import type { Metadata } from "next";

export const metadata: Metadata = noIndexMetadata;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthRouteLayout>{children}</AuthRouteLayout>;
}
