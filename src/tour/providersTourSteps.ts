import {
  PROVIDERS_TOUR_ACTIONS,
} from "@/tour/providersTourActions";
import type { TourDefinition } from "@/tour/types";
import { buildTourStorageKey } from "@/tour/storage";

/**
 * Full Providers app tour — overview, add-provider walkthrough (demo form),
 * and edit-existing flow. Edit steps are optional when the list is empty.
 */
export const providersTourSteps = [
  {
    selector: "#tour-admin-nav-providers",
    title: "Providers app",
    content:
      "Open the Providers registry from the admin sidebar. Profiles here link to client engagements and payout tracking.",
    side: "right" as const,
    align: "start" as const,
  },
  {
    selector: "#tour-providers-header",
    title: "Provider registry",
    content:
      "Your team directory for postpartum and birth doulas, backup coverage, and educators.",
  },
  {
    selector: "#tour-providers-filters",
    title: "Search and filter",
    content:
      "Find providers by name, alias, or email. Filter by active/archived queue, role, or status.",
  },
  {
    selector: "#tour-providers-list",
    title: "Provider list",
    content:
      "Each row is one provider. Click a row to expand and edit details, or use Add provider for someone new.",
  },
  {
    selector: "#tour-providers-payout",
    title: "Payout report",
    content:
      "Review pending and paid provider payouts across client engagements in this CRM environment.",
    optional: true,
  },
  {
    selector: "#tour-providers-add",
    title: "Add a provider",
    content:
      "Start here to create a profile manually. On the next step we'll open the form with sample data you can explore.",
  },
  {
    selector: "#tour-providers-add-form",
    title: "Add provider form",
    content:
      "This form saves a new registry entry. The tour pre-fills demo data — replace it before saving a real provider.",
    beforeHighlight: PROVIDERS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-providers-form-name",
    title: "Display name",
    content:
      "The primary name shown in schedules, engagements, and payout reports. Aliases help match imported spreadsheets.",
    beforeHighlight: PROVIDERS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-providers-form-aliases",
    title: "Aliases",
    content:
      "Comma-separated alternate names (e.g. initials or nicknames). Used when matching schedule imports to this provider.",
    beforeHighlight: PROVIDERS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-providers-form-roles",
    title: "Roles",
    content:
      "Select every role this person fills — postpartum doula, birth doula, backup, educator, etc.",
    beforeHighlight: PROVIDERS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-providers-form-contact",
    title: "Contact info",
    content: "Email and phone for roster links, class assignments, and internal reference.",
    beforeHighlight: PROVIDERS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-providers-form-rate",
    title: "Default hourly rate",
    content:
      "Optional baseline rate in dollars. Engagements can override this per package.",
    beforeHighlight: PROVIDERS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-providers-form-actions",
    title: "Save or cancel",
    content:
      "Save provider commits the profile. During this tour, use Cancel if you don't want to keep the demo entry.",
    beforeHighlight: PROVIDERS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-providers-first-row",
    title: "Edit an existing provider",
    content:
      "Click any row to expand it. We'll open the first provider so you can see the edit panel.",
    optional: true,
    beforeHighlight: PROVIDERS_TOUR_ACTIONS.EXPAND_FIRST_PROVIDER,
  },
  {
    selector: "#tour-providers-detail",
    title: "Provider detail panel",
    content:
      "Update name, status, aliases, contact info, roles, rate, and notes. Changes apply to future engagements.",
    optional: true,
    beforeHighlight: PROVIDERS_TOUR_ACTIONS.EXPAND_FIRST_PROVIDER,
  },
  {
    selector: "#tour-providers-detail-actions",
    title: "Save, archive, or restore",
    content:
      "Save changes updates the registry. Archive hides a provider from active lists without deleting history.",
    optional: true,
    beforeHighlight: PROVIDERS_TOUR_ACTIONS.EXPAND_FIRST_PROVIDER,
  },
];

export const PROVIDERS_TOUR: TourDefinition = {
  id: "providers",
  storageKey: buildTourStorageKey("providers"),
  readySelector: "#tour-providers-header",
  cleanupAction: PROVIDERS_TOUR_ACTIONS.CLEANUP,
  steps: providersTourSteps,
};
