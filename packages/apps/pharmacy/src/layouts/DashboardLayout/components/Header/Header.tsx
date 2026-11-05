import { usePharma, Route } from "@/store/slices/session";
import { canSeeRoute } from "@/utils";
import { IconSearch, IconBell, IconCrown, IconChevronLeft } from "@/components/Icon";

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

export function Header({ onMenu }: { onMenu: () => void }) {
  const { route, go, back, canGoBack, prescriptions, subscription, me } = usePharma();
  const meta = PAGE_META[route];
  const pendingRx = prescriptions.filter((r) => r.status === "pending").length;
  const allow = (key: Route) => canSeeRoute(key, me?.role, me?.permissions);
  return (
    <header className="pd-topbar">
      <button className="pd-menu-btn pd-topbtn pd-no-print" onClick={onMenu} aria-label="Menu">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      {canGoBack && (
        <button
          className="pd-backbtn pd-no-print"
          onClick={back}
          aria-label="Go back"
          title="Back to previous page"
        >
          <IconChevronLeft size={19} />
        </button>
      )}
      <div className="pd-pagetitle">
        <h1>{meta.title}</h1>
        <small>{meta.sub}</small>
      </div>
      {allow("inventory") && (
        <div className="pd-topsearch pd-no-print">
          <span className="ic">
            <IconSearch size={17} />
          </span>
          <input
            placeholder="Search medicines, orders, invoices…"
            onFocus={() => go("inventory")}
            readOnly
          />
        </div>
      )}
      {subscription.plan === "Essential" && (
        <button
          className="pd-upgradechip pd-no-print"
          onClick={() => go("subscription")}
          title="Unlock premium features"
        >
          <IconCrown size={14} /> <span>Essential · Upgrade</span>
        </button>
      )}
      {allow("pos") && (
        <button className="pd-btn pd-btn-primary pd-no-print" onClick={() => go("pos")}>
          + New sale
        </button>
      )}
      {allow("prescriptions") && (
        <button
          className="pd-topbtn pd-no-print"
          onClick={() => go("prescriptions")}
          aria-label="Notifications"
        >
          <IconBell size={19} />
          {pendingRx > 0 && <span className="dot" />}
        </button>
      )}
    </header>
  );
}
