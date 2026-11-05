import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BillingCycle, HOSPITAL_ROUTES, Plan, PREMIUM_ROUTES, isFreePlan, subscriptionLapsed, todayISO } from "@/domain";
import {
  IconChevronLeft, IconCrown, IconDashboard, IconGift, IconHelp, IconOffer, IconReports, IconRx, IconSend, IconStore, IconUser,
} from "@/components/Icon";
import { SignOutDialog } from "@/features/auth/SignOutDialog";

import { plusDays } from "./plusDays";
import { Table } from "./Table";
import { makeCode } from "./makeCode";

type Desk = "dashboard" | "pharmacies" | "kyc" | "subscriptions" | "coupons" | "requests" | "support" | "consultations" | "referrals" | "activity";

type Booking = { id: number; name: string; phone: string; area: string; note: string; status: string; at: string };

type Seats = { included: number | null; extra: number; inUse: number; limit: number | null };

type Kyc = { gstin: string; pan: string; dlNo: string; fssai: string; pharmacist?: string; bank?: { bankName?: string; accountNumber?: string; ifsc?: string } | null };

type Row = { id: string; phone: string; name: string; city: string; plan: string; cycle: string; status: string; renewsOn: string; businessType: string; seats: Seats; kyc: Kyc };

type Grant = { route: string; until?: string };

type RequestRow = { id: string; pharmacyId: string; pharmacyName: string; phone: string; plan: Plan; cycle: BillingCycle; kind: string; createdAt: number; status: string };

type Ticket = { id: string; subject: string; status: string; pharmacyId?: string; pharmacyName?: string; category?: string };

type Referral = { id: string; name: string; status: string; reward: number; paidAt?: number; paidBy?: string; pharmacyId?: string; pharmacyName?: string };

type Profile = Row & { tickets: Ticket[]; referrals: Referral[]; grants: Grant[]; requests: { id: string; plan: string; cycle: string; kind: string; createdAt: number; status: string }[] };

type AuditRow = { phone: string; pharmacyId: string; pharmacyName: string; action: string; before: unknown; after: unknown; reason: string; at: string };

const LABELS: Record<string, string> = {
  orders: "Orders", sales: "Sales", prescriptions: "Prescriptions", customers: "Customers", khata: "Credit · Khata",
  crm: "CRM", rackmap: "Rack map", reorder: "Reorder", distributors: "Distributors", online: "Online store",
  offers: "Offers", kiosk: "Kiosk", reports: "Reports", expenses: "Expenses", ca: "CA", employees: "Employees",
  wards: "IPD · Wards", hospbill: "Hospital Billing", ptbills: "Active Patients", salesreg: "Sales Register",
  indents: "Ward Indents", departments: "Departments", doctors: "Doctors",
};

const PLANS: Plan[] = ["Essential", "Care", "Growth", "Flagship"];

const NAV: { key: Desk; label: string; group?: string; Icon: (p: { size?: number }) => React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", Icon: IconDashboard },
  { key: "pharmacies", label: "Pharmacies", Icon: IconStore, group: "Tenants" },
  { key: "kyc", label: "KYC", Icon: IconUser },
  { key: "subscriptions", label: "Subscriptions", Icon: IconCrown },
  { key: "coupons", label: "Coupons", Icon: IconOffer },
  { key: "requests", label: "Plan requests", Icon: IconSend },
  { key: "support", label: "Support", Icon: IconHelp, group: "Operations" },
  { key: "consultations", label: "Consultations", Icon: IconRx },
  { key: "referrals", label: "Referrals", Icon: IconGift },
  { key: "activity", label: "Platform activity", Icon: IconReports },
];

const META: Record<Desk, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard", sub: "Pharmacies, KYC, and renewals" },
  pharmacies: { title: "Pharmacies", sub: "Search and open a pharmacy file" },
  kyc: { title: "KYC", sub: "GSTIN, PAN, or drug licence still blank" },
  subscriptions: { title: "Subscriptions", sub: "Plan, cycle, and renewal" },
  coupons: { title: "Coupons", sub: "Upgrade codes with an expiry and a plan length" },
  requests: { title: "Plan requests", sub: "What pharmacies asked for" },
  support: { title: "Support", sub: "Open tickets" },
  consultations: { title: "Consultations", sub: "Bookings from the public site" },
  referrals: { title: "Referrals", sub: "Earn, then pay ₹500 once" },
  activity: { title: "Platform activity", sub: "Master changes, newest first" },
};

type CouponRow = { code: string; plan: string; expiresOn: string; validDays: number; redeemed: number };

export function CouponDesk() {
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [code, setCode] = useState("");
  const [plan, setPlan] = useState<Plan>("Growth");
  const [expiresOn, setExpiresOn] = useState(plusDays(30));
  const [validDays, setValidDays] = useState(30);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => api<CouponRow[]>("/master/coupons").then(setRows).catch((err: Error) => setError(err.message));
  useEffect(() => { void load(); }, []);
  const issue = async () => {
    setError("");
    setBusy(true);
    try {
      await api("/master/coupons", { method: "POST", body: { code, plan, expiresOn, validDays } });
      setCode("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not issue the coupon");
    } finally { setBusy(false); }
  };
  return (
    <div>
      <div className="pd-card pd-card-pad" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Issue a coupon</h3>
        <p className="pd-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>The code works until the expiry date. Redeeming it turns on the plan for the validity days. Each pharmacy can redeem one coupon.</p>
        {error && <p className="pd-form-alert" role="alert">{error}</p>}
        <div className="pd-flex pd-gap6" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="pd-field"><label htmlFor="issue-code">Code</label><input id="issue-code" className="pd-input" value={code} autoComplete="off" onChange={(e) => setCode(e.target.value.toUpperCase())} /></div>
          <button className="pd-btn pd-btn-ghost" type="button" onClick={() => setCode(makeCode())}>Generate</button>
          <div className="pd-field"><label htmlFor="issue-plan">Plan</label>
            <select id="issue-plan" className="pd-select" value={plan} onChange={(e) => setPlan(e.target.value as Plan)}>{(["Care", "Growth", "Flagship"] as Plan[]).map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <div className="pd-field"><label htmlFor="issue-expiry">Coupon expiry</label><input id="issue-expiry" className="pd-input" type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} /></div>
          <div className="pd-field"><label htmlFor="issue-days">Plan validity (days)</label><input id="issue-days" className="pd-input" type="number" min={1} max={3650} value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} /></div>
          <button className="pd-btn pd-btn-primary" disabled={busy} onClick={() => void issue()}>Issue coupon</button>
        </div>
      </div>
      <Table columns={["Code", "Plan", "Expires", "Validity", "Redeemed"]} empty="No coupons yet.">
        {rows.map((row) => <tr key={row.code}><td>{row.code}</td><td>{row.plan}</td><td>{row.expiresOn}</td><td>{row.validDays} days</td><td>{row.redeemed}</td></tr>)}
      </Table>
    </div>
  );
}
