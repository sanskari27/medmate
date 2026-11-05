import { usePharma, Route } from "@/app/session/pharmacy-provider";
import { canSeeRoute } from "@/domain";
import {
  IconDashboard,
  IconPos,
  IconOrders,
  IconInventory,
  IconRx,
  IconStore,
  IconOffer,
  IconReports,
  IconSettings,
  IconTruck,
  IconUsers,
  IconCustomers,
  IconSend,
  IconKiosk,
  IconShare,
  IconReceipt,
  IconCrown,
  IconGift,
  IconHelp,
  IconUser,
  IconRupee,
  IconCash,
  IconLock,
} from "@/components/Icon";

import { BrandMark } from "./BrandMark";

const NAV: {
  key: Route;
  label: string;
  Icon: (p: { size?: number }) => React.ReactNode;
  group?: string;
  hospital?: boolean;
}[] = [
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

export function Sidebar({
  open,
  onNavigate,
  onMaster,
}: {
  open: boolean;
  onNavigate: () => void;
  onMaster?: () => void;
}) {
  const {
    route,
    go,
    profile,
    prescriptions,
    sales,
    isHospital,
    wardIndents,
    signOut,
    featureLocked,
    me,
  } = usePharma();
  const newOrders = sales.filter((s) => s.channel === "online" && s.status === "new").length;
  const pendingRx = prescriptions.filter((r) => r.status === "pending").length;
  const pendingIndents = wardIndents.filter((x) => x.status === "pending").length;
  const badgeFor = (k: Route) =>
    k === "orders"
      ? newOrders
      : k === "prescriptions"
        ? pendingRx
        : k === "indents"
          ? pendingIndents
          : 0;
  const nav = NAV.filter(
    (n) => (isHospital || !n.hospital) && canSeeRoute(n.key, me?.role, me?.permissions),
  );
  const choose = (key: Route) => {
    go(key);
    onNavigate();
  };
  return (
    <aside className={`pd-sidebar${open ? " open" : ""}`}>
      <div className="pd-brand">
        <BrandMark />
        <span className="pd-brand-tx">
          <b>
            <em>Namma</em> MedMate
          </b>
          <small>Partner Console</small>
        </span>
      </div>
      <div className="pd-storechip">
        <span style={{ fontSize: 18 }}>
          <IconStore size={18} />
        </span>
        <span className="nm">
          {profile.name}
          <small>
            {profile.storeOpen ? "● Online · accepting orders" : "○ Online store paused"}
          </small>
        </span>
      </div>
      <nav className="pd-nav">
        {nav.map((n) => {
          const b = badgeFor(n.key);
          const locked = featureLocked(n.key);
          return (
            <div key={n.key}>
              {n.group && <div className="pd-nav-label">{n.group}</div>}
              <button
                className={`pd-navitem${route === n.key ? " on" : ""}${locked ? " locked" : ""}`}
                onClick={() => choose(n.key)}
                title={locked ? "Premium feature — upgrade to unlock" : undefined}
              >
                <span className="ic">
                  <n.Icon size={19} />
                </span>
                {n.label}
                {locked ? (
                  <span className="pd-navlock">
                    <IconLock size={12} />
                  </span>
                ) : (
                  b > 0 && <span className="badge">{b}</span>
                )}
              </button>
            </div>
          );
        })}
      </nav>
      <div className="pd-sidefoot">
        <div className="pd-userrow">
          <span className="pd-userav">{profile.pharmacist[0]}</span>
          <span className="nm">
            {profile.pharmacist.split(",")[0]}
            <small>Registered Pharmacist</small>
          </span>
          <button className="pd-signout" title="Log out" onClick={signOut} aria-label="Log out">
            <svg
              width={17}
              height={17}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
        {onMaster && (
          <button className="pd-ob-link" style={{ margin: "8px 12px" }} onClick={onMaster}>
            Master portal
          </button>
        )}
        <p className="pd-copyright">© 2026 Medmate India Technology Private Limited</p>
      </div>
    </aside>
  );
}
