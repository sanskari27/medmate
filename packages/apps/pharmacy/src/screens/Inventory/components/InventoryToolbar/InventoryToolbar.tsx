import { useRef, useState, type ChangeEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Stack } from "@/components/atoms/Stack";
import { IconDownload, IconPrint, IconSearch, IconTruck } from "@/components/atoms/Icon";
import { cn } from "@/utils/className";
import type { InventoryFilter } from "../../Inventory.utils";
import type { InventoryToolbarProps } from "./InventoryToolbar.types";

export function InventoryToolbar({
  filter,
  alertCount,
  unallocatedCount,
  searchQuery,
  canExport,
  onFilter,
  onSearch,
  onExcel,
  onPdf,
  onRackMap,
  onSample,
  onImportFile,
  onAddStock,
}: InventoryToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showMore, setShowMore] = useState(false);
  const filters: Array<{ key: InventoryFilter; label: string }> = [
    { key: "all", label: "All" },
    { key: "alerts", label: alertCount ? `Alerts · ${alertCount}` : "Alerts" },
    { key: "low", label: "Low stock" },
    { key: "expiring", label: "Expiring" },
    { key: "rx", label: "Rx-only" },
    { key: "out", label: "Out of stock" },
    { key: "noloc", label: unallocatedCount ? `Unallocated · ${unallocatedCount}` : "Unallocated" },
  ];

  function renderFilter(item: { key: InventoryFilter; label: string }) {
    return <FilterButton key={item.key} item={item} selected={filter === item.key} onFilter={onFilter} />;
  }
  function changeSearch(event: ChangeEvent<HTMLInputElement>) {
    onSearch(event.target.value);
  }
  function toggleMore() {
    setShowMore(function flip(open) {
      return !open;
    });
  }
  function openRacks() {
    setShowMore(false);
    onRackMap();
  }
  function downloadSample() {
    setShowMore(false);
    onSample();
  }
  function chooseFile() {
    setShowMore(false);
    fileRef.current?.click();
  }
  function changeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onImportFile(file);
    event.target.value = "";
  }

  return (
    <Stack direction="row" align="center" wrap className="mb-4 gap-2.5">
      <Box className="inline-flex max-w-full flex-wrap gap-0.5 rounded-sm border border-line bg-wash-2 p-0.5">
        {filters.map(renderFilter)}
      </Box>
      <Box className="min-w-4 flex-1" />
      <Stack
        direction="row"
        align="center"
        gap={2}
        className="h-10 max-w-[360px] min-w-[240px] flex-1 rounded-sm border border-line-2 bg-paper px-3 py-2"
      >
        <Box className="text-green">
          <IconSearch size={17} />
        </Box>
        <Input
          variant="plain"
          placeholder="Search by name, salt, brand…"
          value={searchQuery}
          onChange={changeSearch}
          className="px-[2px] py-px text-[13.5px]"
        />
      </Stack>
      <Button variant="ghost" size="sm" disabled={!canExport} title="Download this view as Excel (CSV)" onClick={onExcel}>
        <IconDownload size={15} /> Excel
      </Button>
      <Button variant="ghost" size="sm" disabled={!canExport} title="Download this view as PDF" onClick={onPdf}>
        <IconPrint size={15} /> PDF
      </Button>
      <Input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={changeFile} />
      <Box className="relative">
        <Button variant="ghost" size="sm" onClick={toggleMore}>
          More ▾
        </Button>
        {showMore ? (
          <Box className="absolute top-[110%] right-0 z-20 min-w-[210px] rounded-md border border-line bg-paper p-1.5 shadow-pop">
            <MenuItem label="Rack & Locations" onClick={openRacks} />
            <MenuItem label="Sample sheet" onClick={downloadSample} />
            <MenuItem label="Import medicines" onClick={chooseFile} />
          </Box>
        ) : null}
      </Box>
      <Button
        variant="primary"
        size="sm"
        title="Products are added by entering a distributor purchase bill"
        onClick={onAddStock}
      >
        <IconTruck size={16} /> Add stock via purchase
      </Button>
    </Stack>
  );
}

function FilterButton({
  item,
  selected,
  onFilter,
}: {
  item: { key: InventoryFilter; label: string };
  selected: boolean;
  onFilter: (filter: InventoryFilter) => void;
}) {
  function select() {
    onFilter(item.key);
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={select}
      className={cn(
        "h-auto border-0 px-[13px] py-1.5 text-[12.5px] shadow-none",
        selected ? "bg-paper text-dark shadow-sm" : "bg-transparent text-muted",
      )}
    >
      {item.label}
    </Button>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="h-auto w-full justify-start border-0 bg-transparent px-3 py-[9px] text-[13.5px] font-normal text-ink shadow-none hover:bg-wash-2"
    >
      {label}
    </Button>
  );
}
