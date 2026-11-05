import { OverviewTab } from "@/screens/HospitalBilling/components/OverviewTab";
import { ReminderModal } from "@/screens/HospitalBilling/components/ReminderModal";
import { IssuesTable } from "@/screens/HospitalBilling/components/IssuesTable";
import { WardStockTab } from "@/screens/HospitalBilling/components/WardStockTab";
import { AccountTab } from "@/screens/HospitalBilling/components/AccountTab";
import { PriceListTab } from "@/screens/HospitalBilling/components/PriceListTab";
import { SupplyModal } from "@/screens/HospitalBilling/components/SupplyModal";
import { PaymentModal } from "@/screens/HospitalBilling/components/PaymentModal";
import { useState, useEffect } from "react";
import { usePharma } from "@/hooks";
import { inr } from "@/utils";
import {
  hospitalOutstanding,
  suppliedTotal,
  returnedTotal,
  paidTotal,
  hospitalAging,
} from "@/utils/calculations/hospitalAccount";
import { IconPlus, IconRupee, IconHospital } from "@/components/Icon";

type Tab = "overview" | "issue" | "stock" | "account" | "prices";

// shared hospital-credit-price accessor

// admin OTP gate — unlock pricing changes

// match a ward-indent's free-text item names to catalogue products → editable bill rows

export default function HospitalBillingScreen() {
  const {
    hospitalAccount,
    wardSupplies,
    hospitalPayments,
    billIndentTarget,
    clearBillIndentTarget,
    now,
  } = usePharma();
  const [tab, setTab] = useState<Tab>("overview");
  const [modal, setModal] = useState<"issue" | "return" | "payment" | "reminder" | null>(null);
  // arriving from Ward Indents ("Bill & issue to hospital") opens the issue modal pre-loaded
  useEffect(() => {
    if (billIndentTarget) {
      setTab("issue");
      setModal("issue");
    }
  }, [billIndentTarget]);

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
        <span className="ic">
          <IconHospital size={18} />
        </span>
        <div>
          <b>Bill-to: {hospitalAccount.name}</b>
          <small>
            Every ward / emergency / refill issue is billed to the hospital on credit at the
            institutional price ({hospitalAccount.discountPct}% off MRP) · terms{" "}
            {hospitalAccount.creditTerms}. The hospital settles with patients on its own.
          </small>
        </div>
        <div className="pd-spacer" />
        {aging.overdue > 0 && (
          <div className="pd-hb-due overdue">
            <span>Overdue</span>
            <b>{inr(aging.overdue)}</b>
          </div>
        )}
        <div className="pd-hb-due">
          <span>Hospital owes</span>
          <b>{inr(outstanding)}</b>
        </div>
      </div>

      <div className="pd-toolbar" style={{ marginTop: 16 }}>
        <div className="pd-seg">
          {TABS.map((t) => (
            <button key={t.k} className={tab === t.k ? "on" : ""} onClick={() => setTab(t.k)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="pd-spacer" />
        {(tab === "overview" || tab === "issue") && (
          <>
            {tab === "issue" && (
              <button className="pd-btn pd-btn-ghost" onClick={() => setModal("return")}>
                ↩ Record return
              </button>
            )}
            <button className="pd-btn pd-btn-primary" onClick={() => setModal("issue")}>
              <IconPlus size={16} /> New ward issue
            </button>
          </>
        )}
        {tab === "overview" && (
          <button className="pd-btn pd-btn-ghost" onClick={() => setModal("payment")}>
            <IconRupee size={15} /> Record payment
          </button>
        )}
        {tab === "account" && (
          <button className="pd-btn pd-btn-primary" onClick={() => setModal("payment")}>
            <IconRupee size={15} /> Record payment
          </button>
        )}
      </div>

      {tab === "overview" && (
        <OverviewTab
          outstanding={outstanding}
          supplied={supplied}
          returns={returns}
          received={received}
          aging={aging}
          goTab={setTab}
          onNewIssue={() => setModal("issue")}
          onRecordPayment={() => setModal("payment")}
          onRemind={() => setModal("reminder")}
        />
      )}
      {tab === "issue" && <IssuesTable />}
      {tab === "stock" && <WardStockTab />}
      {tab === "account" && (
        <AccountTab
          outstanding={outstanding}
          supplied={supplied}
          returns={returns}
          received={received}
          aging={aging}
          onRemind={() => setModal("reminder")}
        />
      )}
      {tab === "prices" && <PriceListTab />}

      {modal === "issue" && (
        <SupplyModal
          mode="issue"
          prefillIndentId={billIndentTarget}
          onClose={() => {
            setModal(null);
            clearBillIndentTarget();
          }}
        />
      )}
      {modal === "return" && <SupplyModal mode="return" onClose={() => setModal(null)} />}
      {modal === "payment" && (
        <PaymentModal onClose={() => setModal(null)} outstanding={outstanding} />
      )}
      {modal === "reminder" && (
        <ReminderModal onClose={() => setModal(null)} outstanding={outstanding} aging={aging} />
      )}
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
