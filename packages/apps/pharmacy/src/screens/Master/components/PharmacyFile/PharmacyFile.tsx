import { BillingCycle, HOSPITAL_ROUTES, Plan, PREMIUM_ROUTES } from "@/utils";

import { kycGaps } from "@/screens/Master/components/kycGaps";
import { seatText } from "@/screens/Master/components/seatText";

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

const LABELS: Record<string, string> = {
  orders: "Orders",
  sales: "Sales",
  prescriptions: "Prescriptions",
  customers: "Customers",
  khata: "Credit · Khata",
  crm: "CRM",
  rackmap: "Rack map",
  reorder: "Reorder",
  distributors: "Distributors",
  online: "Online store",
  offers: "Offers",
  kiosk: "Kiosk",
  reports: "Reports",
  expenses: "Expenses",
  ca: "CA",
  employees: "Employees",
  wards: "IPD · Wards",
  hospbill: "Hospital Billing",
  ptbills: "Active Patients",
  salesreg: "Sales Register",
  indents: "Ward Indents",
  departments: "Departments",
  doctors: "Doctors",
};

const PLANS: Plan[] = ["Essential", "Care", "Growth", "Flagship"];

export function PharmacyFile({
  profile,
  reason,
  setReason,
  nextPlan,
  setNextPlan,
  cycle,
  setCycle,
  renewsOn,
  setRenewsOn,
  extra,
  setExtra,
  grants,
  setGrants,
  save,
  onImpersonate,
}: {
  profile: Profile;
  reason: string;
  setReason: (value: string) => void;
  nextPlan: Plan;
  setNextPlan: (value: Plan) => void;
  cycle: BillingCycle;
  setCycle: (value: BillingCycle) => void;
  renewsOn: string;
  setRenewsOn: (value: string) => void;
  extra: number;
  setExtra: (value: number) => void;
  grants: Grant[];
  setGrants: (value: Grant[] | ((list: Grant[]) => Grant[])) => void;
  save: (path: string, method: string, body: unknown) => Promise<void>;
  onImpersonate: () => void;
}) {
  const gaps = kycGaps(profile);
  return (
    <div className="pd-card pd-card-pad">
      <p className="pd-muted">
        {profile.businessType} · {profile.plan} {profile.cycle} · renews {profile.renewsOn} ·{" "}
        {seatText(profile.seats)}
      </p>
      <button className="pd-btn pd-btn-primary" style={{ margin: "8px 0" }} onClick={onImpersonate}>
        Open this pharmacy
      </button>
      <p>
        KYC: GSTIN {profile.kyc.gstin || "—"} · PAN {profile.kyc.pan || "—"} · Drug licence{" "}
        {profile.kyc.dlNo || "—"} · FSSAI {profile.kyc.fssai || "—"} · Pharmacist{" "}
        {profile.kyc.pharmacist || "—"} · Bank{" "}
        {profile.kyc.bank
          ? `${profile.kyc.bank.bankName || ""} ${profile.kyc.bank.accountNumber || ""} ${profile.kyc.bank.ifsc || ""}`
          : "—"}
      </p>
      {gaps.length > 0 && (
        <p className="pd-form-alert">
          Missing {gaps.join(", ")}. The pharmacy fills these in Settings. This desk does not
          approve them.
        </p>
      )}
      <div className="pd-field" style={{ margin: "12px 0" }}>
        <label>Reason</label>
        <input
          className="pd-input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why this change"
        />
      </div>
      <div className="pd-flex pd-gap6" style={{ flexWrap: "wrap", marginBottom: 12 }}>
        <select
          className="pd-select"
          value={nextPlan}
          onChange={(e) => setNextPlan(e.target.value as Plan)}
          aria-label="Plan"
        >
          {PLANS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          className="pd-select"
          value={cycle}
          onChange={(e) => setCycle(e.target.value as BillingCycle)}
          aria-label="Billing cycle"
        >
          <option value="monthly">Monthly</option>
          <option value="annual">Annual</option>
        </select>
        <input
          className="pd-input"
          type="date"
          value={renewsOn}
          onChange={(e) => setRenewsOn(e.target.value)}
          aria-label="Renewal date"
        />
        <button
          className="pd-btn pd-btn-primary"
          onClick={() =>
            save(`/master/pharmacies/${profile.id}/plan`, "PATCH", {
              plan: nextPlan,
              cycle,
              renewsOn: nextPlan === "Essential" ? "—" : renewsOn,
            })
          }
        >
          Save plan
        </button>
      </div>
      <div className="pd-flex pd-gap6" style={{ flexWrap: "wrap", marginBottom: 12 }}>
        <input
          className="pd-input"
          type="number"
          min={0}
          max={50}
          value={extra}
          onChange={(e) => setExtra(Number(e.target.value))}
          aria-label="Extra seats"
        />
        <button
          className="pd-btn pd-btn-primary"
          onClick={() =>
            save(`/master/pharmacies/${profile.id}/seats`, "PATCH", { extraSeats: extra })
          }
        >
          Save seats
        </button>
        <button
          className="pd-btn pd-btn-ghost"
          onClick={() => {
            const next = profile.businessType === "hospital" ? "pharmacy" : "hospital";
            if (
              !confirm(
                `Change this pharmacy to ${next === "hospital" ? "hospital" : "retail"}? Hospital screens follow this choice.`,
              )
            )
              return;
            void save(`/master/pharmacies/${profile.id}/business-type`, "PATCH", {
              businessType: next,
            });
          }}
        >
          Set {profile.businessType === "hospital" ? "retail" : "hospital"}
        </button>
      </div>
      <h4>Screen access</h4>
      <p className="pd-muted">
        Grants open a screen on Free and after a paid plan lapses. An active paid plan ignores them.
        Hospital screens also need the hospital business type.
      </p>
      {PREMIUM_ROUTES.map((route) => {
        const grant = grants.find((item) => item.route === route);
        return (
          <label key={route} className="pd-flex pd-gap6" style={{ margin: "4px 0" }}>
            <input
              type="checkbox"
              checked={Boolean(grant)}
              onChange={(e) =>
                setGrants((list) =>
                  e.target.checked
                    ? [...list, { route }]
                    : list.filter((item) => item.route !== route),
                )
              }
            />
            <span>
              {LABELS[route] || route}
              {HOSPITAL_ROUTES.includes(route) ? " · hospital" : ""}
            </span>
            {grant && (
              <input
                className="pd-input"
                type="date"
                value={grant.until || ""}
                onChange={(e) =>
                  setGrants((list) =>
                    list.map((item) =>
                      item.route === route ? { route, until: e.target.value || undefined } : item,
                    ),
                  )
                }
                aria-label={`${LABELS[route] || route} expiry`}
              />
            )}
          </label>
        );
      })}
      <button
        className="pd-btn pd-btn-primary"
        style={{ marginTop: 8 }}
        onClick={() => save(`/master/pharmacies/${profile.id}/grants`, "PUT", { grants })}
      >
        Save screen access
      </button>
      <h4 style={{ marginTop: 16 }}>Open tickets</h4>
      {profile.tickets.length === 0 ? (
        <p className="pd-muted">No open tickets.</p>
      ) : (
        profile.tickets.map((ticket) => (
          <div key={ticket.id} className="pd-flex pd-gap6" style={{ margin: "6px 0" }}>
            <span>{ticket.subject}</span>
            <span className="pd-pill">{ticket.status}</span>
            {ticket.status !== "Resolved" && (
              <button
                className="pd-btn pd-btn-sm"
                onClick={() =>
                  save(`/master/pharmacies/${profile.id}/tickets/${ticket.id}`, "PATCH", {
                    status: "Resolved",
                  })
                }
              >
                Resolve
              </button>
            )}
          </div>
        ))
      )}
      <h4>Referrals</h4>
      {profile.referrals.length === 0 ? (
        <p className="pd-muted">No referrals.</p>
      ) : (
        profile.referrals.map((referral) => (
          <div key={referral.id} className="pd-flex pd-gap6" style={{ margin: "6px 0" }}>
            <span>{referral.name}</span>
            <span className="pd-pill">{referral.status}</span>
            <span>₹{referral.reward}</span>
            {referral.status !== "Paid" && referral.status !== "Earned" && (
              <button
                className="pd-btn pd-btn-sm"
                onClick={() =>
                  save(`/master/pharmacies/${profile.id}/referrals/${referral.id}/earn`, "POST", {})
                }
              >
                Mark earned
              </button>
            )}
            {referral.status === "Earned" && (
              <button
                className="pd-btn pd-btn-sm pd-btn-primary"
                onClick={() =>
                  save(`/master/pharmacies/${profile.id}/referrals/${referral.id}/pay`, "POST", {})
                }
              >
                Mark paid
              </button>
            )}
            {referral.paidBy && <span className="pd-muted">Paid by {referral.paidBy}</span>}
          </div>
        ))
      )}
    </div>
  );
}
