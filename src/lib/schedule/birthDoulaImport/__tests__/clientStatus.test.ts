import { describe, expect, it } from "vitest";
import {
  blockHasFutureServiceDate,
  engagementHasFutureServiceDate,
  resolveHistoricClientStatus,
} from "@/lib/schedule/birthDoulaImport/clientStatus";
import type { BirthScheduleEngagementBlock } from "@/lib/schedule/birthDoulaImport/parseWorkbook";

describe("clientStatus", () => {
  it("marks clients active when due date is in the future", () => {
    const block: BirthScheduleEngagementBlock = {
      sheetName: "2026",
      rowStart: 5,
      clientName: "Taylor Ingas",
      scheduleYear: 2026,
      bookDate: "2025-09-01",
      packages: [
        {
          rowNumber: 5,
          doulaLabel: "Megan",
          clientFeeDollars: 2400,
          doulaFeeDollars: 1200,
          bookDate: "2025-09-01",
          dueDate: "2026-02-01",
          hospital: "Valley",
          clientDepositDollars: 800,
          clientDepositPaid: "2025-09-02",
          clientBalanceDollars: 1600,
          clientBalanceDue: null,
          clientBalancePaid: null,
          doulaDepositDollars: 400,
          doulaDepositPaid: null,
          doulaBalanceDollars: 800,
          doulaBalancePaid: null,
          notes: "",
        },
      ],
    };

    expect(blockHasFutureServiceDate(block, "2026-01-01")).toBe(true);
    expect(resolveHistoricClientStatus(true)).toBe("active");
  });

  it("marks clients inactive when all service dates are in the past", () => {
    expect(
      engagementHasFutureServiceDate(
        { estimatedDate: "2023-04-10", bookDate: "2023-01-24" },
        "2026-06-17"
      )
    ).toBe(false);
    expect(resolveHistoricClientStatus(false)).toBe("inactive");
  });
});
