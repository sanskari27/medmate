import { Overview } from "./Overview";
import { Patients } from "./Patients";
import { Reminders } from "./Reminders";
import { Loyalty } from "./Loyalty";
import { Campaigns } from "./Campaigns";
import { FeedbackTab } from "./FeedbackTab";
import { Analytics } from "./Analytics";
import { PatientModal } from "./PatientModal";
import { useState, useMemo } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import { custKeyOf } from "@/domain";
import { buildPatients } from "@/features/crm/crm";

type Tab =
  "overview" | "patients" | "reminders" | "loyalty" | "campaigns" | "feedback" | "analytics";
const TABS: { k: Tab; label: string }[] = [
  { k: "overview", label: "Overview" },
  { k: "patients", label: "Patients & Segments" },
  { k: "reminders", label: "Reminders" },
  { k: "loyalty", label: "Loyalty" },
  { k: "campaigns", label: "Campaigns" },
  { k: "feedback", label: "Feedback" },
  { k: "analytics", label: "Analytics" },
];

export default function CrmScreen() {
  const {
    sales,
    inventory,
    creditPayments,
    crm,
    profile,
    now,
    setPatientMeta,
    addCampaign,
    addFeedback,
    logReminder,
    redeemPoints,
    go,
  } = usePharma();
  const [tab, setTab] = useState<Tab>("overview");
  const [sel, setSel] = useState<string | null>(null);

  const creditKeys = useMemo(() => {
    const k = new Set<string>();
    for (const s of sales)
      if (s.status !== "cancelled" && s.payMode === "credit") k.add(custKeyOf(s.customer));
    for (const p of creditPayments) k.add(p.custKey);
    return k;
  }, [sales, creditPayments]);
  const patients = useMemo(
    () => buildPatients(sales, inventory, creditKeys, now, crm.meta),
    [sales, inventory, creditKeys, now, crm.meta],
  );
  const redeemedBy = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of crm.redemptions) m.set(r.custKey, (m.get(r.custKey) ?? 0) + r.points);
    return m;
  }, [crm.redemptions]);
  const current = patients.find((p) => p.key === sel) ?? null;

  const shared = {
    patients,
    profile,
    now,
    sales,
    crm,
    redeemedBy,
    setPatientMeta,
    addCampaign,
    addFeedback,
    logReminder,
    redeemPoints,
    openPatient: setSel,
    go,
  };

  return (
    <div className="pd-canvas-wide">
      <div className="pd-toolbar">
        <div className="pd-seg" style={{ flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button key={t.k} className={tab === t.k ? "on" : ""} onClick={() => setTab(t.k)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && <Overview {...shared} />}
      {tab === "patients" && <Patients {...shared} />}
      {tab === "reminders" && <Reminders {...shared} />}
      {tab === "loyalty" && <Loyalty {...shared} />}
      {tab === "campaigns" && <Campaigns {...shared} />}
      {tab === "feedback" && <FeedbackTab {...shared} />}
      {tab === "analytics" && <Analytics {...shared} />}

      {current && <PatientModal p={current} onClose={() => setSel(null)} {...shared} />}
    </div>
  );
}

// ════════════════════ OVERVIEW ════════════════════

// ════════════════════ PATIENTS & SEGMENTS ════════════════════

// ════════════════════ REMINDERS ════════════════════

// ════════════════════ LOYALTY ════════════════════

// ════════════════════ CAMPAIGNS ════════════════════

// ════════════════════ FEEDBACK ════════════════════

// ════════════════════ ANALYTICS ════════════════════

// small inline spend sparkline for the patient profile

// ════════════════════ PATIENT 360° PROFILE ════════════════════
