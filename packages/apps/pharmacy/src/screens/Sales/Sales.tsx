import { useState, type ReactNode } from "react";
import { usePharma } from "@/hooks";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { IconDownload, IconPrint } from "@/components/atoms/Icon";
import { useDateRange } from "@/components/molecules";
import { ShareSheet } from "@/components/organisms";
import { OrderDetail, matchRx } from "@/screens/Orders";
import {
  inr,
  type Channel,
  type OrderStatus,
  type PayMode,
  type PharmacyProfile,
  type Prescription,
  type Sale,
} from "@/utils";
import type { PaidFilter, SalesSortKey } from "./Sales.types";
import {
  downloadBlob,
  nextSalesSort,
  salesCsv,
  salesFileSlug,
  salesPdfBlob,
  selectSales,
  summarizeSales,
} from "./Sales.utils";
import { SalesFilters } from "./components/SalesFilters";
import { SalesSummary } from "./components/SalesSummary";
import { SalesTable } from "./components/SalesTable";

export default function SalesScreen() {
  const { sales, prescriptions, profile, advanceOrder, cancelOrder, markPaid, now, go } =
    usePharma();
  const period = useDateRange(now, "last-365");
  const [searchQuery, setSearchQuery] = useState("");
  const [channel, setChannel] = useState<"all" | Channel>("all");
  const [payMode, setPayMode] = useState<"all" | PayMode>("all");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [paid, setPaid] = useState<PaidFilter>("all");
  const [sort, setSort] = useState<SalesSortKey>("date");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [view, setView] = useState<Sale | null>(null);
  const [viewTab, setViewTab] = useState<"history" | "invoice">("history");
  const [shareSale, setShareSale] = useState<Sale | null>(null);

  const rows = selectSales(
    sales,
    { channel, payMode, status, paid, searchQuery, sort, direction },
    period.inWindow,
  );
  const summary = summarizeSales(rows);
  const current = view
    ? (sales.find(function same(sale) {
        return sale.id === view.id;
      }) ?? view)
    : null;

  function toggleSort(key: SalesSortKey) {
    const next = nextSalesSort(sort, direction, key);
    setSort(next.sort);
    setDirection(next.direction);
  }
  function openSale(sale: Sale, tab: "history" | "invoice") {
    setViewTab(tab);
    setView(sale);
  }
  function closeView() {
    setView(null);
  }
  function share(sale: Sale) {
    setShareSale(sale);
  }
  function closeShare() {
    setShareSale(null);
  }
  function shareCurrent() {
    if (view) setShareSale(view);
  }
  function advanceCurrent() {
    if (view) advanceOrder(view.id);
  }
  function cancelCurrent() {
    if (view) cancelOrder(view.id);
  }
  function markCurrentPaid(mode: PayMode) {
    if (view) markPaid(view.id, mode);
  }
  function markRowPaid(id: string, mode: PayMode) {
    markPaid(id, mode);
  }
  function openPrescriptions() {
    setView(null);
    go("prescriptions");
  }
  function exportCsv() {
    downloadBlob(
      new Blob(["\uFEFF" + salesCsv(rows)], { type: "text/csv;charset=utf-8;" }),
      `sales-${salesFileSlug(period.label)}.csv`,
    );
  }
  function exportPdf() {
    downloadBlob(
      salesPdfBlob(rows, summary, period.label, profile as PharmacyProfile),
      `sales-report-${salesFileSlug(period.label)}.pdf`,
    );
  }

  function linked(rx: Prescription) {
    return rx.id === current?.rxId;
  }
  function sameSale(sale: Sale) {
    return sale.id === shareSale?.id;
  }
  return (
    <Box className="mx-auto max-w-[1680px]">
      <Stack direction="row" align="center" wrap className="mb-4 gap-2.5">
        <Box>
          <Heading level={2} className="text-[16px]">
            All sales
          </Heading>
          <Text as="span" variant="caption" className="text-[12.5px] leading-[1.5]">
            Every sale from day one to date — counter & online
          </Text>
        </Box>
        <Box className="flex-1" />
        {period.node as ReactNode}
        <Button
          variant="ghost"
          className="!leading-[1.5] active:translate-y-px"
          onClick={exportCsv}
        >
          <IconDownload size={14} /> Excel
        </Button>
        <Button
          variant="ghost"
          className="!leading-[1.5] active:translate-y-px"
          onClick={exportPdf}
        >
          <IconPrint size={15} /> PDF
        </Button>
      </Stack>
      <SalesSummary
        periodLabel={period.label}
        bills={rows.length}
        units={summary.units}
        gross={inr(summary.gross)}
        tax={inr(summary.tax)}
        net={inr(summary.net)}
      />
      <SalesFilters
        searchQuery={searchQuery}
        channel={channel}
        payMode={payMode}
        status={status}
        paid={paid}
        onSearch={setSearchQuery}
        onChannel={setChannel}
        onPayMode={setPayMode}
        onStatus={setStatus}
        onPaid={setPaid}
      />
      <SalesTable
        rows={rows}
        sort={sort}
        direction={direction}
        now={now}
        tax={inr(summary.tax)}
        net={inr(summary.net)}
        units={summary.units}
        onSort={toggleSort}
        onOpen={openSale}
        onMarkPaid={markRowPaid}
        onShare={share}
      />
      {current ? (
        <OrderDetail
          key={current.id + viewTab}
          initialTab={viewTab}
          sale={current}
          rx={prescriptions.find(linked) ?? matchRx(prescriptions, current)}
          profile={profile}
          onClose={closeView}
          onAdvance={advanceCurrent}
          onCancel={cancelCurrent}
          onMarkPaid={markCurrentPaid}
          onShare={shareCurrent}
          onOpenRx={openPrescriptions}
          now={now}
        />
      ) : null}
      {shareSale ? (
        <ShareSheet
          sale={sales.find(sameSale) ?? shareSale}
          profile={profile}
          onClose={closeShare}
        />
      ) : null}
    </Box>
  );
}
