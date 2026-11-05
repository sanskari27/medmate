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

export function FeatRow({ ico, t, s, on, onClick }: { ico: React.ReactNode; t: string; s: string; on: boolean; onClick: () => void }) {
  return (
    <div className="pd-feat">
      <span className="ico">{ico}</span>
      <div className="gw"><div className="t">{t}</div><div className="s">{s}</div></div>
      <button className={`pd-switch${on ? " on" : ""}`} onClick={onClick} />
    </div>
  );
}
