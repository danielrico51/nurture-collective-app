import { TASK_REPORT } from "@/config/taskReport";
import {
  buildReportFilenameStem,
  reportRowToValues,
  TASK_REPORT_COLUMNS,
  type TaskReportPayload,
} from "@/lib/tasks/reportData";
import * as XLSX from "xlsx";

export const exportOpenTasksToExcel = (
  report: TaskReportPayload,
  scopeLabel: string
): void => {
  const headerBlock: (string | number)[][] = [
    [TASK_REPORT.organization],
    [TASK_REPORT.legalEntity],
    [TASK_REPORT.title],
    [TASK_REPORT.subtitle],
    [`Generated: ${report.generatedAt}`],
    [`Scope: ${report.scopeLabel}`],
    [
      `Open tasks: ${report.openCount} · Urgent: ${report.urgentCount} · Overdue: ${report.overdueCount}`,
    ],
    [TASK_REPORT.confidentialityNotice],
    [],
    [...TASK_REPORT_COLUMNS],
  ];

  const dataRows = report.rows.map((row) => reportRowToValues(row));
  const sheetData = [...headerBlock, ...dataRows];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  worksheet["!cols"] = [
    { wch: 36 },
    { wch: 48 },
    { wch: 24 },
    { wch: 14 },
    { wch: 12 },
    { wch: 8 },
    { wch: 10 },
    { wch: 28 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
  ];

  if (!worksheet["!merges"]) worksheet["!merges"] = [];
  for (let row = 0; row < 8; row += 1) {
    worksheet["!merges"].push({
      s: { r: row, c: 0 },
      e: { r: row, c: TASK_REPORT_COLUMNS.length - 1 },
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Open Tasks");

  const filename = `${buildReportFilenameStem(scopeLabel)}.xlsx`;
  XLSX.writeFile(workbook, filename, { compression: true });
};
