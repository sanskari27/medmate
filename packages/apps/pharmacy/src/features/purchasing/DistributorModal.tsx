import { useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import { Supplier, isValidGstin } from "@/domain";
import { IconX } from "@/components/Icon";

const BLANK_SUP: Omit<Supplier, "id"> = {
  name: "",
  gstin: "",
  phone: "",
  contactPerson: "",
  email: "",
  address: "",
  city: "",
  state: "Karnataka",
  dlNo: "",
  paymentTerms: "30 days credit",
  outstanding: 0,
  active: true,
};

export function DistributorModal({
  init,
  onClose,
  onSave,
}: {
  init?: Supplier;
  onClose: () => void;
  onSave: (d: Omit<Supplier, "id">) => void;
}) {
  const { showFault } = usePharma();
  const [f, setF] = useState<Omit<Supplier, "id">>(init ? { ...init } : { ...BLANK_SUP });
  const set = (p: Partial<typeof f>) => setF((s) => ({ ...s, ...p }));
  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="pd-modal-head">
          <h3>{init ? "Edit distributor" : "Add distributor"}</h3>
          <button className="pd-x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          <div className="pd-form-grid">
            <div className="pd-field pd-span2" data-field="name">
              <label>Distributor / firm name *</label>
              <input
                className="pd-input"
                value={f.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="e.g. Bengaluru Pharma Distributors"
              />
            </div>
            <div className="pd-field">
              <label>Contact person</label>
              <input
                className="pd-input"
                value={f.contactPerson || ""}
                onChange={(e) => set({ contactPerson: e.target.value })}
              />
            </div>
            <div className="pd-field" data-field="phone">
              <label>Phone *</label>
              <input
                className="pd-input"
                value={f.phone}
                onChange={(e) => set({ phone: e.target.value })}
                placeholder="+91 …"
              />
            </div>
            <div className="pd-field" data-field="email">
              <label>Email</label>
              <input
                className="pd-input"
                value={f.email || ""}
                onChange={(e) => set({ email: e.target.value })}
              />
            </div>
            <div className="pd-field" data-field="gstin">
              <label>GSTIN</label>
              <input
                className="pd-input pd-mono"
                value={f.gstin}
                onChange={(e) => set({ gstin: e.target.value.toUpperCase() })}
                placeholder="29ABCDE1234F1Z5"
              />
            </div>
            <div className="pd-field">
              <label>Drug licence no.</label>
              <input
                className="pd-input pd-mono"
                value={f.dlNo || ""}
                onChange={(e) => set({ dlNo: e.target.value.toUpperCase() })}
                placeholder="KA-W-…"
              />
            </div>
            <div className="pd-field pd-span2">
              <label>Address</label>
              <input
                className="pd-input"
                value={f.address || ""}
                onChange={(e) => set({ address: e.target.value })}
              />
            </div>
            <div className="pd-field">
              <label>City</label>
              <input
                className="pd-input"
                value={f.city || ""}
                onChange={(e) => set({ city: e.target.value })}
              />
            </div>
            <div className="pd-field">
              <label>State</label>
              <input
                className="pd-input"
                value={f.state || ""}
                onChange={(e) => set({ state: e.target.value })}
              />
            </div>
            <div className="pd-field">
              <label>Payment terms</label>
              <select
                className="pd-select"
                value={f.paymentTerms || ""}
                onChange={(e) => set({ paymentTerms: e.target.value })}
              >
                <option>Advance</option>
                <option>On delivery</option>
                <option>7 days credit</option>
                <option>15 days credit</option>
                <option>30 days credit</option>
                <option>45 days credit</option>
              </select>
            </div>
            <div className="pd-field">
              <label>Outstanding payable (₹)</label>
              <input
                className="pd-input"
                type="number"
                value={f.outstanding ?? 0}
                onChange={(e) => set({ outstanding: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="pd-flex" style={{ marginTop: 16, gap: 10, alignItems: "center" }}>
            <button
              type="button"
              className={`pd-switch${f.active !== false ? " on" : ""}`}
              onClick={() => set({ active: !(f.active !== false) })}
              aria-label="Toggle active"
            />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Active — show in purchases & reorder lists
            </span>
          </div>
        </div>
        <div className="pd-modal-foot">
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="pd-btn pd-btn-primary"
            disabled={!f.name.trim() || !f.phone.trim()}
            onClick={() => {
              if (f.gstin.trim() && !isValidGstin(f.gstin)) {
                showFault("Enter a valid GSTIN");
                return;
              }
              onSave(f);
            }}
          >
            {init ? "Save changes" : "Add distributor"}
          </button>
        </div>
      </div>
    </div>
  );
}
