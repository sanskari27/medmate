import { useState, useMemo, useEffect } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import { inr, fmtDateTime, mrpOf, stockOf, earliestBatch, PayMode, PAY_LABEL, InvProduct, findScan, hasLocation, waLink, smsLink, timeAgo } from "@/domain";
import { WardIndent } from "@/features/hospital/hospital";
import {
  CreditTerms, CREDIT_TERMS, SUPPLY_REASONS, WardSupplyReason, reasonMeta, WardSupplyItem, WardSupply,
  creditPriceOf, hospitalOutstanding, suppliedTotal, returnedTotal, paidTotal,
  wardOnHand, buildStatement, termDays, PriceMode,
  hospitalAging, wardConsumption, topSuppliedItems, monthlyHospitalFlow,
} from "@/features/hospital/hospitalAccount";
import {
  IconSearch, IconPlus, IconX, IconRupee, IconReports, IconPrint, IconTrash, IconLock, IconUnlock,
  IconHospital, IconReceipt, IconTag, IconKey, IconCamera, IconArrowRight, IconAlert, IconChart,
  IconWhatsApp, IconMail, IconSend, IconWallet, IconBox, IconShield, IconCalendar, IconCheck, IconCopy, IconStore,
} from "@/components/Icon"
import { SupplyReasonIcon, monogramOf } from "@/components/entityIcon";
import { buildReportPdf } from "@/features/reports/pdf";
import { useDateRange } from "@/components/DateRangeField";
import WardSupplyInvoice, { SupplyInvoiceData } from "@/features/hospital/billing/WardSupplyInvoice";
import QtyBox from "@/components/QtyBox";

import { useCreditPrice } from "./useCreditPrice";
import { indentToRows } from "./indentToRows";

;

type LineType = "all" | "issue" | "return" | "payment";

const LINE_FILTERS: { k: LineType; label: string }[] = [{ k: "all", label: "All" }, { k: "issue", label: "Supplied" }, { k: "return", label: "Returns" }, { k: "payment", label: "Payments" }];

const REASON_TONE: Record<WardSupplyReason, string> = { floor: "pill-blue", consumption: "pill-gold", refill: "pill-teal" };

type Tab = "overview" | "issue" | "stock" | "account" | "prices";

