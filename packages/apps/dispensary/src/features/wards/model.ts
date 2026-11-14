export const WARD_CATEGORIES = [
  "General",
  "ICU",
  "Pediatric",
  "Maternity",
  "Surgical",
  "Private",
] as const;

export type WardCategory = (typeof WARD_CATEGORIES)[number];

export const INSURERS = [
  "Star Health (Medi Assist)",
  "Ayushman Bharat (PM-JAY)",
  "ICICI Lombard",
  "Niva Bupa (Vidal)",
  "HDFC Ergo",
  "Care Health",
  "New India Assurance",
  "Aditya Birla Health",
  "Tata AIG",
  "Other / Self-pay",
];

export const PAY_MODES = ["cash", "upi", "card", "insurance"] as const;

export type PayMode = (typeof PAY_MODES)[number];

export const PAY_LABEL: Record<PayMode, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  insurance: "Insurance / TPA",
};

export type Ward = {
  id: string;
  name: string;
  code: string;
  floor: string | null;
  category: WardCategory;
  beds: number;
  sister: string | null;
  dailyRate: string;
  bedsHeld: number;
  underMaintenance: boolean;
  maintenanceNote: string | null;
};

export type Admission = {
  id: string;
  name: string;
  uhid: string;
  phone: string | null;
  age: number | null;
  gender: "Male" | "Female" | "Other" | null;
  wardId: string;
  wardName: string;
  bed: string;
  doctor: string | null;
  diagnosis: string | null;
  payerType: "self" | "insurance";
  insurer: string | null;
  policyNo: string | null;
  admittedAt: string;
  status: "admitted" | "discharged";
  days: number;
  dailyRate: string;
  outstanding: string;
};

export type WardList = { wards: Ward[] };
export type WardOne = { ward: Ward };
export type AdmissionList = { admissions: Admission[] };
export type AdmissionOne = { admission: Admission };

export type WardDraft = {
  name: string;
  code: string;
  floor: string;
  category: WardCategory;
  beds: string;
  sister: string;
  dailyRate: string;
  bedsHeld: string;
  underMaintenance: boolean;
  maintenanceNote: string;
};

export type WardPayload = {
  name: string;
  code: string;
  floor: string | null;
  category: WardCategory;
  beds: number;
  sister: string | null;
  dailyRate: string;
  bedsHeld: number;
  underMaintenance: boolean;
  maintenanceNote: string | null;
};

const DAY = 86_400_000;

export function canOpenWards(
  role: string | null | undefined,
  permissions: string[] | undefined,
  pharmacyType: string | null | undefined,
): boolean {
  if (pharmacyType !== "hospital") return false;
  return role === "owner" || (permissions ?? []).includes("wards:read");
}

export function wardAccess(role: string | null | undefined, permissions: string[] | undefined) {
  const owner = role === "owner";
  const keys = permissions ?? [];
  return {
    create: owner || keys.includes("wards:create"),
    update: owner || keys.includes("wards:update"),
    admit: owner || keys.includes("wards:admit"),
    transfer: owner || keys.includes("wards:transfer"),
    discharge: owner || keys.includes("wards:discharge"),
  };
}

export function blankWard(): WardDraft {
  return {
    name: "",
    code: "",
    floor: "",
    category: "General",
    beds: "10",
    sister: "",
    dailyRate: "0.00",
    bedsHeld: "0",
    underMaintenance: false,
    maintenanceNote: "",
  };
}

export function wardPayload(draft: WardDraft): WardPayload {
  return {
    name: draft.name.trim(),
    code: draft.code.trim().toUpperCase(),
    floor: draft.floor.trim() || null,
    category: draft.category,
    beds: Number(draft.beds),
    sister: draft.sister.trim() || null,
    dailyRate: draft.dailyRate.trim() || "0.00",
    bedsHeld: Number(draft.bedsHeld || "0"),
    underMaintenance: draft.underMaintenance,
    maintenanceNote: draft.maintenanceNote.trim() || null,
  };
}

export function bedLabels(code: string, beds: number): string[] {
  return Array.from({ length: Math.max(0, beds) }, (_, index) => `${code}-${index + 1}`);
}

export function heldLabels(code: string, beds: number, held: number): string[] {
  return bedLabels(code, beds).slice(Math.max(0, beds - Math.max(0, held)));
}

export function occupiedBeds(admissions: Admission[], wardId: string): Set<string> {
  return new Set(
    admissions
      .filter((row) => row.status === "admitted" && row.wardId === wardId)
      .map((row) => row.bed),
  );
}

export function admissionAtBed(admissions: Admission[], wardId: string, bed: string) {
  return (
    admissions.find(
      (row) => row.status === "admitted" && row.wardId === wardId && row.bed === bed,
    ) ?? null
  );
}

export function freeBeds(ward: Ward, admissions: Admission[]): string[] {
  const taken = occupiedBeds(admissions, ward.id);
  const held = new Set(heldLabels(ward.code, ward.beds, ward.bedsHeld));
  return bedLabels(ward.code, ward.beds).filter((bed) => !taken.has(bed) && !held.has(bed));
}

export function occupancy(wards: Ward[], admissions: Admission[]) {
  const beds = wards.reduce((sum, ward) => sum + ward.beds, 0);
  const held = wards.reduce((sum, ward) => sum + ward.bedsHeld, 0);
  const occ = admissions.filter((row) => row.status === "admitted").length;
  const free = beds - held - occ;
  return { beds, occ, free, pct: beds ? Math.round((occ / beds) * 100) : 0 };
}

export function daysIn(admittedAt: string, now: number): number {
  const from = Date.parse(admittedAt);
  if (!Number.isFinite(from)) return 1;
  return Math.max(1, Math.ceil((now - from) / DAY));
}

export function timeAgo(admittedAt: string, now: number): string {
  const from = Date.parse(admittedAt);
  const mins = Math.max(0, Math.round((now - from) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

export function formatWhen(admittedAt: string): string {
  const date = new Date(admittedAt);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function inr(amount: string): string {
  const value = Number(amount);
  const rounded = Number.isFinite(value) ? Math.round(value) : 0;
  return `₹${rounded.toLocaleString("en-IN")}`;
}

export function suggestUhid(count: number): string {
  return `UHID-${100400 + count + 1}`;
}

export function moneyDue(amount: string): boolean {
  return Number(amount) > 0;
}
