import { useState } from "react";
import { usePharma } from "@/store/slices/session";
import {
  SupplyEntry,
  InvProduct,
  inr2,
  effectiveSupplyPrice,
  schemeLabel,
  isDevice,
  mrpOf,
} from "@/utils";
import { IconX, IconCheck } from "@/components/Icon";

export function SupplyModal({
  init,
  onClose,
  onSave,
}: {
  init?: SupplyEntry;
  onClose: () => void;
  onSave: (d: Omit<SupplyEntry, "id">) => void;
}) {
  const { inventory, suppliers, supplyList } = usePharma();
  const [f, setF] = useState<Omit<SupplyEntry, "id">>(
    init
      ? { ...init }
      : {
          productId: inventory[0]?.id ?? "",
          supplierId: suppliers[0]?.id ?? "",
          purchasePrice: 0,
          mrp: undefined,
          bonusBuy: undefined,
          bonusFree: undefined,
          preferred: false,
          note: "",
        },
  );
  const set = (p: Partial<typeof f>) => setF((s) => ({ ...s, ...p }));
  const prod: InvProduct | undefined = inventory.find((p) => p.id === f.productId);
  const others = supplyList.filter((e) => e.productId === f.productId && e.id !== init?.id);
  // when picking a product, default MRP to its printed MRP for convenience
  const onPickProduct = (id: string) => {
    const p = inventory.find((x) => x.id === id);
    set({ productId: id, mrp: f.mrp ?? (p ? mrpOf(p) : undefined) });
  };
  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="pd-modal-head">
          <h3>{init ? "Edit supply item" : "Add supply item"}</h3>
          <button className="pd-x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          <div className="pd-form-grid">
            <div className="pd-field pd-span2">
              <label>Medicine / device *</label>
              <select
                className="pd-select"
                value={f.productId}
                onChange={(e) => onPickProduct(e.target.value)}
              >
                {inventory.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.pack}
                    {isDevice(p) ? " (device)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="pd-field pd-span2">
              <label>Distributor *</label>
              <select
                className="pd-select"
                value={f.supplierId}
                onChange={(e) => set({ supplierId: e.target.value })}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="pd-field" data-field="amount">
              <label>Purchase price ₹ (per pack) *</label>
              <input
                className="pd-input"
                type="number"
                step="0.01"
                value={f.purchasePrice || ""}
                onChange={(e) => set({ purchasePrice: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="pd-field">
              <label>MRP ₹ (per pack)</label>
              <input
                className="pd-input"
                type="number"
                step="0.01"
                value={f.mrp ?? ""}
                onChange={(e) =>
                  set({ mrp: e.target.value === "" ? undefined : Number(e.target.value) })
                }
              />
            </div>
            <div className="pd-field">
              <label>Bonus — buy</label>
              <input
                className="pd-input"
                type="number"
                value={f.bonusBuy ?? ""}
                onChange={(e) =>
                  set({ bonusBuy: e.target.value === "" ? undefined : Number(e.target.value) })
                }
                placeholder="e.g. 10"
              />
            </div>
            <div className="pd-field">
              <label>… get free</label>
              <input
                className="pd-input"
                type="number"
                value={f.bonusFree ?? ""}
                onChange={(e) =>
                  set({ bonusFree: e.target.value === "" ? undefined : Number(e.target.value) })
                }
                placeholder="e.g. 1"
              />
            </div>
            <div className="pd-field pd-span2">
              <label>Note (credit / shipping)</label>
              <input
                className="pd-input"
                value={f.note || ""}
                onChange={(e) => set({ note: e.target.value })}
                placeholder="e.g. free shipping above ₹5000"
              />
            </div>
          </div>
          {f.purchasePrice > 0 && schemeLabel(f as SupplyEntry) && (
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#1f7a46" }}>
              Landed cost after {schemeLabel(f as SupplyEntry)} scheme:{" "}
              {inr2(effectiveSupplyPrice(f as SupplyEntry))} / pack
            </div>
          )}

          {others.length > 0 && (
            <div
              className="pd-card pd-card-pad"
              style={{ marginTop: 14, background: "var(--wash2)" }}
            >
              <div
                style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}
              >
                {prod?.name} is also supplied by:
              </div>
              <div className="pd-flex" style={{ flexWrap: "wrap", gap: 6 }}>
                {others
                  .slice()
                  .sort((a, b) => effectiveSupplyPrice(a) - effectiveSupplyPrice(b))
                  .map((o) => (
                    <span key={o.id} className="pd-pill pill-gray">
                      {suppliers.find((s) => s.id === o.supplierId)?.name} ·{" "}
                      {inr2(effectiveSupplyPrice(o))}
                      {schemeLabel(o) ? ` (${schemeLabel(o)})` : ""}
                    </span>
                  ))}
              </div>
              {f.purchasePrice > 0 &&
                (() => {
                  const myEff = effectiveSupplyPrice(f as SupplyEntry);
                  const bestOther = Math.min(...others.map((o) => effectiveSupplyPrice(o)));
                  return myEff <= bestOther ? (
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#1f7a46" }}>
                      <IconCheck size={13} /> Lowest landed price — {inr2(bestOther - myEff)}{" "}
                      cheaper than the next.
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: 12, color: "var(--mid)" }}>
                      {inr2(myEff - bestOther)} more than the cheapest current source (landed).
                    </div>
                  );
                })()}
            </div>
          )}

          <div className="pd-flex" style={{ marginTop: 16, gap: 10, alignItems: "center" }}>
            <button
              type="button"
              className={`pd-switch${f.preferred ? " on" : ""}`}
              onClick={() => set({ preferred: !f.preferred })}
              aria-label="Toggle preferred"
            />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Mark as preferred source for this item
            </span>
          </div>
        </div>
        <div className="pd-modal-foot">
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="pd-btn pd-btn-primary"
            disabled={!f.productId || !f.supplierId || f.purchasePrice <= 0}
            onClick={() => onSave(f)}
          >
            {init ? "Save changes" : "Add supply item"}
          </button>
        </div>
      </div>
    </div>
  );
}
