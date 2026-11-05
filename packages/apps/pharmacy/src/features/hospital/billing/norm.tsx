import { useState, useMemo, useEffect } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import { inr, fmtDateTime, mrpOf, stockOf, earliestBatch, PayMode, PAY_LABEL, InvProduct, findScan, hasLocation, waLink, smsLink, timeAgo } from "@/domain";
import { WardIndent } from "@/features/hospital/hospital";
import {
  CreditTerms, CREDIT_TERMS, SUPPLY_REASONS, WardSupplyReason, reasonMeta, WardSupplyItem, WardSupply,
  creditPriceOf, hospitalOutstanding, suppliedTotal, returnedTotal, paidTotal,
  wardOnHand, buildStatement, termDays, PriceMode,
  hospitalAging, wardConsumption, topSuppliedItems, monthlyHospitalFlow,
} from "@/features/hospital/hospitalAccount";
import {
  IconSearch, IconPlus, IconX, IconRupee, IconReports, IconPrint, IconTrash, IconLock, IconUnlock,
  IconHospital, IconReceipt, IconTag, IconKey, IconCamera, IconArrowRight, IconAlert, IconChart,
  IconWhatsApp, IconMail, IconSend, IconWallet, IconBox, IconShield, IconCalendar, IconCheck, IconCopy, IconStore,
} from "@/components/Icon"
import { SupplyReasonIcon, monogramOf } from "@/components/entityIcon";
import { buildReportPdf } from "@/features/reports/pdf";
import { useDateRange } from "@/components/DateRangeField";
import WardSupplyInvoice, { SupplyInvoiceData } from "@/features/hospital/billing/WardSupplyInvoice";
import QtyBox from "@/components/QtyBox";

;

type LineType = "all" | "issue" | "return" | "payment";

const LINE_FILTERS: { k: LineType; label: string }[] = [{ k: "all", label: "All" }, { k: "issue", label: "Supplied" }, { k: "return", label: "Returns" }, { k: "payment", label: "Payments" }];

const REASON_TONE: Record<WardSupplyReason, string> = { floor: "pill-blue", consumption: "pill-gold", refill: "pill-teal" };

type Tab = "overview" | "issue" | "stock" | "account" | "prices";

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
