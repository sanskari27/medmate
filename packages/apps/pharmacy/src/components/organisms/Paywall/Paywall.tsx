import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { Pill } from "@/components/atoms/Pill";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { IconArrowRight, IconCheck, IconCrown, IconLock, IconSparkle } from "@/components/atoms/Icon";
import { usePharma } from "@/hooks";
import type { Route } from "@/types";
import { inr, planPrice, PLANS } from "@/utils";
import { cn } from "@/utils/className";
import type { PaywallProps } from "./Paywall.types";

const PAGE_META: Record<Route, { title: string }> = {
  dashboard: { title: "Dashboard" },
  pos: { title: "Billing / POS" },
  orders: { title: "Orders" },
  sales: { title: "Sales" },
  prescriptions: { title: "Prescriptions" },
  customers: { title: "Customers" },
  khata: { title: "Credit · Khata" },
  crm: { title: "CRM · Patients" },
  wards: { title: "IPD · Wards" },
  hospbill: { title: "Hospital Billing" },
  ptbills: { title: "Active Patients" },
  salesreg: { title: "Sales Register" },
  indents: { title: "Ward Indents" },
  departments: { title: "Departments" },
  doctors: { title: "Doctors" },
  inventory: { title: "Inventory" },
  rackmap: { title: "Rack & Locations" },
  purchases: { title: "Purchases" },
  reorder: { title: "Reorder · Distributor" },
  distributors: { title: "Distributors" },
  online: { title: "Online Store" },
  offers: { title: "Offers" },
  kiosk: { title: "Self-Order Kiosk" },
  reports: { title: "Reports" },
  expenses: { title: "Expenses" },
  ca: { title: "CA / Accountant" },
  account: { title: "Account" },
  employees: { title: "Employees" },
  users: { title: "Manage Users" },
  invoicing: { title: "Invoice Settings" },
  subscription: { title: "Subscription" },
  refer: { title: "Refer & Earn" },
  support: { title: "Help & Support" },
  settings: { title: "Settings" },
  notifications: { title: "Notifications" },
  menu: { title: "Menu" },
};

function PaywallFeature({ feature }: { feature: string }) {
  return (
    <Stack direction="row" align="center" gap={2}>
      <Box className="shrink-0 text-green">
        <IconCheck size={14} />
      </Box>
      <Text as="span" className="text-[13px] text-ink-2">
        {feature}
      </Text>
    </Stack>
  );
}

function PaywallFeatures({ features }: { features: string[] }) {
  return features.map(function renderFeature(feature) {
    return <PaywallFeature key={feature} feature={feature} />;
  });
}

export function Paywall({ route, className }: PaywallProps) {
  const { go, subscription } = usePharma();
  const meta = PAGE_META[route];
  const care = PLANS.find(function findCare(plan) {
    return plan.key === "Care";
  });
  const price = care ? planPrice(care, "monthly") : 0;
  function openPlans() {
    go("subscription");
  }
  return (
    <Stack data-slot="paywall" align="center" className={cn("mx-auto my-9 w-full max-w-[640px]", className)}>
      <Stack align="center" gap={3} className="w-full rounded-xl border border-line bg-paper px-8 py-10 text-center shadow-sm">
        <Box className="grid h-[68px] w-[68px] place-items-center rounded-lg bg-wash text-mid">
          <IconLock size={30} />
        </Box>
        <Pill tone="gold">
          <IconCrown size={12} /> Paid plan
        </Pill>
        <Heading level={2}>{meta.title} is a premium feature</Heading>
        <Text variant="muted" className="max-w-[470px] text-[13.5px] leading-relaxed">
          You're on the{" "}
          <Text as="span" className="font-bold text-ink">
            {subscription.plan}
          </Text>{" "}
          plan. Billing / POS, Inventory and Purchases stay open — {meta.title} unlocks with any active paid plan
          from{" "}
          <Text as="span" className="font-bold text-ink">
            {inr(price)}/mo
          </Text>
          .
        </Text>
        {care ? (
          <Stack align="start" gap={2} className="my-1 w-full min-w-[300px] rounded-md border border-line bg-wash-2 px-4 py-4 text-left">
            <PaywallFeatures features={care.features} />
          </Stack>
        ) : null}
        <Stack direction="row" justify="center" wrap gap={2}>
          <Button onClick={openPlans}>
            <IconSparkle size={15} /> Upgrade to unlock
          </Button>
          <Button variant="ghost" onClick={openPlans}>
            See all plans <IconArrowRight size={14} />
          </Button>
        </Stack>
        <Pill tone="green" className="px-3.5 py-1.5 text-[12px]">
          <IconCheck size={13} /> Free forever: Billing / POS · Inventory · Purchases
        </Pill>
      </Stack>
    </Stack>
  );
}
