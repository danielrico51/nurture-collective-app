import RootLayoutClient from "@/app/RootLayoutClient";
import { siteMetadata } from "@/config/siteMetadata";
import { fontVariables } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata = siteMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="font-sans antialiased">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
