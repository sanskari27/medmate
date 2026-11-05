import { useState, useMemo } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import { inr, fmtDateTime, computeInvoice, timeAgo, Sale, PayMode, PAY_LABEL } from "@/domain";
import {
  Ward, WardType, WARD_TYPES, Admission, PayerType, wardBedNos, occupiedBedsOf,
  admissionAtBed, hospitalOccupancy, activeAdmissions, INSURERS,
} from "@/features/hospital/hospital";
import { IconSearch, IconPlus, IconX, IconRupee, IconPos, IconTrash, IconCheck, IconArrowRight, IconSettings, IconCash, IconShield } from "@/components/Icon";

const TYPE_TONE: Record<WardType, string> = { ICU: "pill-rose", General: "pill-gray", Surgical: "pill-blue", Pediatric: "pill-gold", Maternity: "pill-teal", Private: "pill-green" };

const SETTLE_MODES: PayMode[] = ["cash", "upi", "card", "insurance"];

export function AdmitModal({ preset, onClose, onAdmitted }: { preset: { wardId: string; bed: string } | null; onClose: () => void; onAdmitted: (id: string) => void }) {
  const { wards, admissions, doctors, admitPatient } = usePharma();
  const suggestUhid = `UHID-${100400 + admissions.length + 1}`;
  const [wardId, setWardId] = useState(preset?.wardId ?? wards[0]?.id ?? "");
  const ward = wards.find((w) => w.id === wardId);
  const freeBeds = ward ? wardBedNos(ward).filter((b) => !occupiedBedsOf(admissions, ward.id).has(b)) : [];
  const [bed, setBed] = useState(preset?.bed ?? freeBeds[0] ?? "");
  const [f, setF] = useState({ name: "", patientId: suggestUhid, age: "", gender: "Male" as Admission["gender"], phone: "", doctor: doctors[0]?.name ?? "", diagnosis: "", payerType: "self" as PayerType, insurer: INSURERS[0], policyNo: "" });
  const set = (p: Partial<typeof f>) => setF((s) => ({ ...s, ...p }));
  const pickWard = (id: string) => { setWardId(id); const w = wards.find((x) => x.id === id); const fb = w ? wardBedNos(w).filter((b) => !occupiedBedsOf(admissions, w.id).has(b)) : []; setBed(fb[0] ?? ""); };
  const valid = f.name.trim() && f.patientId.trim() && ward && bed && (f.payerType === "self" || f.insurer);

  const save = async () => {
    if (!valid || !ward) return;
    const adm = await admitPatient({
      patientId: f.patientId.trim(), name: f.name.trim(), age: f.age ? Number(f.age) : undefined, gender: f.gender, phone: f.phone.trim(),
      wardId: ward.id, wardName: ward.name, bed, doctor: f.doctor, diagnosis: f.diagnosis,
      payerType: f.payerType, insurer: f.payerType === "insurance" ? f.insurer : undefined, policyNo: f.payerType === "insurance" ? f.policyNo : undefined,
    });
    if (!adm) return;
    onAdmitted(adm.id);
  };

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head"><h3>Admit patient</h3><button className="pd-iconbtn" onClick={onClose}><IconX size={18} /></button></div>
        <div className="pd-modal-body">
          <div className="pd-form-grid">
            <div className="pd-field pd-span2" data-field="name"><label>Patient name *</label><input className="pd-input" autoFocus value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Full name" /></div>
            <div className="pd-field"><label>Patient ID / UHID *</label><input className="pd-input pd-mono" value={f.patientId} onChange={(e) => set({ patientId: e.target.value })} /></div>
            <div className="pd-field" data-field="phone"><label>Phone</label><input className="pd-input" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 …" /></div>
            <div className="pd-field"><label>Age</label><input className="pd-input" type="number" min={0} value={f.age} onChange={(e) => set({ age: e.target.value })} /></div>
            <div className="pd-field"><label>Gender</label><select className="pd-select" value={f.gender} onChange={(e) => set({ gender: e.target.value as Admission["gender"] })}><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div className="pd-field"><label>Ward *</label><select className="pd-select" value={wardId} onChange={(e) => pickWard(e.target.value)}>{wards.map((w) => <option key={w.id} value={w.id}>{w.name} ({wardBedNos(w).filter((b) => !occupiedBedsOf(admissions, w.id).has(b)).length} free)</option>)}</select></div>
            <div className="pd-field"><label>Bed *</label><select className="pd-select" value={bed} onChange={(e) => setBed(e.target.value)}>{!freeBeds.length && <option value="">No free beds</option>}{[...(preset && !freeBeds.includes(preset.bed) ? [preset.bed] : []), ...freeBeds].map((b) => <option key={b} value={b}>{b}</option>)}</select></div>
            <div className="pd-field"><label>Attending doctor</label><select className="pd-select" value={f.doctor} onChange={(e) => set({ doctor: e.target.value })}><option value="">—</option>{doctors.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
            <div className="pd-field pd-span2"><label>Diagnosis / reason</label><input className="pd-input" value={f.diagnosis} onChange={(e) => set({ diagnosis: e.target.value })} placeholder="e.g. Acute appendicitis" /></div>
            <div className="pd-field pd-span2"><label>Payer</label>
              <div className="pd-flex pd-gap6">
                <button className={`pd-chip${f.payerType === "self" ? " on" : ""}`} onClick={() => set({ payerType: "self" })}><IconCash size={14} /> Self-pay</button>
                <button className={`pd-chip${f.payerType === "insurance" ? " on" : ""}`} onClick={() => set({ payerType: "insurance" })}><IconShield size={14} /> Insurance / TPA</button>
              </div>
            </div>
            {f.payerType === "insurance" && <>
              <div className="pd-field"><label>Insurer / TPA</label><select className="pd-select" value={f.insurer} onChange={(e) => set({ insurer: e.target.value })}>{INSURERS.map((i) => <option key={i}>{i}</option>)}</select></div>
              <div className="pd-field"><label>Policy / claim no.</label><input className="pd-input pd-mono" value={f.policyNo} onChange={(e) => set({ policyNo: e.target.value })} placeholder="Policy no." /></div>
            </>}
          </div>
        </div>
        <div className="pd-modal-foot"><div className="pd-spacer" /><button className="pd-btn pd-btn-ghost" onClick={onClose}>Cancel</button><button className="pd-btn pd-btn-primary" disabled={!valid} onClick={save}><IconCheck size={15} /> Admit to {bed || "bed"}</button></div>
      </div>
    </div>
  );
}
