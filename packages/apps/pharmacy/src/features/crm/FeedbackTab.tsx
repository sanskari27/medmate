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

;

type Tab = "overview" | "patients" | "reminders" | "loyalty" | "campaigns" | "feedback" | "analytics";

const TABS: { k: Tab; label: string }[] = [
  { k: "overview", label: "Overview" }, { k: "patients", label: "Patients & Segments" },
  { k: "reminders", label: "Reminders" }, { k: "loyalty", label: "Loyalty" },
  { k: "campaigns", label: "Campaigns" }, { k: "feedback", label: "Feedback" }, { k: "analytics", label: "Analytics" },
];

const GENDERS = ["Male", "Female", "Other"];

export function FeedbackTab(s: any) {
  const { patients, profile, crm, addFeedback } = s;
  const [pk, setPk] = useState("");
  const [rating, setRating] = useState(5);
  const [nps, setNps] = useState(9);
  const [comment, setComment] = useState("");
  const fb = crm.feedbacks;
  const avg = fb.length ? fb.reduce((a: number, f: any) => a + f.rating, 0) / fb.length : 0;
  const promoters = fb.filter((f: any) => (f.nps ?? 0) >= 9).length, detractors = fb.filter((f: any) => (f.nps ?? 0) <= 6).length;
  const npsScore = fb.length ? Math.round(((promoters - detractors) / fb.length) * 100) : 0;
  const save = async () => { const p = patients.find((x: Patient) => x.key === pk); if (!p) return; const err = await addFeedback({ custKey: p.key, custName: p.name, rating, nps, comment: comment.trim() || undefined }); if (!err) setComment(""); };
  return (
    <div className="pd-grid-2">
      <div className="pd-card">
        <div className="pd-card-head"><h3>Log feedback</h3></div>
        <div className="pd-card-pad" style={{ display: "grid", gap: 12 }}>
          <div className="pd-field"><label>Patient</label><select className="pd-select" value={pk} onChange={(e) => setPk(e.target.value)}><option value="">Select patient…</option>{patients.map((p: Patient) => <option key={p.key} value={p.key}>{p.name}</option>)}</select></div>
          <div className="pd-field"><label>Rating</label><div className="pd-flex" style={{ gap: 6 }}>{[1, 2, 3, 4, 5].map((n) => <button key={n} className={`pd-btn ${rating >= n ? "pd-btn-primary" : "pd-btn-ghost"}`} onClick={() => setRating(n)}><IconStar size={15} /></button>)}</div></div>
          <div className="pd-field"><label>NPS (0–10): would they recommend us?</label><input className="pd-input" type="number" min={0} max={10} value={nps} onChange={(e) => setNps(Math.max(0, Math.min(10, Number(e.target.value) || 0)))} style={{ width: 90 }} /></div>
          <div className="pd-field"><label>Comment</label><textarea className="pd-input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did they say?" /></div>
          <div className="pd-flex" style={{ gap: 8 }}>
            <button className="pd-btn pd-btn-primary" disabled={!pk} onClick={save}><IconCheck size={15} /> Save feedback</button>
            <button className="pd-btn pd-btn-ghost" disabled={!pk} onClick={() => { const p = patients.find((x: Patient) => x.key === pk); if (p) wa(p.phone, crmMsg.feedback(p.name, profile.name)); }}><IconWhatsApp size={15} /> Request via WhatsApp</button>
          </div>
        </div>
      </div>
      <div className="pd-card">
        <div className="pd-card-head"><h3>Feedback & NPS</h3><span className="sub">{fb.length} responses</span></div>
        <div className="pd-card-pad">
          <div className="pd-summary-chips" style={{ marginBottom: 12 }}>
            <div className="pd-schip">Avg rating<b>{avg ? avg.toFixed(1) : "—"} <IconStar size={11} /></b></div>
            <div className="pd-schip">NPS<b>{fb.length ? npsScore : "—"}</b></div>
            <div className="pd-schip">Promoters<b>{promoters}</b></div>
            <div className="pd-schip">Detractors<b>{detractors}</b></div>
          </div>
          {fb.length === 0 && <div className="pd-empty" style={{ padding: 16 }}><p>No feedback yet.</p></div>}
          {fb.slice(0, 10).map((f: any) => (
            <div className="pd-row" key={f.id}>
              <span className="pd-rating">{[1, 2, 3, 4, 5].slice(0, f.rating).map((n) => <IconStar key={n} size={13} />)}</span>
              <span className="gw"><div className="t">{f.custName} {f.nps != null && <span className="pd-muted" style={{ fontSize: 11 }}>· NPS {f.nps}</span>}</div><div className="s">{f.comment || "—"}</div></span>
              <span className="pd-muted" style={{ fontSize: 11.5 }}>{timeAgo(f.at, s.now)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
