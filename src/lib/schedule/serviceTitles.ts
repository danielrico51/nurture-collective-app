import type { EngagementServiceType } from "@/types/serviceEngagement";

export const engagementServiceTypeLabel = (
  serviceType: EngagementServiceType
): string => {
  if (serviceType === "postpartum") return "Postpartum doula";
  if (serviceType === "birth") return "Birth doula";
  return "Service";
};

export const buildLinkedServiceTitle = (
  serviceType: EngagementServiceType,
  scheduleYear: number
): string => `${engagementServiceTypeLabel(serviceType)} ${scheduleYear}`;
