"use client";

import { runTour } from "@/tour/runTour";
import type { TourDefinition } from "@/tour/types";
import { useState } from "react";
import toast from "react-hot-toast";

interface TourHelpButtonProps {
  tour: TourDefinition;
  label?: string;
  className?: string;
  disabled?: boolean;
}

/** Replay the app tour on demand — does not require clearing localStorage. */
export const TourHelpButton = ({
  tour,
  label = "App tour",
  className = "rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark transition hover:bg-nurture-sage/10 disabled:cursor-not-allowed disabled:opacity-50",
  disabled = false,
}: TourHelpButtonProps) => {
  const [starting, setStarting] = useState(false);

  const handleClick = async () => {
    setStarting(true);
    try {
      const started = await runTour(tour);
      if (!started) {
        toast.error(
          "Tour could not start. Wait for the page to load, or check that you are on the Providers admin page."
        );
      }
    } finally {
      setStarting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={starting || disabled}
      className={className}
      aria-label={`${label} — guided walkthrough of this page`}
    >
      {starting ? "Starting…" : label}
    </button>
  );
};

export default TourHelpButton;
