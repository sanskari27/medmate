import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BillingCycle, HOSPITAL_ROUTES, Plan, PREMIUM_ROUTES, isFreePlan, subscriptionLapsed, todayISO } from "@/domain";
import {
  IconChevronLeft, IconCrown, IconDashboard, IconGift, IconHelp, IconOffer, IconReports, IconRx, IconSend, IconStore, IconUser,
} from "@/components/Icon";
import { SignOutDialog } from "@/features/auth/SignOutDialog";

import { seatText } from "./seatText";
import { Table } from "./Table";

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

export function PharmacyList({ rows, q, setQ, plan, setPlan, businessType, setBusinessType, window, setWindow, onOpen }: {
  rows: Row[]; q: string; setQ: (value: string) => void; plan: string; setPlan: (value: string) => void;
  businessType: string; setBusinessType: (value: string) => void; window: string; setWindow: (value: string) => void; onOpen: (id: string) => void;
}) {
  return (
    <>
      <div className="pd-card pd-card-pad" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input className="pd-input" placeholder="Name, phone, or city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search pharmacies" />
        <select className="pd-select" value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Plan filter"><option value="">Any plan</option>{PLANS.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="pd-select" value={businessType} onChange={(e) => setBusinessType(e.target.value)} aria-label="Business type filter"><option value="">Any type</option><option value="pharmacy">Retail</option><option value="hospital">Hospital</option></select>
        <select className="pd-select" value={window} onChange={(e) => setWindow(e.target.value)} aria-label="Renewal window"><option value="">Any renewal</option><option value="7">Expiring in 7 days</option><option value="15">Expiring in 15 days</option><option value="30">Expiring in 30 days</option><option value="expired">Expired</option></select>
      </div>
      <Table columns={["Pharmacy", "Phone", "City", "Plan", "Type", "Renews", "Seats"]} empty="No pharmacies match.">
        {rows.map((row) => <tr key={row.id} onClick={() => onOpen(row.id)} style={{ cursor: "pointer" }}><td>{row.name}</td><td>{row.phone}</td><td>{row.city || "—"}</td><td>{row.plan} · {row.cycle}</td><td>{row.businessType}</td><td>{row.renewsOn || "—"}</td><td>{seatText(row.seats)}</td></tr>)}
      </Table>
    </>
  );
}
