/** Dispatched by guest banner / toolbar to reset the concierge chat in-place. */
export const INTAKE_START_FRESH_EVENT = "nurture-intake-start-fresh";

export const requestIntakeStartFresh = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(INTAKE_START_FRESH_EVENT));
};
