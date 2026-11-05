import { useRef, useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  PHARMACY_BUSINESS_TYPES, REGISTRATION_TYPES, INDUSTRY_TYPES, INDIAN_STATES, PharmacyProfile, ProfileFile, setupGap,
} from "@/domain";
import {
  IconArrowRight, IconCheck, IconUpload, IconStore, IconReceipt, IconKiosk, IconRupee, IconInventory, IconUsers,
  IconBox, IconGlobe, IconChart, IconBulb, IconFolder, IconSparkle,
} from "@/components/Icon";

const STEPS = [
  { t: "Welcome", s: "Let's set up your pharmacy" },
  { t: "Business profile", s: "Tell us about your pharmacy" },
  { t: "Location", s: "Where is your store?" },
  { t: "Tax & licences", s: "GST, PAN, drug & trade licences" },
  { t: "Pharmacist", s: "Registered pharmacist on record" },
  { t: "Invoice & branding", s: "How your bills look" },
  { t: "Features", s: "Turn on what you need" },
  { t: "Catalogue", s: "Start your medicine list" },
  { t: "Review", s: "Confirm & finish" },
];

type Draft = PharmacyProfile & {
  invoicePrefix: string; terms: string; kioskEnabled: boolean; looseDefault: boolean;
};

export function LicenceField({ label, value, file, onValue, onFile }: { label: string; value: string; file?: ProfileFile; onValue: (v: string) => void; onFile: (f: ProfileFile) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]; if (!picked) return;
    const r = new FileReader();
    r.onload = () => onFile({ name: picked.name, dataUrl: String(r.result || "") });
    r.readAsDataURL(picked);
    e.target.value = "";
  };
  return (
    <>
      <div className="pd-field" data-field={label === "GSTIN" ? "gstin" : undefined}><label>{label} *</label><input className="pd-input pd-mono" value={value} onChange={(e) => onValue(e.target.value.toUpperCase())} /></div>
      <div className="pd-field"><label>{label} document *</label>
        <input ref={ref} type="file" accept="image/*,.pdf,application/pdf" hidden onChange={pick} />
        {file?.dataUrl
          ? <div className="pd-flex pd-gap6" style={{ alignItems: "center" }}><span style={{ fontSize: 12.5, fontWeight: 700 }}>{file.name}</span><button type="button" className="pd-btn pd-btn-ghost pd-btn-sm" onClick={() => ref.current?.click()}>Replace</button></div>
          : <button type="button" className="pd-btn pd-btn-ghost pd-btn-sm" onClick={() => ref.current?.click()}><IconUpload size={14} /> Attach</button>}
      </div>
    </>
  );
}
