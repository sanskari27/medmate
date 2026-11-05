import type { InvProduct, PurchaseOrder, Supplier } from "@/utils";
import { Box, Button, Heading, Input, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { usePharma } from "@/hooks";
import { isLowStock, stockOf, suggestedSupplierId, bestSupplyFor, effectiveSupplyPrice, schemeLabel, suggestedReorderQty, POItem, timeAgo, inr2, } from "@/utils";
import { IconSend, IconTruck, IconCheck, IconTrendDown, IconCash, IconBulb, IconDownload, IconUpload, } from "@/components/Icon";
import { downloadPoTemplate, parsePoCsv } from "@/utils/purchases";
import { Thumb } from "@/components/Thumb";
import { lowStockProducts } from "./Reorder.utils";
export default function ReorderScreen() {
    const { inventory, suppliers, supplyList, purchaseOrders, sendPurchaseOrder, importPurchaseOrders, markPOReceived, setProductSupplier, now, go, showFault, toast, } = usePharma();
    const poFile = useRef<HTMLInputElement>(null);
    const [qtys, setQtys] = useState<Record<string, number>>({});
    const low = lowStockProducts(inventory, isLowStock);
    const qtyFor = (id: string) => qtys[id] ?? suggestedReorderQty(inventory.find((p) => p.id === id)!);
    // supply rows for a product
    const rowsFor = (pid: string) => supplyList.filter((e) => e.productId === pid);
    const entryFor = (pid: string, sid: string) => supplyList.find((e) => e.productId === pid && e.supplierId === sid);
    // group low-stock items by SUGGESTED distributor (cheapest landed price, after bonus)
    const groups = suppliers
        .map((s) => ({
        supplier: s,
        items: low.filter((p) => suggestedSupplierId(p, suppliers, supplyList) === s.id),
    }))
        .filter((g) => g.items.length > 0);
    // estimated savings: buying each multi-source item from its cheapest source vs its priciest
    const estSavings = low.reduce((sum, p) => {
        const rows = rowsFor(p.id);
        if (rows.length < 2)
            return sum;
        const effs = rows.map(effectiveSupplyPrice);
        return sum + (Math.max(...effs) - Math.min(...effs)) * qtyFor(p.id);
    }, 0);
    const send = (supplierId: string, supplierName: string, items: typeof low) => {
        const poItems: POItem[] = items
            .map((p) => ({ productId: p.id, name: p.name, qty: qtyFor(p.id) }))
            .filter((x) => x.qty > 0);
        sendPurchaseOrder(supplierId, supplierName, poItems);
        setQtys((q) => {
            const n = { ...q };
            items.forEach((p) => delete n[p.id]);
            return n;
        });
    };
    return (<Box className="!mx-auto !max-w-[1680px]">
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-rose-bg !text-rose">
            <IconTrendDown size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Items below reorder level</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{low.length}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">need ordering</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
            <IconTruck size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Distributors to order from</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{groups.length}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">best price each</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconCash size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Est. savings (best price)</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inr2(estSavings)}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">vs priciest source · this order</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
            <IconSend size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Open purchase orders</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{purchaseOrders.filter(matchPurchaseOrder).length}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">sent, awaiting</Box>
        </Box>
      </Box>

      {low.length === 0 ? (<Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
          <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
            <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
              <IconCheck size={30}/>
            </Box>
            <Heading level={3}>Everything well stocked</Heading>
            <Text>No products are below their reorder level right now.</Text>
          </Box>
        </Box>) : (<Box className="!mb-4">
          <Box className="!mb-2 !flex !items-center !justify-between">
            <Heading level={2}>Suggested orders by distributor</Heading>
            <Text className="text-[12.5px] text-muted" as="span">
              grouped under the <Text as="span" className="font-bold">cheapest landed price</Text> (after bonus / free-goods schemes) —
              adjust the distributor or quantity anytime
            </Text>
          </Box>
          {groups.map(renderGroup)}
        </Box>)}

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
          <Heading level={3}>Purchase orders</Heading>
          <Text className="text-[12.5px] text-muted" as="span">sent to distributors</Text>
          <Box className="!flex-1"/>
          <Input ref={poFile} type="file" accept=".csv,text/csv" hidden onChange={parsePoCsvOnChange}/>
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={downloadPoTemplate}>
            <IconDownload size={14}/> Sample sheet
          </Button>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={clickOnClick}>
            <IconUpload size={14}/> Import
          </Button>
        </Box>
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>PO no.</TableHeaderCell>
                <TableHeaderCell>Distributor</TableHeaderCell>
                <TableHeaderCell>Items</TableHeaderCell>
                <TableHeaderCell>Sent</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell></TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrders.map(renderPurchaseOrder)}
              {purchaseOrders.length === 0 && (<TableRow>
                  <TableCell colSpan={6}>
                    <Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink", "!p-6")}>
                      <Text>No purchase orders yet.</Text>
                    </Box>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>);
    function matchPurchaseOrder(p: PurchaseOrder) {
        return p.status === "sent";
    }
    function renderGroup(g: {
        supplier: Supplier;
        items: InvProduct[];
    }) {
        return (<Box key={g.supplier.id} className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm", "!mb-4")}>
              <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
                <Box className="!flex !items-center !gap-2.5">
                  <Text className={cn("!w-[38px] !h-[38px] !rounded-[10px] !bg-wash !text-mid !grid !place-items-center")} as="span">
                    <IconTruck size={20}/>
                  </Text>
                  <Box>
                    <Heading level={3}>{g.supplier.name}</Heading>
                    <Text className="text-[12.5px] text-muted !font-mono" as="span">
                      {g.supplier.gstin} · {g.supplier.phone}
                    </Text>
                  </Box>
                </Box>
                <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={sendOnClick}>
                  <IconSend size={15}/> Send order ({g.items.length})
                </Button>
              </Box>
              <Box className="!overflow-x-auto">
                <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Product</TableHeaderCell>
                      <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">In stock</TableHeaderCell>
                      <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Reorder at</TableHeaderCell>
                      <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Landed price</TableHeaderCell>
                      <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Save / pack</TableHeaderCell>
                      <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Order qty</TableHeaderCell>
                      <TableHeaderCell>Distributor</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {g.items.map(renderItem)}
                  </TableBody>
                </Table>
              </Box>
            </Box>);
        function sendOnClick() {
            return send(g.supplier.id, g.supplier.name, g.items);
        }
        function renderItem(p: InvProduct) {
            const rows = rowsFor(p.id);
            const sel = entryFor(p.id, g.supplier.id);
            const cheapest = bestSupplyFor(p.id, supplyList);
            const selEff = sel ? effectiveSupplyPrice(sel) : undefined;
            const effs = rows.map(effectiveSupplyPrice);
            const maxEff = effs.length ? Math.max(...effs) : undefined;
            const isBest = !!(cheapest && sel && cheapest.id === sel.id);
            const savePack = selEff !== undefined && maxEff !== undefined && rows.length > 1
                ? maxEff - selEff
                : 0;
            const cheaperElsewhere = cheapest && (!sel || cheapest.id !== sel.id) ? cheapest : undefined;
            return (<TableRow key={p.id}>
                          <TableCell>
                            <Box className="flex items-center gap-2.5">
                              <Text className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-[17px] font-display font-bold leading-none text-mid" as="span">
                                <Thumb p={p}/>
                              </Text>
                              <Text as="span">
                                <Text className="!font-bold !text-ink" as="span">{p.name}</Text>
                                <Box className="text-[11.5px] text-muted">{p.pack}</Box>
                              </Text>
                            </Box>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-ink">
                            <Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-rose-bg !text-rose" as="span">{stockOf(p)}</Text>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-ink !text-muted">{p.reorderLevel}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-ink">
                            {sel ? (<>
                                <Text className={cn("!font-bold")} as="span">{inr2(selEff!)}</Text>
                                {schemeLabel(sel) && (<Box className={cn("text-[12.5px] text-muted !text-muted", "!text-[11px]")}>
                                    {inr2(sel.purchasePrice)} · {schemeLabel(sel)} free
                                  </Box>)}
                                {isBest && rows.length > 1 && (<Box>
                                    <Text className={cn("!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid", "!text-[10.5px]")} as="span">
                                      <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                                      Best price
                                    </Text>
                                  </Box>)}
                              </>) : (<Text className={cn("!text-muted", "!text-[11.5px]")} as="span">
                                no quote
                              </Text>)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-ink">
                            {savePack > 0 ? (<Text className={cn("!font-bold !text-primary")} as="span">
                                {inr2(savePack)}
                              </Text>) : (<Text className="!text-muted" as="span">—</Text>)}
                            {cheaperElsewhere && (<Box className={cn("text-[12.5px] text-muted", "!text-[11px]")}>
                                <Button title="Switch to cheaper distributor" onClick={setProductSupplierOnClick} className={cn("!h-auto !border-0 !bg-transparent !p-0 !text-mid !underline-offset-2 !shadow-none hover:!underline", "!text-gold-d !font-bold !bg-transparent !border-0 !cursor-pointer !p-0")}>
                                  <IconBulb size={13}/>{" "}
                                  {suppliers
                        .find(matchSupplier)
                        ?.name?.split(" ")[0]}{" "}
                                  {inr2(effectiveSupplyPrice(cheaperElsewhere))} →
                                </Button>
                              </Box>)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-ink">
                            <Box className={cn("!inline-flex !items-center !overflow-hidden !rounded-sm !border !border-line-2", "!ml-auto")}>
                              <Button onClick={setQtysOnClick}>
                                −
                              </Button>
                              <Text as="span">{qtyFor(p.id)}</Text>
                              <Button onClick={setQtysOnClick2}>
                                +
                              </Button>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Select value={suggestedSupplierId(p, suppliers, supplyList)} onChange={setProductSupplierOnChange} className={cn("!bg-[position:right_7px_center] !py-[5px] !pr-[30px] !pl-2 !text-[12.5px]", "!max-w-[220px]")} options={[...(suppliers.map(renderSupplier))]} />
                          </TableCell>
                        </TableRow>);
            function setProductSupplierOnClick() {
                if (!cheaperElsewhere) return;
                return setProductSupplier(p.id, cheaperElsewhere.supplierId);
            }
            function matchSupplier(s: Supplier) {
                if (!cheaperElsewhere) return false;
                return s.id === cheaperElsewhere.supplierId;
            }
            function setQtysOnClick() {
                return setQtys((q) => ({ ...q, [p.id]: Math.max(0, qtyFor(p.id) - 5) }));
            }
            function setQtysOnClick2() {
                return setQtys((q) => ({ ...q, [p.id]: qtyFor(p.id) + 5 }));
            }
            function setProductSupplierOnChange(e: ChangeEvent<HTMLSelectElement>) {
                return setProductSupplier(p.id, e.target.value);
            }
            function renderSupplier(s: Supplier) {
                const en = entryFor(p.id, s.id);
                return { value: String(s.id), label: String(s.name) + " " + String(en ? ` · ${inr2(effectiveSupplyPrice(en))}` : "") };
            }
        }
    }
    function parsePoCsvOnChange(e: ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f)
            return;
        const r = new FileReader();
        r.onload = async () => {
            const parsed = parsePoCsv(String(r.result));
            if (!parsed.rows.length) {
                showFault(parsed.errors[0] || "No purchase orders in that sheet");
                return;
            }
            const res = await importPurchaseOrders(parsed.rows);
            if (res?.skipped.length)
                toast(`${res.skipped.length} rows skipped — distributor or medicine name did not match`);
        };
        r.readAsText(f);
        e.target.value = "";
    }
    function clickOnClick() {
        return poFile.current?.click();
    }
    function renderPurchaseOrder(po: PurchaseOrder) {
        return (<TableRow key={po.id}>
                  <TableCell className={cn("!font-mono", "!font-bold")}>
                    {po.id}
                  </TableCell>
                  <TableCell className={cn("!font-semibold")}>{po.supplierName}</TableCell>
                  <TableCell>{po.items.map(matchItem).join(", ")}</TableCell>
                  <TableCell>{timeAgo(po.createdAt, now)}</TableCell>
                  <TableCell>
                    <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${po.status ==="received" ?"!bg-wash !text-mid" : po.status ==="sent" ?"!bg-blue-bg !text-blue" :"!bg-gray-pill !text-muted"}`} as="span">
                      <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                      {po.status === "received"
                ? "Received"
                : po.status === "sent"
                    ? "Sent · awaiting"
                    : "Draft"}
                    </Text>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-ink">
                    {po.status === "sent" && (<Box className={cn("!flex !items-center !gap-1.5", "!justify-end")}>
                        <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={goOnClick}>
                          Record GRN
                        </Button>
                        <Button className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs !border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={markPOReceivedOnClick}>
                          <IconCheck size={14}/> Received
                        </Button>
                      </Box>)}
                  </TableCell>
                </TableRow>);
        function matchItem(i: POItem) {
            return `${i.name} ×${i.qty}`;
        }
        function goOnClick() {
            return go("purchases");
        }
        function markPOReceivedOnClick() {
            return markPOReceived(po.id);
        }
    }
}
