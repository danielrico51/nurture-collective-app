export const PROVIDERS_TOUR_ACTIONS = {
  OPEN_ADD_FORM_DEMO: "providers:open-add-form-demo",
  CLOSE_ADD_FORM: "providers:close-add-form",
  EXPAND_FIRST_PROVIDER: "providers:expand-first-provider",
  COLLAPSE_PROVIDER: "providers:collapse-provider",
  CLEANUP: "providers:cleanup",
} as const;

export type ProvidersTourAction =
  (typeof PROVIDERS_TOUR_ACTIONS)[keyof typeof PROVIDERS_TOUR_ACTIONS];

const TOUR_ACTION_EVENT = "nurture-tour-action";

export const dispatchTourAction = (action: string): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOUR_ACTION_EVENT, { detail: { action } })
  );
};

export const subscribeTourActions = (
  handler: (action: string) => void
): (() => void) => {
  if (typeof window === "undefined") return () => undefined;

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ action: string }>).detail;
    if (detail?.action) handler(detail.action);
  };

  window.addEventListener(TOUR_ACTION_EVENT, listener);
  return () => window.removeEventListener(TOUR_ACTION_EVENT, listener);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Run a tour action and allow React to render new targets. */
export const runTourActionAndWait = async (action: string): Promise<void> => {
  dispatchTourAction(action);
  await sleep(450);
};
