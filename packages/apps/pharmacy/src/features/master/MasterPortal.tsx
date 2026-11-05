import { plusDays } from "./plusDays";
import { subOf } from "./subOf";
import { renewalDue } from "./renewalDue";
import { kycGaps } from "./kycGaps";
import { seatText } from "./seatText";
import { Dashboard } from "./Dashboard";
import { PharmacyList } from "./PharmacyList";
import { Queue } from "./Queue";
import { RequestTable } from "./RequestTable";
import { ConsultationTable } from "./ConsultationTable";
import { TicketTable } from "./TicketTable";
import { ReferralTable } from "./ReferralTable";
import { AuditTable } from "./AuditTable";
import { PharmacyFile } from "./PharmacyFile";
import { CouponDesk } from "./CouponDesk";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BillingCycle, Plan, subscriptionLapsed, todayISO } from "@/domain";
import {
  IconChevronLeft,
  IconCrown,
  IconDashboard,
  IconGift,
  IconHelp,
  IconOffer,
  IconReports,
  IconRx,
  IconSend,
  IconStore,
  IconUser,
} from "@/components/Icon";
import { SignOutDialog } from "@/features/auth/SignOutDialog";

type Desk =
  | "dashboard"
  | "pharmacies"
  | "kyc"
  | "subscriptions"
  | "coupons"
  | "requests"
  | "support"
  | "consultations"
  | "referrals"
  | "activity";
type Booking = {
  id: number;
  name: string;
  phone: string;
  area: string;
  note: string;
  status: string;
  at: string;
};
type Seats = { included: number | null; extra: number; inUse: number; limit: number | null };
type Kyc = {
  gstin: string;
  pan: string;
  dlNo: string;
  fssai: string;
  pharmacist?: string;
  bank?: { bankName?: string; accountNumber?: string; ifsc?: string } | null;
};
type Row = {
  id: string;
  phone: string;
  name: string;
  city: string;
  plan: string;
  cycle: string;
  status: string;
  renewsOn: string;
  businessType: string;
  seats: Seats;
  kyc: Kyc;
};
type Grant = { route: string; until?: string };
type RequestRow = {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  phone: string;
  plan: Plan;
  cycle: BillingCycle;
  kind: string;
  createdAt: number;
  status: string;
};
type Ticket = {
  id: string;
  subject: string;
  status: string;
  pharmacyId?: string;
  pharmacyName?: string;
  category?: string;
};
type Referral = {
  id: string;
  name: string;
  status: string;
  reward: number;
  paidAt?: number;
  paidBy?: string;
  pharmacyId?: string;
  pharmacyName?: string;
};
type Profile = Row & {
  tickets: Ticket[];
  referrals: Referral[];
  grants: Grant[];
  requests: {
    id: string;
    plan: string;
    cycle: string;
    kind: string;
    createdAt: number;
    status: string;
  }[];
};
type AuditRow = {
  phone: string;
  pharmacyId: string;
  pharmacyName: string;
  action: string;
  before: unknown;
  after: unknown;
  reason: string;
  at: string;
};

