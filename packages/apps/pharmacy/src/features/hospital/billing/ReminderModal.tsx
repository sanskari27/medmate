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

import { fmtDay } from "./fmtDay";

;

type LineType = "all" | "issue" | "return" | "payment";

const LINE_FILTERS: { k: LineType; label: string }[] = [{ k: "all", label: "All" }, { k: "issue", label: "Supplied" }, { k: "return", label: "Returns" }, { k: "payment", label: "Payments" }];

const REASON_TONE: Record<WardSupplyReason, string> = { floor: "pill-blue", consumption: "pill-gold", refill: "pill-teal" };

type Tab = "overview" | "issue" | "stock" | "account" | "prices";

export function ReminderModal({ onClose, outstanding, aging }: { onClose: () => void; outstanding: number; aging: ReturnType<typeof hospitalAging> }) {
  const { hospitalAccount: a, profile } = usePharma();
  const [copied, setCopied] = useState(false);
  const msg = [
    `Dear ${a.name},`,
    ``,
    `This is a payment reminder from ${profile.name}.`,
    `Outstanding on your credit account: ${inr(outstanding)}.`,
    ...(aging.overdue > 0 ? [`Overdue (past ${a.creditTerms}): ${inr(aging.overdue)}${aging.dueDate ? `, due ${fmtDay(aging.dueDate)}` : ""}.`] : []),
    ``,
    `Kindly arrange settlement at your earliest. Thank you.`,
  ].join("\n");
  const phone = a.phone || "";
  const mail = `mailto:${a.email || ""}?subject=${encodeURIComponent(`Payment reminder — ${inr(outstanding)} outstanding`)}&body=${encodeURIComponent(msg)}`;

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head"><h3>Send payment reminder</h3><button className="pd-iconbtn" onClick={onClose}><IconX size={18} /></button></div>
        <div className="pd-modal-body">
          <div className="pd-summary-chips" style={{ marginBottom: 12 }}>
            <div className="pd-schip">Outstanding<b style={{ color: "var(--rose)" }}>{inr(outstanding)}</b></div>
            {aging.overdue > 0 && <div className="pd-schip">Overdue<b style={{ color: "var(--rose)" }}>{inr(aging.overdue)}</b></div>}
            <div className="pd-schip">Terms<b>{a.creditTerms}</b></div>
          </div>
          <div className="pd-msgbox">{msg}</div>
          <div className="pd-share-row">
            <button className="pd-btn pd-btn-line" onClick={() => { navigator.clipboard?.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <IconCheck size={15} /> : <IconCopy size={15} />} {copied ? "Copied" : "Copy"}</button>
            <a className="pd-btn pd-btn-wa" href={phone ? waLink(phone, msg) : undefined} target="_blank" rel="noreferrer" aria-disabled={!phone}><IconWhatsApp size={15} /> WhatsApp</a>
            <a className="pd-btn pd-btn-line" href={phone ? smsLink(phone, msg) : undefined} aria-disabled={!phone}>SMS</a>
            <a className="pd-btn pd-btn-line" href={mail}><IconMail size={15} /> Email</a>
          </div>
          <p className="pd-hint"><IconAlert size={12} /> Opens WhatsApp / SMS / email prefilled to the hospital's billing contact — you press send.</p>
        </div>
        <div className="pd-modal-foot"><button className="pd-btn pd-btn-primary" onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}
