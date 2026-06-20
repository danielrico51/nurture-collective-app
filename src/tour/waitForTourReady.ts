import type { TourStepConfig } from "@/tour/types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const elementExists = (selector: string): boolean =>
  Boolean(typeof document !== "undefined" && document.querySelector(selector));

/** Required steps that must exist before the tour can start (skips beforeHighlight / optional). */
export const resolveTourSteps = (steps: TourStepConfig[]): TourStepConfig[] => {
  const resolved: TourStepConfig[] = [];
  for (const step of steps) {
    if (elementExists(step.selector)) {
      resolved.push(step);
      continue;
    }
    if (step.optional || step.beforeHighlight) {
      continue;
    }
    return [];
  }
  return resolved;
};

export const waitForTourStart = async (
  steps: TourStepConfig[],
  timeoutMs = 12_000
): Promise<boolean> => {
  const initialSteps = steps.filter(
    (step) => !step.beforeHighlight && !step.optional
  );
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const resolved = resolveTourSteps(initialSteps);
    if (resolved.length === initialSteps.length) return true;
    await sleep(200);
  }
  return resolveTourSteps(initialSteps).length === initialSteps.length;
};

export const waitForSelector = async (
  selector: string,
  timeoutMs = 12_000
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (elementExists(selector)) return true;
    await sleep(200);
  }
  return elementExists(selector);
};
