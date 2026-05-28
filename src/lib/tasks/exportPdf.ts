import { TASK_REPORT } from "@/config/taskReport";
import {
  buildReportFilenameStem,
  reportRowToValues,
  TASK_REPORT_COLUMNS,
  type TaskReportPayload,
} from "@/lib/tasks/reportData";

export type PdfExportMethod = "preview-tab" | "iframe-print" | "download";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildReportHtml = (report: TaskReportPayload, filename: string): string => {
  const tableHead = TASK_REPORT_COLUMNS.map(
    (column) => `<th scope="col">${escapeHtml(column)}</th>`
  ).join("");

  const tableBody = report.rows
    .map((row) => {
      const cells = reportRowToValues(row)
        .map(
          (value, index) =>
            `<td${index === 0 ? ' class="task-title"' : ""}>${escapeHtml(value)}</td>`
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const emptyState =
    report.rows.length === 0
      ? `<p class="empty">No open tasks to include in this report.</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(filename)}</title>
    <style>
      @page {
        size: letter landscape;
        margin: 0.6in;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        color: #2d3436;
        font-family: "Inter", "Segoe UI", system-ui, sans-serif;
        font-size: 11px;
        line-height: 1.45;
      }
      .toolbar {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 12px 16px;
        background: #f3eef8;
        border-bottom: 1px solid #d8cce6;
      }
      @media print {
        .toolbar {
          display: none;
        }
      }
      .toolbar button {
        border: 0;
        border-radius: 999px;
        background: #8b7ba8;
        color: #fff;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        padding: 8px 16px;
        cursor: pointer;
      }
      .page {
        padding: 24px;
      }
      .brand-bar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        padding-bottom: 16px;
        border-bottom: 3px solid #8b7ba8;
        margin-bottom: 18px;
      }
      .brand-name {
        font-family: "Lora", Georgia, serif;
        font-size: 26px;
        font-weight: 600;
        color: #8b7ba8;
        margin: 0;
      }
      .brand-entity {
        margin: 4px 0 0;
        font-size: 12px;
        color: #6b6570;
      }
      .brand-tagline {
        margin: 2px 0 0;
        font-size: 11px;
        color: #8b7ba8;
        font-style: italic;
      }
      .meta {
        text-align: right;
        font-size: 10px;
        color: #555;
      }
      .meta strong {
        display: block;
        font-size: 14px;
        color: #2d3436;
        margin-bottom: 4px;
      }
      .summary {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
      }
      .summary span {
        background: #f3eef8;
        border: 1px solid #d8cce6;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 10px;
        font-weight: 600;
        color: #5c4f72;
      }
      .confidential {
        background: #faf7f2;
        border-left: 4px solid #8b7ba8;
        padding: 10px 12px;
        margin-bottom: 18px;
        font-size: 9px;
        color: #444;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      thead {
        display: table-header-group;
      }
      tr {
        page-break-inside: avoid;
      }
      th {
        background: #b8a9c9;
        color: #2d3436;
        text-align: left;
        padding: 8px 6px;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border: 1px solid #9b8ab8;
      }
      td {
        vertical-align: top;
        padding: 7px 6px;
        border: 1px solid #ddd;
        word-wrap: break-word;
      }
      tbody tr:nth-child(even) td {
        background: #faf8fc;
      }
      .task-title {
        font-weight: 600;
      }
      .empty {
        padding: 24px;
        text-align: center;
        color: #666;
        border: 1px dashed #ccc;
        border-radius: 12px;
      }
      .footer {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #ccc;
        font-size: 9px;
        color: #666;
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <button type="button" onclick="window.print()">Print / Save as PDF</button>
    </div>
    <div class="page">
      <header class="brand-bar">
        <div>
          <h1 class="brand-name">${escapeHtml(TASK_REPORT.organization)}</h1>
          <p class="brand-entity">${escapeHtml(TASK_REPORT.legalEntity)}</p>
          <p class="brand-tagline">${escapeHtml(TASK_REPORT.tagline)}</p>
        </div>
        <div class="meta">
          <strong>${escapeHtml(TASK_REPORT.title)}</strong>
          <div>${escapeHtml(TASK_REPORT.subtitle)}</div>
          <div>Generated: ${escapeHtml(report.generatedAt)}</div>
          <div>Scope: ${escapeHtml(report.scopeLabel)}</div>
        </div>
      </header>

      <div class="summary">
        <span>Open tasks: ${report.openCount}</span>
        <span>Urgent: ${report.urgentCount}</span>
        <span>Overdue: ${report.overdueCount}</span>
      </div>

      <div class="confidential">${escapeHtml(TASK_REPORT.confidentialityNotice)}</div>

      ${
        report.rows.length
          ? `<table>
              <thead><tr>${tableHead}</tr></thead>
              <tbody>${tableBody}</tbody>
            </table>`
          : emptyState
      }

      <footer class="footer">
        <span>${escapeHtml(TASK_REPORT.footerNotice)}</span>
        <span>${escapeHtml(TASK_REPORT.confidentialityNotice)}</span>
      </footer>
    </div>
    <script>
      window.addEventListener("load", function () {
        setTimeout(function () {
          window.print();
        }, 400);
      });
    </script>
  </body>
</html>`;
};

const downloadHtmlReport = (html: string, filename: string): void => {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}.html`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

const printViaHiddenIframe = (html: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Task report print preview");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";

    const cleanup = () => {
      window.setTimeout(() => {
        iframe.remove();
      }, 1_000);
    };

    iframe.onload = () => {
      try {
        const frameWindow = iframe.contentWindow;
        if (!frameWindow) {
          reject(new Error("Could not access the print preview frame."));
          cleanup();
          return;
        }
        frameWindow.focus();
        frameWindow.print();
        cleanup();
        resolve();
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    iframe.onerror = () => {
      cleanup();
      reject(new Error("Could not render the print preview."));
    };

    document.body.appendChild(iframe);
    iframe.srcdoc = html;
  });

export const exportOpenTasksToPdf = async (
  report: TaskReportPayload,
  scopeLabel: string
): Promise<PdfExportMethod> => {
  const filename = buildReportFilenameStem(scopeLabel);
  const html = buildReportHtml(report, filename);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const previewTab = window.open(blobUrl, "_blank");
    if (previewTab) {
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
      return "preview-tab";
    }
  } catch {
    // Fall through to iframe/download fallbacks.
  }

  URL.revokeObjectURL(blobUrl);

  try {
    await printViaHiddenIframe(html);
    return "iframe-print";
  } catch {
    downloadHtmlReport(html, filename);
    return "download";
  }
};
