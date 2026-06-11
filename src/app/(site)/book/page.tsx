import IntroCallBookingPage from "@/components/Booking/IntroCallBookingPage";
import { noIndexMetadata } from "@/config/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Book an Introductory Call | The Nesting Place",
  description:
    "Pick an open time for a free introductory call with The Nesting Place care team.",
};

export default function BookIntroCallPage() {
  return <IntroCallBookingPage />;
}
