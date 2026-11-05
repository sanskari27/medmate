import { useState, useRef } from "react";
import { CATEGORIES, InvProduct, Schedule, DosageForm, SCHEDULE_META } from "@/utils";
import { IconX, IconUpload } from "@/components/Icon";
import { monogramOf } from "@/components/EntityIcon";

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

export function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product: InvProduct;
  onClose: () => void;
  onSave: (p: InvProduct) => void;
}) {
  const [f, setF] = useState<InvProduct>(product);
  const set = (patch: Partial<InvProduct>) => setF((p) => ({ ...p, ...patch }));
  const valid = !!f.name.trim();
  const photoRef = useRef<HTMLInputElement>(null);
  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => set({ image: r.result as string });
    r.readAsDataURL(file);
  };

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <h3>Edit {f.name}</h3>
          <button className="pd-x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          <div className="pd-form-grid">
            <div className="pd-field pd-span2">
              <label>Medicine name</label>
              <input
                className="pd-input"
                value={f.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="e.g. Dolo 650"
              />
            </div>
            <div className="pd-field pd-span2">
              <label>Composition / salt</label>
              <input
                className="pd-input"
                value={f.composition}
                onChange={(e) => set({ composition: e.target.value })}
                placeholder="e.g. Paracetamol 650mg"
              />
            </div>
            <div className="pd-field">
              <label>Manufacturer</label>
              <input
                className="pd-input"
                value={f.manufacturer}
                onChange={(e) => set({ manufacturer: e.target.value })}
              />
            </div>
            <div className="pd-field">
              <label>Pack</label>
              <input
                className="pd-input"
                value={f.pack}
                onChange={(e) => set({ pack: e.target.value })}
                placeholder="Strip of 15"
              />
            </div>
            <div className="pd-field">
              <label>Category</label>
              <select
                className="pd-select"
                value={f.category}
                onChange={(e) => set({ category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="pd-field">
              <label>Form</label>
              <select
                className="pd-select"
                value={f.form}
                onChange={(e) => set({ form: e.target.value as DosageForm })}
              >
                {FORMS.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div className="pd-field">
              <label>Drug schedule</label>
              <select
                className="pd-select"
                value={f.schedule}
                onChange={(e) => set({ schedule: e.target.value as Schedule })}
              >
                {SCHEDS.map((x) => (
                  <option key={x} value={x}>
                    {SCHEDULE_META[x].label} — {SCHEDULE_META[x].rx ? "Rx" : "OTC"}
                  </option>
                ))}
              </select>
            </div>
            <div className="pd-field">
              <label>HSN code</label>
              <input
                className="pd-input"
                value={f.hsn}
                onChange={(e) => set({ hsn: e.target.value })}
              />
            </div>
            <div className="pd-field">
              <label>GST %</label>
              <select
                className="pd-select"
                value={f.gst}
                onChange={(e) => set({ gst: Number(e.target.value) })}
              >
                {GSTS.map((x) => (
                  <option key={x} value={x}>
                    {x}%
                  </option>
                ))}
              </select>
            </div>
            <div className="pd-field">
              <label>
                Rack location{" "}
                <span className="pd-muted" style={{ fontWeight: 400 }}>
                  · Rack-Shelf-Bin
                </span>
              </label>
              <input
                className="pd-input pd-mono"
                value={f.rack}
                onChange={(e) => set({ rack: e.target.value.toUpperCase() })}
                placeholder="A3-12"
              />
            </div>
            <div className="pd-field">
              <label>
                2nd slot{" "}
                <span className="pd-muted" style={{ fontWeight: 400 }}>
                  · overflow (optional)
                </span>
              </label>
              <input
                className="pd-input pd-mono"
                value={f.rackAlt ?? ""}
                onChange={(e) => set({ rackAlt: e.target.value.toUpperCase() || undefined })}
                placeholder="—"
              />
            </div>
            <div className="pd-field">
              <label>Reorder level (units)</label>
              <input
                className="pd-input"
                type="number"
                value={f.reorderLevel}
                onChange={(e) => set({ reorderLevel: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* product photo */}
          <div className="pd-field pd-span2" style={{ marginTop: 14 }}>
            <label>Product photo</label>
            <div className="pd-flex" style={{ gap: 14 }}>
              <div
                className="em"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  background: "var(--wash)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 30,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {f.image ? <img className="pd-thumb" src={f.image} alt="" /> : monogramOf(f.name)}
              </div>
              <input ref={photoRef} type="file" accept="image/*" hidden onChange={onPhoto} />
              <div
                className="pd-flex"
                style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}
              >
                <div className="pd-flex pd-gap6">
                  <button
                    type="button"
                    className="pd-btn pd-btn-ghost pd-btn-sm"
                    onClick={() => photoRef.current?.click()}
                  >
                    <IconUpload size={14} /> {f.image ? "Change photo" : "Upload photo"}
                  </button>
                  {f.image && (
                    <button
                      type="button"
                      className="pd-btn pd-btn-sm"
                      style={{ color: "var(--rose)", background: "none" }}
                      onClick={() => set({ image: undefined })}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {(f.form === "Tablet" || f.form === "Capsule") && (
            <label
              className="pd-flex"
              style={{
                justifyContent: "space-between",
                padding: "12px 0",
                marginTop: 8,
                borderTop: "1px solid var(--line)",
                borderBottom: "1px solid var(--line)",
                cursor: "pointer",
              }}
            >
              <span>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>
                  Allow loose / per-tablet selling
                </span>
                <div className="pd-muted" style={{ fontSize: 12 }}>
                  Let staff sell individual {f.form.toLowerCase()}s at the counter (auto-priced per
                  unit)
                </div>
              </span>
              <button
                type="button"
                className={`pd-switch${(f.looseAllowed ?? true) ? " on" : ""}`}
                onClick={() => set({ looseAllowed: !(f.looseAllowed ?? true) })}
              />
            </label>
          )}
        </div>
        <div className="pd-modal-foot">
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="pd-btn pd-btn-primary" disabled={!valid} onClick={() => onSave(f)}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
