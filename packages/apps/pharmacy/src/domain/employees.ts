// ════════════════════════════════════════════════════════════════
// Employees — HR record of every team member (payroll, bank, IDs).
// Distinct from app-login "users" (StaffUser): this is the personnel
// register a pharmacy keeps for salary, statutory & bank details.
// ════════════════════════════════════════════════════════════════
export const EMPLOYEE_POSITIONS = [
  "Owner", "Manager", "Pharmacist", "Cashier", "Delivery Executive",
  "Store Helper", "Accountant", "Housekeeping",
];
export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract"] as const;
export type EmploymentType = typeof EMPLOYMENT_TYPES[number];

export type Employee = {
  id: string;              // employee code, e.g. "EMP-001"
  name: string;
  position: string;        // designation
  department?: string;
  phone: string;
  email?: string;
  address?: string;
  dob?: string;            // YYYY-MM-DD
  joinedOn: string;        // YYYY-MM-DD
  employment: EmploymentType;
  salary: number;          // monthly gross ₹
  status: "active" | "inactive";
  // statutory ids
  pan?: string;
  aadhaar?: string;
  // salary bank account
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  upi?: string;
  // emergency contact
  emergencyName?: string;
  emergencyPhone?: string;
  note?: string;
  emoji?: string;         // legacy field — the UI renders an initials avatar
  photo?: string;          // employee photo (data URL) — used on the digital ID card
  bloodGroup?: string;     // shown on the ID card
  documents?: EmployeeDoc[]; // uploaded ID proofs / certificates (image or PDF, stored as data URLs)
};
// an uploaded HR document — Aadhaar/PAN/licence/certificate etc. (image or PDF)
export type EmployeeDoc = { id: string; label: string; kind: "image" | "pdf"; fileName: string; dataUrl: string; at: number };
export const DOC_LABELS = ["Aadhaar card", "PAN card", "Pharmacist licence", "Appointment letter", "Educational certificate", "Experience letter", "Bank passbook", "Address proof", "Photograph", "Other"];
export const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

export const blankEmployee = (): Omit<Employee, "id"> => ({
  name: "", position: EMPLOYEE_POSITIONS[2], phone: "", email: "", address: "",
  joinedOn: "", employment: "Full-time", salary: 0, status: "active", documents: [],
});

// tenure in whole years/months from joining date to `now`
export const employeeTenure = (joinedOn: string, now: number): string => {
  if (!joinedOn) return "—";
  const j = new Date(joinedOn).getTime();
  if (isNaN(j)) return "—";
  const months = Math.max(0, Math.round((now - j) / (30 * 86400000)));
  const y = Math.floor(months / 12), m = months % 12;
  return y > 0 ? `${y}y ${m}m` : `${m}m`;
};
export const monthlyPayroll = (emps: Employee[]) => emps.filter((e) => e.status === "active").reduce((a, e) => a + e.salary, 0);
