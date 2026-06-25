"use client";

import { formatEngagementMoney } from "@/lib/api/scheduleClient";
import {
  buildCsvContent,
  downloadCsvFile,
  formatCentsAsDollars,
} from "@/lib/dashboard/csvExport";
import type { DashboardEngagementRow } from "@/types/dashboard";
import type { EngagementServiceType } from "@/types/serviceEngagement";
import Link from "next/link";
import { useMemo, useState } from "react";

type SortKey =
  | "serviceDate"
  | "clientName"
  | "serviceTypeLabel"
  | "clientFeeCents"
  | "doulaFeeCents";

const SERVICE_TYPE_OPTIONS: Array<{ value: "all" | EngagementServiceType; label: string }> =
  [
    { value: "all", label: "All types" },
    { value: "birth", label: "Birth" },
    { value: "postpartum", label: "Postpartum" },
    { value: "other", label: "Other" },
  ];

const SOURCE_OPTIONS = [
  { value: "all", label: "All sources" },
  { value: "historic", label: "Historic import" },
  { value: "live", label: "Live CRM" },
] as const;

const formatDisplayDate = (isoDate: string): string => {
  if (!isoDate) return "—";
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) return isoDate;
  return new Date(parsed).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

const compareRows = (
  a: DashboardEngagementRow,
  b: DashboardEngagementRow,
  sortKey: SortKey,
  direction: "asc" | "desc"
): number => {
  let result = 0;
  if (sortKey === "clientFeeCents" || sortKey === "doulaFeeCents") {
    result = a[sortKey] - b[sortKey];
  } else {
    result = String(a[sortKey]).localeCompare(String(b[sortKey]));
  }
  return direction === "asc" ? result : -result;
};

interface DashboardEngagementsTabProps {
  rows: DashboardEngagementRow[];
  loading: boolean;
  indexLoadedAt: string | null;
}

