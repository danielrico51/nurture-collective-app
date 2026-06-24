import { isPlausibleEnabled } from "@/config/analytics";

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
  }
}

export const sendPlausibleEvent = (
  eventName: string,
  props: Record<string, string | number | boolean> = {}
): void => {
  if (typeof window === "undefined" || !isPlausibleEnabled()) return;
  window.plausible?.(eventName, { props });
};
