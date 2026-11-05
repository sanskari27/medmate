import { isFreePlan, subscriptionLapsed } from "@/utils";

import { plusDays } from "@/screens/Master/utils/plusDays";
import { subOf } from "@/screens/Master/utils/subOf";

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

export function renewalDue(row: Row) {
  if (isFreePlan(row.plan)) return false;
  if (subscriptionLapsed(subOf(row))) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(row.renewsOn) && row.renewsOn <= plusDays(30);
}
