import { noIndexMetadata } from "@/config/seo";
import type { Metadata } from "next";

export const metadata: Metadata = noIndexMetadata;

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
