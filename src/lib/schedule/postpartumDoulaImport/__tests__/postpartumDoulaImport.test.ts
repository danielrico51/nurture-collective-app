import { describe, expect, it } from "vitest";
import { matchPostpartumDoulaProvider } from "@/lib/schedule/postpartumDoulaImport/matchDoula";
import {
  applyPostpartumRowCorrections,
  computeYearTotals,
  moneyDollarsToCents,
  type PostpartumScheduleEngagementRow,
} from "@/lib/schedule/postpartumDoulaImport/parseWorkbook";
import {
  buildExpectedTotalsRows,
  verifyStoredTotals,
} from "@/lib/schedule/postpartumDoulaImport/verifyTotals";
import type { ProviderRecord } from "@/types/provider";

const rosterProviders: ProviderRecord[] = [
  {
    providerId: "1",
    displayName: "Megan E Flaherty",
    aliases: ["Megan E Flaherty", "Megan"],
    roles: ["postpartum_doula"],
    email: "",
    phone: "",
    defaultHourlyRateCents: null,
    notes: "",
    status: "active",
    archivedAt: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    providerId: "2",
    displayName: "Lauren A Carrabs",
    aliases: ["Lauren A Carrabs", "Carrabs"],
    roles: ["postpartum_doula"],
    email: "",
    phone: "",
    defaultHourlyRateCents: null,
    notes: "",
    status: "active",
    archivedAt: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    providerId: "3",
    displayName: "Brittany Longo",
    aliases: ["Brittany Longo"],
    roles: ["postpartum_doula"],
    email: "",
    phone: "",
    defaultHourlyRateCents: null,
    notes: "",
    status: "active",
    archivedAt: null,
    createdAt: "",
    updatedAt: "",
  },
];

describe("postpartumDoulaImport", () => {
  it("matches birth roster aliases and first names", () => {
    expect(matchPostpartumDoulaProvider("Megan", rosterProviders).provider?.displayName).toBe(
      "Megan E Flaherty"
    );
    expect(matchPostpartumDoulaProvider("Carrabs", rosterProviders).provider?.displayName).toBe(
      "Lauren A Carrabs"
    );
    expect(matchPostpartumDoulaProvider("Longo", rosterProviders).provider?.displayName).toBe(
      "Brittany Longo"
    );
  });

  it("computes year totals from engagement rows", () => {
    const rows: PostpartumScheduleEngagementRow[] = [
      {
        rowNumber: 2,
        clientName: "A",
        doulaLabel: "Megan",
        startDate: "2024-03-01",
        scheduleYear: 2024,
        clientFeeDollars: 1000,
        totalHours: 20,
        totalDepositsDollars: 500,
        totalDoulaFeeDollars: 600,
      },
      {
        rowNumber: 3,
        clientName: "B",
        doulaLabel: "Megan",
        startDate: "2024-06-01",
        scheduleYear: 2024,
        clientFeeDollars: 1200,
        totalHours: 24,
        totalDepositsDollars: 1200,
        totalDoulaFeeDollars: 700,
      },
    ];

    const totals = computeYearTotals(rows);
    expect(totals).toEqual([
      {
        scheduleYear: 2024,
        engagementCount: 2,
        clientFeeDollars: 2200,
        doulaFeeDollars: 1300,
        depositDollars: 1700,
      },
    ]);
  });

  it("corrects known Carolyn Zegel aggregation typo", () => {
    const corrected = applyPostpartumRowCorrections({
      rowNumber: 2,
      clientName: "Carolyn Zegel",
      doulaLabel: "LL",
      startDate: "2025-05-27",
      scheduleYear: 2025,
      clientFeeDollars: 18300,
      totalHours: 20,
      totalDepositsDollars: 18300,
      totalDoulaFeeDollars: 709600,
    });
    expect(corrected.totalDoulaFeeDollars).toBe(7096);
  });

  it("verifies stored totals against workbook expectations", () => {
    const expected = buildExpectedTotalsRows([
      {
        scheduleYear: 2024,
        engagementCount: 2,
        clientFeeDollars: 2200,
        doulaFeeDollars: 1300,
        depositDollars: 1700,
      },
    ]);

    const report = verifyStoredTotals(expected, [
      {
        year: 2024,
        engagementCount: 2,
        clientFeeCents: moneyDollarsToCents(2200),
        doulaFeeCents: moneyDollarsToCents(1300),
      },
    ]);

    expect(report[0]?.ok).toBe(true);
  });
});
