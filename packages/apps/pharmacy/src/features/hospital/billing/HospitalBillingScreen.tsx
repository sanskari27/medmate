import { OverviewTab } from "./OverviewTab";
import { ReminderModal } from "./ReminderModal";
import { IssuesTable } from "./IssuesTable";
import { WardStockTab } from "./WardStockTab";
import { AccountTab } from "./AccountTab";
import { PriceListTab } from "./PriceListTab";
import { SupplyModal } from "./SupplyModal";
import { PaymentModal } from "./PaymentModal";
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
import { SupplyReasonIcon, monogramOf } from "@/components/entityIcon";;
import { buildReportPdf } from "@/features/reports/pdf";
import { useDateRange } from "@/components/DateRangeField";
import WardSupplyInvoice, { SupplyInvoiceData } from "@/features/hospital/billing/WardSupplyInvoice";
import QtyBox from "@/components/QtyBox";

type LineType = "all" | "issue" | "return" | "payment";
const LINE_FILTERS: { k: LineType; label: string }[] = [{ k: "all", label: "All" }, { k: "issue", label: "Supplied" }, { k: "return", label: "Returns" }, { k: "payment", label: "Payments" }];

const REASON_TONE: Record<WardSupplyReason, string> = { floor: "pill-blue", consumption: "pill-gold", refill: "pill-teal" };

type Tab = "overview" | "issue" | "stock" | "account" | "prices";

// shared hospital-credit-price accessor

// admin OTP gate — unlock pricing changes

// match a ward-indent's free-text item names to catalogue products → editable bill rows

export default function HospitalBillingScreen() {
  const { hospitalAccount, wardSupplies, hospitalPayments, billIndentTarget, clearBillIndentTarget, now } = usePharma();
  const [tab, setTab] = useState<Tab>("overview");
  const [modal, setModal] = useState<"issue" | "return" | "payment" | "reminder" | null>(null);
  // arriving from Ward Indents ("Bill & issue to hospital") opens the issue modal pre-loaded
  useEffect(() => { if (billIndentTarget) { setTab("issue"); setModal("issue"); } }, [billIndentTarget]);

  const outstanding = hospitalOutstanding(wardSupplies, hospitalPayments);
  const supplied = suppliedTotal(wardSupplies);
  const returns = returnedTotal(wardSupplies);
  const received = paidTotal(hospitalPayments);
  const aging = hospitalAging(wardSupplies, hospitalPayments, now, hospitalAccount.creditTerms);

  const TABS: { k: Tab; label: string }[] = [
    { k: "overview", label: "Overview" },
    { k: "issue", label: "Issue to ward" },
    { k: "stock", label: "Ward stock" },
    { k: "account", label: "Account & statement" },
    { k: "prices", label: "Price list" },
  ];

  return (
    <div className="pd-canvas-wide">
      <div className="pd-hb-banner">
        <span className="ic"><IconHospital size={18} /></span>
        <div>
          <b>Bill-to: {hospitalAccount.name}</b>
          <small>Every ward / emergency / refill issue is billed to the hospital on credit at the institutional price ({hospitalAccount.discountPct}% off MRP) · terms {hospitalAccount.creditTerms}. The hospital settles with patients on its own.</small>
        </div>
        <div className="pd-spacer" />
        {aging.overdue > 0 && <div className="pd-hb-due overdue"><span>Overdue</span><b>{inr(aging.overdue)}</b></div>}
        <div className="pd-hb-due"><span>Hospital owes</span><b>{inr(outstanding)}</b></div>
      </div>

      <div className="pd-toolbar" style={{ marginTop: 16 }}>
        <div className="pd-seg">
          {TABS.map((t) => <button key={t.k} className={tab === t.k ? "on" : ""} onClick={() => setTab(t.k)}>{t.label}</button>)}
        </div>
        <div className="pd-spacer" />
        {(tab === "overview" || tab === "issue") && <>
          {tab === "issue" && <button className="pd-btn pd-btn-ghost" onClick={() => setModal("return")}>↩ Record return</button>}
          <button className="pd-btn pd-btn-primary" onClick={() => setModal("issue")}><IconPlus size={16} /> New ward issue</button>
        </>}
        {tab === "overview" && <button className="pd-btn pd-btn-ghost" onClick={() => setModal("payment")}><IconRupee size={15} /> Record payment</button>}
        {tab === "account" && <button className="pd-btn pd-btn-primary" onClick={() => setModal("payment")}><IconRupee size={15} /> Record payment</button>}
      </div>

      {tab === "overview" && <OverviewTab outstanding={outstanding} supplied={supplied} returns={returns} received={received} aging={aging}
        goTab={setTab} onNewIssue={() => setModal("issue")} onRecordPayment={() => setModal("payment")} onRemind={() => setModal("reminder")} />}
      {tab === "issue" && <IssuesTable />}
      {tab === "stock" && <WardStockTab />}
      {tab === "account" && <AccountTab outstanding={outstanding} supplied={supplied} returns={returns} received={received} aging={aging} onRemind={() => setModal("reminder")} />}
      {tab === "prices" && <PriceListTab />}

      {modal === "issue" && <SupplyModal mode="issue" prefillIndentId={billIndentTarget} onClose={() => { setModal(null); clearBillIndentTarget(); }} />}
      {modal === "return" && <SupplyModal mode="return" onClose={() => setModal(null)} />}
      {modal === "payment" && <PaymentModal onClose={() => setModal(null)} outstanding={outstanding} />}
      {modal === "reminder" && <ReminderModal onClose={() => setModal(null)} outstanding={outstanding} aging={aging} />}
    </div>
  );
}

/* ── overview dashboard ──────────────────────────────────────── */

/* ── payment reminder (compose links — pharmacist sends) ─────── */

/* ── issues / returns log ────────────────────────────────────── */

/* ── ward stock on hand ──────────────────────────────────────── */

/* ── hospital account + credit statement ─────────────────────── */

/* ── hospital price list & discount control (admin-gated) ────── */

/* ── new ward issue / return ─────────────────────────────────── */

/* ── record a hospital payment ───────────────────────────────── */

