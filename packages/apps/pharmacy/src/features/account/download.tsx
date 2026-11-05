import { useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import { PLANS, planPrice, cycleNoun, inr, computeInvoice, routeLocked, PREMIUM_ROUTES, HOSPITAL_ROUTES, includedSeats, seatCeiling, UserRole, isValidIfsc } from "@/domain";
import { Route } from "@/app/session/pharmacy-provider";
import {
  IconUsers, IconReceipt, IconCrown, IconGift, IconShare, IconHelp, IconSettings, IconCheck,
  IconArrowRight, IconRupee, IconShield, IconStore, IconWallet, IconAlert, IconDownload,
  IconLock, IconSparkle, IconBank, IconInventory,
} from "@/components/Icon";

const ROLE_PILL: Record<string, string> = { Owner: "pill-gold", Manager: "pill-blue", Pharmacist: "pill-green", Cashier: "pill-teal" };

const blankBank = { holderName: "", accountNumber: "", ifsc: "", bankName: "", branch: "", accountType: "Current" as const, upiVpa: "" };

export const download = (blob: Blob, name: string) => { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 6000); };
