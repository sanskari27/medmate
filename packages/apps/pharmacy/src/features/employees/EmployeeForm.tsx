import { useRef, useState } from "react";
import {
  Employee,
  EMPLOYEE_POSITIONS,
  EMPLOYMENT_TYPES,
  EmploymentType,
  BLOOD_GROUPS,
  blankEmployee,
  isValidIfsc,
  DOC_LABELS,
  EmployeeDoc,
} from "@/domain";
import { IconUpload, IconIdCard, IconX, IconDoc } from "@/components/Icon";

import { ymd } from "./ymd";
import { Section } from "./Section";
import { Field } from "./Field";

export function EmployeeForm({
  initial,
  onClose,
  onSave,
  now,
  onIdCard,
}: {
  initial: Employee | null;
  onClose: () => void;
  onSave: (e: Omit<Employee, "id">) => void;
  onDelete?: () => void;
  now: number;
  onIdCard?: () => void;
}) {
  const [f, setF] = useState<Omit<Employee, "id">>(() =>
    initial ? { ...initial } : { ...blankEmployee(), joinedOn: ymd(now) },
  );
  const set = (patch: Partial<Employee>) => setF((p) => ({ ...p, ...patch }));
  const ifscBad = !!f.ifsc && !isValidIfsc(f.ifsc);
  const valid = f.name.trim() && f.phone.trim() && f.position && f.salary >= 0 && !ifscBad;
  const photoRef = useRef<HTMLInputElement>(null);
  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => set({ photo: r.result as string });
    r.readAsDataURL(file);
  };

  // ── documents (photo / PDF) ──
  const docRef = useRef<HTMLInputElement>(null);
  const [docLabel, setDocLabel] = useState(DOC_LABELS[0]);
  const addDoc = (doc: EmployeeDoc) =>
    setF((p) => ({ ...p, documents: [...(p.documents ?? []), doc] }));
  const onDocs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const kind: "image" | "pdf" =
        /pdf$/i.test(file.name) || file.type === "application/pdf" ? "pdf" : "image";
      const r = new FileReader();
      r.onload = () =>
        addDoc({
          id: `DOC-${Date.now()}-${Math.round(Math.random() * 1e5)}`,
          label: docLabel,
          kind,
          fileName: file.name,
          dataUrl: r.result as string,
          at: Date.now(),
        });
      r.readAsDataURL(file);
    });
    e.target.value = "";
  };
  const docs = f.documents ?? [];

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <h3>
            {initial ? `Edit ${initial.name}` : "Add Employee"}
            {initial && (
              <span className="pd-mono pd-muted" style={{ fontSize: 12, marginLeft: 8 }}>
                {initial.id}
              </span>
            )}
          </h3>
          <button className="pd-icon-btn" onClick={onClose}>
            <IconX size={16} />
          </button>
        </div>
        <div
          className="pd-modal-body"
          style={{ display: "grid", gap: 14, maxHeight: "70vh", overflowY: "auto" }}
        >
          <Section title="Personal" />
          {/* photo */}
          <div className="pd-flex" style={{ gap: 14, alignItems: "center" }}>
            <input ref={photoRef} type="file" accept="image/*" hidden onChange={onPhoto} />
            <button
              onClick={() => photoRef.current?.click()}
              title="Upload photo"
              style={{
                width: 72,
                height: 86,
                borderRadius: 10,
                border: "1px dashed var(--line-2)",
                background: f.photo ? "#000" : "var(--wash2)",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                padding: 0,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {f.photo ? (
                <img
                  src={f.photo}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ color: "var(--muted)", fontSize: 11, textAlign: "center" }}>
                  <IconUpload size={16} />
                  <br />
                  Photo
                </span>
              )}
            </button>
            <div>
              <button
                className="pd-btn pd-btn-ghost pd-btn-sm"
                onClick={() => photoRef.current?.click()}
              >
                <IconUpload size={13} /> {f.photo ? "Change photo" : "Upload photo"}
              </button>
              {f.photo && (
                <button
                  className="pd-btn pd-btn-ghost pd-btn-sm"
                  style={{ color: "var(--rose)", marginLeft: 6 }}
                  onClick={() => set({ photo: undefined })}
                >
                  Remove
                </button>
              )}
              <p className="pd-muted" style={{ fontSize: 11.5, marginTop: 6 }}>
                Used on the digital ID card · passport-style works best
              </p>
            </div>
          </div>
          <div className="pd-grid-2">
            <Field label="Full name *" field="name">
              <input
                className="pd-input"
                value={f.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="e.g. Anjali Menon"
              />
            </Field>
            <Field label="Phone *" field="phone">
              <input
                className="pd-input"
                value={f.phone}
                onChange={(e) => set({ phone: e.target.value })}
                placeholder="+91 …"
              />
            </Field>
            <Field label="Email" field="email">
              <input
                className="pd-input"
                value={f.email ?? ""}
                onChange={(e) => set({ email: e.target.value })}
                placeholder="name@pharmacy.in"
              />
            </Field>
            <Field label="Date of birth">
              <input
                className="pd-input"
                type="date"
                value={f.dob ?? ""}
                onChange={(e) => set({ dob: e.target.value })}
              />
            </Field>
            <Field label="Blood group">
              <select
                className="pd-select"
                value={f.bloodGroup ?? ""}
                onChange={(e) => set({ bloodGroup: e.target.value })}
              >
                <option value="">—</option>
                {BLOOD_GROUPS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Address">
            <input
              className="pd-input"
              value={f.address ?? ""}
              onChange={(e) => set({ address: e.target.value })}
              placeholder="Residential address"
            />
          </Field>

          <Section title="Employment" />
          <div className="pd-grid-2">
            <Field label="Position *">
              <select
                className="pd-select"
                value={f.position}
                onChange={(e) => set({ position: e.target.value })}
              >
                {EMPLOYEE_POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Department">
              <input
                className="pd-input"
                value={f.department ?? ""}
                onChange={(e) => set({ department: e.target.value })}
                placeholder="e.g. Dispensing"
              />
            </Field>
            <Field label="Employment type">
              <select
                className="pd-select"
                value={f.employment}
                onChange={(e) => set({ employment: e.target.value as EmploymentType })}
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className="pd-select"
                value={f.status}
                onChange={(e) => set({ status: e.target.value as "active" | "inactive" })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Joining date">
              <input
                className="pd-input"
                type="date"
                value={f.joinedOn}
                onChange={(e) => set({ joinedOn: e.target.value })}
              />
            </Field>
            <Field label="Monthly salary ₹">
              <input
                className="pd-input"
                inputMode="numeric"
                value={f.salary || ""}
                onChange={(e) => set({ salary: Number(e.target.value) || 0 })}
                placeholder="0"
              />
            </Field>
          </div>

          <Section title="Statutory IDs" />
          <div className="pd-grid-2">
            <Field label="PAN">
              <input
                className="pd-input"
                value={f.pan ?? ""}
                onChange={(e) => set({ pan: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
              />
            </Field>
            <Field label="Aadhaar">
              <input
                className="pd-input"
                value={f.aadhaar ?? ""}
                onChange={(e) => set({ aadhaar: e.target.value })}
                placeholder="XXXX XXXX XXXX"
              />
            </Field>
          </div>

          <Section title={`Documents${docs.length ? ` · ${docs.length}` : ""}`} />
          <input
            ref={docRef}
            type="file"
            accept="image/*,application/pdf,.pdf"
            multiple
            hidden
            onChange={onDocs}
          />
          <div className="pd-flex" style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="pd-field" style={{ flex: "1 1 200px" }}>
              <label>Document type</label>
              <select
                className="pd-select"
                value={docLabel}
                onChange={(e) => setDocLabel(e.target.value)}
              >
                {DOC_LABELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="pd-btn pd-btn-ghost"
              onClick={() => docRef.current?.click()}
            >
              <IconUpload size={14} /> Upload photo / PDF
            </button>
          </div>
          <p className="pd-muted" style={{ fontSize: 11.5, marginTop: -4 }}>
            Attach ID proofs & certificates — JPG/PNG or PDF. You can select multiple files.
          </p>
          {docs.length === 0 ? (
            <div
              className="pd-empty"
              style={{
                padding: "18px 10px",
                border: "1px dashed var(--line-2)",
                borderRadius: "var(--r)",
              }}
            >
              <div className="em">
                <IconDoc size={26} />
              </div>
              <p>No documents yet — upload Aadhaar, PAN, licence, etc.</p>
            </div>
          ) : (
            <div className="pd-card" style={{ overflow: "hidden" }}>
              {docs.map((d) => (
                <div className="pd-docrow" key={d.id}>
                  {d.kind === "image" ? (
                    <span className="thumb">
                      <img src={d.dataUrl} alt="" />
                    </span>
                  ) : (
                    <span className="thumb pdf">
                      <IconDoc size={18} />
                    </span>
                  )}
                  <span className="gw">
                    <div className="t">{d.label}</div>
                    <div className="s">
                      {d.fileName} · {d.kind === "pdf" ? "PDF" : "Image"}
                    </div>
                  </span>
                  <a
                    className="pd-btn pd-btn-ghost pd-btn-sm"
                    href={d.dataUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                  <a className="pd-iconbtn" href={d.dataUrl} download={d.fileName} title="Download">
                    <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
                      <IconUpload size={14} />
                    </span>
                  </a>
                </div>
              ))}
            </div>
          )}

          <Section title="Salary bank account" />
          <div className="pd-grid-2">
            <Field label="Bank name">
              <input
                className="pd-input"
                value={f.bankName ?? ""}
                onChange={(e) => set({ bankName: e.target.value })}
                placeholder="e.g. HDFC Bank"
              />
            </Field>
            <Field label="Account holder name">
              <input
                className="pd-input"
                value={f.accountName ?? ""}
                onChange={(e) => set({ accountName: e.target.value })}
                placeholder="As per bank"
              />
            </Field>
            <Field label="Account number">
              <input
                className="pd-input"
                value={f.accountNumber ?? ""}
                onChange={(e) => set({ accountNumber: e.target.value })}
                placeholder="Account no."
              />
            </Field>
            <Field label="IFSC" field="ifsc">
              <input
                className="pd-input"
                style={ifscBad ? { borderColor: "var(--rose)" } : undefined}
                value={f.ifsc ?? ""}
                onChange={(e) => set({ ifsc: e.target.value.toUpperCase() })}
                placeholder="HDFC0001234"
              />
              {ifscBad && <span className="pd-field-err">Invalid IFSC</span>}
            </Field>
            <Field label="UPI ID">
              <input
                className="pd-input"
                value={f.upi ?? ""}
                onChange={(e) => set({ upi: e.target.value })}
                placeholder="name@bank"
              />
            </Field>
          </div>

          <Section title="Emergency contact" />
          <div className="pd-grid-2">
            <Field label="Contact name">
              <input
                className="pd-input"
                value={f.emergencyName ?? ""}
                onChange={(e) => set({ emergencyName: e.target.value })}
                placeholder="Name"
              />
            </Field>
            <Field label="Contact phone">
              <input
                className="pd-input"
                value={f.emergencyPhone ?? ""}
                onChange={(e) => set({ emergencyPhone: e.target.value })}
                placeholder="+91 …"
              />
            </Field>
          </div>
          <Field label="Notes">
            <input
              className="pd-input"
              value={f.note ?? ""}
              onChange={(e) => set({ note: e.target.value })}
              placeholder="Anything else to record"
            />
          </Field>
        </div>
        <div className="pd-modal-foot">
          {onIdCard && (
            <button className="pd-btn pd-btn-ghost" onClick={onIdCard}>
              <IconIdCard size={14} /> ID card
            </button>
          )}
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="pd-btn pd-btn-primary" disabled={!valid} onClick={() => onSave(f)}>
            {initial ? "Save changes" : "Add employee"}
          </button>
        </div>
      </div>
    </div>
  );
}
