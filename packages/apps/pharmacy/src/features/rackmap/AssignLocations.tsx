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

import { AssignRow } from "./AssignRow";

type Tab = "map" | "assign";

export function AssignLocations({ inventory, q, setProductLocation, bulkAssignLocation, toast }: {
  inventory: InvProduct[]; q: string;
  setProductLocation: (id: string, rack: string, rackAlt?: string) => Promise<unknown>;
  bulkAssignLocation: (ids: string[], rack: string) => Promise<unknown>;
  toast: (m: string) => void;
}) {
  const [onlyUnset, setOnlyUnset] = useState(true);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [rack, setRack] = useState("");
  const [shelf, setShelf] = useState("");
  const [bin, setBin] = useState("");
  const code = composeRack(rack, shelf, bin);

  const t = q.trim().toLowerCase();
  const list = inventory.filter((p) => {
    if (onlyUnset && hasLocation(p)) return false;
    if (t && !(`${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(t) || matchesLocation(p, t))) return false;
    return true;
  });

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allShownSelected = list.length > 0 && list.every((p) => sel.has(p.id));
  const toggleAll = () => setSel((s) => { const n = new Set(s); if (allShownSelected) list.forEach((p) => n.delete(p.id)); else list.forEach((p) => n.add(p.id)); return n; });

  const assignSelected = async () => {
    if (!code || sel.size === 0) return;
    if (await bulkAssignLocation([...sel], code)) return;
    toast(`${sel.size} medicine${sel.size !== 1 ? "s" : ""} → ${code}`);
    setSel(new Set());
  };

  return (
    <div className="pd-rack-assign">
      {/* location builder */}
      <div className="pd-card pd-card-pad" style={{ marginBottom: 14 }}>
        <div className="pd-flex" style={{ gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="pd-field" data-field="rack" style={{ width: 90 }}><label>Rack</label><input className="pd-input" value={rack} onChange={(e) => setRack(e.target.value.toUpperCase())} placeholder="A" maxLength={4} /></div>
          <div className="pd-field" style={{ width: 80 }}><label>Shelf</label><input className="pd-input" value={shelf} onChange={(e) => setShelf(e.target.value)} placeholder="3" maxLength={3} /></div>
          <div className="pd-field" style={{ width: 80 }}><label>Bin</label><input className="pd-input" value={bin} onChange={(e) => setBin(e.target.value)} placeholder="12" maxLength={4} /></div>
          <div style={{ alignSelf: "stretch", display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
            <div>
              <div className="pd-muted" style={{ fontSize: 11 }}>Location code</div>
              <div className="pd-rack-preview">{code || "—"}</div>
            </div>
          </div>
          <div className="pd-spacer" />
          <button className="pd-btn pd-btn-primary" disabled={!code || sel.size === 0} onClick={assignSelected}>
            <IconCheck size={16} /> Assign to {sel.size || ""} selected
          </button>
        </div>
        <div className="pd-muted" style={{ fontSize: 11.5, marginTop: 10 }}>
          Read like an address: <b>Rack</b> (cupboard A, B, C…) → <b>Shelf</b> (top = 1) → <b>Bin</b> (slot left→right). Keep the on-screen code identical to the printed shelf label. Tip: keep fast-movers in racks nearest the counter.
        </div>
      </div>

      {/* filter row */}
      <div className="pd-flex" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <label className="pd-flex pd-gap6" style={{ cursor: "pointer", fontSize: 13 }}>
          <input type="checkbox" checked={onlyUnset} onChange={(e) => setOnlyUnset(e.target.checked)} /> Show only medicines with no location
        </label>
        <span className="pd-muted" style={{ fontSize: 12.5 }}>{list.length} shown · {sel.size} selected</span>
      </div>

      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" checked={allShownSelected} onChange={toggleAll} aria-label="Select all shown" /></th>
                <th>Medicine</th><th>Stock</th><th>Current location</th><th style={{ width: 200 }}>Set location</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => <AssignRow key={p.id} p={p} checked={sel.has(p.id)} onToggle={() => toggle(p.id)} onSave={async (v) => { if (!await setProductLocation(p.id, v)) toast(`${p.name} → ${v}`); }} fillCode={code} />)}
              {list.length === 0 && <tr><td colSpan={5}><div className="pd-empty"><div className="em"><IconCheck size={28} /></div><p>{onlyUnset ? "Every medicine has a location. Nice and tidy!" : "No medicines match."}</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
