import type { ReactNode } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { IconButton } from "@/components/atoms/IconButton";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import {
  IconArrowRight,
  IconCash,
  IconCrown,
  IconCustomers,
  IconDashboard,
  IconGift,
  IconHelp,
  IconInventory,
  IconKiosk,
  IconOffer,
  IconOrders,
  IconPos,
  IconReceipt,
  IconReports,
  IconRupee,
  IconRx,
  IconSend,
  IconSettings,
  IconShare,
  IconStore,
  IconTruck,
  IconUser,
  IconUsers,
} from "@/components/atoms/Icon";
import { BrandMark } from "@/components/molecules/BrandMark";
import { NavItem } from "@/components/molecules/NavItem";
import { NavSectionLabel } from "@/components/molecules/NavSectionLabel";
import { StoreChip } from "@/components/molecules/StoreChip";
import { usePharma } from "@/hooks";
import type { Route } from "@/types";
import { canSeeRoute } from "@/utils";
import { cn } from "@/utils/className";
import type { AppSidebarProps } from "./AppSidebar.types";

type NavIcon = (props: { size?: number }) => ReactNode;

type NavEntry = {
  key: Route;
  label: string;
  Icon: NavIcon;
  group?: string;
  hospital?: boolean;
};

const NAV: NavEntry[] = [
  { key: "dashboard", label: "Dashboard", Icon: IconDashboard },
  { key: "pos", label: "Billing / POS", Icon: IconPos },
  { key: "orders", label: "Orders", Icon: IconOrders },
  { key: "sales", label: "Sales", Icon: IconRupee },
  { key: "prescriptions", label: "Prescriptions", Icon: IconRx },
  { key: "customers", label: "Customers", Icon: IconCustomers },
  { key: "khata", label: "Credit · Khata", Icon: IconReceipt },
  { key: "crm", label: "CRM · Patients", Icon: IconUsers },
  { key: "wards", label: "IPD · Wards", Icon: IconStore, group: "Hospital", hospital: true },
  { key: "hospbill", label: "Hospital Billing", Icon: IconReceipt, hospital: true },
  { key: "ptbills", label: "Active Patients", Icon: IconCustomers, hospital: true },
  { key: "salesreg", label: "Sales Register", Icon: IconRupee, hospital: true },
  { key: "indents", label: "Ward Indents", Icon: IconReceipt, hospital: true },
  { key: "departments", label: "Departments", Icon: IconUsers, hospital: true },
  { key: "doctors", label: "Doctors", Icon: IconRx, hospital: true },
  { key: "inventory", label: "Inventory", Icon: IconInventory, group: "Catalogue" },
  { key: "rackmap", label: "Rack & Locations", Icon: IconStore },
  { key: "purchases", label: "Purchases", Icon: IconTruck },
  { key: "reorder", label: "Reorder · Distributor", Icon: IconSend },
  { key: "distributors", label: "Distributors", Icon: IconTruck },
  { key: "online", label: "Online Store", Icon: IconStore },
  { key: "offers", label: "Offers", Icon: IconOffer },
  { key: "kiosk", label: "Self-Order Kiosk", Icon: IconKiosk },
  { key: "reports", label: "Reports", Icon: IconReports, group: "Business" },
  { key: "expenses", label: "Expenses", Icon: IconCash },
  { key: "ca", label: "CA / Accountant", Icon: IconShare },
  { key: "account", label: "Account", Icon: IconUser, group: "Account" },
  { key: "employees", label: "Employees", Icon: IconUsers },
  { key: "users", label: "Manage Users", Icon: IconUsers },
  { key: "invoicing", label: "Invoice Settings", Icon: IconReceipt },
  { key: "subscription", label: "Subscription", Icon: IconCrown },
  { key: "refer", label: "Refer & Earn", Icon: IconGift },
  { key: "settings", label: "Settings", Icon: IconSettings },
  { key: "support", label: "Help & Support", Icon: IconHelp },
];

function SidebarBrand() {
  return (
    <Stack direction="row" align="center" gap={3} className="px-[18px] pt-[18px] pb-4">
      <BrandMark />
      <Stack gap={0}>
        <Text as="span" className="font-display text-[15px] font-extrabold tracking-tight text-white">
          <Text as="span" className="text-gold">
            Namma
          </Text>{" "}
          MedMate
        </Text>
        <Text as="span" className="text-[9px] font-bold tracking-[0.14em] text-mint uppercase">
          Partner Console
        </Text>
      </Stack>
    </Stack>
  );
}

