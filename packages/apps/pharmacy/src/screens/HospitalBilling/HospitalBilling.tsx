import { Box, Button, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import { OverviewTab } from "@/screens/HospitalBilling/components/OverviewTab";
import { ReminderModal } from "@/screens/HospitalBilling/components/ReminderModal";
import { IssuesTable } from "@/screens/HospitalBilling/components/IssuesTable";
import { WardStockTab } from "@/screens/HospitalBilling/components/WardStockTab";
import { AccountTab } from "@/screens/HospitalBilling/components/AccountTab";
import { PriceListTab } from "@/screens/HospitalBilling/components/PriceListTab";
import { SupplyModal } from "@/screens/HospitalBilling/components/SupplyModal";
import { PaymentModal } from "@/screens/HospitalBilling/components/PaymentModal";
import { useState, useEffect } from "react";
import { setBillIndentTarget } from "@/store/actions/feedback.actions";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { inr } from "@/utils";
import {
  hospitalOutstanding,
  suppliedTotal,
  returnedTotal,
  paidTotal,
  hospitalAging,
} from "@/utils/calculations/hospitalAccount";
import { IconPlus, IconRupee, IconHospital } from "@/components/atoms";
type Tab = "overview" | "issue" | "stock" | "account" | "prices";
// shared hospital-credit-price accessor
// admin OTP gate — unlock pricing changes
// match a ward-indent's free-text item names to catalogue products → editable bill rows
export default function HospitalBillingScreen() {
  const dispatch = useAppDispatch();
  const hospitalAccount = useAppSelector((state) => state.hospital.hospitalAccount);
  const wardSupplies = useAppSelector((state) => state.hospital.wardSupplies);
  const hospitalPayments = useAppSelector((state) => state.hospital.hospitalPayments);
  const billIndentTarget = useAppSelector((state) => state.ui.billIndentTarget);
  const now = useAppSelector((state) => state.ui.now);
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
  const TABS: {
    k: Tab;
    label: string;
  }[] = [
    { k: "overview", label: "Overview" },
    { k: "issue", label: "Issue to ward" },
    { k: "stock", label: "Ward stock" },
    { k: "account", label: "Account & statement" },
    { k: "prices", label: "Price list" },
  ];
  return (
    <Box className="!mx-auto !max-w-[1680px]">
      <Box className="!flex !items-center !gap-3.5 !rounded-lg !border !border-line-2 !bg-gradient-to-br !from-wash-2 !to-white !px-[18px] !py-3.5">
        <Text
          className="!grid !h-[42px] !w-[42px] !shrink-0 !place-items-center !rounded-md !bg-wash !text-[22px]"
          as="span"
        >
          <IconHospital size={18} />
        </Text>
        <Box>
          <Text as="span" className="!block !font-display !text-[15px] !font-extrabold !text-dark">
            Bill-to: {hospitalAccount.name}
          </Text>
          <Text
            as="span"
            className="!mt-0.5 !block !max-w-[720px] !text-xs !leading-[1.45] !text-muted"
          >
            Every ward / emergency / refill issue is billed to the hospital on credit at the
            institutional price ({hospitalAccount.discountPct}% off MRP) · terms{" "}
            {hospitalAccount.creditTerms}. The hospital settles with patients on its own.
          </Text>
        </Box>
        <Box className="!flex-1" />
        {aging.overdue > 0 && (
          <Box className="!shrink-0 !text-right">
            <Text
              as="span"
              className="!block !text-[10.5px] !font-bold !uppercase !tracking-[0.06em] !text-faint"
            >
              Overdue
            </Text>
            <Text
              as="span"
              className="!block !font-display !text-[22px] !font-extrabold !text-rose"
            >
              {inr(aging.overdue)}
            </Text>
          </Box>
        )}
        <Box className="!shrink-0 !text-right">
          <Text
            as="span"
            className="!block !text-[10.5px] !font-bold !uppercase !tracking-[0.06em] !text-faint"
          >
            Hospital owes
          </Text>
          <Text as="span" className="!block !font-display !text-[22px] !font-extrabold !text-rose">
            {inr(outstanding)}
          </Text>
        </Box>
      </Box>

      <Box className={cn("!mb-4 !flex !flex-wrap !items-center !gap-2.5", "!mt-4")}>
        <Box className="!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
          {TABS.map(renderTABS)}
        </Box>
        <Box className="!flex-1" />
        {(tab === "overview" || tab === "issue") && (
          <>
            {tab === "issue" && (
              <Button variant="ghost" onClick={setModalOnClick}>
                ↩ Record return
              </Button>
            )}
            <Button variant="primary" onClick={setModalOnClick2}>
              <IconPlus size={16} /> New ward issue
            </Button>
          </>
        )}
        {tab === "overview" && (
          <Button variant="ghost" onClick={setModalOnClick3}>
            <IconRupee size={15} /> Record payment
          </Button>
        )}
        {tab === "account" && (
          <Button variant="primary" onClick={setModalOnClick4}>
            <IconRupee size={15} /> Record payment
          </Button>
        )}
      </Box>

      {tab === "overview" && (
        <OverviewTab
          outstanding={outstanding}
          supplied={supplied}
          returns={returns}
          received={received}
          aging={aging}
          goTab={setTab}
          onNewIssue={setModalOnNewIssue}
          onRecordPayment={setModalOnRecordPayment}
          onRemind={setModalOnRemind}
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
          onRemind={setModalOnRemind2}
        />
      )}
      {tab === "prices" && <PriceListTab />}

      {modal === "issue" && (
        <SupplyModal mode="issue" prefillIndentId={billIndentTarget} onClose={setModalOnClose} />
      )}
      {modal === "return" && <SupplyModal mode="return" onClose={setModalOnClose2} />}
      {modal === "payment" && <PaymentModal onClose={setModalOnClose3} outstanding={outstanding} />}
      {modal === "reminder" && (
        <ReminderModal onClose={setModalOnClose4} outstanding={outstanding} aging={aging} />
      )}
    </Box>
  );
  function renderTABS(t: { k: Tab; label: string }) {
    return (
      <Button
        key={t.k}
        className={
          tab === t.k
            ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"
            : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"
        }
        onClick={setTabOnClick}
      >
        {t.label}
      </Button>
    );
    function setTabOnClick() {
      return setTab(t.k);
    }
  }
  function setModalOnClick() {
    return setModal("return");
  }
  function setModalOnClick2() {
    return setModal("issue");
  }
  function setModalOnClick3() {
    return setModal("payment");
  }
  function setModalOnClick4() {
    return setModal("payment");
  }
  function setModalOnNewIssue() {
    return setModal("issue");
  }
  function setModalOnRecordPayment() {
    return setModal("payment");
  }
  function setModalOnRemind() {
    return setModal("reminder");
  }
  function setModalOnRemind2() {
    return setModal("reminder");
  }
  function setModalOnClose() {
    setModal(null);
    dispatch(setBillIndentTarget(null));
  }
  function setModalOnClose2() {
    return setModal(null);
  }
  function setModalOnClose3() {
    return setModal(null);
  }
  function setModalOnClose4() {
    return setModal(null);
  }
}
