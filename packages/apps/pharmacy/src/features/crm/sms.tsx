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

export const sms = (phone: string, text: string) => phone && window.open(smsLink(phone, text), "_blank");
