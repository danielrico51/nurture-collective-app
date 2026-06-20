import { CLIENTS_TOUR } from "@/tour/clientsTourSteps";
import { PROVIDERS_TOUR } from "@/tour/providersTourSteps";
import type { TourDefinition } from "@/tour/types";

export { providersTourSteps } from "@/tour/providersTourSteps";
export { clientsTourSteps } from "@/tour/clientsTourSteps";

const TOURS_BY_PATH: Record<string, TourDefinition> = {
  "/admin/providers": PROVIDERS_TOUR,
  "/admin/clients": CLIENTS_TOUR,
};

/** Resolve the tour definition for the current admin route, if any. */
export const getTourForPath = (pathname: string): TourDefinition | null =>
  TOURS_BY_PATH[pathname] ?? null;

/** All registered tours (for dev tooling / future hub picker). */
export const ADMIN_TOURS: TourDefinition[] = [PROVIDERS_TOUR, CLIENTS_TOUR];
