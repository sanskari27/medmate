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

;

type Tab = "overview" | "patients" | "reminders" | "loyalty" | "campaigns" | "feedback" | "analytics";

const TABS: { k: Tab; label: string }[] = [
  { k: "overview", label: "Overview" }, { k: "patients", label: "Patients & Segments" },
  { k: "reminders", label: "Reminders" }, { k: "loyalty", label: "Loyalty" },
  { k: "campaigns", label: "Campaigns" }, { k: "feedback", label: "Feedback" }, { k: "analytics", label: "Analytics" },
];

const GENDERS = ["Male", "Female", "Other"];

export function Analytics(s: any) {
  const { patients, sales } = s;
  const ltv = patients.length ? patients.reduce((a: number, p: Patient) => a + p.spent, 0) / patients.length : 0;
  const repeat = patients.filter((p: Patient) => p.orders > 1).length;
  const retention = patients.length ? Math.round((repeat / patients.length) * 100) : 0;
  const risk = atRisk(patients);
  const rfm = [...patients].sort((a, b) => b.rfm.score - a.rfm.score).slice(0, 10);
  const campRev = s.crm.campaigns.reduce((a: number, c: Campaign) => a + attributedSales(c, patients, sales), 0);
  return (
    <>
      <div className="pd-stats" >
        <div className="pd-stat"><div className="ic ic-green"><IconRupee size={18} /></div><div className="lbl">Avg lifetime value</div><div className="val">{inr(ltv)}</div><div className="split">per patient</div></div>
        <div className="pd-stat"><div className="ic ic-blue"><IconRefresh size={18} /></div><div className="lbl">Retention (repeat)</div><div className="val">{retention}%</div><div className="split">came back</div></div>
        <div className="pd-stat"><div className="ic ic-rose"><IconTrendDown size={18} /></div><div className="lbl">Churn risk</div><div className="val">{risk.length}</div><div className="split">at-risk patients</div></div>
        <div className="pd-stat"><div className="ic ic-gold"><IconMega size={18} /></div><div className="lbl">Campaign sales</div><div className="val">{inr(campRev)}</div><div className="split">attributed revenue</div></div>
        <div className="pd-stat"><div className="ic ic-blue"><IconStar size={18} /></div><div className="lbl">RFM leaders</div><div className="val">{rfm.length}</div><div className="split">best customers</div></div>
      </div>
      <div className="pd-card">
        <div className="pd-card-head"><h3>Top patients by RFM</h3><span className="sub">recency · frequency · monetary</span></div>
        <div className="pd-tbl-wrap"><table className="pd-tbl">
          <thead><tr><th>Patient</th><th className="num">R</th><th className="num">F</th><th className="num">M</th><th className="num">RFM</th><th className="num">Orders</th><th className="num">Lifetime</th><th>Segments</th></tr></thead>
          <tbody>
            {rfm.map((p: Patient) => (
              <tr key={p.key} style={{ cursor: "pointer" }} onClick={() => s.openPatient(p.key)}>
                <td><div className="prod"><span className="em"><IconUser size={15} /></span><span className="nm">{p.name}</span></div></td>
                <td className="num">{p.rfm.r}</td><td className="num">{p.rfm.f}</td><td className="num">{p.rfm.m}</td>
                <td className="num"><span className="pd-pill pill-green">{p.rfm.score}</span></td>
                <td className="num">{p.orders}</td><td className="num" style={{ fontWeight: 800 }}>{inr(p.spent)}</td>
                <td>{p.segments.map((g) => segLabel(g)).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
