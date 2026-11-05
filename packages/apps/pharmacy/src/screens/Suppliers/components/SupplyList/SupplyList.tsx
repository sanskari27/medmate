import type { Supplier } from "@/utils";
import { Box, Button, Heading, Input, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { SupplyEntry, inr2, bestSupplyFor, effectiveSupplyPrice, schemeLabel, isDevice, mrpOf, catLabel, } from "@/utils";
import { IconPlus, IconEdit, IconReceipt, IconRefresh, IconStar } from "@/components/Icon";
import { Thumb } from "@/components/Thumb";
import { multiSourceCount } from "@/screens/Purchases/utils/multiSourceCount";
import { SupplyModal } from "@/screens/Purchases/components/SupplyModal";
export function SupplyList() {
    const { supplyList, suppliers, inventory, addSupply, updateSupply, setPreferredSupply } = usePharma();
    const [edit, setEdit] = useState<SupplyEntry | null>(null);
    const [adding, setAdding] = useState(false);
    const [q, setQ] = useState("");
    const [supFilter, setSupFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState<"all" | "medicine" | "device">("all");
    const prodOf = (id: string) => inventory.find((p) => p.id === id);
    const supOf = (id: string) => suppliers.find((s) => s.id === id);
    const rows = supplyList
        .filter((e) => {
        const p = prodOf(e.productId);
        if (!p)
            return false;
        if (supFilter !== "all" && e.supplierId !== supFilter)
            return false;
        if (typeFilter === "device" && !isDevice(p))
            return false;
        if (typeFilter === "medicine" && isDevice(p))
            return false;
        if (q.trim()) {
            const t = q.toLowerCase();
            if (![p.name, p.composition, p.manufacturer, supOf(e.supplierId)?.name]
                .filter(Boolean)
                .some((v) => v!.toLowerCase().includes(t)))
                return false;
        }
        return true;
    })
        .sort((a, b) => prodOf(a.productId)!.name.localeCompare(prodOf(b.productId)!.name));
    const deviceCount = supplyList.filter((e) => {
        const p = prodOf(e.productId);
        return p && isDevice(p);
    }).length;
    return (<>
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
            <IconReceipt size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Supply items</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{supplyList.length}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            {supplyList.length - deviceCount} medicines · {deviceCount} devices
          </Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconRefresh size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Multi-source items</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{multiSourceCount(supplyList)}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">supplied by 2+ distributors</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
            <IconStar size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Preferred set</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{supplyList.filter(matchSupplyList).length}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">marked best source</Box>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Heading className={cn("!text-[16px]")} level={2}>Medicines & devices by distributor</Heading>
        <Box className="!flex-1"/>
        <Select value={typeFilter} onChange={setTypeFilterOnChange} className={cn("", "!max-w-[140px]")} options={[{ value: "all", label: "All types" }, { value: "medicine", label: "Medicines" }, { value: "device", label: "Devices" }]} />
        <Select value={supFilter} onChange={setSupFilterOnChange} className={cn("", "!max-w-[200px]")} options={[{ value: "all", label: "All distributors" }, ...suppliers.map(renderSupplier)]} />
        <Input placeholder="Search medicine / device…" value={q} onChange={setQOnChange} className={cn("", "!max-w-[220px]")}/>
        <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={setAddingOnClick}>
          <IconPlus size={16}/> Add supply item
        </Button>
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Medicine / device</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Distributor</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Purchase ₹</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">MRP ₹</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Margin</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Price rank</TableHeaderCell>
                <TableHeaderCell></TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(renderRow)}
              {rows.length === 0 && (<TableRow>
                  <TableCell colSpan={8}>
                    <Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink", "!p-7")}>
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconReceipt size={30}/>
                      </Box>
                      <Text>No supply items match. Add what you purchase from each distributor.</Text>
                    </Box>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {(adding || edit) && (<SupplyModal init={edit ?? undefined} onClose={setAddingOnClose} onSave={updateSupplyOnSave}/>)}
    </>);
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
    function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setQ(e.target.value);
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
        return (<TableRow key={e.id}>
                    <TableCell>
                      <Box className="flex items-center gap-2.5">
                        <Text className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-[17px] font-display font-bold leading-none text-mid" as="span">
                          <Thumb p={p}/>
                        </Text>
                        <Text as="span">
                          <Text className="!font-bold !text-ink" as="span">
                            {p.name}{" "}
                            {e.preferred && (<Text title="Preferred source" as="span">
                                <IconStar size={13}/>
                              </Text>)}
                          </Text>
                          <Box className="text-[11.5px] text-muted">
                            {p.composition} · {p.pack}
                          </Box>
                        </Text>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${isDevice(p) ?"!bg-teal-bg !text-teal" :"!bg-gray-pill !text-muted"}`} as="span">
                        {isDevice(p) ? "Device" : "Medicine"}
                      </Text>
                      <Box className={cn("text-[12.5px] text-muted !text-muted", "!text-[11px]")}>
                        {catLabel(p.category)}
                      </Box>
                    </TableCell>
                    <TableCell className={cn("!font-semibold")}>
                      {sup?.name ?? "—"}
                      {e.note && (<Box className={cn("text-[12.5px] text-muted !text-muted", "!text-[11px]")}>
                          {e.note}
                        </Box>)}
                    </TableCell>
                    <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-bold")}>
                      {inr2(e.purchasePrice)}
                      {schemeLabel(e) && (<Box className={cn("text-[12.5px] text-muted", "!text-[11px] !text-primary !font-bold")}>
                          {schemeLabel(e)} → {inr2(eff)}
                        </Box>)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-ink !text-muted">{inr2(mrp)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-ink">
                      <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${margin >= 30 ?"!bg-wash !text-mid" : margin >= 15 ?"!bg-amber-bg !text-gold-d" :"!bg-rose-bg !text-rose"}`} as="span">
                        {margin.toFixed(0)}%
                      </Text>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-ink">
                      {sources > 1 ? (isCheapest ? (<Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid" as="span">
                            <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                            Lowest
                          </Text>) : (<Text className={cn("!text-muted", "!text-[11.5px]")} as="span">
                            +{inr2(eff - bestEff)}
                          </Text>)) : (<Text className={cn("!text-muted", "!text-[11.5px]")} as="span">
                          only source
                        </Text>)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-ink">
                      <Box className={cn("!flex !items-center !gap-1.5", "!justify-end")}>
                        {!e.preferred && (<Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" title="Mark preferred source" onClick={setPreferredSupplyOnClick}>
                            <IconStar size={14}/>
                          </Button>)}
                        <Button className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid" title="Edit" onClick={setEditOnClick}>
                          <IconEdit size={15}/>
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>);
        function matchSupplyList2(x: SupplyEntry) {
            return x.productId === e.productId;
        }
        function setPreferredSupplyOnClick() {
            return setPreferredSupply(e.id);
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
        const err = edit ? await updateSupply(edit.id, data) : await addSupply(data);
        if (!err) {
            setAdding(false);
            setEdit(null);
        }
    }
}
