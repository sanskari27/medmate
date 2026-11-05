import { useState, type ReactNode } from "react";
import { usePharma } from "@/hooks";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Stack } from "@/components/atoms/Stack";
import { IconPrint, IconReports } from "@/components/atoms/Icon";
import { Chip } from "@/components/molecules/Chip";
import { useDateRange } from "@/components/molecules";
import { inr, SALE_SOURCES, type PayMode, type PharmacyProfile, type SaleSource } from "@/utils";
import { cn } from "@/utils/className";
import type { RegisterPaid } from "./SalesRegister.types";
import {
  downloadBlob,
  filterRegister,
  registerBase,
  registerCsv,
  registerInsurers,
  registerPdfBlob,
  registerTotals,
  registerWards,
  sourceBreakdown,
} from "./SalesRegister.utils";
import { RegisterFilters } from "./components/RegisterFilters";
import { RegisterSummary } from "./components/RegisterSummary";
import { RegisterTable } from "./components/RegisterTable";
import { SourceCards } from "./components/SourceCards";

export default function SalesRegisterScreen() {
  const { sales, profile, now } = usePharma();
  const period = useDateRange(now, "last-365");
  const [source, setSource] = useState<"all" | SaleSource>("all");
  const [payMode, setPayMode] = useState<"all" | PayMode>("all");
  const [paid, setPaid] = useState<RegisterPaid>("all");
  const [insurer, setInsurer] = useState("all");
  const [ward, setWard] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const base = registerBase(sales, period.inWindow);
  const rows = filterRegister(base, { source, payMode, paid, insurer, ward, searchQuery });
  const totals = registerTotals(rows);

  function chooseSource(next: SaleSource) {
    setSource(source === next ? "all" : next);
  }
  function pickSource(next: SaleSource) {
    setSource(next);
  }
  function showAllSources() {
    setSource("all");
  }
  function exportCsv() {
    downloadBlob(
      new Blob(["\uFEFF" + registerCsv(rows)], { type: "text/csv;charset=utf-8;" }),
      "hospital-sales-register.csv",
    );
  }
  function exportPdf() {
    downloadBlob(
      registerPdfBlob(rows, totals, period.label, source, profile as PharmacyProfile, now),
      "hospital-sales-register.pdf",
    );
  }
  function renderSource(item: (typeof SALE_SOURCES)[number]) {
    return (
      <SourceChip
        key={item.key}
        source={item}
        selected={source === item.key}
        onSelect={pickSource}
      />
    );
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <SourceCards cards={sourceBreakdown(base)} selected={source} onSelect={chooseSource} />
      <Stack direction="row" align="center" wrap className="mb-4 gap-2.5">
        {period.node as ReactNode}
        <Stack direction="row" align="center" wrap className="gap-1.5">
          <Chip
            selected={source === "all"}
            className={cn(source === "all" && "border-dark bg-dark text-white hover:bg-dark")}
            onClick={showAllSources}
          >
            All sources
          </Chip>
          {SALE_SOURCES.map(renderSource)}
        </Stack>
        <Box className="flex-1" />
        <Button variant="ghost" onClick={exportCsv}>
          <IconReports size={15} /> Excel
        </Button>
        <Button variant="ghost" onClick={exportPdf}>
          <IconPrint size={15} /> PDF
        </Button>
      </Stack>
      <RegisterFilters
        payMode={payMode}
        paid={paid}
        insurer={insurer}
        ward={ward}
        insurers={registerInsurers(base)}
        wards={registerWards(base)}
        searchQuery={searchQuery}
        onPayMode={setPayMode}
        onPaid={setPaid}
        onInsurer={setInsurer}
        onWard={setWard}
        onSearch={setSearchQuery}
      />
      <RegisterSummary
        count={rows.length}
        revenue={inr(totals.revenue)}
        paid={inr(totals.paid)}
        unpaid={inr(totals.unpaid)}
        insurance={inr(totals.insurance)}
      />
      <RegisterTable rows={rows} revenue={inr(totals.revenue)} />
    </Box>
  );
}

function SourceChip({
  source,
  selected,
  onSelect,
}: {
  source: (typeof SALE_SOURCES)[number];
  selected: boolean;
  onSelect: (source: SaleSource) => void;
}) {
  function select() {
    onSelect(source.key);
  }
  return (
    <Chip
      selected={selected}
      className={cn(selected && "border-dark bg-dark text-white hover:bg-dark")}
      onClick={select}
    >
      {source.short}
    </Chip>
  );
}
