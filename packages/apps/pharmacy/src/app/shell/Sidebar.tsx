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

import { BrandMark } from "./BrandMark";

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

export function Sidebar({ open, onNavigate, onMaster }: { open: boolean; onNavigate: () => void; onMaster?: () => void }) {
  const { route, go, profile, prescriptions, sales, isHospital, wardIndents, signOut, featureLocked, me } = usePharma();
  const newOrders = sales.filter((s) => s.channel === "online" && s.status === "new").length;
  const pendingRx = prescriptions.filter((r) => r.status === "pending").length;
  const pendingIndents = wardIndents.filter((x) => x.status === "pending").length;
  const badgeFor = (k: Route) => (k === "orders" ? newOrders : k === "prescriptions" ? pendingRx : k === "indents" ? pendingIndents : 0);
  const nav = NAV.filter((n) => (isHospital || !n.hospital) && canSeeRoute(n.key, me?.role, me?.permissions));
  const choose = (key: Route) => { go(key); onNavigate(); };
  return (
    <aside className={`pd-sidebar${open ? " open" : ""}`}>
      <div className="pd-brand">
        <BrandMark />
        <span className="pd-brand-tx">
          <b><em>Namma</em> MedMate</b>
          <small>Partner Console</small>
        </span>
      </div>
      <div className="pd-storechip">
        <span style={{ fontSize: 18 }}><IconStore size={18} /></span>
        <span className="nm">{profile.name}<small>{profile.storeOpen ? "● Online · accepting orders" : "○ Online store paused"}</small></span>
      </div>
      <nav className="pd-nav">
        {nav.map((n) => {
          const b = badgeFor(n.key);
          const locked = featureLocked(n.key);
          return (
            <div key={n.key}>
              {n.group && <div className="pd-nav-label">{n.group}</div>}
              <button className={`pd-navitem${route === n.key ? " on" : ""}${locked ? " locked" : ""}`} onClick={() => choose(n.key)} title={locked ? "Premium feature — upgrade to unlock" : undefined}>
                <span className="ic"><n.Icon size={19} /></span>
                {n.label}
                {locked ? <span className="pd-navlock"><IconLock size={12} /></span> : b > 0 && <span className="badge">{b}</span>}
              </button>
            </div>
          );
        })}
      </nav>
      <div className="pd-sidefoot">
        <div className="pd-userrow">
          <span className="pd-userav">{profile.pharmacist[0]}</span>
          <span className="nm">{profile.pharmacist.split(",")[0]}<small>Registered Pharmacist</small></span>
          <button className="pd-signout" title="Log out" onClick={signOut} aria-label="Log out">
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          </button>
        </div>
        {onMaster && <button className="pd-ob-link" style={{ margin: "8px 12px" }} onClick={onMaster}>Master portal</button>}
        <p className="pd-copyright">© 2026 Medmate India Technology Private Limited</p>
      </div>
    </aside>
  );
}