function SidebarNavItem({
  entry,
  active,
  locked,
  badge,
  onChoose,
}: {
  entry: NavEntry;
  active: boolean;
  locked: boolean;
  badge: number;
  onChoose: (key: Route) => void;
}) {
  function onItemClick() {
    onChoose(entry.key);
  }
  return (
    <Stack gap={0}>
      {entry.group ? <NavSectionLabel>{entry.group}</NavSectionLabel> : null}
      <NavItem
        active={active}
        locked={locked}
        badge={badge}
        icon={<entry.Icon size={19} />}
        onClick={onItemClick}
      >
        {entry.label}
      </NavItem>
    </Stack>
  );
}

function SidebarNav({
  entries,
  route,
  badgeFor,
  isLocked,
  onChoose,
}: {
  entries: NavEntry[];
  route: Route;
  badgeFor: (key: Route) => number;
  isLocked: (key: Route) => boolean;
  onChoose: (key: Route) => void;
}) {
  return entries.map(function renderEntry(entry) {
    return (
      <SidebarNavItem
        key={entry.key}
        entry={entry}
        active={route === entry.key}
        locked={isLocked(entry.key)}
        badge={badgeFor(entry.key)}
        onChoose={onChoose}
      />
    );
  });
}

export function AppSidebar({ open, onNavigate, onMaster, className }: AppSidebarProps) {
  const { route, go, profile, prescriptions, sales, isHospital, wardIndents, signOut, featureLocked, me } =
    usePharma();
  const newOrders = sales.filter(function onlineNew(sale) {
    return sale.channel === "online" && sale.status === "new";
  }).length;
  const pendingRx = prescriptions.filter(function pending(rx) {
    return rx.status === "pending";
  }).length;
  const pendingIndents = wardIndents.filter(function pendingIndent(indent) {
    return indent.status === "pending";
  }).length;
  const entries = NAV.filter(function visible(entry) {
    return (isHospital || !entry.hospital) && canSeeRoute(entry.key, me?.role, me?.permissions);
  });

  function badgeFor(key: Route) {
    if (key === "orders") return newOrders;
    if (key === "prescriptions") return pendingRx;
    if (key === "indents") return pendingIndents;
    return 0;
  }
  function isLocked(key: Route) {
    return featureLocked(key);
  }
  function choose(key: Route) {
    go(key);
    onNavigate();
  }
  function onSignOut() {
    signOut();
  }
  function onMasterClick() {
    if (onMaster) onMaster();
  }

  return (
    <Stack
      data-slot="app-sidebar"
      className={cn(
        "h-dvh w-64 shrink-0 bg-sidebar text-white max-[1099px]:fixed max-[1099px]:z-40 max-[1099px]:-translate-x-[105%] max-[1099px]:transition-transform",
        open && "max-[1099px]:translate-x-0",
        className,
      )}
    >
      <SidebarBrand />
      <StoreChip name={profile.name} open={profile.storeOpen} />
      <Stack gap={0} className="min-h-0 flex-1 overflow-y-auto px-3 py-1.5">
        <SidebarNav entries={entries} route={route} badgeFor={badgeFor} isLocked={isLocked} onChoose={choose} />
      </Stack>
      <Stack gap={2} className="border-t border-white/10 px-3.5 py-3.5">
        <Stack direction="row" align="center" gap={2}>
          <Avatar name={profile.pharmacist || "Pharmacist"} size="md" className="rounded-[10px] bg-mint text-deep" />
          <Stack gap={0} className="min-w-0 flex-1">
            <Text as="span" className="truncate text-[12.5px] font-bold text-white">
              {profile.pharmacist.split(",")[0]}
            </Text>
            <Text as="span" className="text-[10.5px] text-white/45">
              Registered Pharmacist
            </Text>
          </Stack>
          <IconButton label="Log out" variant="ghost" className="text-white hover:bg-white/10" onClick={onSignOut}>
            <IconArrowRight size={17} />
          </IconButton>
        </Stack>
        {onMaster ? (
          <Button variant="link" className="text-mint" onClick={onMasterClick}>
            Master portal
          </Button>
        ) : null}
        <Text variant="caption" className="text-white/40">
          © 2026 Medmate India Technology Private Limited
        </Text>
      </Stack>
    </Stack>
  );
}