const DashboardEngagementsTab = ({
  rows,
  loading,
  indexLoadedAt,
}: DashboardEngagementsTabProps) => {
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | EngagementServiceType>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "historic" | "live">("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("serviceDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const row of rows) years.add(row.scheduleYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const next = rows.filter((row) => {
      if (yearFilter !== "all" && row.scheduleYear !== yearFilter) return false;
      if (typeFilter !== "all" && row.serviceType !== typeFilter) return false;
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
      if (query && !row.clientName.toLowerCase().includes(query)) return false;
      return true;
    });
    return [...next].sort((a, b) => compareRows(a, b, sortKey, sortDirection));
  }, [rows, yearFilter, typeFilter, sourceFilter, search, sortKey, sortDirection]);

  const totals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => {
          acc.clientFeeCents += row.clientFeeCents;
          acc.doulaFeeCents += row.doulaFeeCents;
          return acc;
        },
        { clientFeeCents: 0, doulaFeeCents: 0 }
      ),
    [filteredRows]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "serviceDate" ? "asc" : "desc");
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const downloadCsv = () => {
    const headers = [
      "Date",
      "Client",
      "Type",
      "Client Fee",
      "Doula Fee",
      "Provider",
      "Year",
      "Source",
      "Status",
    ];
    const csvRows = filteredRows.map((row) => [
      row.serviceDate,
      row.clientName,
      row.serviceTypeLabel,
      formatCentsAsDollars(row.clientFeeCents),
      formatCentsAsDollars(row.doulaFeeCents),
      row.providerName ?? "",
      String(row.scheduleYear),
      row.source,
      row.status,
    ]);
    const content = buildCsvContent(headers, csvRows);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`nurture-engagements-${stamp}.csv`, content);
  };

  if (loading && rows.length === 0) {
    return (
      <div className="rounded-2xl border border-nurture-sage/15 bg-white/60 p-5">
        <p className="text-sm text-nurture-charcoal/55">Loading engagement spreadsheet…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold text-nurture-charcoal">
            All engagements
          </h3>
          <p className="mt-1 text-sm text-nurture-charcoal/60">
            Spreadsheet view of every engagement with client fees and doula payouts.
          </p>
          {indexLoadedAt ? (
            <p className="mt-1 text-xs text-nurture-charcoal/45">
              Data indexed {new Date(indexLoadedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={filteredRows.length === 0}
          className="rounded-lg bg-nurture-sage px-4 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-50"
        >
          Download CSV ({filteredRows.length})
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search client…"
          className="min-w-[180px] rounded-lg border border-nurture-sage/25 bg-white px-3 py-1.5 text-sm"
        />
        <select
          value={yearFilter === "all" ? "all" : String(yearFilter)}
          onChange={(event) =>
            setYearFilter(
              event.target.value === "all" ? "all" : Number(event.target.value)
            )
          }
          className="rounded-lg border border-nurture-sage/25 bg-white px-3 py-1.5 text-sm"
        >
          <option value="all">All years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value as "all" | EngagementServiceType)
          }
          className="rounded-lg border border-nurture-sage/25 bg-white px-3 py-1.5 text-sm"
        >
          {SERVICE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(event) =>
            setSourceFilter(event.target.value as "all" | "historic" | "live")
          }
          className="rounded-lg border border-nurture-sage/25 bg-white px-3 py-1.5 text-sm"
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-nurture-sage/15 bg-white/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-nurture-cream/95 backdrop-blur">
              <tr className="border-b border-nurture-sage/15 text-left text-xs uppercase tracking-wide text-nurture-charcoal/55">
                <th className="px-4 py-3 font-semibold">
                  <button type="button" onClick={() => toggleSort("serviceDate")} className="hover:text-nurture-charcoal">
                    Date{sortIndicator("serviceDate")}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <button type="button" onClick={() => toggleSort("clientName")} className="hover:text-nurture-charcoal">
                    Client{sortIndicator("clientName")}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <button type="button" onClick={() => toggleSort("serviceTypeLabel")} className="hover:text-nurture-charcoal">
                    Type{sortIndicator("serviceTypeLabel")}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Provider</th>
                <th className="px-4 py-3 font-semibold text-right">
                  <button type="button" onClick={() => toggleSort("clientFeeCents")} className="hover:text-nurture-charcoal">
                    Client fee{sortIndicator("clientFeeCents")}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold text-right">
                  <button type="button" onClick={() => toggleSort("doulaFeeCents")} className="hover:text-nurture-charcoal">
                    Doula fee{sortIndicator("doulaFeeCents")}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-nurture-charcoal/55">
                    No engagements match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.engagementId}
                    className="border-b border-nurture-sage/10 hover:bg-nurture-sage/5"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 text-nurture-charcoal/80">
                      {formatDisplayDate(row.serviceDate)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/clients?client=${row.clientId}`}
                        className="font-medium text-nurture-sage-dark hover:underline"
                      >
                        {row.clientName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-nurture-charcoal/75">
                      {row.serviceTypeLabel}
                    </td>
                    <td className="px-4 py-2.5 text-nurture-charcoal/70">
                      {row.providerName ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium text-nurture-charcoal">
                      {formatEngagementMoney(row.clientFeeCents)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-nurture-charcoal/80">
                      {formatEngagementMoney(row.doulaFeeCents)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.source === "historic"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-nurture-sage/15 text-nurture-sage-dark"
                        }`}
                      >
                        {row.source === "historic" ? "Historic" : "Live"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRows.length > 0 ? (
              <tfoot className="border-t border-nurture-sage/20 bg-nurture-cream/70">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-nurture-charcoal">
                    Totals ({filteredRows.length} rows)
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-nurture-charcoal">
                    {formatEngagementMoney(totals.clientFeeCents)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-nurture-charcoal">
                    {formatEngagementMoney(totals.doulaFeeCents)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardEngagementsTab;
