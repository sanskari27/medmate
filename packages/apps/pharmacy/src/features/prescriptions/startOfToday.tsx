import { useMemo, useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  timeAgo, fmtDateTime, RxStatus, Prescription, InvProduct, sellPrice, inr, stockOf,
  SCHEDULE_META, rxWaitMins, rxOverdue, rxTurnaroundMins, rxAvailability, rxScheduledCount,
  fmtMins, RX_SLA_MINS, waLink, smsLink,
} from "@/domain";
import { ChannelPill } from "@/components/bits";
import {
  IconCheck, IconX, IconRx, IconArrowRight, IconClock, IconDoc, IconPill, IconAlert,
  IconPhone, IconWhatsApp, IconRupee, IconBox, IconStethoscope, IconUser, IconSearch,
  IconBolt, IconCalendar, IconChart, IconShield,
} from "@/components/Icon"
import { monogramOf } from "@/components/entityIcon";
import RxView from "@/features/prescriptions/RxView";

;

const RX_PILL: Record<RxStatus, string> = { pending: "pill-gold", approved: "pill-blue", dispensed: "pill-green", rejected: "pill-rose" };

const RX_LABEL: Record<RxStatus, string> = { pending: "Pending review", approved: "Approved", dispensed: "Dispensed", rejected: "Rejected" };

const KIND_LABEL: Record<string, string> = { digital: "Digital Rx", uploaded: "Uploaded" };

const REJECT_REASONS = [
  "Prescription illegible — please re-upload a clear photo",
  "Prescriber could not be verified",
  "Prescription expired (older than 6 months)",
  "Medicine not stocked — please contact the store",
];

export const startOfToday = (now: number) => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime(); };
