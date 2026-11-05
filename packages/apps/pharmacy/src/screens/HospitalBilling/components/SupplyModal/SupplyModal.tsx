import type { SupplyModalProps } from "./SupplyModal.types";
import type { Batch, InvProduct, Ward, WardIndent } from "@/utils";
import { Box, Button, Heading, Input, Label, Select, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { inr, mrpOf, stockOf, earliestBatch, findScan, hasLocation } from "@/utils";
import { SUPPLY_REASONS, WardSupplyReason, WardSupplyItem, } from "@/utils/calculations/hospitalAccount";
import { IconSearch, IconPlus, IconX, IconTag, IconCamera } from "@/components/atoms";
import { SupplyReasonIcon } from "@/components/molecules";
import WardSupplyInvoice from "@/screens/HospitalBilling/components/WardSupplyInvoice";
import { QuantityStepper as QtyBox } from "@/components/molecules";
import { useCreditPrice } from "@/screens/HospitalBilling/hooks/useCreditPrice";
import { indentToRows } from "@/screens/HospitalBilling/utils/indentToRows";
export function SupplyModal({ mode, onClose, prefillIndentId, }: SupplyModalProps) {
    const { inventory, wards, issueWardSupply, returnWardSupply, wardIndents, profile, hospitalAccount, toast, } = usePharma();
    const cp = useCreditPrice();
    const stocked = inventory.filter((p) => stockOf(p) > 0);
    const openIndents = wardIndents.filter((i) => i.status === "pending" || i.status === "approved");
    const prefill = prefillIndentId ? wardIndents.find((i) => i.id === prefillIndentId) : null;
    const prefillRows = prefill ? indentToRows(prefill, inventory, cp) : [];
    const [wardId, setWardId] = useState(prefill?.wardId ?? wards[0]?.id ?? "");
    const [indentId, setIndentId] = useState(prefill?.id ?? "");
    const [reason, setReason] = useState<WardSupplyReason>("floor");
    const [patientId, setPatientId] = useState("");
    const [patientName, setPatientName] = useState("");
    const [refDoc, setRefDoc] = useState("");
    type Row = {
        productId: string;
        qty: number;
        price: number;
        batchNo?: string;
    };
    const defBatch = (id: string) => {
        const p = inventory.find((x) => x.id === id);
        return earliestBatch(p!)?.batchNo;
    };
    const [rows, setRows] = useState<Row[]>(() => prefillRows.map((r) => ({ ...r, batchNo: defBatch(r.productId) })));
    const [scan, setScan] = useState("");
    const [picking, setPicking] = useState(false);
    const [pq, setPq] = useState("");
    const pickResults = stocked
        .filter((p) => !pq.trim() ||
        `${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(pq.toLowerCase()))
        .slice(0, 9);
    const addRowFor = (id: string) => {
        setRows((r) => [...r, { productId: id, qty: 1, price: cp(id), batchNo: defBatch(id) }]);
        setPicking(false);
        setPq("");
    };
    // a fully-matched indent jumps straight to the invoice preview
    const [view, setView] = useState<"edit" | "invoice">(mode === "issue" &&
        !!prefill &&
        prefillRows.length > 0 &&
        prefillRows.length === prefill!.items.length
        ? "invoice"
        : "edit");
    const ward = wards.find((w) => w.id === wardId);
    const pickIndent = (id: string) => {
        setIndentId(id);
        const ind = wardIndents.find((i) => i.id === id);
        if (ind) {
            setWardId(ind.wardId);
            setRows(indentToRows(ind, inventory, cp).map((r) => ({ ...r, batchNo: defBatch(r.productId) })));
        }
    };
    const setRow = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => j === i
        ? {
            ...x,
            ...patch,
            ...(patch.productId
                ? { price: cp(patch.productId), batchNo: defBatch(patch.productId) }
                : {}),
        }
        : x));
    const delRow = (i: number) => setRows((r) => r.filter((_, j) => j !== i));
    const onScan = () => {
        const code = scan.trim();
        if (!code) {
            return;
        }
        const hit = findScan(inventory, code);
        if (!hit) {
            toast(`No match for “${code}”`);
            setScan("");
            return;
        }
        setRows((r) => [
            ...r,
            {
                productId: hit.product.id,
                qty: 1,
                price: cp(hit.product.id),
                batchNo: hit.batch?.batchNo ?? defBatch(hit.product.id),
            },
        ]);
        toast(`${hit.product.name}${hit.batch ? " · Batch " + hit.batch.batchNo : ""}`);
        setScan("");
    };
    const total = rows.reduce((a, x) => a + x.qty * x.price, 0);
    const refillNeedsPatient = mode === "issue" && reason === "refill" && !patientId.trim();
    const valid = !!ward &&
        rows.length > 0 &&
        rows.every((x) => x.qty > 0 && x.price >= 0) &&
        !refillNeedsPatient;
    const buildItems = (): WardSupplyItem[] => rows.map((x) => {
        const p = inventory.find((y) => y.id === x.productId)!;
        const b = (x.batchNo && p.batches.find((z) => z.batchNo === x.batchNo)) || earliestBatch(p);
        return {
            productId: p.id,
            name: p.name,
            batchNo: b?.batchNo ?? "—",
            expiry: b?.expiry ?? "—",
            hsn: p.hsn,
            gst: p.gst,
            qty: x.qty,
            price: x.price,
            amount: Math.round(x.qty * x.price * 100) / 100,
            mrp: b?.mrp ?? mrpOf(p),
        };
    });
    const save = async () => {
        if (!valid || !ward)
            return;
        const draft = {
            wardId: ward.id,
            wardName: ward.name,
            reason: mode === "return" ? ("floor" as WardSupplyReason) : reason,
            patientId: reason === "refill" ? patientId.trim() : undefined,
            patientName: reason === "refill" ? patientName.trim() : undefined,
            items: buildItems(),
            refDoc: refDoc.trim() || indentId || undefined,
            indentId: mode === "issue" && indentId ? indentId : undefined,
        };
        const res = mode === "return" ? await returnWardSupply(draft) : await issueWardSupply(draft);
        if (res)
            onClose();
        else
            setView("edit");
    };
    // invoice preview before sending to the hospital
    if (mode === "issue" && view === "invoice" && ward && valid) {
        return (<WardSupplyInvoice data={{
                invoiceNo: "DRAFT",
                at: Date.now(),
                wardName: ward.name,
                reason,
                patientId: reason === "refill" ? patientId.trim() : undefined,
                patientName: reason === "refill" ? patientName.trim() : undefined,
                refDoc: refDoc.trim() || undefined,
                indentId: indentId || undefined,
                items: buildItems(),
            }} profile={profile} account={hospitalAccount} onClose={onClose} onEdit={setViewOnEdit} onConfirm={save}/>);
    }
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box className="!flex !max-h-[90vh] !w-full !max-w-[720px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop" onClick={stopPropagationOnClick}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>{mode === "return" ? "Record return from ward" : "Issue stock to ward"}</Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          {mode === "issue" && (<Box className={cn("!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2", "!mb-3")}>
              <Label>Link a ward indent (optional — bills & closes the requisition)</Label>
              <Select className="" value={indentId} onChange={pickIndentOnChange} options={[{ value: "", label: "\u2014 None \u00b7 ad-hoc issue \u2014" }, ...openIndents.map(renderOpenIndent)]} />
            </Box>)}
          <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="ward">
              <Label>Ward</Label>
              <Select className="" value={wardId} onChange={setWardIdOnChange} options={[...(wards.map(renderWard))]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Reference (indent / doc)</Label>
              <Input className="" value={refDoc} onChange={setRefDocOnChange} placeholder="e.g. IND-4012"/>
            </Box>
          </Box>

          {mode === "issue" && (<Box className={cn("!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2", "!mt-3")}>
              <Label>Reason (informational — bill always goes to the hospital)</Label>
              <Box className={cn("!flex !items-center !gap-1.5", "!mt-1 !flex-wrap")}>
                {SUPPLY_REASONS.map(renderSUPPLYREASONS)}
              </Box>
            </Box>)}
          {mode === "issue" && reason === "refill" && (<Box className={cn("!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1", "!mt-3 !bg-wash-2 !p-3 !rounded-[10px]")}>
              <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                <Label>Patient ID / MRN *</Label>
                <Input className="!font-mono" value={patientId} onChange={setPatientIdOnChange} placeholder="Hospital MRN"/>
              </Box>
              <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                <Label>Patient name</Label>
                <Input className="" value={patientName} onChange={setPatientNameOnChange} placeholder="For traceability"/>
              </Box>
              <Text className={cn("!text-muted !col-span-2 max-[767px]:!col-span-1", "!text-[11.5px] !col-span-full")}>
                <IconTag size={12}/> Recorded only as a breadcrumb — the bill still goes to the
                hospital, which recovers this from the patient.
              </Text>
            </Box>)}

          <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mt-4 !mx-0 !mb-2")}>
            <Text as="span" className="font-bold">Medicines</Text>
            <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={setPickingOnClick}>
              <IconPlus size={13}/> Add medicine
            </Button>
          </Box>
          <Box className={cn("!flex !min-w-[280px] !flex-1 !items-center !gap-2 !rounded-sm !border-[1.5px] !border-mid !bg-wash-2 !py-1 !pr-1.5 !pl-[11px] [&_input]:!flex-1 [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!px-0.5 [&_input]:!py-1.5 [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none", "!mb-2.5")}>
            <Text className="!text-[16px] !text-mid" as="span">
              <IconCamera size={16}/>
            </Text>
            <Input placeholder="Scan barcode / type batch no. + Enter" value={scan} onChange={setScanOnChange} onKeyDown={preventDefaultOnKeyDown}/>
            <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={onScan} disabled={!scan.trim()}>
              Add
            </Button>
          </Box>
          {picking && (<Box className="!rounded-md !border !border-line">
              <Box className={cn("!flex !max-w-[360px] !min-w-[240px] !flex-1 !items-center !gap-2 !rounded-sm !border !border-line-2 !bg-paper !px-3 !py-2 [&_input]:!w-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none", "!flex-1")}>
                <Text className="!text-green" as="span">
                  <IconSearch size={16}/>
                </Text>
                <Input autoFocus placeholder="Search medicine by name, salt, brand…" value={pq} onChange={setPqOnChange}/>
              </Box>
              <Box className="!max-h-60 !overflow-auto">
                {pickResults.map(renderPickResult)}
                {pickResults.length === 0 && (<Box className={cn("!text-muted", "!py-2.5 !px-3 !text-[12.5px]")}>
                    No medicine matches “{pq}”.
                  </Box>)}
              </Box>
            </Box>)}
          {rows.length === 0 && (<Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink", "!p-4.5")}>
              Add medicines to {mode === "return" ? "return" : "issue"} — scan, or “Add medicine”.
            </Box>)}
          {rows.map(renderRow)}

          <Box className={cn("!flex !items-center !justify-between !py-1.5 !text-[13px] font-display text-[18px] font-extrabold text-dark", "!mt-3 !pt-3 !border-t !border-line")}>
            <Text as="span">{mode === "return" ? "Credit note to hospital" : "Billed to hospital a/c"}</Text>
            <Text as="span">{inr(total)}</Text>
          </Box>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          {refillNeedsPatient && (<Text className={cn("!text-rose !text-[12px] !mr-auto")} as="span">
              Patient MRN required for a refill
            </Text>)}
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onClose}>
            Cancel
          </Button>
          {mode === "return" ? (<Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={!valid} onClick={save}>
              Record return · {inr(total)}
            </Button>) : (<Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={!valid} onClick={setViewOnClick}>
              Preview invoice · {inr(total)} →
            </Button>)}
        </Box>
      </Box>
    </Box>);
    function setViewOnEdit() {
        return setView("edit");
    }
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function pickIndentOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return pickIndent(e.target.value);
    }
    function renderOpenIndent(i: WardIndent) {
        return { value: String(i.id), label: String(i.id) + " \u00b7 " + String(i.wardName) + " \u00b7 " + String(i.items.length) + " item" + String(i.items.length !== 1 ? "s" : "") + " " + String(i.patient ? " · " + i.patient : "") };
    }
    function setWardIdOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return setWardId(e.target.value);
    }
    function renderWard(w: Ward) {
        return { value: String(w.id), label: String(w.name) };
    }
    function setRefDocOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setRefDoc(e.target.value);
    }
    function renderSUPPLYREASONS(r: {
        key: WardSupplyReason;
        label: string;
        tag: string;
    }) {
        return (<Button key={r.key} className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${reason === r.key ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={setReasonOnClick}>
                    <SupplyReasonIcon k={r.key} size={15}/> {r.label}
                  </Button>);
        function setReasonOnClick() {
            return setReason(r.key);
        }
    }
    function setPatientIdOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setPatientId(e.target.value);
    }
    function setPatientNameOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setPatientName(e.target.value);
    }
    function setPickingOnClick() {
        setPicking((v) => !v);
        setPq("");
    }
    function setScanOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setScan(e.target.value);
    }
    function preventDefaultOnKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            onScan();
        }
    }
    function setPqOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setPq(e.target.value);
    }
    function renderPickResult(p: InvProduct) {
        return (<Button key={p.id} className="!flex !w-full !items-center !justify-between !border-b !border-line !px-3 !py-2 !text-left hover:!bg-wash-2" onClick={addRowForOnClick}>
                    <Text as="span" className="font-bold">{p.name}</Text>
                    <Text className="!text-muted" as="span">
                      {" "}
                      · {p.composition || p.manufacturer} · {stockOf(p)} in stock · MRP{" "}
                      {inr(mrpOf(p))}
                      {hasLocation(p) ? ` · ${p.rack}` : ""}
                    </Text>
                  </Button>);
        function addRowForOnClick() {
            return addRowFor(p.id);
        }
    }
    function renderRow(x: Row, i: number) {
        const p = inventory.find(matchInventory);
        return (<Box key={i} className={cn("!flex !items-center !gap-1.5", "!mb-2 !items-center !flex-wrap")}>
                <Select value={x.productId} onChange={setRowOnChange} className={cn("", "!flex-[2_1_180px]")} options={[...(stocked.map(renderStocked))]} />
                <Select value={x.batchNo ?? ""} onChange={setRowOnChange2} title="Batch" className={cn("!font-mono", "!flex-[1_1_150px] !text-[12px]")} options={[...((p?.batches ?? []).map(renderBb))]} />
                <QtyBox qty={x.qty} max={p ? stockOf(p) : undefined} onDec={setRowOnDec} onInc={setRowOnInc} onSet={setRowOnSet} onRemove={delRowOnRemove}/>
                <Text className={cn("!text-muted", "!text-[12px]")} as="span">
                  ×
                </Text>
                <Input type="number" min={0} value={x.price} onChange={setRowOnChange3} title="Credit price" className={cn("!font-mono", "!w-[78px] !text-right")}/>
                <Text className={cn("!w-[82px] !text-right !font-extrabold")} as="span">
                  {inr(x.qty * x.price)}
                </Text>
              </Box>);
        function matchInventory(y: InvProduct) {
            return y.id === x.productId;
        }
        function setRowOnChange(e: ChangeEvent<HTMLSelectElement>) {
            return setRow(i, { productId: e.target.value });
        }
        function renderStocked(pp: InvProduct) {
            return { value: String(pp.id), label: String(pp.name) + " (" + String(stockOf(pp)) + " in stock)" };
        }
        function setRowOnChange2(e: ChangeEvent<HTMLSelectElement>) {
            return setRow(i, { batchNo: e.target.value || undefined });
        }
        function renderBb(bb: Batch) {
            return { value: String(bb.batchNo), label: "Batch " + String(bb.batchNo) + " \u00b7 " + String(bb.expiry) + " \u00b7 " + String(bb.qty) };
        }
        function setRowOnDec() {
            return setRow(i, { qty: Math.max(1, x.qty - 1) });
        }
        function setRowOnInc() {
            return setRow(i, { qty: x.qty + 1 });
        }
        function setRowOnSet(n: number) {
            return setRow(i, { qty: Math.max(1, n) });
        }
        function delRowOnRemove() {
            return delRow(i);
        }
        function setRowOnChange3(e: ChangeEvent<HTMLInputElement>) {
            return setRow(i, { price: Math.max(0, Number(e.target.value) || 0) });
        }
    }
    function setViewOnClick() {
        return setView("invoice");
    }
}
