export type AdminAppStatus = "available" | "coming_soon";

export type AdminAppIcon = "tasks" | "intakes" | "leads" | "members" | "reports" | "settings";

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
    description: "Track new leads from AI intake, notes, and coordinator pipeline.",
    href: "/admin/leads",
    status: "available",
    icon: "leads",
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
    id: "intakes",
    title: "Intake queue",
    description: "Review member onboarding submissions from all intake partitions.",
    href: "/admin/intakes",
    status: "available",
    icon: "intakes",
  },
];

export const getAvailableAdminApps = () =>
  ADMIN_APPS.filter((app) => app.status === "available");

export const getAdminAppByHref = (href: string) =>
  ADMIN_APPS.find((app) => app.href === href);