export function SupplyModal({ mode, onClose, prefillIndentId }: { mode: "issue" | "return"; onClose: () => void; prefillIndentId?: string | null }) {
  const { inventory, wards, issueWardSupply, returnWardSupply, wardIndents, profile, hospitalAccount, toast } = usePharma();
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
  type Row = { productId: string; qty: number; price: number; batchNo?: string };
  const defBatch = (id: string) => { const p = inventory.find((x) => x.id === id); return earliestBatch(p!)?.batchNo; };
  const [rows, setRows] = useState<Row[]>(() => prefillRows.map((r) => ({ ...r, batchNo: defBatch(r.productId) })));
  const [scan, setScan] = useState("");
  const [picking, setPicking] = useState(false);
  const [pq, setPq] = useState("");
  const pickResults = stocked.filter((p) => !pq.trim() || `${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(pq.toLowerCase())).slice(0, 9);
  const addRowFor = (id: string) => { setRows((r) => [...r, { productId: id, qty: 1, price: cp(id), batchNo: defBatch(id) }]); setPicking(false); setPq(""); };
  // a fully-matched indent jumps straight to the invoice preview
  const [view, setView] = useState<"edit" | "invoice">(mode === "issue" && !!prefill && prefillRows.length > 0 && prefillRows.length === prefill!.items.length ? "invoice" : "edit");
  const ward = wards.find((w) => w.id === wardId);

  const pickIndent = (id: string) => {
    setIndentId(id);
    const ind = wardIndents.find((i) => i.id === id);
    if (ind) { setWardId(ind.wardId); setRows(indentToRows(ind, inventory, cp).map((r) => ({ ...r, batchNo: defBatch(r.productId) }))); }
  };
  const addRow = () => { const p = stocked[0]; if (!p) return; setRows((r) => [...r, { productId: p.id, qty: 1, price: cp(p.id), batchNo: defBatch(p.id) }]); };
  const setRow = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch, ...(patch.productId ? { price: cp(patch.productId), batchNo: defBatch(patch.productId) } : {}) } : x)));
  const delRow = (i: number) => setRows((r) => r.filter((_, j) => j !== i));
  const onScan = () => {
    const code = scan.trim(); if (!code) { return; }
    const hit = findScan(inventory, code);
    if (!hit) { toast(`No match for “${code}”`); setScan(""); return; }
    setRows((r) => [...r, { productId: hit.product.id, qty: 1, price: cp(hit.product.id), batchNo: hit.batch?.batchNo ?? defBatch(hit.product.id) }]);
    toast(`${hit.product.name}${hit.batch ? " · Batch " + hit.batch.batchNo : ""}`);
    setScan("");
  };
  const total = rows.reduce((a, x) => a + x.qty * x.price, 0);
  const refillNeedsPatient = mode === "issue" && reason === "refill" && !patientId.trim();
  const valid = !!ward && rows.length > 0 && rows.every((x) => x.qty > 0 && x.price >= 0) && !refillNeedsPatient;

  const buildItems = (): WardSupplyItem[] => rows.map((x) => { const p = inventory.find((y) => y.id === x.productId)!; const b = (x.batchNo && p.batches.find((z) => z.batchNo === x.batchNo)) || earliestBatch(p); return { productId: p.id, name: p.name, batchNo: b?.batchNo ?? "—", expiry: b?.expiry ?? "—", hsn: p.hsn, gst: p.gst, qty: x.qty, price: x.price, amount: Math.round(x.qty * x.price * 100) / 100, mrp: b?.mrp ?? mrpOf(p) }; });
  const save = async () => {
    if (!valid || !ward) return;
    const draft = { wardId: ward.id, wardName: ward.name, reason: mode === "return" ? "floor" as WardSupplyReason : reason, patientId: reason === "refill" ? patientId.trim() : undefined, patientName: reason === "refill" ? patientName.trim() : undefined, items: buildItems(), refDoc: refDoc.trim() || (indentId || undefined), indentId: mode === "issue" && indentId ? indentId : undefined };
    const res = mode === "return" ? await returnWardSupply(draft) : await issueWardSupply(draft);
    if (res) onClose();
    else setView("edit");
  };

  // invoice preview before sending to the hospital
  if (mode === "issue" && view === "invoice" && ward && valid) {
    return <WardSupplyInvoice
      data={{ invoiceNo: "DRAFT", at: Date.now(), wardName: ward.name, reason, patientId: reason === "refill" ? patientId.trim() : undefined, patientName: reason === "refill" ? patientName.trim() : undefined, refDoc: refDoc.trim() || undefined, indentId: indentId || undefined, items: buildItems() }}
      profile={profile} account={hospitalAccount} onClose={onClose} onEdit={() => setView("edit")} onConfirm={save} />;
  }

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head"><h3>{mode === "return" ? "Record return from ward" : "Issue stock to ward"}</h3><button className="pd-iconbtn" onClick={onClose}><IconX size={18} /></button></div>
        <div className="pd-modal-body">
          {mode === "issue" && (
            <div className="pd-field" style={{ marginBottom: 12 }}><label>Link a ward indent (optional — bills & closes the requisition)</label>
              <select className="pd-select" value={indentId} onChange={(e) => pickIndent(e.target.value)}>
                <option value="">— None · ad-hoc issue —</option>
                {openIndents.map((i) => <option key={i.id} value={i.id}>{i.id} · {i.wardName} · {i.items.length} item{i.items.length !== 1 ? "s" : ""}{i.patient ? " · " + i.patient : ""}</option>)}
              </select>
            </div>
          )}
          <div className="pd-form-grid">
            <div className="pd-field" data-field="ward"><label>Ward</label><select className="pd-select" value={wardId} onChange={(e) => setWardId(e.target.value)}>{wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
            <div className="pd-field"><label>Reference (indent / doc)</label><input className="pd-input" value={refDoc} onChange={(e) => setRefDoc(e.target.value)} placeholder="e.g. IND-4012" /></div>
          </div>

          {mode === "issue" && (
            <div className="pd-field" style={{ marginTop: 12 }}><label>Reason (informational — bill always goes to the hospital)</label>
              <div className="pd-flex pd-gap6" style={{ marginTop: 4, flexWrap: "wrap" }}>
                {SUPPLY_REASONS.map((r) => <button key={r.key} className={`pd-chip${reason === r.key ? " on" : ""}`} onClick={() => setReason(r.key)}><SupplyReasonIcon k={r.key} size={15} /> {r.label}</button>)}
              </div>
            </div>
          )}
          {mode === "issue" && reason === "refill" && (
            <div className="pd-form-grid" style={{ marginTop: 12, background: "var(--wash2)", padding: 12, borderRadius: 10 }}>
              <div className="pd-field"><label>Patient ID / MRN *</label><input className="pd-input pd-mono" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Hospital MRN" /></div>
              <div className="pd-field"><label>Patient name</label><input className="pd-input" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="For traceability" /></div>
              <p className="pd-muted pd-span2" style={{ fontSize: 11.5, gridColumn: "1/-1" }}><IconTag size={12} /> Recorded only as a breadcrumb — the bill still goes to the hospital, which recovers this from the patient.</p>
            </div>
          )}

          <div className="pd-flex" style={{ justifyContent: "space-between", margin: "16px 0 8px" }}>
            <b>Medicines</b>
            <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={() => { setPicking((v) => !v); setPq(""); }}><IconPlus size={13} /> Add medicine</button>
          </div>
          <div className="pd-scanbar" style={{ marginBottom: 10 }}>
            <span className="ic"><IconCamera size={16} /></span>
            <input placeholder="Scan barcode / type batch no. + Enter" value={scan} onChange={(e) => setScan(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onScan(); } }} />
            <button className="pd-btn pd-btn-primary pd-btn-sm" onClick={onScan} disabled={!scan.trim()}>Add</button>
          </div>
          {picking && (
            <div className="pd-pickbox">
              <div className="pd-search-inline" style={{ flex: 1 }}><span className="ic"><IconSearch size={16} /></span><input autoFocus placeholder="Search medicine by name, salt, brand…" value={pq} onChange={(e) => setPq(e.target.value)} /></div>
              <div className="pd-picklist">
                {pickResults.map((p) => <button key={p.id} className="pd-pickitem" onClick={() => addRowFor(p.id)}><b>{p.name}</b><span className="pd-muted"> · {p.composition || p.manufacturer} · {stockOf(p)} in stock · MRP {inr(mrpOf(p))}{hasLocation(p) ? ` · ${p.rack}` : ""}</span></button>)}
                {pickResults.length === 0 && <div className="pd-muted" style={{ padding: "10px 12px", fontSize: 12.5 }}>No medicine matches “{pq}”.</div>}
              </div>
            </div>
          )}
          {rows.length === 0 && <div className="pd-empty" style={{ padding: "18px" }}>Add medicines to {mode === "return" ? "return" : "issue"} — scan, or “Add medicine”.</div>}
          {rows.map((x, i) => {
            const p = inventory.find((y) => y.id === x.productId);
            return (
              <div key={i} className="pd-flex pd-gap6" style={{ marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select className="pd-select" style={{ flex: "2 1 180px" }} value={x.productId} onChange={(e) => setRow(i, { productId: e.target.value })}>
                  {stocked.map((pp) => <option key={pp.id} value={pp.id}>{pp.name} ({stockOf(pp)} in stock)</option>)}
                </select>
                <select className="pd-select pd-mono" style={{ flex: "1 1 150px", fontSize: 12 }} value={x.batchNo ?? ""} onChange={(e) => setRow(i, { batchNo: e.target.value || undefined })} title="Batch">
                  {(p?.batches ?? []).map((bb) => <option key={bb.batchNo} value={bb.batchNo}>Batch {bb.batchNo} · {bb.expiry} · {bb.qty}</option>)}
                </select>
                <QtyBox
                  qty={x.qty} max={p ? stockOf(p) : undefined}
                  onDec={() => setRow(i, { qty: Math.max(1, x.qty - 1) })}
                  onInc={() => setRow(i, { qty: x.qty + 1 })}
                  onSet={(n) => setRow(i, { qty: Math.max(1, n) })}
                  onRemove={() => delRow(i)}
                />
                <span className="pd-muted" style={{ fontSize: 12 }}>×</span>
                <input className="pd-input pd-mono" type="number" min={0} value={x.price} onChange={(e) => setRow(i, { price: Math.max(0, Number(e.target.value) || 0) })} style={{ width: 78, textAlign: "right" }} title="Credit price" />
                <span style={{ width: 82, textAlign: "right", fontWeight: 800 }}>{inr(x.qty * x.price)}</span>
              </div>
            );
          })}

          <div className="pd-billrow tot" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
            <span>{mode === "return" ? "Credit note to hospital" : "Billed to hospital a/c"}</span><span>{inr(total)}</span>
          </div>
        </div>
        <div className="pd-modal-foot">
          {refillNeedsPatient && <span style={{ color: "var(--rose)", fontSize: 12, marginRight: "auto" }}>Patient MRN required for a refill</span>}
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>Cancel</button>
          {mode === "return"
            ? <button className="pd-btn pd-btn-primary" disabled={!valid} onClick={save}>Record return · {inr(total)}</button>
            : <button className="pd-btn pd-btn-primary" disabled={!valid} onClick={() => setView("invoice")}>Preview invoice · {inr(total)} →</button>}
        </div>
      </div>
    </div>
  );
}
