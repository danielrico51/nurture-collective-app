"use client";

import { getTourForPath } from "@/tour/tourSteps";
import { useTour } from "@/tour/useTour";
import "@/tour/tour.css";
import { usePathname } from "next/navigation";

/** Mount inside the admin layout to run route-specific onboarding tours. */
export const AdminTourHost = () => {
  const pathname = usePathname();
  const tour = getTourForPath(pathname ?? "");

  useTour({
    tour,
    enabled: Boolean(tour),
  });

  return null;
};

export default AdminTourHost;
