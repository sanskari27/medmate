import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { IconChart, IconDoc, IconPrint } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import { problemMessage, useAuthState } from "@/features/authentication";
import { REPORT_CATALOG } from "../../catalog";
import {
  REPORT_PRESETS,
  SNAPSHOT_REPORTS,
  canExportReports,
  downloadFile,
  kolkataDate,
  reportCell,
  reportRange,
  type ReportCell,
  type ReportPreset,
} from "../../model";
import { useLazyExportReportQuery, useReadReportQuery } from "../../reports.api";

export function ReportPage() {
  const { reportId = "" } = useParams();
  const meta = REPORT_CATALOG.find((report) => report.id === reportId);
  const { session } = useAuthState();
  const canExport = canExportReports(session?.account.pharmacyRole, session?.account.permissions);
  const snapshot = SNAPSHOT_REPORTS.has(reportId);
  const today = kolkataDate(new Date());
  const [preset, setPreset] = useState<ReportPreset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const range = snapshot ? null : reportRange(preset, today, customFrom, customTo);
  const report = useReadReportQuery(
    { id: reportId, ...(range ?? {}) },
    { skip: !meta || (!snapshot && !range) },
  );
  const [exportReport, exported] = useLazyExportReportQuery();

  if (!meta) {
    return <Text className="text-[14px] text-muted">This report is not available.</Text>;
  }

  const body = report.data;
  const columns = body?.columns ?? [];
  const rows = body?.rows ?? [];

  return (
    <Box className="print-area mx-auto max-w-[1680px]">
      <Box className="mb-4 flex flex-wrap items-center gap-2.5 print:hidden">
        <Button variant="ghost" asChild>
          <Link to="/reports">← All reports</Link>
        </Button>
        {snapshot ? null : (
          <Box className="inline-flex max-w-full flex-wrap gap-0.5 rounded-sm border border-line bg-wash-2 p-0.5">
            {REPORT_PRESETS.map((item) => (
              <Button
                key={item.key}
                type="button"
                variant="ghost"
                aria-pressed={preset === item.key}
                className={cn(
                  "h-auto rounded-xs px-2.5 py-1.5 text-[12.5px]",
                  preset === item.key && "border-dark bg-dark text-white hover:bg-dark hover:text-white",
                )}
                onClick={() => setPreset(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}
        <Box className="flex-1" />
        {canExport ? (
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={!rows.length || exported.isFetching}
              onClick={() => void download()}
            >
              <IconDoc size={14} /> Excel
            </Button>
            <Button type="button" variant="ghost" disabled={!rows.length} onClick={() => window.print()}>
              <IconPrint size={16} /> PDF
            </Button>
          </>
        ) : null}
      </Box>
      {preset === "custom" && !snapshot ? (
        <Box className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
          <Input
            type="date"
            aria-label="From"
            value={customFrom}
            onChange={(event) => setCustomFrom(event.target.value)}
          />
          <Input
            type="date"
            aria-label="To"
            value={customTo}
            onChange={(event) => setCustomTo(event.target.value)}
          />
        </Box>
      ) : null}
      <Box className="mb-1.5 flex items-baseline gap-2.5">
        <Text className="font-display text-[20px] font-extrabold" as="h2">
          {meta.name}
        </Text>
        {body ? (
          <Text
            className="inline-flex items-center gap-1 rounded-full bg-wash px-[9px] py-[3px] text-[11px] font-bold whitespace-nowrap text-mid"
            as="span"
          >
            <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            {body.label}
          </Text>
        ) : null}
      </Box>
      <Text className="mb-3.5 text-[13px] text-muted">
        {meta.desc}
        {body ? ` · ${rows.length} rows` : ""}
      </Text>
      {report.isLoading ? <Text className="text-[13px] text-muted">Loading report…</Text> : null}
      {report.isError ? (
        <Text className="text-[13px] text-rose">{problemMessage(report.error, "Report could not be loaded.")}</Text>
      ) : null}
      {body ? (
        <Box className="flex flex-col rounded-md border border-line bg-paper shadow-sm">
          <Box className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-[13px]">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "sticky top-0 z-[1] border-b border-line bg-wash-2 px-3.5 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] whitespace-nowrap text-muted uppercase",
                        (column.money || column.num) && "text-right",
                      )}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="hover:bg-wash-2">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={columns[cellIndex]?.key ?? cellIndex}
                        className={cn(
                          "border-b border-line px-3.5 py-[11px] align-middle text-ink-2",
                          (columns[cellIndex]?.money || columns[cellIndex]?.num) &&
                            "text-right font-semibold text-ink tabular-nums",
                        )}
                      >
                        {reportCell(cell, columns[cellIndex]?.money === true)}
                      </td>
                    ))}
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)}>
                      <Box className="px-5 py-9 text-center text-muted">
                        <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-mid">
                          <IconChart size={30} />
                        </Box>
                        <Text>{body.note ?? "No data for this period."}</Text>
                      </Box>
                    </td>
                  </tr>
                ) : null}
              </tbody>
              {body.totals && rows.length > 0 ? (
                <tfoot>
                  <tr>
                    {body.totals.map((cell, index) => (
                      <td
                        key={columns[index]?.key ?? index}
                        className={cn(
                          "border-t-2 border-t-line-2 bg-wash-2 px-3.5 py-[11px] font-extrabold text-ink",
                          (columns[index]?.money || columns[index]?.num) && "text-right tabular-nums",
                        )}
                      >
                        {reportCell(cell as ReportCell, columns[index]?.money === true)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </Box>
        </Box>
      ) : null}
      {body?.note && rows.length > 0 ? (
        <Text className="mt-2.5 text-[12px] text-muted">ⓘ {body.note}</Text>
      ) : null}
    </Box>
  );

  async function download() {
    if (!range && !snapshot) return;
    const csv = await exportReport({ id: reportId, ...(range ?? {}) }).unwrap();
    downloadFile(`${reportId}.csv`, csv, "text/csv");
  }
}
