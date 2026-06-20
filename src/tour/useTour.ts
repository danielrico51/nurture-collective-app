"use client";

import { useEffect, useRef } from "react";
import { startTourDriver } from "@/tour/createTourDriver";
import { hasSeenTour } from "@/tour/storage";
import type { UseTourOptions } from "@/tour/types";
import { waitForSelector, waitForTourStart } from "@/tour/waitForTourReady";

const DEFAULT_START_DELAY_MS = 600;

/**
 * Auto-start an onboarding tour on first visit.
 * Skips when localStorage marks the tour as seen.
 */
export const useTour = ({
  tour,
  enabled = true,
  startDelayMs = DEFAULT_START_DELAY_MS,
}: UseTourOptions) => {
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !tour || tour.steps.length === 0) return;
    if (typeof window === "undefined") return;
    if (hasSeenTour(tour.storageKey)) return;
    if (startedRef.current) return;

    let cancelled = false;

    const run = async () => {
      if (tour.readySelector) {
        const pageReady = await waitForSelector(tour.readySelector);
        if (!pageReady || cancelled) return;
      }

      const canStart = await waitForTourStart(tour.steps);
      if (!canStart || cancelled) return;

      startedRef.current = true;
      startTourDriver({
        steps: tour.steps,
        storageKey: tour.storageKey,
        cleanupAction: tour.cleanupAction,
      });
    };

    const timer = window.setTimeout(() => {
      void run();
    }, startDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, tour, startDelayMs]);
};
