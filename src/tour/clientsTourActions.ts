export const CLIENTS_TOUR_ACTIONS = {
  OPEN_ADD_FORM_DEMO: "clients:open-add-form-demo",
  CLOSE_ADD_FORM: "clients:close-add-form",
  EXPAND_FIRST_OVERVIEW: "clients:expand-first-overview",
  EXPAND_FIRST_SCHEDULE: "clients:expand-first-schedule",
  EXPAND_FIRST_SERVICES: "clients:expand-first-services",
  EXPAND_FIRST_COMMUNICATIONS: "clients:expand-first-communications",
  EXPAND_FIRST_ENGAGEMENT: "clients:expand-first-engagement",
  OPEN_SCHEDULE_BOOK_DEMO: "clients:open-schedule-book-demo",
  CLOSE_SCHEDULE_BOOK: "clients:close-schedule-book",
  COLLAPSE_CLIENT: "clients:collapse-client",
  CLEANUP: "clients:cleanup",
} as const;

export type ClientsTourAction =
  (typeof CLIENTS_TOUR_ACTIONS)[keyof typeof CLIENTS_TOUR_ACTIONS];
