import {
  readClientService,
  updateClientService,
} from "@/lib/client-services/storage";
import { sumFeeItemsCents } from "@/lib/client-services/feeItems";
import type {
  EngagementPackage,
  ServiceEngagement,
} from "@/types/serviceEngagement";

export const sumEngagementPackageFees = (
  packages: EngagementPackage[]
): number => packages.reduce((sum, pkg) => sum + pkg.clientFeeCents, 0);

/**
 * Keep the linked ClientService total aligned with engagement package fees.
 * Clears itemized fee lines so the engagement package total is authoritative.
 */
export const syncEngagementLinkedServiceTotal = async (
  clientId: string,
  engagement: ServiceEngagement,
  packages: EngagementPackage[]
): Promise<boolean> => {
  if (!engagement.serviceId) return false;

  const totalFeeCents = sumEngagementPackageFees(packages);
  if (totalFeeCents <= 0) return false;

  const service = await readClientService(clientId, engagement.serviceId);
  if (!service) return false;

  const itemizedTotal =
    service.feeItems.length > 0 ? sumFeeItemsCents(service.feeItems) : null;
  const effectiveTotal = itemizedTotal ?? service.totalFeeCents;
  const alreadySynced =
    effectiveTotal === totalFeeCents && service.feeItems.length === 0;

  if (alreadySynced) return false;

  await updateClientService(clientId, engagement.serviceId, {
    totalFeeCents,
    feeItems: [],
  });
  return true;
};
