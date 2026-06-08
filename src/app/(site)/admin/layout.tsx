import AdminRouteLayout from "@/components/Admin/AdminRouteLayout";
import { noIndexMetadata } from "@/config/seo";
import type { Metadata } from "next";

export const metadata: Metadata = noIndexMetadata;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminRouteLayout>{children}</AdminRouteLayout>;
}
