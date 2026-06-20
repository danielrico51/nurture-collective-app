import { driver, type Config, type DriveStep, type Driver } from "driver.js";
import { markTourSeen } from "@/tour/storage";
import { runTourActionAndWait } from "@/tour/providersTourActions";
import type { TourStepConfig } from "@/tour/types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toDriveSteps = (steps: TourStepConfig[]): DriveStep[] =>
  steps.map((step) => ({
    element: step.selector,
    popover: {
      title: step.title,
      description: step.content,
      side: step.side ?? "bottom",
      align: step.align ?? "start",
    },
    onHighlightStarted: step.beforeHighlight
      ? async (_element, _driveStep, { driver: tourDriver }) => {
          await runTourActionAndWait(step.beforeHighlight!);
          await focusTourTarget(tourDriver, step);
        }
      : async (_element, _driveStep, { driver: tourDriver }) => {
          await focusTourTarget(tourDriver, step);
        },
  }));

const focusTourTarget = async (
  tourDriver: Driver,
  step: TourStepConfig
): Promise<void> => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const target = document.querySelector(step.selector);
    if (target) {
      tourDriver.refresh();
      return;
    }
    await sleep(150);
  }

  if (step.optional) {
    tourDriver.moveNext();
  }
};

export interface StartTourOptions {
  steps: TourStepConfig[];
  storageKey: string;
  onStarted?: () => void;
  /** When false, finishing/closing does not write to localStorage (on-demand replays). Default true. */
  persistSeen?: boolean;
  cleanupAction?: string;
}

/** Start a Driver.js tour. Set persistSeen false for on-demand replays. */
export const startTourDriver = ({
  steps,
  storageKey,
  onStarted,
  persistSeen = true,
  cleanupAction,
}: StartTourOptions) => {
  if (steps.length === 0) return null;

  let markedSeen = false;
  const markSeenOnce = () => {
    if (markedSeen) return;
    markedSeen = true;
    markTourSeen(storageKey);
  };

  const config: Config = {
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayColor: "#2D3436",
    overlayOpacity: 0.55,
    stagePadding: 8,
    stageRadius: 12,
    popoverClass: "nurture-tour-popover",
    showProgress: true,
    progressText: "Step {{current}} of {{total}}",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Finish",
    showButtons: ["previous", "next", "close"],
    steps: toDriveSteps(steps),
    onHighlightStarted: () => {
      onStarted?.();
    },
    onDestroyed: () => {
      if (cleanupAction) {
        void runTourActionAndWait(cleanupAction);
      }
      if (persistSeen) markSeenOnce();
    },
  };

  const instance = driver(config);
  instance.drive();
  return instance;
};
