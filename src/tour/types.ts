import type { Alignment, Side } from "driver.js";

export interface TourStepConfig {
  selector: string;
  title: string;
  content: string;
  side?: Side;
  align?: Alignment;
  /** When true, the tour can start even if this element is missing. */
  optional?: boolean;
  /** Run before highlighting — opens forms, expands rows, etc. */
  beforeHighlight?: string;
}

export interface TourDefinition {
  id: string;
  /** localStorage key — e.g. hasSeenTour:providers */
  storageKey: string;
  steps: TourStepConfig[];
  /** Wait until this selector exists before starting (e.g. page finished loading). */
  readySelector?: string;
  /** Dispatched when the tour closes (any reason). */
  cleanupAction?: string;
}

export interface UseTourOptions {
  tour: TourDefinition | null;
  /** When false, the tour will not auto-start. */
  enabled?: boolean;
  /** Delay before starting (ms) so layout can settle. */
  startDelayMs?: number;
}
