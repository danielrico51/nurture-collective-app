import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientService } from "@/types/clientService";
import type {
  EngagementPackage,
  ServiceEngagement,
} from "@/types/serviceEngagement";

const { readClientService, updateClientService } = vi.hoisted(() => ({
  readClientService: vi.fn(),
  updateClientService: vi.fn(),
}));

vi.mock("@/lib/client-services/storage", () => ({
  readClientService,
  updateClientService,
}));

import {
  sumEngagementPackageFees,
  syncEngagementLinkedServiceTotal,
} from "@/lib/schedule/engagementServiceSync";

const engagement: ServiceEngagement = {
  engagementId: "eng-1",
  clientId: "client-1",
  serviceId: "service-1",
  serviceType: "postpartum",
  scheduleYear: 2026,
  primaryProviderId: null,
  bookDate: "2026-01-15",
  estimatedDate: null,
  estimatedNotes: "",
  status: "booked",
  preferredPaymentMethod: "venmo",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const packages: EngagementPackage[] = [
  {
    packageId: "pkg-1",
    engagementId: "eng-1",
    sortOrder: 0,
    label: "Primary",
    clientFeeCents: 540_000,
    hoursTotal: null,
    hoursAnnotation: "",
    schedulePattern: "",
    doulaFeeCents: null,
    providerId: null,
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const baseService = (overrides: Partial<ClientService> = {}): ClientService => ({
  serviceId: "service-1",
  clientId: "client-1",
  title: "Postpartum doula 2026",
  providerName: "Alex",
  serviceDate: "2026-01-15",
  totalFeeCents: 500_000,
  feeItems: [],
  proposalId: null,
  googleDocUrl: null,
  status: "active",
  notes: "",
  engagementId: "eng-1",
  providerId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("engagementServiceSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateClientService.mockResolvedValue({});
  });

  it("sums engagement package fees", () => {
    expect(sumEngagementPackageFees(packages)).toBe(540_000);
  });

  it("updates linked service total when package fee changes", async () => {
    readClientService.mockResolvedValue(baseService());

    const updated = await syncEngagementLinkedServiceTotal(
      "client-1",
      engagement,
      packages
    );

    expect(updated).toBe(true);
    expect(updateClientService).toHaveBeenCalledWith(
      "client-1",
      "service-1",
      {
        totalFeeCents: 540_000,
        feeItems: [],
      }
    );
  });

  it("clears stale itemized fee lines that block total updates", async () => {
    readClientService.mockResolvedValue(
      baseService({
        totalFeeCents: 500_000,
        feeItems: [{ id: "fee-1", label: "Doula fee", amountCents: 500_000 }],
      })
    );

    const updated = await syncEngagementLinkedServiceTotal(
      "client-1",
      engagement,
      packages
    );

    expect(updated).toBe(true);
    expect(updateClientService).toHaveBeenCalledWith(
      "client-1",
      "service-1",
      expect.objectContaining({ totalFeeCents: 540_000, feeItems: [] })
    );
  });

  it("no-ops when service total already matches packages", async () => {
    readClientService.mockResolvedValue(
      baseService({ totalFeeCents: 540_000, feeItems: [] })
    );

    const updated = await syncEngagementLinkedServiceTotal(
      "client-1",
      engagement,
      packages
    );

    expect(updated).toBe(false);
    expect(updateClientService).not.toHaveBeenCalled();
  });

  it("preserves itemized fee lines when they match the engagement total", async () => {
    readClientService.mockResolvedValue(
      baseService({
        totalFeeCents: 540_000,
        feeItems: [
          { id: "fee-1", label: "Doula fee", amountCents: 500_000 },
          { id: "fee-2", label: "TNP", amountCents: 40_000 },
        ],
      })
    );

    const updated = await syncEngagementLinkedServiceTotal(
      "client-1",
      engagement,
      packages
    );

    expect(updated).toBe(false);
    expect(updateClientService).not.toHaveBeenCalled();
  });
});
