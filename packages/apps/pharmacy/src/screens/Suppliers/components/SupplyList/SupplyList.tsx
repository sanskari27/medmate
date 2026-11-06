import type { Supplier } from "@/utils";
import {
  Box,
  Button,
  Heading,
  IconButton,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import {
  ChevronSelect,
  dataTableClass,
  numClass,
  statCardClass,
  statIconClass,
  statLabelClass,
  statSplitClass,
  statValueClass,
  tableLastRowClass,
  toolbarControlClass,
} from "@/screens/Purchases/purchaseChrome";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { useAppSelector, useConfirmedDispatch } from "@/hooks";
import { addSupply, setPreferredSupply, updateSupply } from "@/store/thunks/purchases.thunk";
import {
  SupplyEntry,
  inr2,
  bestSupplyFor,
  effectiveSupplyPrice,
  schemeLabel,
  isDevice,
  mrpOf,
  catLabel,
} from "@/utils";
import { IconPlus, IconEdit, IconReceipt, IconRefresh, IconStar } from "@/components/atoms";
import { Thumb } from "@/components/molecules";
import { multiSourceCount } from "@/screens/Purchases/utils/multiSourceCount";
import { SupplyModal } from "@/screens/Purchases/components/SupplyModal";
export function SupplyList() {
  const confirm = useConfirmedDispatch();
  const supplyList = useAppSelector((state) => state.purchases.supplyList);
  const suppliers = useAppSelector((state) => state.purchases.suppliers);
  const inventory = useAppSelector((state) => state.inventory.inventory);
  const [edit, setEdit] = useState<SupplyEntry | null>(null);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [supFilter, setSupFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "medicine" | "device">("all");
  const prodOf = (id: string) => inventory.find((p) => p.id === id);
  const supOf = (id: string) => suppliers.find((s) => s.id === id);
  const rows = supplyList
    .filter((e) => {
      const p = prodOf(e.productId);
      if (!p) return false;
      if (supFilter !== "all" && e.supplierId !== supFilter) return false;
      if (typeFilter === "device" && !isDevice(p)) return false;
      if (typeFilter === "medicine" && isDevice(p)) return false;
      if (searchQuery.trim()) {
        const t = searchQuery.toLowerCase();
        if (
          ![p.name, p.composition, p.manufacturer, supOf(e.supplierId)?.name]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(t))
        )
          return false;
      }
      return true;
    })
    .sort((left, right) =>
      prodOf(left.productId)!.name.localeCompare(prodOf(right.productId)!.name),
    );
  const deviceCount = supplyList.filter((e) => {
    const p = prodOf(e.productId);
    return p && isDevice(p);
  }).length;
  return (
    <>
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-blue-bg !text-blue")}>
            <IconReceipt size={18} />
          </Box>
          <Box className={statLabelClass}>Supply items</Box>
          <Box className={statValueClass}>{supplyList.length}</Box>
          <Box className={statSplitClass}>
            {supplyList.length - deviceCount} medicines · {deviceCount} devices
          </Box>
        </Box>
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-wash !text-mid")}>
            <IconRefresh size={18} />
          </Box>
          <Box className={statLabelClass}>Multi-source items</Box>
          <Box className={statValueClass}>{multiSourceCount(supplyList)}</Box>
          <Box className={statSplitClass}>supplied by 2+ distributors</Box>
        </Box>
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-amber-bg !text-gold-d")}>
            <IconStar size={18} />
          </Box>
          <Box className={statLabelClass}>Preferred set</Box>
          <Box className={statValueClass}>{supplyList.filter(matchSupplyList).length}</Box>
          <Box className={statSplitClass}>marked best source</Box>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Heading className={cn("!text-[16px]")} level={2}>
          Medicines & devices by distributor
        </Heading>
        <Box className="!flex-1" />
        <ChevronSelect
          value={typeFilter}
          onChange={setTypeFilterOnChange}
          className={cn(toolbarControlClass, "!max-w-[140px]")}
          options={[
            { value: "all", label: "All types" },
            { value: "medicine", label: "Medicines" },
            { value: "device", label: "Devices" },
          ]}
        />
        <ChevronSelect
          value={supFilter}
          onChange={setSupFilterOnChange}
          className={cn(toolbarControlClass, "!max-w-[200px]")}
          options={[{ value: "all", label: "All distributors" }, ...suppliers.map(renderSupplier)]}
        />
        <Input
          placeholder="Search medicine / device…"
          value={searchQuery}
          onChange={setSearchQueryOnChange}
          className={cn(toolbarControlClass, "!max-w-[220px]")}
        />
        <Button onClick={setAddingOnClick}>
          <IconPlus size={16} /> Add supply item
        </Button>
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className={cn(dataTableClass, tableLastRowClass)}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Medicine / device</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Distributor</TableHeaderCell>
                <TableHeaderCell className={numClass}>Purchase ₹</TableHeaderCell>
                <TableHeaderCell className={numClass}>MRP ₹</TableHeaderCell>
                <TableHeaderCell className={numClass}>Margin</TableHeaderCell>
                <TableHeaderCell className={numClass}>Price rank</TableHeaderCell>
                <TableHeaderCell></TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(renderRow)}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box className="!p-7 !text-center !text-muted">
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconReceipt size={30} />
                      </Box>
                      <Text className="!text-[13px] !text-muted">
                        No supply items match. Add what you purchase from each distributor.
                      </Text>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {(adding || edit) && (
        <SupplyModal
          init={edit ?? undefined}
          onClose={setAddingOnClose}
          onSave={updateSupplyOnSave}
        />
      )}
    </>
  );
  function matchSupplyList(e: SupplyEntry) {
    return e.preferred;
  }
  function setTypeFilterOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setTypeFilter(e.target.value as typeof typeFilter);
  }
  function setSupFilterOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setSupFilter(e.target.value);
  }
  function renderSupplier(s: Supplier) {
    return { value: String(s.id), label: String(s.name) };
  }
  function setSearchQueryOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setSearchQuery(e.target.value);
  }
  function setAddingOnClick() {
    return setAdding(true);
  }
  function renderRow(e: SupplyEntry) {
    const p = prodOf(e.productId)!;
    const sup = supOf(e.supplierId);
    const best = bestSupplyFor(e.productId, supplyList);
    const isCheapest = best?.id === e.id;
    const sources = supplyList.filter(matchSupplyList2).length;
    const mrp = e.mrp ?? mrpOf(p);
    const eff = effectiveSupplyPrice(e);
    const bestEff = best ? effectiveSupplyPrice(best) : eff;
    const margin = mrp > 0 ? ((mrp - eff) / mrp) * 100 : 0;
    return (
      <TableRow key={e.id}>
        <TableCell>
          <Box className="flex items-center gap-2.5">
            <Text
              className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-[17px] font-display font-bold leading-none text-mid"
              as="span"
            >
              <Thumb p={p} />
            </Text>
            <Text as="span">
              <Text className="!text-[13px] !font-bold !text-ink" as="span">
                {p.name}{" "}
                {e.preferred && (
                  <Text title="Preferred source" as="span">
                    <IconStar size={13} />
                  </Text>
                )}
              </Text>
              <Box className="text-[11.5px] text-muted">
                {p.composition} · {p.pack}
              </Box>
            </Text>
          </Box>
        </TableCell>
        <TableCell>
          <Text
            className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${isDevice(p) ? "!bg-teal-bg !text-teal" : "!bg-gray-pill !text-muted"}`}
            as="span"
          >
            {isDevice(p) ? "Device" : "Medicine"}
          </Text>
          <Box className={cn("text-[12.5px] text-muted !text-muted", "!text-[11px]")}>
            {catLabel(p.category)}
          </Box>
        </TableCell>
        <TableCell className={cn("!font-semibold")}>
          {sup?.name ?? "—"}
          {e.note && (
            <Box className={cn("text-[12.5px] text-muted !text-muted", "!text-[11px]")}>
              {e.note}
            </Box>
          )}
        </TableCell>
        <TableCell className={cn(numClass, "!font-bold")}>
          {inr2(e.purchasePrice)}
          {schemeLabel(e) && (
            <Box className="!text-[11px] !font-bold !text-[#1f7a46]">
              {schemeLabel(e)} → {inr2(eff)}
            </Box>
          )}
        </TableCell>
        <TableCell className={numClass}>{inr2(mrp)}</TableCell>
        <TableCell className={numClass}>
          <Text
            className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${margin >= 30 ? "!bg-wash !text-mid" : margin >= 15 ? "!bg-amber-bg !text-gold-d" : "!bg-rose-bg !text-rose"}`}
            as="span"
          >
            {margin.toFixed(0)}%
          </Text>
        </TableCell>
        <TableCell className={numClass}>
          {sources > 1 ? (
            isCheapest ? (
              <Text
                className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid"
                as="span"
              >
                <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                Lowest
              </Text>
            ) : (
              <Text className={cn("!text-muted", "!text-[11.5px]")} as="span">
                +{inr2(eff - bestEff)}
              </Text>
            )
          ) : (
            <Text className={cn("!text-muted", "!text-[11.5px]")} as="span">
              only source
            </Text>
          )}
        </TableCell>
        <TableCell className={numClass}>
          <Box className="!flex !items-center !justify-end !gap-1.5">
            {!e.preferred && (
              <Button
                variant="ghost"
                size="sm"
                title="Mark preferred source"
                onClick={setPreferredSupplyOnClick}
              >
                <IconStar size={14} />
              </Button>
            )}
            <IconButton label="Edit" title="Edit" onClick={setEditOnClick}>
              <IconEdit size={15} />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    );
    function matchSupplyList2(x: SupplyEntry) {
      return x.productId === e.productId;
    }
    function setPreferredSupplyOnClick() {
      void confirm(setPreferredSupply(e.id));
    }
    function setEditOnClick() {
      return setEdit(e);
    }
  }
  function setAddingOnClose() {
    setAdding(false);
    setEdit(null);
  }
  async function updateSupplyOnSave(data: Omit<SupplyEntry, "id">) {
    const result = edit
      ? await confirm(updateSupply({ id: edit.id, patch: data }), { kind: "edit" })
      : await confirm(addSupply(data));
    if ("data" in result) {
      setAdding(false);
      setEdit(null);
    }
  }
}
