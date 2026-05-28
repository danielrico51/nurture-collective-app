import { brands } from "@/content/site";

export const TASK_REPORT = {
  title: "Open Tasks Report",
  subtitle: "Internal management task board — incomplete tasks only",
  organization: brands.nestingPlace.name,
  legalEntity: brands.nurtureCollective.name,
  tagline: brands.nestingPlace.tagline,
  confidentialityNotice:
    "CONFIDENTIAL — This report contains proprietary internal business information of " +
    `${brands.nurtureCollective.name} and ${brands.nestingPlace.name}. ` +
    "It is intended solely for authorized management team members. " +
    "Unauthorized review, copying, or distribution is prohibited.",
  footerNotice:
    "Generated from the internal task board. Do not share outside the organization.",
} as const;
