// ════════════════════════════════════════════════════════════════
// Hospital-pharmacy module — extra data for the "Hospital Pharmacy"
// business type: IPD wards, ward indents (requisitions), departments
// & doctors, insurance / TPA claims, and in-patient bill settlement.
// Shared by desktop + phone.
// ════════════════════════════════════════════════════════════════
import { Sale, SaleSource, computeInvoice, saleSourceOf } from "@/domain";

// ── IPD wards ───────────────────────────────────────────────────
export type WardType = "General" | "ICU" | "Pediatric" | "Maternity" | "Surgical" | "Private";
export type Ward = {
  id: string;
  name: string;
  code: string;
  floor: string;
  type: WardType;
  beds: number;
  occupied: number;
  sister: string; // nurse-in-charge
};

export const WARD_TYPES: WardType[] = [
  "General",
  "ICU",
  "Pediatric",
  "Maternity",
  "Surgical",
  "Private",
];

// bed numbers for a ward, generated from its code (e.g. GEN-A-1 … GEN-A-30)
export const wardBedNos = (w: Ward): string[] =>
  Array.from({ length: Math.max(0, w.beds) }, (_, i) => `${w.code}-${i + 1}`);

// ── IPD admissions (patient admitted to a bed) ──────────────────
export type PayerType = "self" | "insurance";
export type Admission = {
  id: string; // admission no. e.g. ADM-1007
  patientId: string; // UHID / IP no. (links to that patient's bills)
  name: string;
  age?: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  wardId: string;
  wardName: string;
  bed: string; // bed number, e.g. "GEN-A-14"
  doctor: string; // attending doctor
  diagnosis: string;
  payerType: PayerType;
  insurer?: string; // when payerType === "insurance"
  policyNo?: string;
  admittedAt: number;
  status: "admitted" | "discharged";
  dischargedAt?: number;
};
export const activeAdmissions = (a: Admission[]) => a.filter((x) => x.status === "admitted");
export const occupiedBedsOf = (a: Admission[], wardId: string) =>
  new Set(
    activeAdmissions(a)
      .filter((x) => x.wardId === wardId)
      .map((x) => x.bed),
  );
export const admissionAtBed = (a: Admission[], wardId: string, bed: string) =>
  activeAdmissions(a).find((x) => x.wardId === wardId && x.bed === bed) ?? null;
export const admissionOfPatient = (a: Admission[], patientId: string) =>
  activeAdmissions(a).find((x) => x.patientId === patientId) ?? null;
export const hospitalOccupancy = (wards: Ward[], a: Admission[]) => {
  const beds = wards.reduce((s, w) => s + w.beds, 0);
  const occ = activeAdmissions(a).length;
  return { beds, occ, free: beds - occ, pct: beds ? Math.round((occ / beds) * 100) : 0 };
};

// ── ward indents (medicine requisitions from a ward → pharmacy) ──
export type IndentStatus = "pending" | "approved" | "issued" | "rejected";
export type IndentItem = { name: string; qty: number; issued?: number };
export type WardIndent = {
  id: string;
  wardId: string;
  wardName: string;
  patient?: string; // optional patient/bed the indent is for
  bed?: string;
  requestedBy: string; // nurse / resident
  status: IndentStatus;
  items: IndentItem[];
  note?: string;
  at: number;
};

// ── departments & doctors (OPD) ─────────────────────────────────
export type Doctor = { name: string; specialty: string; opdRoom?: string; phone?: string };
export type Department = {
  id: string;
  name: string;
  head: string;
  type: "OPD" | "IPD" | "Diagnostic" | "Support";
  emoji?: string; // legacy field — the UI renders a department icon
  doctors: Doctor[];
};

// ── doctor directory (full profiles, with photo) ────────────────
export type DoctorStatus = "active" | "on-leave" | "visiting";
export type DoctorProfile = {
  id: string;
  name: string;
  photo?: string; // data URL (uploaded), else emoji avatar
  emoji?: string; // legacy field — the UI renders an initials avatar
  gender: "Male" | "Female" | "Other";
  qualification: string; // MBBS, MD, MS, DM, DNB…
  specialty: string;
  department: string; // department name
  regNo: string; // state medical council registration no.
  experience: number; // years
  phone: string;
  email: string;
  opdRoom: string;
  days: string; // consulting days, e.g. "Mon–Sat"
  timing: string; // consulting hours, e.g. "10:00 AM – 1:00 PM"
  fee: number; // consultation fee ₹
  languages: string; // comma-separated
  status: DoctorStatus;
  bio: string;
};

