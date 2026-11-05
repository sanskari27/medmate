import type { ReportDetailProps } from "./ReportDetail.types";
import type { RCol } from "@/utils";
import { Box, Button, Heading, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { TableFooter } from "@/components/molecules/DataTable";
import { cn } from "@/utils/className";
import { useMemo } from "react";
import { usePharma } from "@/hooks";
import { inr } from "@/utils";
import { IconPrint, IconDownload, IconChart } from "@/components/Icon";
import { usePeriod } from "@/components/PeriodFilter";
import { runReport, ReportResult, reportById } from "@/utils/calculations/reportCatalog";
import { exportCatalogCsv, exportCatalogPdf } from "@/utils/calculations/reportExport";
export function ReportDetail({ id, onBack }: ReportDetailProps) {
    const { sales, purchases, inventory, expenses, now, profile } = usePharma();
    const meta = reportById(id);
    const period = usePeriod(now, "month");
    const res: ReportResult = useMemo(() => runReport(id, {
        sales,
        purchases,
        inventory,
        expenses,
        profile,
        now,
        range: { from: period.start, to: period.end, label: period.label },
    }), [
        id,
        sales,
        purchases,
        inventory,
        expenses,
        profile,
        now,
        period.start,
        period.end,
        period.label,
    ]);
    const range = { from: period.start, to: period.end, label: period.label };
    const fmt = (v: string | number | undefined, money?: boolean) => typeof v === "number" ? (money ? inr(v) : v.toLocaleString("en-IN")) : (v ?? "");
    return (<Box className="!mx-auto !max-w-[1680px] print-area">
      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5 print:hidden">
        <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onBack}>
          ← All reports
        </Button>
        <Box className="!flex-1"/>
        {period.node}
        <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" disabled={!res.rows.length} onClick={exportCatalogCsvOnClick}>
          <IconDownload size={14}/> Excel
        </Button>
        <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" disabled={!res.rows.length} onClick={exportCatalogPdfOnClick}>
          <IconPrint size={16}/> PDF
        </Button>
      </Box>

      <Box className={cn("!flex !items-center !gap-2.5", "!items-baseline !gap-2.5 !mb-1.5")}>
        <Heading className={cn("!font-display !font-extrabold !text-[20px]")} level={2}>{meta?.name ?? id}</Heading>
        <Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid" as="span">
          <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          {period.label}
        </Text>
      </Box>
      {meta?.desc && (<Text className={cn("!text-muted", "!text-[13px] !mb-3.5")}>
          {meta.desc} · {res.rows.length} rows
        </Text>)}

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
            <TableHead>
              <TableRow>
                {res.columns.map(renderColumn)}
              </TableRow>
            </TableHead>
            <TableBody>
              {res.rows.map(renderRow)}
              {res.rows.length === 0 && (<TableRow>
                  <TableCell colSpan={res.columns.length}>
                    <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconChart size={30}/>
                      </Box>
                      <Text>{res.note ?? "No data for this period."}</Text>
                    </Box>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
          {res.totals && res.rows.length > 0 && (
            <TableFooter className="flex flex-wrap items-center justify-between gap-3">
              {res.totals.map(renderTotal)}
            </TableFooter>
          )}
        </Box>
      </Box>
      {res.note && res.rows.length > 0 && (<Text className={cn("!text-muted", "!text-[12px] !mt-2.5")}>
          ⓘ {res.note}
        </Text>)}
    </Box>);
    function exportCatalogCsvOnClick() {
        return exportCatalogCsv(meta?.name ?? id, res, range, now);
    }
    function exportCatalogPdfOnClick() {
        return exportCatalogPdf(meta?.name ?? id, res, profile, range, now);
    }
    function renderColumn(c: RCol) {
        return (<TableHeaderCell key={c.key} className={c.money || c.num ? "text-right tabular-nums font-semibold text-ink" : ""}>
                    {c.label}
                  </TableHeaderCell>);
    }
    function renderRow(row: (string | number)[], ri: number) {
        return (<TableRow key={ri}>
                  {row.map(renderRow2)}
                </TableRow>);
        function renderRow2(cellv: string | number, ci: number) {
            const c = res.columns[ci];
            const isSection = typeof cellv === "string" && row[ci + 1] === "" && ci === 0;
            return (<TableCell key={ci} className={cn(c.money || c.num ? "text-right tabular-nums font-semibold text-ink" : "", isSection ? "font-extrabold text-dark" : "")}>
                        {fmt(cellv, c.money)}
                      </TableCell>);
        }
    }
    function renderTotal(t: string | number, ti: number) {
        const money = res.columns[ti]?.money || res.columns[ti]?.num;
        return (<Text key={ti} as="span" className={money ? "tabular-nums" : ""}>
                      {fmt(t, res.columns[ti]?.money)}
                    </Text>);
    }
}
