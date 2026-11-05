import { useState, useMemo } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import { inr, fmtDateTime, computeInvoice, timeAgo, Sale, PayMode, PAY_LABEL } from "@/domain";
import {
  Ward, WardType, WARD_TYPES, Admission, PayerType, wardBedNos, occupiedBedsOf,
  admissionAtBed, hospitalOccupancy, activeAdmissions, INSURERS,
} from "@/features/hospital/hospital";
import { IconSearch, IconPlus, IconX, IconRupee, IconPos, IconTrash, IconCheck, IconArrowRight, IconSettings, IconCash, IconShield } from "@/components/Icon";

const TYPE_TONE: Record<WardType, string> = { ICU: "pill-rose", General: "pill-gray", Surgical: "pill-blue", Pediatric: "pill-gold", Maternity: "pill-teal", Private: "pill-green" };

const SETTLE_MODES: PayMode[] = ["cash", "upi", "card", "insurance"];

export const daysIn = (from: number, now: number) => Math.max(1, Math.ceil((now - from) / 86400000));
