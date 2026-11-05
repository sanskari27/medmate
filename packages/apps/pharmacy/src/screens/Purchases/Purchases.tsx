import type { CategoryKey, InvProduct, Supplier } from "@/utils";
import { Box, Button, Heading, Input, Label, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { TableFooter } from "@/components/molecules/DataTable";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState, useRef } from "react";
import { usePharma } from "@/hooks";
import { CATEGORIES, inr, inr2, fmtDateTime, purchaseTotals, blankPurchaseItem, PurchaseItem, Purchase, Schedule, DosageForm, SCHEDULE_META, } from "@/utils";
import { IconPlus, IconX, IconTruck, IconCheck, IconTrash, IconRupee, IconPrint, IconReceipt, IconBulb, IconDoc, IconAlert, } from "@/components/Icon";
import { parsePurchaseCsv, downloadPurchaseTemplate, CsvParseResult } from "@/utils/purchases";
const FORMS: DosageForm[] = [
    "Tablet",
    "Capsule",
    "Syrup",
    "Drops",
    "Injection",
    "Cream",
    "Device",
    "Other",
];
const SCHEDS: Schedule[] = ["OTC", "H", "H1", "X"];
const GSTS = [0, 5, 12, 18];
export default function PurchasesScreen() {
    const { purchases, now } = usePharma();
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<Purchase | null>(null);
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthly = purchases.filter((p) => p.createdAt >= monthStart.getTime());
    const monthValue = monthly.reduce((a, p) => a + purchaseTotals(p.items).total, 0);
    const monthGst = monthly.reduce((a, p) => a + purchaseTotals(p.items).gst, 0);
    return (<Box className="!mx-auto !max-w-[1680px]">
      <Box className="!text-mid">
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconRupee size={19}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Purchases this month</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inr(monthValue)}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">{monthly.length} distributor bills</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
            <IconReceipt size={19}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Input GST credit (month)</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inr(monthGst)}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">claimable on GSTR-2</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
            <IconTruck size={19}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Total GRNs</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{purchases.length}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">goods-inward entries</Box>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Heading className={cn("!text-[16px]")} level={2}>Goods inward / purchase bills</Heading>
        <Box className="!flex-1"/>
        <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={setOpenOnClick}>
          <IconPlus size={16}/> New purchase entry
        </Button>
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>GRN</TableHeaderCell>
                <TableHeaderCell>Distributor</TableHeaderCell>
                <TableHeaderCell>Invoice no.</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Items</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Taxable</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">GST</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Bill total</TableHeaderCell>
                <TableHeaderCell></TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.map(renderPurchase)}
              {purchases.length === 0 && (<TableRow>
                  <TableCell colSpan={9}>
                    <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconTruck size={28}/>
                      </Box>
                      <Heading level={3}>No purchases yet</Heading>
                      <Text>Enter a distributor bill to add stock automatically.</Text>
                    </Box>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Text className={cn("!text-muted", "!text-[12.5px] !mt-3")}>
        <IconBulb size={13}/> Entering a distributor’s purchase bill here{" "}
        <Text as="span" className="font-bold">auto-updates inventory</Text> — matching batches are topped up, new batches and brand-new
        products are created, and MRP/cost are refreshed. No manual stock edits needed.
      </Text>

      {open && <PurchaseModal onClose={setOpenOnClose}/>}
      {view && <ViewPurchase purchase={view} onClose={setViewOnClose}/>}
    </Box>);
    function setOpenOnClick() {
        return setOpen(true);
    }
    function renderPurchase(p: Purchase) {
        const t = purchaseTotals(p.items);
        return (<TableRow key={p.id} onClick={setViewOnClick} className={cn("!cursor-pointer")}>
                    <TableCell className={cn("!font-mono", "!font-bold")}>
                      {p.id}
                    </TableCell>
                    <TableCell className={cn("!font-semibold")}>{p.supplierName}</TableCell>
                    <TableCell className="!font-mono">{p.invoiceNo}</TableCell>
                    <TableCell>{p.invoiceDate}</TableCell>
                    <TableCell>
                      {p.items.length} lines · {t.units} units
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-ink">{inr(t.taxable)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-ink">{inr(t.gst)}</TableCell>
                    <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-extrabold")}>
                      {inr(t.total)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-ink">
                      <Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid" as="span">
                        <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                        Stocked
                      </Text>
                    </TableCell>
                  </TableRow>);
        function setViewOnClick() {
            return setView(p);
        }
    }
    function setOpenOnClose() {
        return setOpen(false);
    }
    function setViewOnClose() {
        return setView(null);
    }
}
// ── new purchase entry ──────────────────────────────────────────
function PurchaseModal({ onClose }: {
    onClose: () => void;
}) {
    const { inventory, suppliers, receivePurchase, go } = usePharma();
    const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
    const [invoiceNo, setInvoiceNo] = useState("");
    const [invoiceDate, setInvoiceDate] = useState("2026-06-19");
    const [lines, setLines] = useState<PurchaseItem[]>([blankPurchaseItem()]);
    const [csv, setCsv] = useState<CsvParseResult | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const onCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f)
            return;
        const r = new FileReader();
        r.onload = () => {
            const res = parsePurchaseCsv(String(r.result), inventory);
            if (res.items.length) {
                setLines(res.items);
                setCsv(res);
            }
            else
                setCsv(res);
        };
        r.readAsText(f);
        e.target.value = "";
    };
    const update = (i: number, patch: Partial<PurchaseItem>) => setLines((l) => l.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
    const selectProduct = (i: number, val: string) => {
        if (val === "__new__") {
            update(i, { productId: null, name: "" });
            return;
        }
        const p = inventory.find((x) => x.id === val);
        if (p)
            update(i, {
                productId: p.id,
                name: p.name,
                ptr: p.batches[0]?.ptr ?? 0,
                mrp: p.batches[0]?.mrp ?? 0,
                gst: p.gst,
                hsn: p.hsn,
            });
    };
    const addLine = () => setLines((l) => [...l, blankPurchaseItem()]);
    const removeLine = (i: number) => setLines((l) => (l.length > 1 ? l.filter((_, idx) => idx !== i) : l));
    const t = purchaseTotals(lines);
    const supplier = suppliers.find((s) => s.id === supplierId) ?? suppliers[0];
    const valid = invoiceNo.trim() &&
        lines.some((x) => x.qty + (x.freeQty || 0) > 0 && x.batchNo.trim() && (x.productId || x.name.trim()));
    const save = async () => {
        const res = await receivePurchase({
            supplierId,
            supplierName: supplier?.name ?? "Distributor",
            invoiceNo,
            invoiceDate,
            items: lines,
        });
        if (res) {
            onClose();
            go("inventory");
        }
    };
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box onClick={stopPropagationOnClick} className={cn("!flex !max-h-[90vh] !w-full !max-w-[720px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop", "!max-w-[880px]")}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>New purchase entry · goods inward</Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Box className={cn("!grid !grid-cols-3 !gap-3.5 max-[767px]:!grid-cols-1", "!mb-4.5")}>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Distributor / supplier</Label>
              <Select className="" value={supplierId} onChange={setSupplierIdOnChange} options={[...(suppliers.map(renderSupplier))]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="invoiceNo">
              <Label>Invoice no.</Label>
              <Input className="" value={invoiceNo} onChange={setInvoiceNoOnChange} placeholder="BPD/26-27/8842"/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Invoice date</Label>
              <Input className="" type="date" value={invoiceDate} onChange={setInvoiceDateOnChange}/>
            </Box>
          </Box>

          {/* ── bulk CSV import ── */}
          <Input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onCsv}/>
          <Box className={cn("!flex !items-center !gap-2.5", "!gap-2 !items-center !mb-3 !py-2.5 !px-3 !bg-wash-2 !rounded-[10px] !flex-wrap")}>
            <Text className={cn("!text-[13px] !font-bold")} as="span">
              <IconDoc size={13}/> Bulk entry
            </Text>
            <Text className={cn("!text-muted", "!text-[12.5px] !flex-1")} as="span">
              Import a whole purchase bill / stock list from CSV — products are matched by name, new
              ones are created.
            </Text>
            <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={downloadPurchaseTemplate}>
              <IconPrint size={14}/> Template
            </Button>
            <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={clickOnClick}>
              <IconPlus size={14}/> Import CSV
            </Button>
          </Box>
          {csv && (<Box className={cn("!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold", "!mb-3 !w-full !justify-start !py-2 !px-3", csv.items.length ? "!bg-wash" : "!bg-rose-bg")}>
              {csv.items.length ? (<Text as="span">
                  <IconCheck size={13}/> Imported {csv.items.length} lines · {csv.matched} matched,{" "}
                  {csv.created} new{csv.skipped ? `, ${csv.skipped} skipped` : ""}
                  {csv.errors.length ? ` · ${csv.errors.length} need attention (check qty)` : ""}.
                  Review & edit below, then save.
                </Text>) : (<Text className={cn("!text-rose")} as="span">
                  <IconAlert size={13}/> {csv.errors[0] ?? "Could not read the CSV."}
                </Text>)}
            </Box>)}

          <Box className={cn("!mb-2 !flex !items-center !justify-between", "!mb-2.5")}>
            <Heading className={cn("!text-[14px]")} level={2}>Billed items</Heading>
            <Text className="text-[12.5px] text-muted" as="span">free goods are stocked but not charged</Text>
          </Box>

          {lines.map(renderLine)}

          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !w-full" onClick={addLine}>
            <IconPlus size={15}/> Add another item
          </Button>

          <Box className={cn("!flex !items-center !gap-2.5", "!justify-end !gap-[26px] !mt-4 !pt-3.5 !border-t !border-line-2 !border-dashed")}>
            <Text className={cn("!text-muted", "!text-[13px]")} as="span">
              {t.lines} lines · <Text as="span" className={cn("font-bold", "!text-ink")}>{t.units} units</Text>
            </Text>
            <Text className={cn("!text-muted", "!text-[13px]")} as="span">
              Taxable <Text as="span" className={cn("font-bold", "!text-ink")}>{inr(t.taxable)}</Text>
            </Text>
            <Text className={cn("!text-muted", "!text-[13px]")} as="span">
              GST <Text as="span" className={cn("font-bold", "!text-ink")}>{inr(t.gst)}</Text>
            </Text>
            <Text className={cn("!font-display !font-extrabold !text-[18px] !text-dark")} as="span">
              Bill {inr(t.total)}
            </Text>
          </Box>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onClose}>
            Cancel
          </Button>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={!valid} onClick={save}>
            <IconCheck size={16}/> Save & update stock
          </Button>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function setSupplierIdOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return setSupplierId(e.target.value);
    }
    function renderSupplier(s: Supplier) {
        return { value: String(s.id), label: String(s.name) };
    }
    function setInvoiceNoOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setInvoiceNo(e.target.value);
    }
    function setInvoiceDateOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setInvoiceDate(e.target.value);
    }
    function clickOnClick() {
        return fileRef.current?.click();
    }
    function renderLine(line: PurchaseItem, i: number) {
        const isNew = line.productId === null;
        const lineTotal = line.ptr * line.qty * (1 + line.gst / 100);
        return (<Box className="!mb-2.5 !rounded-md !border !border-line-2 !bg-wash-2 !p-3" key={i}>
                <Box className="!mb-2.5 !flex !items-center !gap-2.5">
                  <Select className="" value={isNew ? "__new__" : (line.productId ?? "")} onChange={selectProductOnChange} options={[{ value: "", label: "Select product\u2026", disabled: true }, { value: "__new__", label: "New product (add to catalogue)" }, ...inventory.map(renderInventory)]} />
                  <Text className="!pb-2 !text-right !font-display !text-[13px] !font-extrabold !text-dark" as="span">{inr2(lineTotal)}</Text>
                  <Button className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid" onClick={removeLineOnClick} title="Remove line">
                    <IconTrash size={15}/>
                  </Button>
                </Box>

                {isNew && (<Box className="!mb-2.5 !grid !grid-cols-[1.4fr_1.4fr_1fr_1fr] !gap-2 !rounded-[9px] !border !border-dashed !border-mint !bg-wash !p-2.5 max-[767px]:!grid-cols-1">
                    <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                      <Label>Product name</Label>
                      <Input className="" value={line.name} onChange={updateOnChange} placeholder="e.g. Azithromycin 500"/>
                    </Box>
                    <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                      <Label>Composition</Label>
                      <Input className="" value={line.composition} onChange={updateOnChange2} placeholder="Azithromycin 500mg"/>
                    </Box>
                    <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                      <Label>Category</Label>
                      <Select className="" value={line.category} onChange={updateOnChange3} options={[...(CATEGORIES.map(renderCATEGORIES))]} />
                    </Box>
                    <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                      <Label>Schedule</Label>
                      <Select className="" value={line.schedule} onChange={updateOnChange4} options={[...(SCHEDS.map(renderSCHEDS))]} />
                    </Box>
                    <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                      <Label>Manufacturer</Label>
                      <Input className="" value={line.manufacturer} onChange={updateOnChange5}/>
                    </Box>
                    <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                      <Label>Pack</Label>
                      <Input className="" value={line.pack} onChange={updateOnChange6} placeholder="Strip of 10"/>
                    </Box>
                    <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                      <Label>Form</Label>
                      <Select className="" value={line.form} onChange={updateOnChange7} options={[...(FORMS.map(renderFORMS))]} />
                    </Box>
                  </Box>)}

                <Box className="!grid !grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr_1fr_0.9fr] !items-end !gap-2 max-[1099px]:!grid-cols-3 max-[767px]:!grid-cols-1">
                  <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                    <Label>Batch no.</Label>
                    <Input className="" value={line.batchNo} onChange={updateOnChange8}/>
                  </Box>
                  <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                    <Label>Expiry</Label>
                    <Input className="" value={line.expiry} onChange={updateOnChange9} placeholder="2027-06"/>
                  </Box>
                  <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                    <Label>Qty</Label>
                    <Input className="" type="number" value={line.qty || ""} onChange={updateOnChange10}/>
                  </Box>
                  <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                    <Label>Free</Label>
                    <Input className="" type="number" value={line.freeQty || ""} onChange={updateOnChange11}/>
                  </Box>
                  <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                    <Label>Rate / PTR</Label>
                    <Input className="" type="number" value={line.ptr || ""} onChange={updateOnChange12}/>
                  </Box>
                  <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                    <Label>MRP</Label>
                    <Input className="" type="number" value={line.mrp || ""} onChange={updateOnChange13}/>
                  </Box>
                  <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                    <Label>GST%</Label>
                    <Select className="" value={line.gst} onChange={updateOnChange14} options={[...(GSTS.map(renderGSTS))]} />
                  </Box>
                </Box>
              </Box>);
        function selectProductOnChange(e: ChangeEvent<HTMLSelectElement>) {
            return selectProduct(i, e.target.value);
        }
        function renderInventory(p: InvProduct) {
            return { value: String(p.id), label: String(p.name) + " \u00b7 " + String(p.pack) };
        }
        function removeLineOnClick() {
            return removeLine(i);
        }
        function updateOnChange(e: ChangeEvent<HTMLInputElement>) {
            return update(i, { name: e.target.value });
        }
        function updateOnChange2(e: ChangeEvent<HTMLInputElement>) {
            return update(i, { composition: e.target.value });
        }
        function updateOnChange3(e: ChangeEvent<HTMLSelectElement>) {
            return update(i, { category: e.target.value });
        }
        function renderCATEGORIES(c: {
            key: CategoryKey;
            label: string;
        }) {
            return { value: String(c.key), label: String(c.label) };
        }
        function updateOnChange4(e: ChangeEvent<HTMLSelectElement>) {
            return update(i, { schedule: e.target.value as Schedule });
        }
        function renderSCHEDS(s: Schedule) {
            return { value: String(s), label: String(SCHEDULE_META[s].label) };
        }
        function updateOnChange5(e: ChangeEvent<HTMLInputElement>) {
            return update(i, { manufacturer: e.target.value });
        }
        function updateOnChange6(e: ChangeEvent<HTMLInputElement>) {
            return update(i, { pack: e.target.value });
        }
        function updateOnChange7(e: ChangeEvent<HTMLSelectElement>) {
            return update(i, { form: e.target.value as DosageForm });
        }
        function renderFORMS(x: DosageForm) {
            return { value: String(x), label: String(x) };
        }
        function updateOnChange8(e: ChangeEvent<HTMLInputElement>) {
            return update(i, { batchNo: e.target.value });
        }
        function updateOnChange9(e: ChangeEvent<HTMLInputElement>) {
            return update(i, { expiry: e.target.value });
        }
        function updateOnChange10(e: ChangeEvent<HTMLInputElement>) {
            return update(i, { qty: Number(e.target.value) || 0 });
        }
        function updateOnChange11(e: ChangeEvent<HTMLInputElement>) {
            return update(i, { freeQty: Number(e.target.value) || 0 });
        }
        function updateOnChange12(e: ChangeEvent<HTMLInputElement>) {
            return update(i, { ptr: Number(e.target.value) || 0 });
        }
        function updateOnChange13(e: ChangeEvent<HTMLInputElement>) {
            return update(i, { mrp: Number(e.target.value) || 0 });
        }
        function updateOnChange14(e: ChangeEvent<HTMLSelectElement>) {
            return update(i, { gst: Number(e.target.value) });
        }
        function renderGSTS(x: number) {
            return { value: String(x), label: String(x) + "%" };
        }
    }
}
// ── view a past purchase ────────────────────────────────────────
function ViewPurchase({ purchase, onClose }: {
    purchase: Purchase;
    onClose: () => void;
}) {
    const t = purchaseTotals(purchase.items);
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box className="!flex !max-h-[90vh] !w-full !max-w-[720px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop" onClick={stopPropagationOnClick2}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>
            {purchase.id} · {purchase.supplierName}
          </Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Box className={cn("!grid !grid-cols-2 !gap-3", "!border-t !border-line !mb-1")}>
            <Box>
              <Text className="text-ink-2" as="span">Distributor: </Text>
              <Text as="span" className="font-bold">{purchase.supplierName}</Text>
            </Box>
            <Box>
              <Text className="text-ink-2" as="span">Invoice no: </Text>
              <Text as="span" className="font-bold">{purchase.invoiceNo}</Text>
            </Box>
            <Box>
              <Text className="text-ink-2" as="span">Invoice date: </Text>
              {purchase.invoiceDate}
            </Box>
            <Box>
              <Text className="text-ink-2" as="span">Entered: </Text>
              {fmtDateTime(purchase.createdAt)}
            </Box>
          </Box>
          <Table className={cn("!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2", "!mt-2.5")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Item</TableHeaderCell>
                <TableHeaderCell>Batch</TableHeaderCell>
                <TableHeaderCell>Exp</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Qty</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Free</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Rate</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">MRP</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">GST</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Amount</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchase.items.map(renderItem)}
            </TableBody>
          </Table>
          <TableFooter className="flex items-center justify-between">
            <Text>Bill total ({t.units} units stocked)</Text>
            <Text className="tabular-nums">{inr2(t.total)}</Text>
          </TableFooter>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick2(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function renderItem(it: PurchaseItem, i: number) {
        return (<TableRow key={i}>
                  <TableCell className={cn("!font-bold")}>
                    {it.name}
                    {!it.productId && (<Text className={cn("!inline-flex !items-center !gap-1 !rounded-xs !border !border-line-2 !bg-paper !px-[7px] !py-0.5 !text-[10.5px] !font-bold !text-ink-2", "!ml-1.5")} as="span">
                        new
                      </Text>)}
                  </TableCell>
                  <TableCell className="!font-mono">{it.batchNo}</TableCell>
                  <TableCell>{it.expiry}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-ink">{it.qty}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-ink">{it.freeQty || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-ink">{inr2(it.ptr)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-ink">{inr2(it.mrp)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-ink">{it.gst}%</TableCell>
                  <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-bold")}>
                    {inr2(it.ptr * it.qty * (1 + it.gst / 100))}
                  </TableCell>
                </TableRow>);
    }
}
