import type { ProviderRole } from "@/types/provider";

/** Demo data pre-filled when the tour opens the add-provider form (not saved automatically). */
export const PROVIDERS_TOUR_DEMO_DRAFT = {
  displayName: "Sample Doula (Tour Demo)",
  aliases: "Demo Doula, SD",
  roles: ["postpartum_doula"] as ProviderRole[],
  email: "demo.doula@example.com",
  phone: "(555) 010-0200",
  defaultHourlyRateCents: 6500,
  notes:
    "Sample profile for the app tour — cancel or replace before saving a real provider.",
};

export type ProviderTourFormDraft = typeof PROVIDERS_TOUR_DEMO_DRAFT;

export const providerTourDraftFromDemo = (): ProviderTourFormDraft => ({
  ...PROVIDERS_TOUR_DEMO_DRAFT,
  roles: [...PROVIDERS_TOUR_DEMO_DRAFT.roles],
});
