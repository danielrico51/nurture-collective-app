import { CLIENTS_TOUR_ACTIONS } from "@/tour/clientsTourActions";
import type { TourDefinition } from "@/tour/types";
import { buildTourStorageKey } from "@/tour/storage";

/** Full Client CRM tour — queue overview, add-client demo form, and client detail tabs. */
export const clientsTourSteps = [
  {
    selector: "#tour-admin-nav-clients",
    title: "Client CRM",
    content:
      "Manage active clients from the admin sidebar — link leads and app users, track schedule, services, billing, and communications.",
    side: "right" as const,
    align: "start" as const,
  },
  {
    selector: "#tour-clients-header",
    title: "Client workspace",
    content:
      "Your hub for families after they become clients. Proposals, engagements, invoices, and notes live on each client record.",
  },
  {
    selector: "#tour-clients-filters",
    title: "Search and filter",
    content:
      "Find clients by name, email, phone, or tags. Filter by active/archived queue or pipeline status.",
  },
  {
    selector: "#tour-clients-list",
    title: "Client list",
    content:
      "Each row is one client. Click to expand the full record, or use Add client for manual entry.",
  },
  {
    selector: "#tour-clients-add",
    title: "Add a client",
    content:
      "Create a client who did not come through a lead — referrals, returning families, or partners. Next we open the form with sample data.",
  },
  {
    selector: "#tour-clients-add-form",
    title: "Add client form",
    content:
      "Manual clients can be linked to a lead or app user later. Demo data is pre-filled — replace before saving.",
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-clients-form-name",
    title: "Client name",
    content: "Primary name shown across schedule, services, and communications.",
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-clients-form-contact",
    title: "Contact info",
    content: "Provide at least email or phone. Used for invoices and outreach.",
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-clients-form-channel",
    title: "How they reached us",
    content:
      "Tracks intake channel — referral, phone, event, provider referral, etc.",
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-clients-form-meta",
    title: "ZIP, tags, and notes",
    content:
      "ZIP helps with coverage matching. Tags organize segments; notes capture context for the team.",
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-clients-form-coordinator",
    title: "Coordinator",
    content: "Assign the team member who owns this client relationship.",
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-clients-form-actions",
    title: "Save or cancel",
    content:
      "Add client creates the record. During this tour, use Cancel if you do not want to keep the demo entry.",
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO,
  },
  {
    selector: "#tour-clients-first-row",
    title: "Open a client record",
    content:
      "Click any row to expand it. We will open the first client to walk through the detail tabs.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_OVERVIEW,
  },
  {
    selector: "#tour-clients-detail-tabs",
    title: "Client detail tabs",
    content:
      "Overview, Schedule, Services, Communications, and Notes — each tab holds a different part of the client journey.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_OVERVIEW,
  },
  {
    selector: "#tour-clients-overview-status",
    title: "Status and coordinator",
    content:
      "Set pipeline status (prospect → active) and assign the coordinator responsible for this client.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_OVERVIEW,
  },
  {
    selector: "#tour-clients-overview-profile",
    title: "Contact profile",
    content:
      "View and edit name, email, phone, ZIP, tags, and summary notes. Changes sync to linked lead or app user when present.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_OVERVIEW,
  },
  {
    selector: "#tour-clients-overview-links",
    title: "Link lead or app user",
    content:
      "Connect this client to an existing lead record or Cognito app user for a unified profile.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_OVERVIEW,
  },
  {
    selector: "#tour-clients-tab-schedule",
    title: "Schedule tab",
    content:
      "Service engagements — book dates, provider assignment, payment expectations, shifts, and payouts.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_SCHEDULE,
  },
  {
    selector: "#tour-schedule-intro",
    title: "What is an engagement?",
    content:
      "A service engagement is a booked period of care for this client — for example, postpartum support for a schedule year. It holds package fees, the assigned provider, deposit and balance expectations, visit shifts, provider payouts, and a linked billing service for invoicing.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_SCHEDULE,
  },
  {
    selector: "#tour-schedule-engagement-list",
    title: "Engagement list",
    content:
      "Each row is one engagement. Expand a row to update status, edit package details, log shifts, or track the payment schedule.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_SCHEDULE,
  },
  {
    selector: "#tour-schedule-first-engagement",
    title: "Open an engagement",
    content:
      "Click a row to see package fees, payment expectations, shift tracking, and the linked service used on the Services tab for invoices.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_ENGAGEMENT,
  },
  {
    selector: "#tour-schedule-engagement-detail",
    title: "Engagement details",
    content:
      "Mark status (booked → active → completed), edit fees and provider assignment, record deposit/balance payments, and manage visit shifts and doula payouts.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_ENGAGEMENT,
  },
  {
    selector: "#tour-schedule-book",
    title: "Book an engagement",
    content:
      "Start here to book a new engagement. Next we open the form with sample data — cancel or edit before saving.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.CLOSE_SCHEDULE_BOOK,
  },
  {
    selector: "#tour-schedule-book-form",
    title: "New engagement form",
    content:
      "Creating an engagement also creates a linked service on the Services tab so you can invoice the client. Demo data is pre-filled below.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_SCHEDULE_BOOK_DEMO,
  },
  {
    selector: "#tour-schedule-form-dates",
    title: "Book and due dates",
    content:
      "Book date is when the engagement was sold or confirmed. Estimated due/birth helps plan coverage; schedule year groups reporting.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_SCHEDULE_BOOK_DEMO,
  },
  {
    selector: "#tour-schedule-form-provider",
    title: "Primary provider",
    content:
      "Assign the lead doula from your provider registry. You can change this later or add backup coverage on shifts.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_SCHEDULE_BOOK_DEMO,
  },
  {
    selector: "#tour-schedule-form-package",
    title: "Package fees and hours",
    content:
      "Client fee is what the family pays; doula fee is what you owe the provider. Hours and the days/nights pattern describe the care plan.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_SCHEDULE_BOOK_DEMO,
  },
  {
    selector: "#tour-schedule-form-notes",
    title: "Estimated notes",
    content:
      "Free-text planning notes — due dates, induction plans, or internal shorthand your team uses.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_SCHEDULE_BOOK_DEMO,
  },
  {
    selector: "#tour-schedule-form-payments",
    title: "Deposit and balance",
    content:
      "Optional payment schedule: preferred invoice method, deposit amount, balance due date, and labels like “after 1st wk”.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_SCHEDULE_BOOK_DEMO,
  },
  {
    selector: "#tour-schedule-form-actions",
    title: "Create engagement",
    content:
      "Save creates the engagement, payment expectations, and linked service. During this tour, skip saving if you only want to explore.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.OPEN_SCHEDULE_BOOK_DEMO,
  },
  {
    selector: "#tour-clients-tab-services",
    title: "Services tab",
    content:
      "Billing anchor for each engagement — fee breakdown, invoices, payment method, and QuickBooks sync.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_SERVICES,
  },
  {
    selector: "#tour-clients-detail-content",
    title: "Services and invoices",
    content:
      "Add services, split fee items, send invoices (Zelle, Venmo, Stripe, QuickBooks), and track paid vs due balances.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_SERVICES,
  },
  {
    selector: "#tour-clients-tab-communications",
    title: "Communications tab",
    content: "Log emails and messages sent to this client from your team.",
    optional: true,
    beforeHighlight: CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_COMMUNICATIONS,
  },
];

export const CLIENTS_TOUR: TourDefinition = {
  id: "clients",
  storageKey: buildTourStorageKey("clients"),
  readySelector: "#tour-clients-header",
  cleanupAction: CLIENTS_TOUR_ACTIONS.CLEANUP,
  steps: clientsTourSteps,
};
