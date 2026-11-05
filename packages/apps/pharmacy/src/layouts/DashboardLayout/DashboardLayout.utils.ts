import type { ReactNode } from "react";
import {
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
} from "@/components/atoms";
import type { Route } from "@/types";
import { canSeeRoute } from "@/utils";

export type NavIcon = (props: { size?: number }) => ReactNode;

export type NavItem = {
  key: Route;
  label: string;
  Icon: NavIcon;
  group?: string;
  hospital?: boolean;
};

export type PageMeta = {
  title: string;
  sub: string;
};

export type RouteAccess = {
  role?: string;
  permissions?: string[];
  isHospital: boolean;
};

export type NavBadgeCounts = {
  orders: number;
  prescriptions: number;
  indents: number;
};

export const NAV: NavItem[] = [
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

export const PAGE_META: Record<Route, PageMeta> = {
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

export function pageMeta(route: Route): PageMeta {
  return PAGE_META[route];
}

export function isNavItemVisible(item: NavItem, access: RouteAccess): boolean {
  if (item.hospital && !access.isHospital) return false;
  return canSeeRoute(item.key, access.role, access.permissions);
}

export function visibleNavItems(access: RouteAccess): NavItem[] {
  return NAV.filter(function keepVisible(item) {
    return isNavItemVisible(item, access);
  });
}

/** Next route when the current one is locked for this staff member. Null means stay. */
export function lockedRouteFallback(route: Route, access: RouteAccess): Route | null {
  if (canSeeRoute(route, access.role, access.permissions)) return null;
  const next = NAV.find(function findAllowed(item) {
    return isNavItemVisible(item, access);
  });
  return next ? next.key : null;
}

export function navBadgeCount(key: Route, counts: NavBadgeCounts): number {
  if (key === "orders") return counts.orders;
  if (key === "prescriptions") return counts.prescriptions;
  if (key === "indents") return counts.indents;
  return 0;
}
