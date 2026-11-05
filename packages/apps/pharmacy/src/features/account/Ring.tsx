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

export function Ring({ pct }: { pct: number }) {
  const r = 30, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return (
    <div className="pd-acct-ring">
      <svg width={78} height={78} viewBox="0 0 78 78">
        <circle cx="39" cy="39" r={r} fill="none" stroke="var(--wash)" strokeWidth="8" />
        <circle cx="39" cy="39" r={r} fill="none" stroke="var(--mid)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 39 39)" />
      </svg>
      <span className="pd-acct-ring-val">{pct}%</span>
    </div>
  );
}
