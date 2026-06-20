import { startTourDriver } from "@/tour/createTourDriver";
import type { TourDefinition } from "@/tour/types";
import { waitForSelector, waitForTourStart } from "@/tour/waitForTourReady";

export interface RunTourOptions {
  /** When false, localStorage is not updated when the tour ends. Default false for on-demand. */
  persistSeen?: boolean;
}

/** Start a tour on demand (ignores hasSeenTour). Waits for page targets first. */
export const runTour = async (
  tour: TourDefinition,
  options: RunTourOptions = {}
): Promise<boolean> => {
  if (typeof window === "undefined" || tour.steps.length === 0) return false;

  if (tour.readySelector) {
    const pageReady = await waitForSelector(tour.readySelector);
    if (!pageReady) return false;
  }

  const canStart = await waitForTourStart(tour.steps);
  if (!canStart) return false;

  startTourDriver({
    steps: tour.steps,
    storageKey: tour.storageKey,
    persistSeen: options.persistSeen ?? false,
    cleanupAction: tour.cleanupAction,
  });
  return true;
};
