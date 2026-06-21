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
      <body className="font-sans">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
