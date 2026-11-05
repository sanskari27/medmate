import type { ChangeEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { IconButton } from "@/components/atoms/IconButton";
import { Input } from "@/components/atoms/Input";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { IconBell, IconChevronLeft, IconSearch } from "@/components/atoms/Icon";
import { UpgradeChip } from "@/components/molecules/UpgradeChip";
import { usePharma } from "@/hooks";
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

function MenuGlyph() {
  return (
    <Stack gap={1} className="w-4" aria-hidden>
      <Box className="h-0.5 w-full rounded-full bg-current" />
      <Box className="h-0.5 w-full rounded-full bg-current" />
      <Box className="h-0.5 w-full rounded-full bg-current" />
    </Stack>
  );
}

export function AppHeader({ onMenu, className }: AppHeaderProps) {
  const { route, go, back, canGoBack, prescriptions, subscription, me } = usePharma();
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
      className={cn("h-[60px] border-b border-line bg-paper px-6", className)}
    >
      <IconButton
        label="Menu"
        variant="ghost"
        className="hidden print:hidden max-[1099px]:grid"
        onClick={onMenu}
      >
        <MenuGlyph />
      </IconButton>
      {canGoBack ? (
        <IconButton label="Go back" variant="default" className="print:hidden" onClick={onBack}>
          <IconChevronLeft size={19} />
        </IconButton>
      ) : null}
      <Stack gap={0} className="min-w-0">
        <Heading level={1} className="truncate text-[19px] font-bold">
          {meta.title}
        </Heading>
        <Text as="span" variant="caption" className="truncate text-[12.5px]">
          {meta.sub}
        </Text>
      </Stack>
      {allow("inventory") ? (
        <Stack
          direction="row"
          align="center"
          gap={2}
          className="ml-auto w-[300px] max-w-full rounded-sm bg-wash-2 px-3 py-1.5 print:hidden"
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
          />
        </Stack>
      ) : (
        <Box className="ml-auto" />
      )}
      {subscription.plan === "Essential" ? (
        <UpgradeChip className="print:hidden" title="Unlock premium features" onClick={openSubscription} />
      ) : null}
      {allow("pos") ? (
        <Button className="print:hidden" onClick={openPos}>
          + New sale
        </Button>
      ) : null}
      {allow("prescriptions") ? (
        <Box className="relative print:hidden">
          <IconButton label="Notifications" onClick={openPrescriptions}>
            <IconBell size={19} />
          </IconButton>
          {pendingRx > 0 ? <Box className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose" /> : null}
        </Box>
      ) : null}
    </Stack>
  );
}
