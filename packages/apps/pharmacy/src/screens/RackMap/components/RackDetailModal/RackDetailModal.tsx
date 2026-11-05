import { useState } from "react";
import { InvProduct, stockOf, hasLocation, locationCodes } from "@/utils";
import { Thumb } from "@/components/Thumb";
import { IconSearch, IconX, IconFolder, IconBox } from "@/components/Icon";

export function RackDetailModal({
  code,
  items,
  inventory,
  onClose,
  onAdd,
  onMed,
}: {
  code: string;
  items: InvProduct[];
  inventory: InvProduct[];
  onClose: () => void;
  onAdd: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onDeleteRack: () => void;
  onMed: (id: string) => void;
}) {
  const [pq, setPq] = useState("");
  const t = pq.trim().toLowerCase();
  const here = new Set(items.map((p) => p.id));
  const results = inventory
    .filter(
      (p) =>
        !here.has(p.id) &&
        (!t || `${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(t)),
    )
    .slice(0, 8);

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <h3>
            <IconFolder size={16} /> Rack <span className="pd-mono">{code}</span>
          </h3>
          <button className="pd-x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          {/* search + add */}
          <div className="pd-field" style={{ marginBottom: 10 }}>
            <label>Add medicine to this rack</label>
            <div className="pd-search-inline" style={{ width: "100%" }}>
              <span className="ic">
                <IconSearch size={16} />
              </span>
              <input
                autoFocus
                placeholder="Search medicine by name, salt, brand…"
                value={pq}
                onChange={(e) => setPq(e.target.value)}
              />
            </div>
          </div>
          {pq.trim() && (
            <div className="pd-pickbox" style={{ marginBottom: 14 }}>
              <div className="pd-picklist">
                {results.map((p) => (
                  <button key={p.id} className="pd-pickitem" onClick={() => onAdd(p.id)}>
                    <b>{p.name}</b>
                    <span className="pd-muted">
                      {" "}
                      · {p.composition || p.manufacturer} · {stockOf(p)} in stock
                      {hasLocation(p) ? ` · now at ${locationCodes(p).join(" · ")}` : ""}
                    </span>
                  </button>
                ))}
                {results.length === 0 && (
                  <div className="pd-muted" style={{ padding: "10px 12px", fontSize: 12.5 }}>
                    No other medicine matches “{pq}”.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* medicines currently in this rack */}
          <div className="pd-flex" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <b style={{ fontSize: 13 }}>In this rack</b>
            <span className="pd-muted" style={{ fontSize: 12 }}>
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          </div>
          {items.length === 0 ? (
            <div className="pd-empty" style={{ padding: "20px 10px" }}>
              <div className="em">
                <IconBox size={28} />
              </div>
              <p>No medicines here yet. Search above to add some.</p>
            </div>
          ) : (
            <div
              className="pd-rackcard-list scroll tall"
              style={{ border: "1px solid var(--line)", borderRadius: "var(--r)" }}
            >
              {items.map((p) => (
                <div className="pd-rackrow" key={p.id}>
                  <button
                    className="pd-rackrow-main"
                    onClick={() => onMed(p.id)}
                    title="View medicine details"
                  >
                    <span className="em">
                      <Thumb p={p} />
                    </span>
                    <span className="nm">
                      {p.name}
                      <span className="pd-muted" style={{ fontSize: 11 }}>
                        {" "}
                        · {p.composition}
                      </span>
                    </span>
                    <span className={`pd-pill ${stockOf(p) === 0 ? "pill-rose" : "pill-gray"}`}>
                      {stockOf(p)}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="pd-modal-foot">
          <div className="pd-spacer" />
          <button className="pd-btn pd-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
