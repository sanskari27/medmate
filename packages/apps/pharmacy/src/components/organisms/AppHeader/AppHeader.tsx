import type { ChangeEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { IconButton } from "@/components/atoms/IconButton";
import { Input } from "@/components/atoms/Input";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { IconBell, IconChevronLeft, IconMenu, IconSearch } from "@/components/atoms/Icon";
import { UpgradeChip } from "@/components/molecules/UpgradeChip";
import { useAppSelector, usePharmacyNav } from "@/hooks";
import type { Route } from "@/types";
import { canSeeRoute } from "@/utils";
import { cn } from "@/utils/className";
import type { AppHeaderProps } from "./AppHeader.types";

const PAGE_META: Record<Route, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard", sub: "Today at a glance" },
  pos: { title: "Billing / POS", sub: "Counter sale & GST invoice" },
  orders: { title: "Orders", sub: "Online & counter sales" },
  sales: { title: "Sales", sub: "Every sale, day one to date" },
  prescriptions: { title: "Prescriptions", sub: "Review & dispense" },
  customers: { title: "Customers", sub: "Customer database & history" },
  khata: { title: "Credit · Khata", sub: "Customer credit, dues & repayments" },
  crm: { title: "CRM · Patients", sub: "Segments, reminders, loyalty & campaigns" },
  wards: { title: "IPD · Wards", sub: "In-patient wards, beds & dispensing" },
  hospbill: { title: "Hospital Billing", sub: "Ward supply billed to the hospital credit account" },
  ptbills: { title: "Active Patients", sub: "In-patient bills & settlement" },
  salesreg: { title: "Sales Register", sub: "Sales by source, payment & insurance" },
  indents: { title: "Ward Indents", sub: "Medicine requisitions from wards" },
  departments: { title: "Departments", sub: "Hospital departments & doctors" },
  doctors: { title: "Doctors", sub: "Doctor directory — profiles & details" },
  inventory: { title: "Inventory", sub: "Stock, batches & expiry" },
  rackmap: { title: "Rack & Locations", sub: "Where each medicine is stored on the shelves" },
  purchases: { title: "Purchases", sub: "Distributor billing → auto-stock" },
  reorder: { title: "Reorder · Distributor", sub: "Send required stock to distributors" },
  distributors: { title: "Distributors", sub: "Your distributor & supplier directory" },
  online: { title: "Online Store", sub: "Control what customers see" },
  offers: { title: "Offers", sub: "Discounts & promotions" },
  kiosk: { title: "Self-Order Kiosk", sub: "In-store customer ordering" },
  reports: { title: "Reports", sub: "Sales & GST summary" },
  expenses: { title: "Expenses", sub: "Track business spend & categories" },
  ca: { title: "CA / Accountant", sub: "Share reports with your CA" },
  account: { title: "Account", sub: "Business account & plan" },
  employees: { title: "Employees", sub: "Team records, payroll & bank details" },
  users: { title: "Manage Users", sub: "Staff roles & access" },
  invoicing: { title: "Invoice Settings", sub: "Customise your GST invoice" },
  subscription: { title: "Subscription", sub: "Plan, renewal & billing" },
  refer: { title: "Refer & Earn", sub: "Invite pharmacies, earn rewards" },
  support: { title: "Help & Support", sub: "FAQs, tickets & contact" },
  settings: { title: "Settings", sub: "Pharmacy profile & licences" },
  notifications: { title: "Notifications", sub: "Alerts & updates" },
  menu: { title: "Menu", sub: "All sections" },
};

