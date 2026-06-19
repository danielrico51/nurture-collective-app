export type AdminAppStatus = "available" | "coming_soon";

export type AdminAppIcon =
  | "tasks"
  | "intakes"
  | "leads"
  | "clients"
  | "providers"
  | "coverage"
  | "blog"
  | "events"
  | "members"
  | "reports"
  | "settings";

export interface AdminApp {
  id: string;
  title: string;
  description: string;
  href: string;
  status: AdminAppStatus;
  icon: AdminAppIcon;
}

/** Registry of admin-only tools. Add new apps here as they are built. */
export const ADMIN_APPS: AdminApp[] = [
  {
    id: "leads",
    title: "Lead CRM",
    description:
      "Guest leads and member intakes — pipeline, recommendations, concierge, and notes in one queue.",
    href: "/admin/leads",
    status: "available",
    icon: "leads",
  },
  {
    id: "clients",
    title: "Client CRM",
    description:
      "Manage active clients, link leads and app users, and track proposals, billing, and communications.",
    href: "/admin/clients",
    status: "available",
    icon: "clients",
  },
  {
    id: "providers",
    title: "Providers",
    description:
      "Registry of doulas and educators — names, roles, rates, and aliases for schedule matching.",
    href: "/admin/providers",
    status: "available",
    icon: "providers",
  },
    {
    id: "coverage",
    title: "Coverage map",
    description: "Plan service regions and ZIP areas for internal use (not shown on the public site).",
    href: "/admin/coverage",
    status: "available",
    icon: "coverage",
  },
  {
    id: "tasks",
    title: "Task board",
    description: "Team checklists, assignees, deadlines, and calendar view.",
    href: "/admin/tasks",
    status: "available",
    icon: "tasks",
  },
  {
    id: "blog",
    title: "Blog",
    description: "Create, edit, and publish articles stored in S3.",
    href: "/admin/blog",
    status: "available",
    icon: "blog",
  },
  {
    id: "events",
    title: "Events & classes",
    description:
      "Listings, registrations, payments, and settings for classes and events.",
    href: "/admin/events",
    status: "available",
    icon: "events",
  },
  {
    id: "quickbooks",
    title: "QuickBooks",
    description: "Connect QuickBooks Online for billing, invoices, and payment sync.",
    href: "/admin/integrations/quickbooks",
    status: "available",
    icon: "settings",
  },
];

export const getAvailableAdminApps = () =>
  ADMIN_APPS.filter((app) => app.status === "available");

export const getAdminAppByHref = (href: string) =>
  ADMIN_APPS.find((app) => app.href === href);
