import { useState, useMemo } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  InvProduct, stockOf, hasLocation, groupByLocation, composeRack,
  matchesLocation, locationCodes, normalizeRack, inr, inr2, stockValue, mrpOf, looseUnitsOf,
  monthsToExpiry, isExpired, catLabel, packNoun, plural, unitNoun, stockLabel,
} from "@/domain";
import { Thumb, ScheduleTag } from "@/components/bits";
import { IconSearch, IconInventory, IconPrint, IconCheck, IconX, IconPlus, IconTrash, IconReports, IconMap, IconPin, IconHelp, IconFolder, IconBox, IconUnlock, IconReceipt, IconTag } from "@/components/Icon";
import { exportRackAuditCsv } from "@/features/inventory/stockExport";

type Tab = "map" | "assign";

export function RackMap({ groups, q, unassigned, onGoAssign, createRack, onOpen, onMed }: {
  groups: { code: string; zone: string; items: InvProduct[] }[]; q: string; unassigned: InvProduct[];
  onGoAssign: () => void; createRack: (code: string) => Promise<boolean>; onOpen: (code: string) => void; onMed: (id: string) => void;
}) {
  const t = q.trim().toLowerCase();
  const [nr, setNr] = useState("");
  const matchProd = (p: InvProduct) => !t || `${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(t) || matchesLocation(p, t);
  const shown = groups
    .map((g) => ({ ...g, items: g.items.filter(matchProd) }))
    .filter((g) => (!t ? true : g.items.length > 0 || g.code.toLowerCase().includes(t)));
  const submitNew = async () => { if (nr.trim() && await createRack(nr)) setNr(""); };

  return (
    <>
      {/* create a rack manually */}
      <div className="pd-card pd-card-pad" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <b style={{ fontSize: 13 }}><IconFolder size={15} /> Create a rack</b>
        <input className="pd-input pd-mono" data-field="rack" style={{ width: 130 }} value={nr} onChange={(e) => setNr(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === "Enter") void submitNew(); }} placeholder="e.g. A3-12" />
        <button className="pd-btn pd-btn-primary pd-btn-sm" disabled={!nr.trim()} onClick={submitNew}><IconPlus size={14} /> Add rack</button>
        <span className="pd-muted" style={{ fontSize: 11.5, flex: "1 1 100%", lineHeight: 1.5 }}>Make the on-screen code identical to the printed shelf label. Click any rack below to add / arrange medicines inside it.</span>
      </div>

      {unassigned.length > 0 && !t && (
        <div className="pd-card pd-card-pad" style={{ background: "var(--amber-bg)", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}><IconHelp size={22} /></span>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13.5 }}>{unassigned.length} medicine{unassigned.length !== 1 ? "s" : ""} have no rack location yet</b>
            <div className="pd-muted" style={{ fontSize: 12 }}>Assign them so staff can find stock on the shelves quickly.</div>
          </div>
          <button className="pd-btn pd-btn-primary pd-btn-sm" onClick={onGoAssign}>Assign now →</button>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="pd-card"><div className="pd-empty"><div className="em"><IconMap size={28} /></div><p>{q ? `No locations match “${q}”.` : "No racks yet — create one above."}</p></div></div>
      ) : (
        <div className="pd-rackgrid">
          {shown.map((g) => (
            <div className="pd-rackcard" key={g.code}>
              <button className="pd-rackcard-head" onClick={() => onOpen(g.code)} title={`Manage rack ${g.code}`}>
                <span className="code">{g.code}</span>
                <span className="pd-muted" style={{ fontSize: 11.5 }}>{g.items.length} item{g.items.length !== 1 ? "s" : ""} · manage ›</span>
              </button>
              <div className="pd-rackcard-list scroll">
                {g.items.map((p) => (
                  <button className="pd-rackrow click" key={p.id} onClick={() => onMed(p.id)} title="View medicine details">
                    <span className="em"><Thumb p={p} /></span>
                    <span className="nm">{p.name}<span className="pd-muted" style={{ fontSize: 11 }}> · {p.composition}</span></span>
                    <span className={`pd-pill ${stockOf(p) === 0 ? "pill-rose" : "pill-gray"}`}>{stockOf(p)} in stock</span>
                  </button>
                ))}
                {g.items.length === 0 && <button className="pd-rackrow pd-muted click" style={{ fontSize: 12, justifyContent: "center" }} onClick={() => onOpen(g.code)}>Empty — click to add medicines</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
