import { useMemo, useState } from "react";
import { usePharma } from "@/hooks";
import { Box, Button } from "@/components/atoms";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { buildPatients } from "@/utils/calculations/crm";
import { Analytics } from "./components/Analytics";
import { Campaigns } from "./components/Campaigns";
import { FeedbackTab } from "./components/FeedbackTab";
import { Loyalty } from "./components/Loyalty";
import { Overview } from "./components/Overview";
import { PatientModal } from "./components/PatientModal";
import { Patients } from "./components/Patients";
import { Reminders } from "./components/Reminders";
import type { CrmTab, CrmViewProps } from "./Crm.types";
import { creditCustomerKeys, redeemedPointsByCustomer } from "./Crm.utils";

const TABS: { key: CrmTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "patients", label: "Patients & Segments" },
  { key: "reminders", label: "Reminders" },
  { key: "loyalty", label: "Loyalty" },
  { key: "campaigns", label: "Campaigns" },
  { key: "feedback", label: "Feedback" },
  { key: "analytics", label: "Analytics" },
];

export default function CrmScreen() {
  const {
    sales,
    inventory,
    creditPayments,
    crm,
    profile,
    now,
    setPatientMeta,
    addCampaign,
    addFeedback,
    logReminder,
    redeemPoints,
    go,
  } = usePharma();
  const [tab, setTab] = useState<CrmTab>("overview");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const creditKeys = useMemo(function collectCreditKeys() {
    return creditCustomerKeys(sales, creditPayments);
  }, [sales, creditPayments]);
  const patients = useMemo(function collectPatients() {
    return buildPatients(sales, inventory, creditKeys, now, crm.meta);
  }, [sales, inventory, creditKeys, now, crm.meta]);
  const redeemedBy = useMemo(function collectRedemptions() {
    return redeemedPointsByCustomer(crm.redemptions);
  }, [crm.redemptions]);
  const current = patients.find(function matchPatient(patient) {
    return patient.key === selectedKey;
  }) ?? null;

  const view: CrmViewProps = {
    patients,
    profile,
    now,
    sales,
    crm,
    redeemedBy,
    setPatientMeta,
    addCampaign,
    addFeedback,
    logReminder,
    redeemPoints,
    openPatient: setSelectedKey,
    go,
  };

  function handleClosePatient() {
    setSelectedKey(null);
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-4">
        <SegmentedControl label="CRM sections" className="gap-0.5 rounded-sm border border-line bg-wash-2 p-0.5">
          <CrmTabs tab={tab} onSelect={setTab} />
        </SegmentedControl>
      </Box>
      {tab === "overview" ? <Overview view={view} /> : null}
      {tab === "patients" ? <Patients view={view} /> : null}
      {tab === "reminders" ? <Reminders view={view} /> : null}
      {tab === "loyalty" ? <Loyalty view={view} /> : null}
      {tab === "campaigns" ? <Campaigns view={view} /> : null}
      {tab === "feedback" ? <FeedbackTab view={view} /> : null}
      {tab === "analytics" ? <Analytics view={view} /> : null}
      {current ? <PatientModal patient={current} onClose={handleClosePatient} view={view} /> : null}
    </Box>
  );
}

function CrmTabs({ tab, onSelect }: { tab: CrmTab; onSelect: (tab: CrmTab) => void }) {
  return TABS.map(function renderTab(item) {
    return <CrmTabButton key={item.key} item={item} selected={tab === item.key} onSelect={onSelect} />;
  });
}

function CrmTabButton({
  item,
  selected,
  onSelect,
}: {
  item: (typeof TABS)[number];
  selected: boolean;
  onSelect: (tab: CrmTab) => void;
}) {
  function handleSelect() {
    onSelect(item.key);
  }
  return (
    <Button size="sm" variant="ghost" className={selected ? "rounded-[6px] border-0 bg-paper px-[13px] py-1.5 text-[12.5px] font-bold text-dark shadow-sm hover:bg-paper" : "rounded-[6px] border-0 bg-transparent px-[13px] py-1.5 text-[12.5px] font-bold text-muted shadow-none hover:bg-transparent"} onClick={handleSelect}>
      {item.label}
    </Button>
  );
}
