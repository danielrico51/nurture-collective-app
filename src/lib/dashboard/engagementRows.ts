import { engagementRef, type CrmStorageIndex } from "@/lib/clients/crmIndexLoader";
import { loadCrmStorageIndex } from "@/lib/clients/crmIndexLoader";
import { listProviders } from "@/lib/providers/storage";
import type {
  DashboardEngagementRow,
  DashboardEngagementRowsResult,
} from "@/types/dashboard";
import type { EngagementServiceType } from "@/types/serviceEngagement";
import type { ProviderRecord } from "@/types/provider";

const SERVICE_TYPE_LABELS: Record<EngagementServiceType, string> = {
  birth: "Birth",
  postpartum: "Postpartum",
  other: "Other",
};

export const engagementServiceTypeLabel = (
  serviceType: EngagementServiceType
): string => SERVICE_TYPE_LABELS[serviceType] ?? serviceType;

export const buildEngagementRowsFromIndex = (
  crmIndex: CrmStorageIndex,
  providers: ProviderRecord[]
): DashboardEngagementRow[] => {
  const providerNames = new Map(
    providers.map((provider) => [
      provider.providerId,
      provider.displayName || provider.providerId,
    ])
  );

  const rows: DashboardEngagementRow[] = [];

  for (const engagement of crmIndex.schedule.engagements) {
    const ref = engagementRef(engagement.clientId, engagement.engagementId);
    const packages = crmIndex.schedule.packagesByEngagement.get(ref) ?? [];
    const payouts = crmIndex.schedule.payoutsByEngagement.get(ref) ?? [];

    const clientFeeCents = packages.reduce((sum, pkg) => sum + pkg.clientFeeCents, 0);
    const doulaFeeCents = payouts.reduce((sum, payout) => sum + payout.amountCents, 0);

    const providerId =
      engagement.primaryProviderId ??
      packages.find((pkg) => pkg.providerId)?.providerId ??
      payouts[0]?.providerId ??
      null;

    rows.push({
      engagementId: engagement.engagementId,
      clientId: engagement.clientId,
      clientName:
        crmIndex.clientNamesById.get(engagement.clientId) ?? engagement.clientId,
      serviceDate: engagement.estimatedDate ?? engagement.bookDate,
      bookDate: engagement.bookDate,
      scheduleYear: engagement.scheduleYear,
      serviceType: engagement.serviceType,
      serviceTypeLabel: engagementServiceTypeLabel(engagement.serviceType),
      status: engagement.status,
      clientFeeCents,
      doulaFeeCents,
      providerName: providerId ? (providerNames.get(providerId) ?? null) : null,
      source: engagement.importSource ? "historic" : "live",
    });
  }

  rows.sort((a, b) => {
    const dateCompare = a.serviceDate.localeCompare(b.serviceDate);
    if (dateCompare !== 0) return dateCompare;
    return a.clientName.localeCompare(b.clientName);
  });

  return rows;
};

export const computeDashboardEngagementRows = async (options?: {
  force?: boolean;
}): Promise<DashboardEngagementRowsResult> => {
  const [crmIndex, providers] = await Promise.all([
    loadCrmStorageIndex({ force: options?.force }),
    listProviders({ includeArchived: true }),
  ]);

  const rows = buildEngagementRowsFromIndex(crmIndex, providers);

  return {
    generatedAt: new Date().toISOString(),
    indexLoadedAt: crmIndex.loadedAt,
    rows,
  };
};
