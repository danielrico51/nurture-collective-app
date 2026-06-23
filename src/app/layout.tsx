import RootLayoutClient from "@/app/RootLayoutClient";
import { siteMetadata } from "@/config/siteMetadata";
import "@/styles/globals.css";

export const metadata = siteMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-nurture-cream font-sans text-nurture-charcoal antialiased">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
