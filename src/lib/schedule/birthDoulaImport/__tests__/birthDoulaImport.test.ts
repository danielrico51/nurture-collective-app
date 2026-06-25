import { describe, expect, it } from "vitest";
import {
  parseExcelSerialDate,
  parseScheduleDate,
  pickEarliestDate,
} from "@/lib/schedule/birthDoulaImport/parseDates";
import { matchDoulaProvider } from "@/lib/schedule/birthDoulaImport/matchDoula";
import {
  computeSheetTotals,
  computeYearTotals,
  moneyDollarsToCents,
} from "@/lib/schedule/birthDoulaImport/parseWorkbook";
import type { BirthScheduleEngagementBlock } from "@/lib/schedule/birthDoulaImport/parseWorkbook";
import type { ProviderRecord } from "@/types/provider";
import {
  buildExpectedTotalsRows,
  verifyStoredTotals,
} from "@/lib/schedule/birthDoulaImport/verifyTotals";

const rosterProviders: ProviderRecord[] = [
  {
    providerId: "1",
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
    providerId: "2",
    displayName: "Janna L. Goodman",
    aliases: ["Janna L. Goodman"],
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
    displayName: "Lauren G. Tyler",
    aliases: ["Lauren G. Tyler", "LT"],
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

describe("parseDates", () => {
  it("parses excel serial dates in a sane range", () => {
    expect(parseExcelSerialDate(44932)).toBe("2023-01-06");
  });

  it("parses m/d strings with a hint year", () => {
    expect(parseScheduleDate("9/18 (Z)", 2020)).toBe("2020-09-18");
    expect(parseScheduleDate("2/9/2021(V)", 2020)).toBe("2021-02-09");
  });

  it("parses ISO date strings", () => {
    expect(parseScheduleDate("2026-12-31")).toBe("2026-12-31");
    expect(parseScheduleDate("2024-08-01")).toBe("2024-08-01");
  });

  it("ignores invalid excel serials", () => {
    expect(parseExcelSerialDate(775140)).toBeNull();
  });

  it("picks earliest paid date", () => {
    expect(
      pickEarliestDate("2021-06-13", "2020-09-18", null)
    ).toBe("2020-09-18");
  });
});

describe("matchDoulaProvider", () => {
  it("matches spreadsheet aliases to roster names", () => {
    expect(matchDoulaProvider("Carrabs", rosterProviders).provider?.displayName).toBe(
      "Lauren A Carrabs"
    );
    expect(matchDoulaProvider("LT", rosterProviders).provider?.displayName).toBe(
      "Lauren G. Tyler"
    );
    expect(matchDoulaProvider("Janna", rosterProviders).provider?.displayName).toBe(
      "Janna L. Goodman"
    );
  });
});

describe("totals helpers", () => {
  const sampleEngagements: BirthScheduleEngagementBlock[] = [
    {
      sheetName: "2023",
      rowStart: 4,
      clientName: "Alexa Ellin",
      scheduleYear: 2023,
      bookDate: "2022-08-15",
      packages: [
        {
          rowNumber: 4,
          doulaLabel: "Janna",
          clientFeeDollars: 2000,
          doulaFeeDollars: 1000,
          bookDate: null,
          dueDate: "2023-01-15",
          hospital: "Englewood",
          clientDepositDollars: 666.67,
          clientDepositPaid: "2022-08-15",
          clientBalanceDollars: 1333.33,
          clientBalanceDue: "2022-12-15",
          clientBalancePaid: "2023-02-15",
          doulaDepositDollars: 366.67,
          doulaDepositPaid: "2023-02-01",
          doulaBalanceDollars: 733.33,
          doulaBalancePaid: "2023-03-01",
          notes: "",
        },
      ],
    },
  ];

  it("converts dollars to cents", () => {
    expect(moneyDollarsToCents(666.67)).toBe(66667);
  });

  it("computes sheet totals", () => {
    const totals = computeSheetTotals("2023", sampleEngagements);
    expect(totals.engagementCount).toBe(1);
    expect(totals.clientFeeDollars).toBe(2000);
    expect(totals.doulaFeeDollars).toBe(1000);
  });

  it("verifies stored totals against workbook expectations", () => {
    const expectedRows = buildExpectedTotalsRows(sampleEngagements, [
      {
        sheetName: "2023",
        scheduleYear: 2023,
        engagementCount: 1,
        packageCount: 1,
        clientFeeDollars: 2000,
        doulaFeeDollars: 1000,
      },
    ]);

    const verified = verifyStoredTotals(expectedRows, [
      {
        year: 2023,
        engagementCount: 1,
        clientFeeCents: 200000,
        doulaFeeCents: 100000,
      },
    ]);

    expect(verified[0]?.ok).toBe(true);
  });

  it("groups 2020-2022 rows by schedule year", () => {
    const byYear = computeYearTotals([
      {
        sheetName: "2020-2022",
        rowStart: 5,
        clientName: "A",
        scheduleYear: 2020,
        bookDate: "2020-09-18",
        packages: [
          {
            rowNumber: 5,
            doulaLabel: "Jamie",
            clientFeeDollars: 700,
            doulaFeeDollars: 200,
            bookDate: null,
            dueDate: "2020-12-01",
            hospital: "",
            clientDepositDollars: 250,
            clientDepositPaid: "2020-09-18",
            clientBalanceDollars: 450,
            clientBalanceDue: null,
            clientBalancePaid: null,
            doulaDepositDollars: 0,
            doulaDepositPaid: null,
            doulaBalanceDollars: 200,
            doulaBalancePaid: "2020-12-05",
            notes: "",
          },
        ],
      },
      {
        sheetName: "2020-2022",
        rowStart: 24,
        clientName: "B",
        scheduleYear: 2021,
        bookDate: "2021-02-09",
        packages: [
          {
            rowNumber: 24,
            doulaLabel: "Judy",
            clientFeeDollars: 1600,
            doulaFeeDollars: 1000,
            bookDate: null,
            dueDate: "2021-05-01",
            hospital: "",
            clientDepositDollars: 533.33,
            clientDepositPaid: "2021-02-09",
            clientBalanceDollars: 1066.67,
            clientBalanceDue: null,
            clientBalancePaid: "2021-04-01",
            doulaDepositDollars: 333.33,
            doulaDepositPaid: "2021-04-01",
            doulaBalanceDollars: 666.67,
            doulaBalancePaid: "2021-05-01",
            notes: "",
          },
        ],
      },
    ]);

    expect(byYear.get(2020)?.engagementCount).toBe(1);
    expect(byYear.get(2021)?.clientFeeDollars).toBe(1600);
  });
});
