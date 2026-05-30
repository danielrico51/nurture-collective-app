export type MemberAppStatus = "available" | "coming_soon";

export type MemberAppIcon =
  | "dashboard"
  | "purchases"
  | "thrift"
  | "community"
  | "groups"
  | "events"
  | "resources"
  | "providers"
  | "journal";

export interface MemberApp {
  id: string;
  title: string;
  description: string;
  href: string;
  status: MemberAppStatus;
  icon: MemberAppIcon;
  /** Shown on coming-soon app pages */
  plannedFeatures?: string[];
}

/** Registry of member-facing apps. Add new apps here as they are built. */
export const MEMBER_APPS: MemberApp[] = [
  {
    id: "dashboard",
    title: "Support dashboard",
    description:
      "Your personalized support journey — intake status, recommendations, checklist, and coordinator next steps.",
    href: "/apps/dashboard",
    status: "available",
    icon: "dashboard",
  },
  {
    id: "purchases",
    title: "Purchases",
    description:
      "View orders, service packages, and billing history for doula care, classes, and add-ons.",
    href: "/apps/purchases",
    status: "coming_soon",
    icon: "purchases",
    plannedFeatures: [
      "Order history and receipts",
      "Active packages and renewals",
      "Gift cards and credits",
    ],
  },
  {
    id: "thrift",
    title: "Thrift circle",
    description:
      "List, sell, or give baby gear and maternity items to other moms in the community.",
    href: "/apps/thrift",
    status: "coming_soon",
    icon: "thrift",
    plannedFeatures: [
      "Post items for sale or free pickup",
      "Browse by size, category, and distance",
      "Safe messaging between members",
    ],
  },
  {
    id: "community",
    title: "Community",
    description:
      "Connect with other moms — share wins, ask questions, and follow topics that match your stage.",
    href: "/apps/community",
    status: "coming_soon",
    icon: "community",
    plannedFeatures: [
      "Stage-based feeds (pregnancy, newborn, toddler)",
      "Moderated discussions",
      "Saved posts and notifications",
    ],
  },
  {
    id: "groups",
    title: "Group chats",
    description:
      "Join small groups by due date, neighborhood, or interest — lactation, NICU, working moms, and more.",
    href: "/apps/groups",
    status: "coming_soon",
    icon: "groups",
    plannedFeatures: [
      "Private group channels",
      "Coordinator-hosted circles",
      "Optional anonymous mode",
    ],
  },
  {
    id: "events",
    title: "Events & classes",
    description:
      "Workshops, prenatal classes, and local meetups — register and add them to your calendar.",
    href: "/apps/events",
    status: "coming_soon",
    icon: "events",
    plannedFeatures: [
      "Upcoming classes near you",
      "RSVP and reminders",
      "Virtual and in-person options",
    ],
  },
  {
    id: "resources",
    title: "Resource library",
    description:
      "Guides, FAQs, and trusted links curated for your maternal stage and support plan.",
    href: "/apps/resources",
    status: "coming_soon",
    icon: "resources",
    plannedFeatures: [
      "Articles matched to your intake",
      "Downloadable checklists",
      "Local provider directories",
    ],
  },
  {
    id: "providers",
    title: "Provider directory",
    description:
      "Find vetted doulas, lactation consultants, and postpartum support in your area.",
    href: "/apps/providers",
    status: "coming_soon",
    icon: "providers",
    plannedFeatures: [
      "Search by service and ZIP",
      "Verified profiles and reviews",
      "Book through your coordinator",
    ],
  },
  {
    id: "journal",
    title: "Wellness journal",
    description:
      "Private notes on mood, sleep, feeding, and milestones — optional sharing with your care team.",
    href: "/apps/journal",
    status: "coming_soon",
    icon: "journal",
    plannedFeatures: [
      "Daily check-ins",
      "Export for pediatric or OB visits",
      "Coordinator insights (opt-in)",
    ],
  },
];

export const MEMBER_APPS_HREF = "/apps";

export const getAvailableMemberApps = () =>
  MEMBER_APPS.filter((app) => app.status === "available");

export const getMemberAppById = (id: string) =>
  MEMBER_APPS.find((app) => app.id === id);

export const getMemberAppByHref = (href: string) =>
  MEMBER_APPS.find((app) => app.href === href);
