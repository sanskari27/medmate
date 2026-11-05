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

export function PtSpark({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 220, h = 40, max = Math.max(...data, 1), min = Math.min(...data, 0), rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / rng) * (h - 8)] as const);
  const line = `M ${pts.map((p) => p.join(",")).join(" L ")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: 40 }} aria-hidden>
      <path d={`${line} L ${w},${h} L 0,${h} Z`} fill="var(--mid)" opacity="0.1" />
      <path d={line} fill="none" stroke="var(--mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {pts.map((pt, i) => <circle key={i} cx={pt[0]} cy={pt[1]} r="2.4" fill="var(--mid)" />)}
    </svg>
  );
}
