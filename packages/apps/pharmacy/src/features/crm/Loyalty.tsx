import { useState, useMemo } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  inr, fmtDateTime, timeAgo, custKeyOf, waLink, smsLink, catLabel, computeInvoice, PAY_LABEL, BLOOD_GROUPS, Sale,
} from "@/domain";
import {
  buildPatients, Patient, PatientMed, Segment, SEGMENTS, segLabel, TIERS, tierOf, refillsDue, atRisk,
  attributedSales, crmMsg, Campaign,
} from "@/features/crm/crm";
import { IconSearch, IconX, IconWhatsApp, IconMessage, IconCheck, IconUser, IconRupee, IconReports, IconAlert, IconClock, IconGift, IconStar, IconSparkle, IconStethoscope, IconHeart, IconDot, IconMail, IconRefresh, IconTrendDown, IconMega, IconPhone, IconReceipt, IconPin, IconCalendar, IconBox, IconPill } from "@/components/Icon"
import { SegmentIcon } from "@/components/entityIcon";

import { Patients } from "./Patients";

;

type Tab = "overview" | "patients" | "reminders" | "loyalty" | "campaigns" | "feedback" | "analytics";

const TABS: { k: Tab; label: string }[] = [
  { k: "overview", label: "Overview" }, { k: "patients", label: "Patients & Segments" },
  { k: "reminders", label: "Reminders" }, { k: "loyalty", label: "Loyalty" },
  { k: "campaigns", label: "Campaigns" }, { k: "feedback", label: "Feedback" }, { k: "analytics", label: "Analytics" },
];

const GENDERS = ["Male", "Female", "Other"];

export function Loyalty(s: any) {
  const { patients, redeemedBy, openPatient } = s;
  const avail = (p: Patient) => Math.max(0, p.points - (redeemedBy.get(p.key) ?? 0));
  const ranked = [...patients].sort((a, b) => avail(b) - avail(a));
  const totalPts = patients.reduce((a: number, p: Patient) => a + avail(p), 0);
  return (
    <>
      <div className="pd-summary-chips" style={{ marginBottom: 14 }}>
        <div className="pd-schip">Points outstanding<b>{totalPts.toLocaleString("en-IN")}</b></div>
        <div className="pd-schip">≈ Liability<b>{inr(totalPts)}</b></div>
        {TIERS.map((t) => <div className="pd-schip" key={t.tier}>{t.tier}<b>{patients.filter((p: Patient) => p.tier === t.tier).length}</b></div>)}
      </div>
      <div className="pd-card"><div className="pd-tbl-wrap"><table className="pd-tbl">
        <thead><tr><th>Patient</th><th>Tier</th><th className="num">Earned</th><th className="num">Redeemed</th><th className="num">Available</th><th className="num">Value</th><th></th></tr></thead>
        <tbody>
          {ranked.slice(0, 50).map((p: Patient) => (
            <tr key={p.key} style={{ cursor: "pointer" }} onClick={() => openPatient(p.key)}>
              <td><div className="prod"><span className="em"><IconUser size={15} /></span><span className="nm">{p.name}</span></div></td>
              <td><span className="pd-pill pill-gold">{p.tier}</span></td>
              <td className="num">{p.points}</td><td className="num pd-muted">{redeemedBy.get(p.key) ?? 0}</td>
              <td className="num" style={{ fontWeight: 800 }}>{avail(p)}</td><td className="num">{inr(avail(p))}</td>
              <td className="num" onClick={(e) => e.stopPropagation()}><button className="pd-btn pd-btn-ghost" disabled={avail(p) <= 0} onClick={() => s.redeemPoints(p.key, p.name, Math.min(avail(p), 50))}>Redeem 50</button></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
      <p className="pd-muted" style={{ fontSize: 12.5, marginTop: 10 }}>ⓘ Patients earn 1 point per ₹100 spent. Tiers: Silver 12+ · Gold 50+ · Platinum 120+ points. Referral: invite a patient, both get ₹100 credit (use Khata to apply).</p>
    </>
  );
}
