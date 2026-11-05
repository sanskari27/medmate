import { Plan } from "@/utils";

import { seatText } from "@/screens/Master/components/seatText";
import { Table } from "@/screens/Master/components/Table";

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

const PLANS: Plan[] = ["Essential", "Care", "Growth", "Flagship"];

export function PharmacyList({
  rows,
  q,
  setQ,
  plan,
  setPlan,
  businessType,
  setBusinessType,
  window,
  setWindow,
  onOpen,
}: {
  rows: Row[];
  q: string;
  setQ: (value: string) => void;
  plan: string;
  setPlan: (value: string) => void;
  businessType: string;
  setBusinessType: (value: string) => void;
  window: string;
  setWindow: (value: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <div
        className="pd-card pd-card-pad"
        style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        <input
          className="pd-input"
          placeholder="Name, phone, or city"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search pharmacies"
        />
        <select
          className="pd-select"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          aria-label="Plan filter"
        >
          <option value="">Any plan</option>
          {PLANS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          className="pd-select"
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          aria-label="Business type filter"
        >
          <option value="">Any type</option>
          <option value="pharmacy">Retail</option>
          <option value="hospital">Hospital</option>
        </select>
        <select
          className="pd-select"
          value={window}
          onChange={(e) => setWindow(e.target.value)}
          aria-label="Renewal window"
        >
          <option value="">Any renewal</option>
          <option value="7">Expiring in 7 days</option>
          <option value="15">Expiring in 15 days</option>
          <option value="30">Expiring in 30 days</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      <Table
        columns={["Pharmacy", "Phone", "City", "Plan", "Type", "Renews", "Seats"]}
        empty="No pharmacies match."
      >
        {rows.map((row) => (
          <tr key={row.id} onClick={() => onOpen(row.id)} style={{ cursor: "pointer" }}>
            <td>{row.name}</td>
            <td>{row.phone}</td>
            <td>{row.city || "—"}</td>
            <td>
              {row.plan} · {row.cycle}
            </td>
            <td>{row.businessType}</td>
            <td>{row.renewsOn || "—"}</td>
            <td>{seatText(row.seats)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
