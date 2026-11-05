import { useEffect, useState } from "react";
import { PharmaProvider, usePharma, Route } from "@/app/session/pharmacy-provider";
import { PLANS, inr, planPrice, canSeeRoute } from "@/domain";
import {
  IconDashboard, IconPos, IconOrders, IconInventory, IconRx, IconStore,
  IconOffer, IconReports, IconSettings, IconSearch, IconBell, IconTruck,
  IconUsers, IconCustomers, IconSend, IconKiosk, IconShare, IconReceipt,
  IconCrown, IconGift, IconHelp, IconUser, IconRupee, IconCash, IconChevronLeft,
  IconLock, IconCheck, IconSparkle, IconArrowRight,
} from "@/components/Icon";
import DashboardScreen from "@/features/dashboard/DashboardScreen";
import PosScreen from "@/features/pos/PosScreen";
import OrdersScreen from "@/features/orders/OrdersScreen";
import SalesScreen from "@/features/sales/SalesScreen";
import InventoryScreen from "@/features/inventory/InventoryScreen";
import RackMapScreen from "@/features/rackmap/RackMapScreen";
import PurchasesScreen from "@/features/purchasing/PurchasesScreen";
import ReorderScreen from "@/features/purchasing/ReorderScreen";
import DistributorsScreen from "@/features/purchasing/DistributorsScreen";
import PrescriptionsScreen from "@/features/prescriptions/PrescriptionsScreen";
import OnlineStoreScreen from "@/features/online/OnlineStoreScreen";
import OffersScreen from "@/features/offers/OffersScreen";
import KioskScreen from "@/features/kiosk/KioskScreen";
import ReportsScreen from "@/features/reports/ReportsScreen";
import CAReportScreen from "@/features/ca/CAReportScreen";
import CustomersScreen from "@/features/customers/CustomersScreen";
import AccountScreen from "@/features/account/AccountScreen";
import UsersScreen from "@/features/users/UsersScreen";
import InvoiceSettingsScreen from "@/features/invoicing/InvoiceSettingsScreen";
import SubscriptionScreen from "@/features/subscription/SubscriptionScreen";
import ReferScreen from "@/features/referrals/ReferScreen";
import SupportScreen from "@/features/support/SupportScreen";
import SettingsScreen from "@/features/settings/SettingsScreen";
import ExpensesScreen from "@/features/expenses/ExpensesScreen";
import EmployeesScreen from "@/features/employees/EmployeesScreen";
import KhataScreen from "@/features/khata/KhataScreen";
import CrmScreen from "@/features/crm/CrmScreen";
import WardsScreen from "@/features/hospital/wards/WardsScreen";
import IndentsScreen from "@/features/hospital/indents/IndentsScreen";
import DepartmentsScreen from "@/features/hospital/departments/DepartmentsScreen";
import SalesRegisterScreen from "@/features/hospital/sales-register/SalesRegisterScreen";
import PatientBillsScreen from "@/features/hospital/patient-bills/PatientBillsScreen";
import DoctorsScreen from "@/features/hospital/doctors/DoctorsScreen";
import HospitalBillingScreen from "@/features/hospital/billing/HospitalBillingScreen";
import SetupWizard from "@/features/auth/SetupWizard";
import Onboarding, { PinSetup } from "@/features/auth/Onboarding";
import MasterPortal from "@/features/master/MasterPortal";
import { api } from "@/lib/api";

const NAV: { key: Route; label: string; Icon: (p: { size?: number }) => React.ReactNode; group?: string; hospital?: boolean }[] = [
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

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { route, go, back, canGoBack, prescriptions, subscription, me } = usePharma();
  const meta = PAGE_META[route];
  const pendingRx = prescriptions.filter((r) => r.status === "pending").length;
  const allow = (key: Route) => canSeeRoute(key, me?.role, me?.permissions);
  return (
    <header className="pd-topbar">
      <button className="pd-menu-btn pd-topbtn pd-no-print" onClick={onMenu} aria-label="Menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      {canGoBack && (
        <button className="pd-backbtn pd-no-print" onClick={back} aria-label="Go back" title="Back to previous page">
          <IconChevronLeft size={19} />
        </button>
      )}
      <div className="pd-pagetitle">
        <h1>{meta.title}</h1>
        <small>{meta.sub}</small>
      </div>
      {allow("inventory") && <div className="pd-topsearch pd-no-print">
        <span className="ic"><IconSearch size={17} /></span>
        <input placeholder="Search medicines, orders, invoices…" onFocus={() => go("inventory")} readOnly />
      </div>}
      {subscription.plan === "Essential" && <button className="pd-upgradechip pd-no-print" onClick={() => go("subscription")} title="Unlock premium features"><IconCrown size={14} /> <span>Essential · Upgrade</span></button>}
      {allow("pos") && <button className="pd-btn pd-btn-primary pd-no-print" onClick={() => go("pos")}>+ New sale</button>}
      {allow("prescriptions") && <button className="pd-topbtn pd-no-print" onClick={() => go("prescriptions")} aria-label="Notifications">
        <IconBell size={19} />
        {pendingRx > 0 && <span className="dot" />}
      </button>}
    </header>
  );
}
