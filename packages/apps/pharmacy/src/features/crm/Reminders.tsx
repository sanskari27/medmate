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

import { wa } from "./wa";
import { sms } from "./sms";

;

type Tab = "overview" | "patients" | "reminders" | "loyalty" | "campaigns" | "feedback" | "analytics";

const TABS: { k: Tab; label: string }[] = [
  { k: "overview", label: "Overview" }, { k: "patients", label: "Patients & Segments" },
  { k: "reminders", label: "Reminders" }, { k: "loyalty", label: "Loyalty" },
  { k: "campaigns", label: "Campaigns" }, { k: "feedback", label: "Feedback" }, { k: "analytics", label: "Analytics" },
];

const GENDERS = ["Male", "Female", "Other"];

export function Reminders(s: any) {
  const { patients, profile, logReminder } = s;
  const due = refillsDue(patients, 14);
  const send = (p: Patient, kind: "refill" | "adherence" | "followup", ch: "whatsapp" | "sms") => {
    const text = kind === "refill" ? crmMsg.refill(p.name, profile.name, p.refill?.med ?? "your medicine") : kind === "adherence" ? crmMsg.adherence(p.name, profile.name) : crmMsg.followup(p.name, profile.name);
    (ch === "whatsapp" ? wa : sms)(p.phone, text);
    logReminder({ custKey: p.key, custName: p.name, kind, channel: ch });
  };
  return (
    <>
      <div className="pd-summary-chips" style={{ marginBottom: 14 }}>
        <div className="pd-schip">Refills due (14d)<b>{due.length}</b></div>
        <div className="pd-schip">Chronic patients<b>{patients.filter((p: Patient) => p.chronic).length}</b></div>
        <div className="pd-schip">Reminders sent<b>{s.crm.reminders.length}</b></div>
      </div>
      <div className="pd-card"><div className="pd-tbl-wrap"><table className="pd-tbl">
        <thead><tr><th>Patient</th><th>Medicine</th><th>Due</th><th>Phone</th><th>Send reminder</th></tr></thead>
        <tbody>
          {due.length === 0 && <tr><td colSpan={5}><div className="pd-empty"><div className="em"><IconClock size={30} /></div><p>No refills due in the next 14 days.</p></div></td></tr>}
          {due.map((p: Patient) => (
            <tr key={p.key}>
              <td><div className="prod"><span className="em"><IconUser size={15} /></span><span className="nm">{p.name}</span></div></td>
              <td>{p.refill!.med}</td>
              <td><span className={`pd-pill ${p.refill!.daysLeft <= 0 ? "pill-rose" : "pill-gold"}`}>{p.refill!.daysLeft <= 0 ? "Overdue" : `in ${p.refill!.daysLeft}d`}</span></td>
              <td className="pd-mono">{p.phone || "—"}</td>
              <td><div className="pd-flex" style={{ gap: 6 }}>
                <button className="pd-btn pd-btn-ghost" disabled={!p.phone} onClick={() => send(p, "refill", "whatsapp")}><IconWhatsApp size={14} /> Refill</button>
                <button className="pd-btn pd-btn-ghost" disabled={!p.phone} onClick={() => send(p, "followup", "whatsapp")} title="Lab / follow-up"><IconStethoscope size={14} /></button>
                <button className="pd-btn pd-btn-ghost" disabled={!p.phone} onClick={() => send(p, "refill", "sms")} title="SMS"><IconMessage size={14} /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
      {s.crm.reminders.length > 0 && (
        <div className="pd-card" style={{ marginTop: 14 }}>
          <div className="pd-card-head"><h3>Recent reminders sent</h3></div>
          <div className="pd-card-pad">
            {s.crm.reminders.slice(0, 8).map((r: any) => <div className="pd-row" key={r.id}><span className="em">{r.kind === "winback" ? <IconHeart size={15} /> : r.kind === "followup" ? <IconStethoscope size={15} /> : <IconClock size={15} />}</span><span className="gw"><div className="t">{r.custName}</div><div className="s">{r.kind} · {r.channel}</div></span><span className="pd-muted" style={{ fontSize: 11.5 }}>{timeAgo(r.at, s.now)}</span></div>)}
          </div>
        </div>
      )}
    </>
  );
}
