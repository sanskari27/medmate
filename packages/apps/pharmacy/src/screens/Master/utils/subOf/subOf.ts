import { BillingCycle, Plan } from "@/utils";

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

export function subOf(row: Row) {
  return {
    plan: row.plan as Plan,
    cycle: (row.cycle === "annual" ? "annual" : "monthly") as BillingCycle,
    status: (row.status === "expired" ? "expired" : "active") as "active" | "expired",
    renewsOn: row.renewsOn,
    since: "",
    autoRenew: false,
  };
}
