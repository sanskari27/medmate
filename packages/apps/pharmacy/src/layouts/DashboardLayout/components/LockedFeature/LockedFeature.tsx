import { usePharma, Route } from "@/store/slices/session";
import { PLANS, inr, planPrice } from "@/utils";
import { IconCrown, IconLock, IconCheck, IconSparkle, IconArrowRight } from "@/components/Icon";

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

export function LockedFeature({ route }: { route: Route }) {
  const { go, subscription } = usePharma();
  const meta = PAGE_META[route];
  const care = PLANS.find((p) => p.key === "Care")!;
  const price = planPrice(care, "monthly");
  return (
    <div className="pd-canvas-wide">
      <div className="pd-paywall">
        <span className="pd-paywall-ic">
          <IconLock size={30} />
        </span>
        <span className="pd-pill pill-gold" style={{ marginBottom: 10 }}>
          <IconCrown size={12} /> Paid plan
        </span>
        <h2>{meta.title} is a premium feature</h2>
        <p>
          You're on the <b>{subscription.plan}</b> plan. Billing / POS, Inventory and Purchases stay
          open — {meta.title} unlocks with any active paid plan from <b>{inr(price)}/mo</b>.
        </p>
        <div className="pd-paywall-feats">
          {care.features.map((f) => (
            <div key={f}>
              <IconCheck size={14} /> {f}
            </div>
          ))}
        </div>
        <div className="pd-paywall-cta">
          <button className="pd-btn pd-btn-primary" onClick={() => go("subscription")}>
            <IconSparkle size={15} /> Upgrade to unlock
          </button>
          <button className="pd-btn pd-btn-ghost" onClick={() => go("subscription")}>
            See all plans <IconArrowRight size={14} />
          </button>
        </div>
        <p className="pd-paywall-free">
          <IconCheck size={13} /> Free forever: Billing / POS · Inventory · Purchases
        </p>
      </div>
    </div>
  );
}
