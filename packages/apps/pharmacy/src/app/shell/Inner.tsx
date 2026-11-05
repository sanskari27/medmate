import { useEffect, useState } from "react";
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
} from "@/components/Icon";
import SetupWizard from "@/features/auth/SetupWizard";
import Onboarding, { PinSetup } from "@/features/auth/Onboarding";
import MasterPortal from "@/features/master/MasterPortal";
import { api } from "@/lib/api";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Canvas } from "./Canvas";

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

export function Inner() {
  const { setupComplete, signedIn, needsPin, pinReset, route, go, me, isHospital } = usePharma();
  const [menu, setMenu] = useState(false);
  const [masterPhone, setMasterPhone] = useState<string | null | undefined>(undefined);
  const [showMaster, setShowMaster] = useState(false);
  const loadMaster = () =>
    api<{ phone: string }>("/master/session")
      .then((row) => setMasterPhone(row.phone))
      .catch(() => setMasterPhone(null));
  useEffect(() => {
    void loadMaster();
  }, []);
  useEffect(() => {
    if (!me || canSeeRoute(route, me.role, me.permissions)) return;
    const next = NAV.find(
      (n) => (isHospital || !n.hospital) && canSeeRoute(n.key, me.role, me.permissions),
    );
    if (next) go(next.key);
  }, [me, route, isHospital, go]);
  if (masterPhone === undefined && !signedIn)
    return <div className="pd-boot">Loading pharmacy…</div>;
  if (masterPhone && (showMaster || !signedIn)) {
    return (
      <MasterPortal
        phone={masterPhone}
        pharmacyLabel={signedIn ? "Pharmacy" : "Pharmacy sign in"}
        onPharmacy={() => setShowMaster(false)}
        onSignedOut={() => {
          setMasterPhone(null);
          setShowMaster(false);
        }}
      />
    );
  }
  if (!signedIn)
    return (
      <Onboarding
        onMaster={() => {
          setShowMaster(true);
          void loadMaster();
        }}
      />
    );
  if (needsPin || pinReset) return <PinSetup />;
  if (!setupComplete) return <SetupWizard />;
  return (
    <div className="pd-shell">
      {menu && (
        <button
          className="pd-nav-backdrop"
          aria-label="Close menu"
          onClick={() => setMenu(false)}
        />
      )}
      <Sidebar
        open={menu}
        onNavigate={() => setMenu(false)}
        onMaster={masterPhone ? () => setShowMaster(true) : undefined}
      />
      <div className="pd-main">
        <TopBar onMenu={() => setMenu((v) => !v)} />
        <div className="pd-canvas">
          <Canvas />
        </div>
      </div>
    </div>
  );
}
