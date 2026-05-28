export type AdminAppStatus = "available" | "coming_soon";

export type AdminAppIcon = "tasks" | "intakes" | "leads" | "coverage" | "members" | "reports" | "settings";

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
    id: "coverage",
    title: "Coverage map",
    description: "Manage service regions, ZIP coverage, and expansion ratio for the concierge.",
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
];

export const getAvailableAdminApps = () =>
  ADMIN_APPS.filter((app) => app.status === "available");

export const getAdminAppByHref = (href: string) =>
  ADMIN_APPS.find((app) => app.href === href);
