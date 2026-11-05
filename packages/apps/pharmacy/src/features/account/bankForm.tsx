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

export function bankForm(b: { holderName: string; accountNumber: string; ifsc: string; bankName: string; branch?: string; accountType: "Savings" | "Current"; upiVpa?: string } | null) {
  return b ? { holderName: b.holderName, accountNumber: b.accountNumber, ifsc: b.ifsc, bankName: b.bankName, branch: b.branch ?? "", accountType: b.accountType, upiVpa: b.upiVpa ?? "" } : blankBank;
}