export const DOCTOR_STATUS_META: Record<DoctorStatus, { label: string; tone: string }> = {
  active: { label: "Available", tone: "green" },
  "on-leave": { label: "On leave", tone: "rose" },
  visiting: { label: "Visiting", tone: "blue" },
};
export const DOCTOR_SPECIALTIES = [
  "General Physician",
  "Diabetologist",
  "Cardiologist",
  "General Surgeon",
  "Orthopaedic Surgeon",
  "Pediatrician",
  "Obstetrician & Gynaecologist",
  "Dermatologist",
  "ENT Surgeon",
  "Ophthalmologist",
  "Neurologist",
  "Nephrologist",
  "Urologist",
  "Pulmonologist",
  "Psychiatrist",
  "Radiologist",
  "Pathologist",
  "Anaesthesiologist",
  "Dentist",
  "Physiotherapist",
];

export const blankDoctor = (): Omit<DoctorProfile, "id"> => ({
  name: "",
  photo: undefined,
  gender: "Male",
  qualification: "",
  specialty: DOCTOR_SPECIALTIES[0],
  department: "",
  regNo: "",
  experience: 0,
  phone: "",
  email: "",
  opdRoom: "",
  days: "Mon–Sat",
  timing: "10:00 AM – 1:00 PM",
  fee: 500,
  languages: "English",
  status: "active",
  bio: "",
});

// ── insurance / TPA claims ──────────────────────────────────────
export type ClaimType = "Cashless" | "Reimbursement";
export type ClaimStatus = "submitted" | "query" | "approved" | "settled" | "rejected";
export type TpaClaim = {
  id: string;
  patient: string;
  billId?: string;
  payer: string; // insurer / TPA name
  policyNo: string;
  claimType: ClaimType;
  amount: number; // claimed ₹
  approvedAmount?: number; // sanctioned ₹
  status: ClaimStatus;
  at: number;
};

export const CLAIM_STATUS_META: Record<ClaimStatus, { label: string; tone: string }> = {
  submitted: { label: "Submitted", tone: "blue" },
  query: { label: "Query raised", tone: "amber" },
  approved: { label: "Approved", tone: "green" },
  settled: { label: "Settled", tone: "green" },
  rejected: { label: "Rejected", tone: "rose" },
};

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

// ── in-patient bill settlement (Active Patients / Unsettled bills) ──
// Sources that belong to an admitted patient — these bills can carry a
// Patient ID (UHID/IP no.) and are settled together (e.g. at discharge).
export const IN_PATIENT_SOURCES: SaleSource[] = ["ward", "emergency"];
export const isInPatientSale = (s: Sale) =>
  !!s.patientId || IN_PATIENT_SOURCES.includes(saleSourceOf(s));
const billTotal = (s: Sale) => computeInvoice(s.items, s.discount).payable;

export type PatientGroup = {
  key: string;
  patientId: string; // UHID/IP no., or "" if none recorded
  name: string;
  ward: string;
  source: SaleSource;
  bills: Sale[];
  total: number; // sum of all bills
  paid: number; // already-settled amount
  outstanding: number; // unsettled amount
  unsettled: number; // count of unpaid bills
  lastAt: number;
};

// Group in-patient bills by patient (by Patient ID when present, else name+ward).
export function buildPatientLedger(sales: Sale[]): PatientGroup[] {
  const map = new Map<string, PatientGroup>();
  for (const s of sales) {
    if (s.status === "cancelled" || !isInPatientSale(s)) continue;
    const key = s.patientId?.trim() || `${s.customer.name}|${s.ward ?? ""}`;
    const amt = billTotal(s);
    const unpaid = s.paid === false;
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        patientId: s.patientId ?? "",
        name: s.customer.name,
        ward: s.ward ?? "—",
        source: saleSourceOf(s),
        bills: [],
        total: 0,
        paid: 0,
        outstanding: 0,
        unsettled: 0,
        lastAt: 0,
      };
      map.set(key, g);
    }
    g.bills.push(s);
    g.total += amt;
    if (unpaid) {
      g.outstanding += amt;
      g.unsettled += 1;
    } else g.paid += amt;
    if (s.createdAt > g.lastAt) {
      g.lastAt = s.createdAt;
      g.name = s.customer.name;
      g.ward = s.ward ?? g.ward;
    }
  }
  return Array.from(map.values())
    .map((g) => ({ ...g, bills: g.bills.sort((a, b) => b.createdAt - a.createdAt) }))
    .sort((a, b) => b.outstanding - a.outstanding || b.lastAt - a.lastAt);
}

// ── small shared helpers ────────────────────────────────────────
export const bedOccupancy = (wards: Ward[]) => {
  const beds = wards.reduce((a, w) => a + w.beds, 0);
  const occ = wards.reduce((a, w) => a + w.occupied, 0);
  return { beds, occ, free: beds - occ, pct: beds ? Math.round((occ / beds) * 100) : 0 };
};
