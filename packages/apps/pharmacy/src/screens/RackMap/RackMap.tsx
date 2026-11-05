import type { InvProduct } from "@/utils";
import { Box, Button, Input, Text } from "@/components/atoms";
import type { ChangeEvent } from "react";
import { RackMap } from "@/screens/RackMap/components/RackMap";
import { RackDetailModal } from "@/screens/RackMap/components/RackDetailModal";
import { MedicineDetailModal } from "@/screens/RackMap/components/MedicineDetailModal";
import { AssignLocations } from "@/screens/RackMap/components/AssignLocations";
import { LabelSheet } from "@/screens/RackMap/components/LabelSheet";
import { useState, useMemo } from "react";
import { usePharma } from "@/hooks";
import { hasLocation, groupByLocation, normalizeRack } from "@/utils";
import {
  IconSearch,
  IconInventory,
  IconPrint,
  IconReports,
  IconMap,
  IconPin,
  IconHelp,
} from "@/components/atoms";
import { unassignedProducts } from "./RackMap.utils";
import { exportRackAuditCsv } from "@/utils/calculations/stockExport";
type Tab = "map" | "assign";
export default function RackMapScreen() {
  const { inventory, racks, now, createRack, setProductLocation, bulkAssignLocation, toast } =
    usePharma();
  const [tab, setTab] = useState<Tab>("map");
  const [q, setQ] = useState("");
  const [labels, setLabels] = useState(false);
  const [openRack, setOpenRack] = useState<string | null>(null);
  const [medId, setMedId] = useState<string | null>(null);
  const unassigned = unassignedProducts(inventory, hasLocation);
  const groups = useMemo(() => groupByLocation(inventory, racks), [inventory, racks]);
  const zones = new Set(groups.map((g) => g.zone));
  const detail = openRack
    ? (groups.find((g) => g.code === openRack) ?? { code: openRack, zone: "", items: [] })
    : null;
  const med = medId ? (inventory.find((p) => p.id === medId) ?? null) : null;
  return (
    <Box className="!mx-auto !max-w-[1680px]">
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconInventory size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Racks created
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark max-[767px]:!text-[22px] !tabular-nums">
            {groups.length}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-[12px] leading-[1.5] text-muted">
            cupboards &amp; shelves
          </Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
            <IconMap size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Racks / zones
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark max-[767px]:!text-[22px] !tabular-nums">
            {zones.size}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-[12px] leading-[1.5] text-muted">
            in use
          </Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
            <IconPin size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            Medicines mapped
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark max-[767px]:!text-[22px] !tabular-nums">
            {inventory.length - unassigned.length}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-[12px] leading-[1.5] text-muted">
            with a location
          </Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-rose-bg !text-rose">
            <IconHelp size={18} />
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
            No location yet
          </Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark max-[767px]:!text-[22px] !tabular-nums">
            {unassigned.length}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-[12px] leading-[1.5] text-muted">
            need allocating
          </Box>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Box className="!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
          <Button
            className={
              tab === "map"
                ? "!h-auto !rounded-[6px] !border-0 !bg-paper !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-dark !shadow-sm hover:!bg-paper hover:!text-dark active:!translate-y-0"
                : "!h-auto !rounded-[6px] !border-0 !bg-transparent !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-muted !shadow-none hover:!bg-transparent hover:!text-muted active:!translate-y-0"
            }
            onClick={setTabOnClick}
          >
            <IconMap size={14} /> Rack map
          </Button>
          <Button
            className={
              tab === "assign"
                ? "!h-auto !rounded-[6px] !border-0 !bg-paper !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-dark !shadow-sm hover:!bg-paper hover:!text-dark active:!translate-y-0"
                : "!h-auto !rounded-[6px] !border-0 !bg-transparent !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-muted !shadow-none hover:!bg-transparent hover:!text-muted active:!translate-y-0"
            }
            onClick={setTabOnClick2}
          >
            <IconPin size={14} /> Assign locations
            {unassigned.length ? " · " + unassigned.length : ""}
          </Button>
        </Box>
        <Box className="!flex-1" />
        <Box className="flex max-w-[360px] min-w-[240px] flex-1 items-center gap-2 rounded-sm border border-line-2 bg-paper px-3 py-2 max-[767px]:min-w-0 max-[767px]:max-w-none max-[767px]:flex-[1_1_100%]">
          <Text className="!text-green" as="span">
            <IconSearch size={17} />
          </Text>
          <Input
            variant="plain"
            placeholder="Search medicine or rack code (e.g. A3-12)…"
            value={q}
            onChange={setQOnChange}
            className="!h-auto !px-0 !py-0 !text-[13.5px] placeholder:!text-faint"
          />
        </Box>
        <Button
          className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
          onClick={exportRackAuditCsvOnClick}
          disabled={!inventory.length}
        >
          <IconReports size={16} /> Audit Excel
        </Button>
        <Button
          className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
          onClick={setLabelsOnClick}
          disabled={!groups.length}
        >
          <IconPrint size={16} /> Print rack labels
        </Button>
      </Box>

      {tab === "map" ? (
        <RackMap
          groups={groups}
          q={q}
          unassigned={unassigned}
          onGoAssign={setTabOnGoAssign}
          createRack={createRackOnAction}
          onOpen={setOpenRackOnOpen}
          onMed={setMedIdOnMed}
        />
      ) : (
        <AssignLocations
          inventory={inventory}
          q={q}
          setProductLocation={setProductLocation}
          bulkAssignLocation={bulkAssignLocation}
          toast={toast}
        />
      )}

      {labels && <LabelSheet groups={groups} onClose={setLabelsOnClose} />}
      {detail && (
        <RackDetailModal
          code={detail.code}
          items={detail.items}
          inventory={inventory}
          onClose={setOpenRackOnClose}
          onMed={setMedIdOnMed2}
          onAdd={findOnAdd}
          onRemoveItem={toastOnRemoveItem}
          onDeleteRack={toastOnDeleteRack}
        />
      )}
      {med && <MedicineDetailModal p={med} now={now} onClose={setMedIdOnClose} />}
    </Box>
  );
  function setTabOnClick() {
    return setTab("map");
  }
  function setTabOnClick2() {
    return setTab("assign");
  }
  function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setQ(e.target.value);
  }
  function exportRackAuditCsvOnClick() {
    exportRackAuditCsv(inventory, now);
    toast("Rack & storage audit exported");
  }
  function setLabelsOnClick() {
    return setLabels(true);
  }
  function setTabOnGoAssign() {
    return setTab("assign");
  }
  async function createRackOnAction(c: string) {
    const result = await createRack(c);
    if (result === "added") {
      toast(`Rack ${normalizeRack(c)} created`);
      return true;
    }
    if (result === "exists") toast("That rack already exists");
    return false;
  }
  function setOpenRackOnOpen(c: string) {
    return setOpenRack(c);
  }
  function setMedIdOnMed(id: string) {
    return setMedId(id);
  }
  function setLabelsOnClose() {
    return setLabels(false);
  }
  function setOpenRackOnClose() {
    return setOpenRack(null);
  }
  function setMedIdOnMed2(id: string) {
    return setMedId(id);
  }
  async function findOnAdd(id: string) {
    if (!detail) return;
    const p = inventory.find(matchInventory);
    if (!(await setProductLocation(id, detail.code)))
      toast(`${p?.name ?? "Item"} → ${detail.code}`);
    function matchInventory(x: InvProduct) {
      return x.id === id;
    }
  }
  function toastOnRemoveItem() {
    toast("Records cannot be deleted");
  }
  function toastOnDeleteRack() {
    toast("Records cannot be deleted");
  }
  function setMedIdOnClose() {
    return setMedId(null);
  }
}
