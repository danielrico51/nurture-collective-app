import type { ManualClientChannel } from "@/types/client";

/** Demo data pre-filled when the tour opens the add-client form (not saved automatically). */
export const CLIENTS_TOUR_DEMO_DRAFT = {
  name: "Sample Client (Tour Demo)",
  email: "demo.client@example.com",
  phone: "(555) 010-0300",
  channel: "referral" as ManualClientChannel,
  locationZip: "07042",
  tags: "postpartum, tour-demo",
  notes:
    "Sample client for the app tour — cancel or replace before saving a real client.",
  coordinatorId: "",
};

export type ClientTourFormDraft = typeof CLIENTS_TOUR_DEMO_DRAFT;

export type ClientTourDetailTab =
  | "overview"
  | "schedule"
  | "services"
  | "communications";
