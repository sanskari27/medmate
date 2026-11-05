import type { CategoryKey, InvProduct, Supplier } from "@/utils";
import {
  Box,
  Button,
  Heading,
  IconButton,
  Input,
  Label,
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
  closeButtonClass,
  dataTableClass,
  denseFieldClass,
  denseInputClass,
  fieldClass,
  grnGridClass,
  modalBodyClass,
  modalFootClass,
  modalHeadClass,
  modalOverlayClass,
  modalPanelClass,
  numClass,
  statCardClass,
  statIconClass,
  statLabelClass,
  statSplitClass,
  statValueClass,
  tableLastRowClass,
} from "./purchaseChrome";
import type { ChangeEvent, MouseEvent } from "react";
import { useState, useRef } from "react";
import { usePharma } from "@/hooks";
import {
  CATEGORIES,
  inr,
  inr2,
  fmtDateTime,
  purchaseTotals,
  blankPurchaseItem,
  PurchaseItem,
  Purchase,
  Schedule,
  DosageForm,
  SCHEDULE_META,
} from "@/utils";
import {
  IconPlus,
  IconX,
  IconTruck,
  IconCheck,
  IconTrash,
  IconRupee,
  IconPrint,
  IconReceipt,
  IconBulb,
  IconDoc,
  IconAlert,
} from "@/components/atoms";
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
  return (
    <Box className="!mx-auto !max-w-[1680px]">
      <Box className={grnGridClass}>
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-wash !text-mid")}>
            <IconRupee size={19} />
          </Box>
          <Box className={statLabelClass}>Purchases this month</Box>
          <Box className={statValueClass}>{inr(monthValue)}</Box>
          <Box className={statSplitClass}>{monthly.length} distributor bills</Box>
        </Box>
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-blue-bg !text-blue")}>
            <IconReceipt size={19} />
          </Box>
          <Box className={statLabelClass}>Input GST credit (month)</Box>
          <Box className={statValueClass}>{inr(monthGst)}</Box>
          <Box className={statSplitClass}>claimable on GSTR-2</Box>
        </Box>
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-amber-bg !text-gold-d")}>
            <IconTruck size={19} />
          </Box>
          <Box className={statLabelClass}>Total GRNs</Box>
          <Box className={statValueClass}>{purchases.length}</Box>
          <Box className={statSplitClass}>goods-inward entries</Box>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Heading className={cn("!text-[16px]")} level={2}>
          Goods inward / purchase bills
        </Heading>
        <Box className="!flex-1" />
        <Button onClick={setOpenOnClick}>
          <IconPlus size={16} /> New purchase entry
        </Button>
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className={cn(dataTableClass, tableLastRowClass)}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>GRN</TableHeaderCell>
                <TableHeaderCell>Distributor</TableHeaderCell>
                <TableHeaderCell>Invoice no.</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Items</TableHeaderCell>
                <TableHeaderCell className={numClass}>Taxable</TableHeaderCell>
                <TableHeaderCell className={numClass}>GST</TableHeaderCell>
                <TableHeaderCell className={numClass}>Bill total</TableHeaderCell>
                <TableHeaderCell></TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.map(renderPurchase)}
              {purchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconTruck size={28} />
                      </Box>
                      <Heading level={3}>No purchases yet</Heading>
                      <Text>Enter a distributor bill to add stock automatically.</Text>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Text className={cn("!text-muted", "!text-[12.5px] !mt-3")}>
        <IconBulb size={13} /> Entering a distributor’s purchase bill here{" "}
        <Text as="span" className="font-bold">
          auto-updates inventory
        </Text>{" "}
        — matching batches are topped up, new batches and brand-new products are created, and
        MRP/cost are refreshed. No manual stock edits needed.
      </Text>

      {open && <PurchaseModal onClose={setOpenOnClose} />}
      {view && <ViewPurchase purchase={view} onClose={setViewOnClose} />}
    </Box>
  );
  function setOpenOnClick() {
    return setOpen(true);
  }
  function renderPurchase(p: Purchase) {
    const t = purchaseTotals(p.items);
    return (
      <TableRow key={p.id} onClick={setViewOnClick} className={cn("!cursor-pointer")}>
        <TableCell className={cn("!font-mono", "!font-bold")}>{p.id}</TableCell>
        <TableCell className={cn("!font-semibold")}>{p.supplierName}</TableCell>
        <TableCell className="!font-mono">{p.invoiceNo}</TableCell>
        <TableCell>{p.invoiceDate}</TableCell>
        <TableCell>
          {p.items.length} lines · {t.units} units
        </TableCell>
        <TableCell className={numClass}>{inr(t.taxable)}</TableCell>
        <TableCell className={numClass}>{inr(t.gst)}</TableCell>
        <TableCell className={cn(numClass, "!font-extrabold")}>{inr(t.total)}</TableCell>
        <TableCell className={numClass}>
          <Text
            className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid"
            as="span"
          >
            <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            Stocked
          </Text>
        </TableCell>
      </TableRow>
    );
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
function PurchaseModal({ onClose }: { onClose: () => void }) {
  const { inventory, suppliers, receivePurchase, go } = usePharma();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("2026-06-19");
  const [lines, setLines] = useState<PurchaseItem[]>([blankPurchaseItem()]);
  const [csv, setCsv] = useState<CsvParseResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const onCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const res = parsePurchaseCsv(String(r.result), inventory);
      if (res.items.length) {
        setLines(res.items);
        setCsv(res);
      } else setCsv(res);
    };
    r.readAsText(f);
    e.target.value = "";
  };
  const update = (i: number, patch: Partial<PurchaseItem>) =>
    setLines((l) => l.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
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
  const removeLine = (i: number) =>
    setLines((l) => (l.length > 1 ? l.filter((_, idx) => idx !== i) : l));
  const t = purchaseTotals(lines);
  const supplier = suppliers.find((s) => s.id === supplierId) ?? suppliers[0];
  const valid =
    invoiceNo.trim() &&
    lines.some(
      (x) => x.qty + (x.freeQty || 0) > 0 && x.batchNo.trim() && (x.productId || x.name.trim()),
    );
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
  return (
    <Box className={modalOverlayClass} onClick={onClose}>
      <Box onClick={stopPropagationOnClick} className={cn(modalPanelClass, "!max-w-[880px]")}>
        <Box className={modalHeadClass}>
          <Heading level={3}>New purchase entry · goods inward</Heading>
          <Button className={closeButtonClass} onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </Button>
        </Box>
        <Box className={modalBodyClass}>
          <Box className="!mb-[18px] !grid !grid-cols-3 !gap-3.5 max-[1099px]:!grid-cols-2 max-[767px]:!grid-cols-1">
            <Box className={fieldClass}>
              <Label>Distributor / supplier</Label>
              <ChevronSelect
                className=""
                value={supplierId}
                onChange={setSupplierIdOnChange}
                options={[...suppliers.map(renderSupplier)]}
              />
            </Box>
            <Box className={fieldClass} data-field="invoiceNo">
              <Label>Invoice no.</Label>
              <Input
                className=""
                value={invoiceNo}
                onChange={setInvoiceNoOnChange}
                placeholder="BPD/26-27/8842"
              />
            </Box>
            <Box className={fieldClass}>
              <Label>Invoice date</Label>
              <Input
                className=""
                type="date"
                value={invoiceDate}
                onChange={setInvoiceDateOnChange}
              />
            </Box>
          </Box>

          {/* ── bulk CSV import ── */}
          <Input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onCsv} />
          <Box
            className={cn(
              "!flex !items-center !gap-2.5",
              "!gap-2 !items-center !mb-3 !py-2.5 !px-3 !bg-wash-2 !rounded-[10px] !flex-wrap",
            )}
          >
            <Text className={cn("!text-[13px] !font-bold")} as="span">
              <IconDoc size={13} /> Bulk entry
            </Text>
            <Text className={cn("!text-muted", "!text-[12.5px] !flex-1")} as="span">
              Import a whole purchase bill / stock list from CSV — products are matched by name, new
              ones are created.
            </Text>
            <Button variant="ghost" onClick={downloadPurchaseTemplate}>
              <IconPrint size={14} /> Template
            </Button>
            <Button onClick={clickOnClick}>
              <IconPlus size={14} /> Import CSV
            </Button>
          </Box>
          {csv && (
            <Box
              className={cn(
                "!mb-3 !flex !w-full !items-center !justify-start !gap-[5px] !rounded-[20px] !px-3 !py-2 !text-[11px] !font-bold",
                csv.items.length ? "!bg-[#eaf6ef] !text-ink" : "!bg-rose-bg !text-rose",
              )}
            >
              {csv.items.length ? (
                <Text as="span">
                  <IconCheck size={13} /> Imported {csv.items.length} lines · {csv.matched} matched,{" "}
                  {csv.created} new{csv.skipped ? `, ${csv.skipped} skipped` : ""}
                  {csv.errors.length ? ` · ${csv.errors.length} need attention (check qty)` : ""}.
                  Review & edit below, then save.
                </Text>
              ) : (
                <Text className={cn("!text-rose")} as="span">
                  <IconAlert size={13} /> {csv.errors[0] ?? "Could not read the CSV."}
                </Text>
              )}
            </Box>
          )}

          <Box className={cn("!mb-2 !flex !items-center !justify-between", "!mb-2.5")}>
            <Heading className={cn("!text-[14px]")} level={2}>
              Billed items
            </Heading>
            <Text className="!text-[12.5px] !text-muted" as="span">
              free goods are stocked but not charged
            </Text>
          </Box>

          {lines.map(renderLine)}

          <Button variant="ghost" block onClick={addLine}>
            <IconPlus size={15} /> Add another item
          </Button>

          <Box
            className={cn(
              "!flex !items-center !gap-2.5",
              "!justify-end !gap-[26px] !mt-4 !pt-3.5 !border-t !border-line-2 !border-dashed",
            )}
          >
            <Text className={cn("!text-muted", "!text-[13px]")} as="span">
              {t.lines} lines ·{" "}
              <Text as="span" className={cn("font-bold", "!text-ink")}>
                {t.units} units
              </Text>
            </Text>
            <Text className={cn("!text-muted", "!text-[13px]")} as="span">
              Taxable{" "}
              <Text as="span" className={cn("font-bold", "!text-ink")}>
                {inr(t.taxable)}
              </Text>
            </Text>
            <Text className={cn("!text-muted", "!text-[13px]")} as="span">
              GST{" "}
              <Text as="span" className={cn("font-bold", "!text-ink")}>
                {inr(t.gst)}
              </Text>
            </Text>
            <Text className={cn("!font-display !font-extrabold !text-[18px] !text-dark")} as="span">
              Bill {inr(t.total)}
            </Text>
          </Box>
        </Box>
        <Box className={modalFootClass}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={save}>
            <IconCheck size={16} /> Save & update stock
          </Button>
        </Box>
      </Box>
    </Box>
  );
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
    return (
      <Box className="!mb-2.5 !rounded-md !border !border-line-2 !bg-wash-2 !p-3" key={i}>
        <Box className="!mb-2.5 !flex !items-center !gap-2.5">
          <ChevronSelect
            className="!min-w-0 !flex-1"
            value={isNew ? "__new__" : (line.productId ?? "")}
            onChange={selectProductOnChange}
            options={[
              { value: "", label: "Select product\u2026", disabled: true },
              { value: "__new__", label: "New product (add to catalogue)" },
              ...inventory.map(renderInventory),
            ]}
          />
          <Text
            className="!min-w-[70px] !pb-2 !text-right !font-display !text-[13px] !font-extrabold !text-dark"
            as="span"
          >
            {inr2(lineTotal)}
          </Text>
          <IconButton label="Remove line" title="Remove line" onClick={removeLineOnClick}>
            <IconTrash size={15} />
          </IconButton>
        </Box>

        {isNew && (
          <Box className="!mb-2.5 !grid !grid-cols-[1.4fr_1.4fr_1fr_1fr] !gap-2 !rounded-[9px] !border !border-dashed !border-mint !bg-wash !p-2.5 max-[767px]:!grid-cols-2">
            <Box className={fieldClass}>
              <Label>Product name</Label>
              <Input
                className=""
                value={line.name}
                onChange={updateOnChange}
                placeholder="e.g. Azithromycin 500"
              />
            </Box>
            <Box className={fieldClass}>
              <Label>Composition</Label>
              <Input
                className=""
                value={line.composition}
                onChange={updateOnChange2}
                placeholder="Azithromycin 500mg"
              />
            </Box>
            <Box className={fieldClass}>
              <Label>Category</Label>
              <ChevronSelect
                className=""
                value={line.category}
                onChange={updateOnChange3}
                options={[...CATEGORIES.map(renderCATEGORIES)]}
              />
            </Box>
            <Box className={fieldClass}>
              <Label>Schedule</Label>
              <ChevronSelect
                className=""
                value={line.schedule}
                onChange={updateOnChange4}
                options={[...SCHEDS.map(renderSCHEDS)]}
              />
            </Box>
            <Box className={fieldClass}>
              <Label>Manufacturer</Label>
              <Input className="" value={line.manufacturer} onChange={updateOnChange5} />
            </Box>
            <Box className={fieldClass}>
              <Label>Pack</Label>
              <Input
                className=""
                value={line.pack}
                onChange={updateOnChange6}
                placeholder="Strip of 10"
              />
            </Box>
            <Box className={fieldClass}>
              <Label>Form</Label>
              <ChevronSelect
                className=""
                value={line.form}
                onChange={updateOnChange7}
                options={[...FORMS.map(renderFORMS)]}
              />
            </Box>
          </Box>
        )}

        <Box className="!grid !grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr_1fr_0.9fr] !items-end !gap-2 max-[1099px]:!grid-cols-3 max-[767px]:!grid-cols-2">
          <Box className={denseFieldClass}>
            <Label>Batch no.</Label>
            <Input className={denseInputClass} value={line.batchNo} onChange={updateOnChange8} />
          </Box>
          <Box className={denseFieldClass}>
            <Label>Expiry</Label>
            <Input
              className={denseInputClass}
              value={line.expiry}
              onChange={updateOnChange9}
              placeholder="2027-06"
            />
          </Box>
          <Box className={denseFieldClass}>
            <Label>Qty</Label>
            <Input
              className={denseInputClass}
              type="number"
              value={line.qty || ""}
              onChange={updateOnChange10}
            />
          </Box>
          <Box className={denseFieldClass}>
            <Label>Free</Label>
            <Input
              className={denseInputClass}
              type="number"
              value={line.freeQty || ""}
              onChange={updateOnChange11}
            />
          </Box>
          <Box className={denseFieldClass}>
            <Label>Rate / PTR</Label>
            <Input
              className={denseInputClass}
              type="number"
              value={line.ptr || ""}
              onChange={updateOnChange12}
            />
          </Box>
          <Box className={denseFieldClass}>
            <Label>MRP</Label>
            <Input
              className={denseInputClass}
              type="number"
              value={line.mrp || ""}
              onChange={updateOnChange13}
            />
          </Box>
          <Box className={denseFieldClass}>
            <Label>GST%</Label>
            <ChevronSelect
              dense
              value={line.gst}
              onChange={updateOnChange14}
              options={[...GSTS.map(renderGSTS)]}
            />
          </Box>
        </Box>
      </Box>
    );
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
    function renderCATEGORIES(c: { key: CategoryKey; label: string }) {
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
function ViewPurchase({ purchase, onClose }: { purchase: Purchase; onClose: () => void }) {
  const t = purchaseTotals(purchase.items);
  return (
    <Box className={modalOverlayClass} onClick={onClose}>
      <Box className={cn(modalPanelClass, "!max-w-[720px]")} onClick={stopPropagationOnClick2}>
        <Box className={modalHeadClass}>
          <Heading level={3}>
            {purchase.id} · {purchase.supplierName}
          </Heading>
          <Button className={closeButtonClass} onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </Button>
        </Box>
        <Box className={modalBodyClass}>
          <Box className="!mb-1 !grid !grid-cols-2 !gap-x-5 !gap-y-1.5 !border-t !border-line !border-b !border-[#e3e3e3] !py-3 !text-[12px] max-[767px]:!grid-cols-1">
            <Box>
              <Text className="!text-[12px] !text-[#666]" as="span">
                Distributor:{" "}
              </Text>
              <Text as="span" className="!text-[12px] !font-bold !text-[#111]">
                {purchase.supplierName}
              </Text>
            </Box>
            <Box>
              <Text className="!text-[12px] !text-[#666]" as="span">
                Invoice no:{" "}
              </Text>
              <Text as="span" className="!text-[12px] !font-bold !text-[#111]">
                {purchase.invoiceNo}
              </Text>
            </Box>
            <Box>
              <Text className="!text-[12px] !text-[#666]" as="span">
                Invoice date:{" "}
              </Text>
              {purchase.invoiceDate}
            </Box>
            <Box>
              <Text className="!text-[12px] !text-[#666]" as="span">
                Entered:{" "}
              </Text>
              {fmtDateTime(purchase.createdAt)}
            </Box>
          </Box>
          <Table className={cn(dataTableClass, "!mt-2.5")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Item</TableHeaderCell>
                <TableHeaderCell>Batch</TableHeaderCell>
                <TableHeaderCell>Exp</TableHeaderCell>
                <TableHeaderCell className={numClass}>Qty</TableHeaderCell>
                <TableHeaderCell className={numClass}>Free</TableHeaderCell>
                <TableHeaderCell className={numClass}>Rate</TableHeaderCell>
                <TableHeaderCell className={numClass}>MRP</TableHeaderCell>
                <TableHeaderCell className={numClass}>GST</TableHeaderCell>
                <TableHeaderCell className={numClass}>Amount</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>{purchase.items.map(renderItem)}</TableBody>
            <tfoot>
              <tr className="!bg-wash-2 !font-extrabold">
                <td colSpan={8} className="!border-b-0 !px-3.5 !py-[11px] !text-ink-2">
                  Bill total ({t.units} units stocked)
                </td>
                <td className={cn(numClass, "!border-b-0 !px-3.5 !py-[11px] !font-extrabold")}>
                  {inr2(t.total)}
                </td>
              </tr>
            </tfoot>
          </Table>
        </Box>
        <Box className={modalFootClass}>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Box>
  );
  function stopPropagationOnClick2(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function renderItem(it: PurchaseItem, i: number) {
    return (
      <TableRow key={i}>
        <TableCell className={cn("!font-bold")}>
          {it.name}
          {!it.productId && (
            <Text
              className={cn(
                "!inline-flex !items-center !gap-1 !rounded-xs !border !border-line-2 !bg-paper !px-[7px] !py-0.5 !text-[10.5px] !font-bold !text-ink-2",
                "!ml-1.5",
              )}
              as="span"
            >
              new
            </Text>
          )}
        </TableCell>
        <TableCell className="!font-mono">{it.batchNo}</TableCell>
        <TableCell>{it.expiry}</TableCell>
        <TableCell className={numClass}>{it.qty}</TableCell>
        <TableCell className={numClass}>{it.freeQty || "—"}</TableCell>
        <TableCell className={numClass}>{inr2(it.ptr)}</TableCell>
        <TableCell className={numClass}>{inr2(it.mrp)}</TableCell>
        <TableCell className={numClass}>{it.gst}%</TableCell>
        <TableCell className={cn(numClass, "!font-bold")}>
          {inr2(it.ptr * it.qty * (1 + it.gst / 100))}
        </TableCell>
      </TableRow>
    );
  }
}
