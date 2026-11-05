import { RackMap } from "@/screens/RackMap/components/RackMap";
import { RackDetailModal } from "@/screens/RackMap/components/RackDetailModal";
import { MedicineDetailModal } from "@/screens/RackMap/components/MedicineDetailModal";
import { AssignLocations } from "@/screens/RackMap/components/AssignLocations";
import { LabelSheet } from "@/screens/RackMap/components/LabelSheet";
import { useState, useMemo } from "react";
import { usePharma } from "@/store/slices/session";
import { hasLocation, groupByLocation, normalizeRack } from "@/utils";
import {
  IconSearch,
  IconInventory,
  IconPrint,
  IconReports,
  IconMap,
  IconPin,
  IconHelp,
} from "@/components/Icon";
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

  const unassigned = inventory.filter((p) => !hasLocation(p));
  const groups = useMemo(() => groupByLocation(inventory, racks), [inventory, racks]);
  const zones = new Set(groups.map((g) => g.zone));
  const detail = openRack
    ? (groups.find((g) => g.code === openRack) ?? { code: openRack, zone: "", items: [] })
    : null;
  const med = medId ? (inventory.find((p) => p.id === medId) ?? null) : null;

  return (
    <div className="pd-canvas-wide">
      <div className="pd-stats">
        <div className="pd-stat">
          <div className="ic ic-green">
            <IconInventory size={18} />
          </div>
          <div className="lbl">Racks created</div>
          <div className="val">{groups.length}</div>
          <div className="split">cupboards &amp; shelves</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-blue">
            <IconMap size={18} />
          </div>
          <div className="lbl">Racks / zones</div>
          <div className="val">{zones.size}</div>
          <div className="split">in use</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-gold">
            <IconPin size={18} />
          </div>
          <div className="lbl">Medicines mapped</div>
          <div className="val">{inventory.length - unassigned.length}</div>
          <div className="split">with a location</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-rose">
            <IconHelp size={18} />
          </div>
          <div className="lbl">No location yet</div>
          <div className="val">{unassigned.length}</div>
          <div className="split">need allocating</div>
        </div>
      </div>

      <div className="pd-toolbar">
        <div className="pd-seg">
          <button className={tab === "map" ? "on" : ""} onClick={() => setTab("map")}>
            <IconMap size={14} /> Rack map
          </button>
          <button className={tab === "assign" ? "on" : ""} onClick={() => setTab("assign")}>
            <IconPin size={14} /> Assign locations
            {unassigned.length ? " · " + unassigned.length : ""}
          </button>
        </div>
        <div className="pd-spacer" />
        <div className="pd-search-inline">
          <span className="ic">
            <IconSearch size={17} />
          </span>
          <input
            placeholder="Search medicine or rack code (e.g. A3-12)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button
          className="pd-btn pd-btn-ghost"
          onClick={() => {
            exportRackAuditCsv(inventory, now);
            toast("Rack & storage audit exported");
          }}
          disabled={!inventory.length}
        >
          <IconReports size={16} /> Audit Excel
        </button>
        <button
          className="pd-btn pd-btn-ghost"
          onClick={() => setLabels(true)}
          disabled={!groups.length}
        >
          <IconPrint size={16} /> Print rack labels
        </button>
      </div>

      {tab === "map" ? (
        <RackMap
          groups={groups}
          q={q}
          unassigned={unassigned}
          onGoAssign={() => setTab("assign")}
          createRack={async (c) => {
            const result = await createRack(c);
            if (result === "added") {
              toast(`Rack ${normalizeRack(c)} created`);
              return true;
            }
            if (result === "exists") toast("That rack already exists");
            return false;
          }}
          onOpen={(c) => setOpenRack(c)}
          onMed={(id) => setMedId(id)}
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

      {labels && <LabelSheet groups={groups} onClose={() => setLabels(false)} />}
      {detail && (
        <RackDetailModal
          code={detail.code}
          items={detail.items}
          inventory={inventory}
          onClose={() => setOpenRack(null)}
          onMed={(id) => setMedId(id)}
          onAdd={async (id) => {
            const p = inventory.find((x) => x.id === id);
            if (!(await setProductLocation(id, detail.code)))
              toast(`${p?.name ?? "Item"} → ${detail.code}`);
          }}
          onRemoveItem={() => {
            toast("Records cannot be deleted");
          }}
          onDeleteRack={() => {
            toast("Records cannot be deleted");
          }}
        />
      )}
      {med && <MedicineDetailModal p={med} now={now} onClose={() => setMedId(null)} />}
    </div>
  );
}

// ── rack map: medicines grouped by physical location ────────────

// ── open a rack: arrange medicines in it (search + add / remove) ─

// ── medicine details (stock, batches, expiry, value) ────────────

// ── assign / re-arrange locations ───────────────────────────────

// ── printable rack-label sheet (stick on each shelf/bin) ─────────