const NAV: {
  key: Desk;
  label: string;
  group?: string;
  Icon: (p: { size?: number }) => React.ReactNode;
}[] = [
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

export default function MasterPortal({
  phone,
  onPharmacy,
  pharmacyLabel,
  onSignedOut,
}: {
  phone: string;
  onPharmacy: () => void;
  pharmacyLabel: string;
  onSignedOut: () => void;
}) {
  const [desk, setDesk] = useState<Desk>("dashboard");
  const [menu, setMenu] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [window, setWindow] = useState("");
  const [reason, setReason] = useState("");
  const [renewsOn, setRenewsOn] = useState(plusDays(30));
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [nextPlan, setNextPlan] = useState<Plan>("Care");
  const [extra, setExtra] = useState(0);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [error, setError] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);

  const load = async () => {
    const [list, inbox, work, booked] = await Promise.all([
      api<Row[]>("/master/pharmacies"),
      api<RequestRow[]>("/master/requests"),
      api<{ tickets: Ticket[]; referrals: Referral[] }>("/master/work"),
      api<Booking[]>("/master/consultations"),
    ]);
    setRows(list);
    setRequests(inbox);
    setTickets(work.tickets);
    setReferrals(work.referrals);
    setBookings(booked);
  };
  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);
  useEffect(() => {
    if (desk !== "activity") return;
    void api<AuditRow[]>("/master/audit")
      .then(setAudit)
      .catch((err) => setError(err.message));
  }, [desk]);

  const choose = (key: Desk) => {
    setDesk(key);
    setProfile(null);
    setMenu(false);
  };
  const open = async (id: string, patch?: { plan?: Plan; cycle?: BillingCycle }) => {
    const next = await api<Profile>("/master/pharmacies/" + id);
    setProfile(next);
    setNextPlan(patch?.plan || (next.plan as Plan));
    setCycle(patch?.cycle || (next.cycle === "annual" ? "annual" : "monthly"));
    setRenewsOn(/^\d{4}-\d{2}-\d{2}$/.test(next.renewsOn) ? next.renewsOn : plusDays(30));
    setExtra(next.seats.extra);
    setGrants(next.grants || []);
    setError("");
    setMenu(false);
  };
  const save = async (path: string, method: string, body: unknown, reopen = true) => {
    try {
      await api(path, { method, body: { ...(body as object), reason } });
      await load();
      if (reopen && profile) await open(profile.id);
      if (desk === "activity") setAudit(await api<AuditRow[]>("/master/audit"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };
  const signOut = () => setLeaveOpen(true);
  const finishSignOut = async () => {
    setLeaveOpen(false);
    await api("/master/sign-out", { method: "POST" }).catch(() => undefined);
    onSignedOut();
  };

  const filtered = rows.filter((row) => {
    const query = q.trim().toLowerCase();
    const digits = query.replace(/\D/g, "");
    if (
      query &&
      !row.name.toLowerCase().includes(query) &&
      !row.city.toLowerCase().includes(query) &&
      !(digits.length >= 4 && row.phone.replace(/\D/g, "").includes(digits))
    )
      return false;
    if (plan && row.plan !== plan) return false;
    if (businessType && row.businessType !== businessType) return false;
    const sub = subOf(row);
    if (window === "expired") return subscriptionLapsed(sub);
    if (window === "7" || window === "15" || window === "30") {
      if (subscriptionLapsed(sub) || !/^\d{4}-\d{2}-\d{2}$/.test(row.renewsOn)) return false;
      return row.renewsOn >= todayISO() && row.renewsOn <= plusDays(Number(window));
    }
    return true;
  });
  const kycQueue = rows.filter((row) => kycGaps(row).length > 0);
  const due = rows.filter(renewalDue);
  const openRequests = requests.filter((request) => request.status === "open");
  const meta = META[desk];
  const openBookings = bookings.filter((row) => row.status === "open").length;
  const badge = (key: Desk) =>
    key === "kyc"
      ? kycQueue.length
      : key === "subscriptions"
        ? due.length
        : key === "requests"
          ? openRequests.length
          : key === "support"
            ? tickets.length
            : key === "consultations"
              ? openBookings
              : 0;
  const markBooking = async (id: number) => {
    try {
      await api(`/master/consultations/${id}`, { method: "PATCH", body: { status: "handled" } });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };
  const impersonate = async (id: string) => {
    try {
      await api(`/master/pharmacies/${id}/impersonate`, { method: "POST", body: {} });
      globalThis.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the pharmacy");
    }
  };

  return (
    <div className="pd-shell">
      {menu && (
        <button
          className="pd-nav-backdrop"
          aria-label="Close menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`pd-sidebar${menu ? " open" : ""}`}>
        <div className="pd-brand">
          <span className="pd-brand-mark" aria-hidden>
            <svg width={24} height={24} viewBox="0 0 40 40" fill="none">
              <path
                d="M20 3.5C12.5 3.5 6.5 9.3 6.5 17c0 8.6 10.7 17.3 12.7 18.8a1.4 1.4 0 0 0 1.6 0C22.8 34.3 33.5 25.6 33.5 17 33.5 9.3 27.5 3.5 20 3.5Z"
                fill="#2F7D52"
              />
              <circle cx="20" cy="16.5" r="8.7" fill="#fff" />
              <path d="M18 10.5h4V14h3.5v4H22v3.5h-4V18h-3.5v-4H18z" fill="#2F7D52" />
            </svg>
          </span>
          <span className="pd-brand-tx">
            <b>
              <em>Namma</em> MedMate
            </b>
            <small>Master</small>
          </span>
        </div>
        <div className="pd-storechip">
          <span style={{ fontSize: 18 }}>
            <IconUser size={18} />
          </span>
          <span className="nm">
            {phone}
            <small>Allowlisted staff</small>
          </span>
        </div>
        <nav className="pd-nav">
          {NAV.map((item) => (
            <div key={item.key}>
              {item.group && <div className="pd-nav-label">{item.group}</div>}
              <button
                className={`pd-navitem${desk === item.key && !profile ? " on" : ""}`}
                onClick={() => choose(item.key)}
              >
                <span className="ic">
                  <item.Icon size={19} />
                </span>
                {item.label}
                {badge(item.key) > 0 && <span className="badge">{badge(item.key)}</span>}
              </button>
            </div>
          ))}
        </nav>
        <div className="pd-sidefoot">
          <button className="pd-navitem" onClick={onPharmacy}>
            <span className="ic">
              <IconStore size={19} />
            </span>
            {pharmacyLabel}
          </button>
          <div className="pd-userrow">
            <span className="pd-userav">M</span>
            <span className="nm">
              Master<small>{phone}</small>
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
          <p className="pd-copyright">© 2026 Medmate India Technology Private Limited</p>
        </div>
      </aside>
      <div className="pd-main">
        <header className="pd-topbar">
          <button
            className="pd-menu-btn pd-topbtn"
            onClick={() => setMenu((open) => !open)}
            aria-label="Menu"
          >
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
          {profile && (
            <button className="pd-backbtn" onClick={() => setProfile(null)} aria-label="Go back">
              <IconChevronLeft size={19} />
            </button>
          )}
          <div className="pd-pagetitle">
            <h1>{profile ? profile.name : meta.title}</h1>
            <small>{profile ? `${profile.phone} · ${profile.city || "No city"}` : meta.sub}</small>
          </div>
        </header>
        <div className="pd-canvas">
          <div className="pd-canvas-wide">
            {error && (
              <p className="pd-form-alert" role="alert">
                {error}
              </p>
            )}
            {profile ? (
              <PharmacyFile
                profile={profile}
                reason={reason}
                setReason={setReason}
                nextPlan={nextPlan}
                setNextPlan={setNextPlan}
                cycle={cycle}
                setCycle={setCycle}
                renewsOn={renewsOn}
                setRenewsOn={setRenewsOn}
                extra={extra}
                setExtra={setExtra}
                grants={grants}
                setGrants={setGrants}
                save={save}
                onImpersonate={() => void impersonate(profile.id)}
              />
            ) : (
              <>
                {desk === "dashboard" && (
                  <Dashboard
                    counts={{
                      pharmacies: rows.length,
                      kyc: kycQueue.length,
                      due: due.length,
                      requests: openRequests.length,
                      tickets: tickets.length,
                    }}
                    onOpen={choose}
                  />
                )}
                {desk === "pharmacies" && (
                  <PharmacyList
                    rows={filtered}
                    q={q}
                    setQ={setQ}
                    plan={plan}
                    setPlan={setPlan}
                    businessType={businessType}
                    setBusinessType={setBusinessType}
                    window={window}
                    setWindow={setWindow}
                    onOpen={(id) => void open(id)}
                  />
                )}
                {desk === "kyc" && (
                  <Queue
                    rows={kycQueue}
                    empty="Every pharmacy has a GSTIN, PAN, and drug licence."
                    columns={["Pharmacy", "Phone", "Missing"]}
                    cells={(row) => [row.name, row.phone, kycGaps(row).join(", ")]}
                    onOpen={(id) => void open(id)}
                  />
                )}
                {desk === "subscriptions" && (
                  <Queue
                    rows={rows}
                    empty="No pharmacies yet."
                    columns={["Pharmacy", "Plan", "Renews", "Seats"]}
                    cells={(row) => [
                      row.name,
                      `${row.plan} · ${row.cycle}${renewalDue(row) ? " · due" : ""}`,
                      row.renewsOn || "—",
                      seatText(row.seats),
                    ]}
                    onOpen={(id) => void open(id)}
                  />
                )}
                {desk === "coupons" && <CouponDesk />}
                {desk === "requests" && (
                  <RequestTable
                    requests={requests}
                    onOpen={(request) =>
                      void open(request.pharmacyId, { plan: request.plan, cycle: request.cycle })
                    }
                  />
                )}
                {desk === "support" && (
                  <TicketTable
                    tickets={tickets}
                    onResolve={(ticket) =>
                      void save(
                        `/master/pharmacies/${ticket.pharmacyId}/tickets/${ticket.id}`,
                        "PATCH",
                        { status: "Resolved" },
                        false,
                      )
                    }
                  />
                )}
                {desk === "consultations" && (
                  <ConsultationTable rows={bookings} onHandled={(id) => void markBooking(id)} />
                )}
                {desk === "referrals" && (
                  <ReferralTable
                    referrals={referrals}
                    onEarn={(row) =>
                      void save(
                        `/master/pharmacies/${row.pharmacyId}/referrals/${row.id}/earn`,
                        "POST",
                        {},
                        false,
                      )
                    }
                    onPay={(row) =>
                      void save(
                        `/master/pharmacies/${row.pharmacyId}/referrals/${row.id}/pay`,
                        "POST",
                        {},
                        false,
                      )
                    }
                  />
                )}
                {desk === "activity" && <AuditTable rows={audit} />}
              </>
            )}
          </div>
        </div>
      </div>
      {leaveOpen && (
        <SignOutDialog
          onCancel={() => setLeaveOpen(false)}
          onConfirm={() => void finishSignOut()}
        />
      )}
    </div>
  );
}
