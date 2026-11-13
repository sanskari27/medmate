export type PatientSort = "spent" | "orders" | "recent";

export type PatientSegment = "all" | "high-value" | "lapsed" | "new" | "credit" | "regular";

export type PatientRow = {
  phone: string;
  name: string;
  orders: number;
  spent: string;
  units: number;
  lastAt: string;
  rx: boolean;
  points: number;
  tier: string;
  segments: string[];
  creditOutstanding: string;
  daysSince: number;
};

export type PatientSummary = {
  named: number;
  lifetimeSales: string;
  repeat: number;
  chronic: number;
  creditOutstanding: string;
  active30: number;
  atRisk: number;
  refillsDue: number;
  loyaltyPoints: number;
  avgRating: string | null;
};

export type AgingBucket = {
  key: string;
  label: string;
  amount: string;
  count: number;
};

export type PatientList = {
  patients: PatientRow[];
  summary: PatientSummary;
  aging: AgingBucket[];
  page: number;
  size: number;
  total: number;
};

export type PatientProfile = {
  age: number | null;
  gender: string | null;
  bloodGroup: string | null;
  dob: string | null;
  address: string | null;
  conditions: string | null;
  allergies: string | null;
  note: string | null;
  consent: boolean;
};

export type PatientDetail = PatientRow & {
  firstAt: string;
  availablePoints: number;
  given: string;
  repaid: string;
  outstanding: string;
  profile: PatientProfile;
  purchases: {
    number: string;
    soldAt: string;
    payable: string;
    payMode: string;
    units: number;
  }[];
  ledger: { at: string; kind: string; label: string; amount: string; ref: string }[];
  reminders: { id: string; phone: string; kind: string; channel: string; at: string }[];
  feedback: {
    id: string;
    phone: string;
    rating: number;
    nps: number | null;
    comment: string | null;
    at: string;
  }[];
  redemptions: { id: string; phone: string; points: number; at: string }[];
};

export type Campaign = {
  id: string;
  name: string;
  segment: string;
  channel: string;
  message: string;
  offerLabel: string | null;
  reach: number;
  sentAt: string;
};

export type Reminder = {
  id: string;
  phone: string;
  kind: string;
  channel: string;
  at: string;
};

export type Feedback = {
  id: string;
  phone: string;
  rating: number;
  nps: number | null;
  comment: string | null;
  at: string;
};

export type Leader = {
  phone: string;
  name: string;
  r: number;
  f: number;
  m: number;
  score: number;
  orders: number;
  spent: string;
  segments: string[];
};

export type Analytics = {
  averageLifetimeValue: string;
  retentionPercent: number;
  churnRisk: number;
  campaignSales: string;
  rfmLeaders: number;
  leaders: Leader[];
};

export function canOpenPatients(
  role: string | null | undefined,
  permissions: string[] | undefined,
) {
  return role === "owner" || (permissions ?? []).includes("patients:read");
}

export function canUpdatePatients(
  role: string | null | undefined,
  permissions: string[] | undefined,
) {
  return role === "owner" || (permissions ?? []).includes("patients:update");
}
