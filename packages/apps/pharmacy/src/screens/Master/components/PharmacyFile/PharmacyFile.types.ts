import type { Plan, BillingCycle } from "@/utils";

type Seats = {
  included: number | null;
  extra: number;
  inUse: number;
  limit: number | null;
};

type Kyc = {
  gstin: string;
  pan: string;
  dlNo: string;
  fssai: string;
  pharmacist?: string;
  bank?: {
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
  } | null;
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

type Grant = {
  route: string;
  until?: string;
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

export type PharmacyFileProps = {
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
};