export function AppHeader({ onMenu, className }: AppHeaderProps) {
  const { route, go, back, canGoBack } = usePharmacyNav();
  const prescriptions = useAppSelector((state) => state.prescriptions.prescriptions);
  const subscription = useAppSelector((state) => state.auth.subscription);
  const me = useAppSelector((state) => state.auth.me);
  const meta = PAGE_META[route];
  const pendingRx = prescriptions.filter(function pending(rx) {
    return rx.status === "pending";
  }).length;
  function allow(key: Route) {
    return canSeeRoute(key, me?.role, me?.permissions);
  }
  function onBack() {
    back();
  }
  function onSearchFocus() {
    go("inventory");
  }
  function onSearchChange(event: ChangeEvent<HTMLInputElement>) {
    event.preventDefault();
  }
  function openSubscription() {
    go("subscription");
  }
  function openPos() {
    go("pos");
  }
  function openPrescriptions() {
    go("prescriptions");
  }

  return (
    <Stack
      data-slot="app-header"
      direction="row"
      align="center"
      gap={4}
      className={cn(
        "h-[60px] gap-4 border-b border-line bg-paper px-6 max-[1099px]:gap-2.5 max-[1099px]:px-4 max-[767px]:h-auto max-[767px]:flex-wrap max-[767px]:gap-2 max-[767px]:px-3 max-[767px]:pt-[max(10px,env(safe-area-inset-top))] max-[767px]:pb-2.5",
        className,
      )}
    >
      <IconButton
        label="Menu"
        variant="default"
        className="hidden h-9 w-9 rounded-sm border-line text-ink-2 print:hidden hover:border-line-2 hover:bg-wash-2 max-[1099px]:grid max-[767px]:h-11 [&_svg]:[stroke-width:2]"
        onClick={onMenu}
      >
        <IconMenu size={18} />
      </IconButton>
      {canGoBack ? (
        <IconButton
          label="Go back"
          variant="default"
          className="-ml-1.5 h-[34px] w-[34px] rounded-sm border-line print:hidden hover:border-line-2 hover:bg-wash-2 hover:text-mid"
          onClick={onBack}
        >
          <IconChevronLeft size={19} />
        </IconButton>
      ) : null}
      <Stack gap={0} className="min-w-0 max-[767px]:flex-1">
        <Heading level={1} className="truncate text-[19px] font-bold max-[767px]:text-[17px]">
          {meta.title}
        </Heading>
        <Text
          as="span"
          variant="caption"
          className="truncate text-[12.5px] leading-[1.5] font-medium"
        >
          {meta.sub}
        </Text>
      </Stack>
      {allow("inventory") ? (
        <Stack
          direction="row"
          align="center"
          gap={2}
          className="ml-auto w-[300px] max-w-full gap-[9px] rounded-sm border border-transparent bg-wash-2 px-3 py-[7px] print:hidden hover:border-line-2 hover:bg-paper max-[1099px]:w-auto max-[1099px]:max-w-[320px] max-[1099px]:min-w-0 max-[1099px]:flex-1 max-[767px]:order-8 max-[767px]:ml-0 max-[767px]:w-full max-[767px]:max-w-none max-[767px]:flex-auto"
        >
          <Box className="text-green">
            <IconSearch size={17} />
          </Box>
          <Input
            variant="plain"
            readOnly
            placeholder="Search medicines, orders, invoices…"
            onFocus={onSearchFocus}
            onChange={onSearchChange}
            aria-label="Search medicines, orders, invoices"
            className="px-[2px] py-0 text-[13.5px] placeholder:text-faint"
          />
        </Stack>
      ) : null}
      {subscription.plan === "Essential" ? (
        <UpgradeChip
          className="print:hidden"
          title="Unlock premium features"
          onClick={openSubscription}
        />
      ) : null}
      {allow("pos") ? (
        <Button className="print:hidden" onClick={openPos}>
          + New sale
        </Button>
      ) : null}
      {allow("prescriptions") ? (
        <Box className="relative print:hidden">
          <IconButton
            label="Notifications"
            className="h-9 w-9 rounded-sm border-line text-ink-2 hover:border-line-2 hover:bg-wash-2 max-[767px]:h-11"
            onClick={openPrescriptions}
          >
            <IconBell size={19} />
          </IconButton>
          {pendingRx > 0 ? (
            <Box className="pointer-events-none absolute top-[7px] right-2 h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-gold" />
          ) : null}
        </Box>
      ) : null}
    </Stack>
  );
}
